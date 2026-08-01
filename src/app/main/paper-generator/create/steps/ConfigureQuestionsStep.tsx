"use client";

import React, { useState, useMemo } from "react";
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
  ToggleLeft,
  ToggleRight,
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
      };
      configs.push(currentConfig);
    } else {
      currentConfig.total_questions += 1;
    }
  });

  return configs;
}

/** Convert QuestionConfig rows back into Question[] for the section */
export function buildQuestionsFromConfig(configs: QuestionConfig[]): Question[] {
  const questions: Question[] = [];
  let globalOrder = 1;

  configs.forEach((cfg) => {
    const count = cfg.total_questions || 1;
    for (let i = 0; i < count; i++) {
      const baseQ = makeEmptyQuestion(cfg.question_type, globalOrder) as Question;
      questions.push({
        ...baseQ,
        marks: cfg.marks_per_question,
        question_order: globalOrder,
        subsection_label: cfg.heading,
        question_data: {
          ...baseQ.question_data,
          attempt_any: cfg.has_choice ? (cfg.attempt_any || 1) : undefined,
        },
      });
      globalOrder++;
    }
  });

  return questions;
}

function getDefaultHeading(type: string): string {
  const info = BOARD_QUESTION_TYPES.find((t) => t.key === type);
  return info?.label || type.replace(/_/g, " ");
}

/** Calculate effective marks for a question config row */
export function getEffectiveMarks(cfg: QuestionConfig): number {
  if (cfg.has_choice && cfg.attempt_any && cfg.attempt_any > 0) {
    return cfg.attempt_any * cfg.marks_per_question;
  }
  return cfg.total_questions * cfg.marks_per_question;
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

  // Build question configs from existing questions
  const [configs, setConfigs] = useState<QuestionConfig[]>(() => {
    const existing = buildConfigFromQuestions(section?.questions || []);
    if (existing.length > 0) return existing;
    // Start with one empty question config
    return [
      {
        id: `qc-init-${Date.now()}`,
        heading: "Multiple Choice Questions",
        question_type: "MCQ",
        marks_per_question: 1,
        total_questions: 1,
        has_choice: false,
        attempt_any: null,
      },
    ];
  });

  // Calculate section marks
  const sectionTotalMarks = useMemo(() => {
    return configs.reduce((acc, cfg) => acc + getEffectiveMarks(cfg), 0);
  }, [configs]);

  const totalAssignedMarks = getTotalAssignedMarks(paper);

  // Persist configs → section questions whenever configs change
  const persistConfigs = (newConfigs: QuestionConfig[]) => {
    setConfigs(newConfigs);
    const newQuestions = buildQuestionsFromConfig(newConfigs);
    const newSections = [...paper.sections];
    const sectionMarks = newConfigs.reduce((acc, cfg) => acc + getEffectiveMarks(cfg), 0);
    newSections[activeSectionIdx] = {
      ...newSections[activeSectionIdx],
      questions: newQuestions,
      total_section_marks: sectionMarks,
    };
    onChange({ sections: newSections });
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleUpdateConfig = (idx: number, updates: Partial<QuestionConfig>) => {
    const next = [...configs];
    next[idx] = { ...next[idx], ...updates };
    // If choice is being disabled, clear attempt_any
    if (updates.has_choice === false) {
      next[idx].attempt_any = null;
    }
    // If choice is being enabled, default attempt_any to total_questions - 1
    if (updates.has_choice === true && !next[idx].attempt_any) {
      next[idx].attempt_any = Math.max(1, next[idx].total_questions - 1);
    }
    // Ensure attempt_any doesn't exceed total_questions
    if (next[idx].attempt_any && next[idx].attempt_any! > next[idx].total_questions) {
      next[idx].attempt_any = next[idx].total_questions;
    }
    persistConfigs(next);
  };

  const handleAddConfig = () => {
    const newConfig: QuestionConfig = {
      id: `qc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      heading: "",
      question_type: "SHORT_ANSWER",
      marks_per_question: 2,
      total_questions: 1,
      has_choice: false,
      attempt_any: null,
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
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Section Marks</p>
              <p className="text-lg font-black text-[#3335e3]">{sectionTotalMarks} Marks</p>
            </div>
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
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-3" style={{ minWidth: 200 }}>Question Heading</th>
                <th className="py-3 px-3 w-44">Question Type</th>
                <th className="py-3 px-3 w-16 text-center">Qty</th>
                <th className="py-3 px-3 w-20 text-center">Marks/Q</th>
                <th className="py-3 px-3 w-40 text-center">Choice (Any N)</th>
                <th className="py-3 px-3 w-24 text-center">Total</th>
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

                    {/* Quantity (Total Questions) */}
                    <td className="py-3 px-3 text-center">
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={cfg.total_questions}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          handleUpdateConfig(idx, { total_questions: val });
                        }}
                        className="w-14 h-9 text-xs font-black text-center border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#3335e3]/20 focus:border-[#3335e3] transition-all mx-auto"
                      />
                    </td>

                    {/* Marks per Question */}
                    <td className="py-3 px-3 text-center">
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={cfg.marks_per_question}
                        onChange={(e) =>
                          handleUpdateConfig(idx, {
                            marks_per_question: parseInt(e.target.value) || 1,
                          })
                        }
                        className="w-14 h-9 text-xs font-black text-center border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#3335e3]/20 focus:border-[#3335e3] transition-all mx-auto"
                      />
                    </td>

                    {/* Choice / Attempt Any */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateConfig(idx, { has_choice: !cfg.has_choice })}
                          className={`p-1 rounded-lg transition-colors ${
                            cfg.has_choice
                              ? "text-[#3335e3] hover:text-[#3335e3]/80"
                              : "text-slate-400 hover:text-slate-600"
                          }`}
                          title={cfg.has_choice ? "Disable choice" : "Enable choice"}
                        >
                          {cfg.has_choice ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                        </button>
                        {cfg.has_choice && (
                          <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
                            <span className="text-slate-400">Any</span>
                            <input
                              type="number"
                              min={1}
                              max={cfg.total_questions}
                              value={cfg.attempt_any || 1}
                              onChange={(e) => {
                                const val = Math.min(
                                  parseInt(e.target.value) || 1,
                                  cfg.total_questions
                                );
                                handleUpdateConfig(idx, { attempt_any: val });
                              }}
                              className="w-10 h-7 text-xs font-black text-center border border-indigo-200 rounded bg-indigo-50 focus:outline-none focus:ring-1 focus:ring-[#3335e3]"
                            />
                            <span className="text-slate-400">of {cfg.total_questions}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Total Marks */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center h-8 px-3 rounded-full text-xs font-black ${
                          cfg.has_choice
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {effectiveMarks} Marks
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteConfig(idx)}
                        disabled={configs.length <= 1}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
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
        </div>

        {/* Add Question Button */}
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleAddConfig}
            className="flex items-center gap-2 h-10 px-5 bg-white border border-slate-300 hover:border-[#3335e3] hover:text-[#3335e3] rounded-xl text-xs font-bold text-slate-700 shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" /> Add Question
          </button>
          <p className="text-xs text-slate-400 font-medium">
            Define question headings and types. Sub-questions are configured in the next step.
          </p>
        </div>
      </div>

      {/* Choice/Matrix Info Panel */}
      {configs.some((c) => c.has_choice) && (
        <div className="bg-amber-50/80 rounded-2xl border border-amber-200 p-5 space-y-2 animate-in fade-in duration-300">
          <h3 className="text-sm font-black text-amber-800 flex items-center gap-2">
            <span className="text-base">📋</span> Choice / Matrix Summary
          </h3>
          <div className="space-y-1.5">
            {configs
              .filter((c) => c.has_choice)
              .map((c, i) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between text-xs font-semibold text-amber-700 bg-white/60 rounded-lg px-3 py-2 border border-amber-100"
                >
                  <span>
                    Q{configs.indexOf(c) + 1}. {c.heading || "Untitled"}{" "}
                    <span className="text-amber-500">
                      (Any {c.attempt_any} out of {c.total_questions})
                    </span>
                  </span>
                  <span className="font-black">
                    {getEffectiveMarks(c)} Marks
                  </span>
                </div>
              ))}
          </div>
          <p className="text-[11px] text-amber-600 font-medium mt-1">
            Total marks reflect only the questions required to be attempted, not the total provided.
          </p>
        </div>
      )}
    </div>
  );
}
