"use client";

import React, { useState, useMemo, useEffect } from "react";
import { PaperState, Question, getTotalAssignedMarks } from "../page";
import { parseSectionName } from "./AddSectionsStep";
import { BOARD_QUESTION_TYPES } from "./PaperSetupStep";
import { makeEmptyQuestion } from "./QuestionForm";
import {
  Plus,
  Trash2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Layers,
  CheckCircle2,
  ChevronDown,
  AlertCircle,
  FileQuestion,
  SlidersHorizontal,
} from "lucide-react";

interface Props {
  paper: PaperState;
  activeSectionIdx: number;
  onChange: (updates: Partial<PaperState>) => void;
}

export interface QuestionConfig {
  id: string;
  heading: string;
  question_type: string;
  marks_per_question: number;
  total_questions: number;
  has_choice: boolean;
  attempt_any: number | null;
  /** Original questions this config represents — preserved to avoid losing DB IDs */
  questionRefs: Question[];
}

/** Build QuestionConfig rows from existing section questions (subsection groups) */
export function buildConfigFromQuestions(questions: Question[]): QuestionConfig[] {
  if (!questions || questions.length === 0) return [];

  const configs: QuestionConfig[] = [];
  let currentConfig: QuestionConfig | null = null;

  questions.forEach((q) => {
    const label = q.subsection_label || "";
    const type = q.question_type;

    if (
      !currentConfig ||
      currentConfig.question_type !== type ||
      (label && currentConfig.heading !== label)
    ) {
      // Start a new group
      const attemptAny = q.question_data?.attempt_any ?? null;
      currentConfig = {
        id: `qc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        heading: label || getDefaultHeading(type),
        question_type: type,
        marks_per_question: q.marks || 1,
        total_questions: 1,
        has_choice: attemptAny !== null && attemptAny > 0,
        attempt_any: attemptAny,
        questionRefs: [q],
      };
      configs.push(currentConfig);
    } else {
      // Continuation of same group — count it, don't accumulate marks
      currentConfig.total_questions++;
      currentConfig.questionRefs.push(q);
    }
  });

  return configs;
}

/** Convert QuestionConfig rows back into Question[] for the section.
 *  CRITICAL: Preserves existing question IDs and data from questionRefs
 *  instead of creating brand-new questions, preventing ID loss / duplication.
 */
export function buildQuestionsFromConfig(configs: QuestionConfig[]): Question[] {
  const questions: Question[] = [];
  let globalOrder = 1;

  configs.forEach((cfg) => {
    // If this config has original question references, preserve them
    if (cfg.questionRefs && cfg.questionRefs.length > 0) {
      // Use the first existing question as the representative,
      // updating its marks and metadata from the config
      const ref = cfg.questionRefs[0];
      questions.push({
        ...ref,
        marks: cfg.marks_per_question || 1,
        question_order: globalOrder,
        subsection_label: cfg.heading,
        question_data: {
          ...(ref.question_data || {}),
          attempt_any: cfg.has_choice ? (cfg.attempt_any || 1) : undefined,
        },
      });
    } else {
      // Genuinely new config with no existing questions — create from scratch
      const baseQ = makeEmptyQuestion(cfg.question_type, globalOrder) as Question;
      questions.push({
        ...baseQ,
        marks: cfg.marks_per_question || 1,
        question_order: globalOrder,
        subsection_label: cfg.heading,
        question_data: {
          ...baseQ.question_data,
          attempt_any: cfg.has_choice ? (cfg.attempt_any || 1) : undefined,
        },
      });
    }
    globalOrder++;
  });

  return questions;
}

function getDefaultHeading(type: string): string {
  const info = BOARD_QUESTION_TYPES.find((t) => t.key === type);
  return info?.label || type.replace(/_/g, " ");
}

/** Calculate effective marks for a question config row */
export function getEffectiveMarks(cfg: QuestionConfig): number {
  return cfg.marks_per_question || 0;
}

// ─── Badge Colors ─────────────────────────────────────────────────────────────
const BADGE_COLORS = [
  { bg: "bg-emerald-500/10", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  { bg: "bg-indigo-500/10", text: "text-indigo-700", border: "border-indigo-200", dot: "bg-indigo-500" },
  { bg: "bg-purple-500/10", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500" },
  { bg: "bg-amber-500/10", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  { bg: "bg-rose-500/10", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500" },
  { bg: "bg-cyan-500/10", text: "text-cyan-700", border: "border-cyan-200", dot: "bg-cyan-500" },
];

export default function ConfigureQuestionsStep({
  paper,
  activeSectionIdx,
  onChange,
}: Props) {
  const section = paper.sections[activeSectionIdx] || paper.sections[0];
  const parsedSection = parseSectionName(section?.section_name || "");
  const sectionLetter = String.fromCharCode(65 + activeSectionIdx);
  const sectionTitle = parsedSection.name || parsedSection.title || `Section ${sectionLetter}`;

  // Section marks budget (set in AddSectionsStep)
  const sectionMarksBudget = section?.total_section_marks || 0;

  // Build question configs from existing questions — start empty for new sections
  const [configs, setConfigs] = useState<QuestionConfig[]>(() => {
    return buildConfigFromQuestions(section?.questions || []);
  });

  // ── FIX: Re-initialize configs when activeSectionIdx changes ──────────────
  // useState initializer only runs on mount, so we need this effect to
  // reset configs when navigating between sections (Section A → B → C).
  useEffect(() => {
    const currentSection = paper.sections[activeSectionIdx];
    if (!currentSection) return;
    setConfigs(buildConfigFromQuestions(currentSection.questions || []));
  }, [activeSectionIdx]);

  // Calculate section marks
  const sectionTotalMarks = useMemo(() => {
    return configs.reduce((acc, cfg) => acc + getEffectiveMarks(cfg), 0);
  }, [configs]);

  const totalAssignedMarks = getTotalAssignedMarks(paper);

  // Check if section marks budget is exceeded
  const isBudgetExceeded = sectionMarksBudget > 0 && sectionTotalMarks > sectionMarksBudget;
  const isBudgetFull = sectionMarksBudget > 0 && sectionTotalMarks >= sectionMarksBudget;

  // Persist configs → section questions whenever configs change
  const persistConfigs = (newConfigs: QuestionConfig[]) => {
    setConfigs(newConfigs);
    const newQuestions = buildQuestionsFromConfig(newConfigs);
    const newSections = [...paper.sections];
    const sectionMarks = newConfigs.reduce((acc, cfg) => acc + getEffectiveMarks(cfg), 0);
    newSections[activeSectionIdx] = {
      ...newSections[activeSectionIdx],
      questions: newQuestions,
    };
    onChange({ sections: newSections });
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleUpdateConfig = (idx: number, updates: Partial<QuestionConfig>) => {
    const next = [...configs];
    next[idx] = { ...next[idx], ...updates };
    persistConfigs(next);
  };

  const handleAddConfig = () => {
    // Prevent adding if marks budget is full
    if (isBudgetFull) return;

    const newConfig: QuestionConfig = {
      id: `qc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      heading: "",
      question_type: "SHORT_ANSWER",
      marks_per_question: 2,
      total_questions: 1,
      has_choice: false,
      attempt_any: null,
      questionRefs: [],
    };
    persistConfigs([...configs, newConfig]);
  };

  const handleDeleteConfig = (idx: number) => {
    const next = configs.filter((_, i) => i !== idx);
    persistConfigs(next);
  };

  const handleMoveConfig = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= configs.length) return;
    const next = [...configs];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    persistConfigs(next);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black bg-[#3335e3]/10 text-[#3335e3] px-3 py-1 rounded-full uppercase tracking-wider">
                Section {sectionLetter}
              </span>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Configure Questions in Section {sectionLetter}
              </h1>
            </div>
            {sectionTitle && (
              <p className="text-sm font-semibold text-slate-600 mt-1">
                {sectionTitle}
              </p>
            )}
            <p className="text-xs text-slate-400 mt-1">
              Define question headings, types, marks, and any choice/matrix settings for this section.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {sectionMarksBudget > 0 && (
              <div className={`border rounded-xl px-4 py-2.5 text-center ${
                isBudgetExceeded
                  ? "bg-red-50 border-red-200"
                  : sectionTotalMarks === sectionMarksBudget
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-slate-50 border-slate-200"
              }`}>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Marks Budget</p>
                <p className={`text-lg font-black ${
                  isBudgetExceeded
                    ? "text-red-600"
                    : sectionTotalMarks === sectionMarksBudget
                      ? "text-emerald-600"
                      : "text-[#3335e3]"
                }`}>
                  {sectionTotalMarks} / {sectionMarksBudget}
                </p>
              </div>
            )}
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paper Target</p>
              <p className="text-lg font-black text-slate-800">
                {totalAssignedMarks} / {paper.total_marks}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>Configuring Section {activeSectionIdx + 1} of {paper.sections.length}</span>
          <span className="flex items-center gap-1.5 text-emerald-600">
            <CheckCircle2 size={13} /> {configs.length} Question{configs.length !== 1 ? "s" : ""} Defined
          </span>
        </div>
      </div>

      {/* Questions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-[#3335e3]" />
            <h2 className="text-base font-black text-slate-800">Question Structure</h2>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {configs.length} Question{configs.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="overflow-x-auto">
           {configs.length === 0 ? (
            /* Empty State — No questions defined yet */
            <div className="py-16 px-8 flex flex-col items-center justify-center text-center">
              <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <FileQuestion className="h-7 w-7 text-slate-400" />
              </div>
              <h3 className="text-sm font-black text-slate-700 mb-1">No Question Types Defined</h3>
              <p className="text-xs text-slate-400 font-medium max-w-sm mb-5">
                Start by adding question types to this section. Each type defines the heading, format, quantity, and marks per question.
              </p>
              <button
                type="button"
                onClick={handleAddConfig}
                disabled={isBudgetFull}
                className={`flex items-center gap-2 h-10 px-6 rounded-xl text-xs font-bold shadow-sm transition-all ${
                  isBudgetFull
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-[#3335e3] hover:bg-[#3335e3]/90 text-white"
                }`}
              >
                <Plus className="h-4 w-4" /> Add Question Type
              </button>
            </div>
          ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-3" style={{ minWidth: 200 }}>Question Heading</th>
                <th className="py-3 px-3 w-44">Question Type</th>
                <th className="py-3 px-3 w-24 text-center">Marks</th>
                <th className="py-3 px-3 w-16 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {configs.map((cfg, idx) => {
                const badge = BADGE_COLORS[idx % BADGE_COLORS.length];
                const typeInfo = BOARD_QUESTION_TYPES.find((t) => t.key === cfg.question_type);
                const effectiveMarks = getEffectiveMarks(cfg);

                return (
                  <tr
                    key={cfg.id}
                    className="group transition-colors hover:bg-slate-50/80"
                  >
                    {/* Row Number + Reorder */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className={`text-xs font-black ${badge.text}`}>Q{idx + 1}</span>
                        <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveConfig(idx, idx - 1)}
                            className="text-slate-400 hover:text-slate-700 disabled:opacity-20 p-0.5"
                          >
                            <ArrowUp size={10} />
                          </button>
                          <button
                            type="button"
                            disabled={idx === configs.length - 1}
                            onClick={() => handleMoveConfig(idx, idx + 1)}
                            className="text-slate-400 hover:text-slate-700 disabled:opacity-20 p-0.5"
                          >
                            <ArrowDown size={10} />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Heading */}
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        value={cfg.heading}
                        onChange={(e) => handleUpdateConfig(idx, { heading: e.target.value })}
                        placeholder={`e.g. ${typeInfo?.label || "Question Heading"}`}
                        className="w-full h-9 px-3 text-sm font-semibold border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#3335e3]/20 focus:border-[#3335e3] transition-all"
                      />
                    </td>

                    {/* Question Type Dropdown */}
                    <td className="py-3 px-3">
                      <select
                        value={cfg.question_type}
                        onChange={(e) => {
                          const newType = e.target.value;
                          const newInfo = BOARD_QUESTION_TYPES.find((t) => t.key === newType);
                          handleUpdateConfig(idx, {
                            question_type: newType,
                            heading: cfg.heading || (newInfo?.label || newType),
                          });
                        }}
                        className="w-full h-9 px-2 text-xs font-bold border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#3335e3]/20 focus:border-[#3335e3] transition-all appearance-none cursor-pointer"
                      >
                        {BOARD_QUESTION_TYPES.map((t) => (
                          <option key={t.key} value={t.key}>
                            {t.emoji} {t.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Marks (editable) */}
                    <td className="py-3 px-3 text-center">
                      <input
                        type="number"
                        min={1}
                        max={999}
                        value={effectiveMarks || ""}
                        onKeyDown={(e) => {
                          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                            e.preventDefault();
                          }
                        }}
                        onWheel={(e) => e.currentTarget.blur()}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "") {
                            handleUpdateConfig(idx, { marks_per_question: 0 });
                          } else {
                            const parsed = parseInt(val, 10);
                            if (!isNaN(parsed)) {
                              handleUpdateConfig(idx, { marks_per_question: parsed });
                            }
                          }
                        }}
                        className="w-16 h-9 text-xs font-black text-center border border-emerald-200 rounded-lg bg-emerald-50 text-emerald-700 focus:outline-none focus:ring-2 focus:ring-[#3335e3]/20 focus:border-[#3335e3] transition-all mx-auto [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteConfig(idx)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete Question"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          )}
        </div>

        {/* Budget exceeded warning */}
        {isBudgetExceeded && (
          <div className="mx-4 mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-xs font-bold text-red-700 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            Section marks ({sectionTotalMarks}) exceed the allocated budget of {sectionMarksBudget} marks. Please reduce questions or marks.
          </div>
        )}

        {/* Add Question Type Button (shown only when there are existing configs) */}
        {configs.length > 0 && (
          <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleAddConfig}
              disabled={isBudgetFull}
              className={`flex items-center gap-2 h-10 px-5 bg-white border rounded-xl text-xs font-bold shadow-sm transition-all ${
                isBudgetFull
                  ? "border-slate-200 text-slate-400 cursor-not-allowed opacity-60"
                  : "border-slate-300 hover:border-[#3335e3] hover:text-[#3335e3] text-slate-700"
              }`}
            >
              <Plus className="h-4 w-4" /> Add Question Type
            </button>
            <p className="text-xs text-slate-400 font-medium">
              {isBudgetFull
                ? `Section marks budget (${sectionMarksBudget}M) is fully allocated.`
                : "Define question headings and types. Sub-questions are configured in the next step."
              }
            </p>
          </div>
        )}
      </div>


    </div>
  );
}
