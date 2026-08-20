"use client";

import React, { useState, useMemo } from "react";
import { PaperState, Question, getTotalAssignedMarks } from "../page";
import { parseSectionName } from "./AddSectionsStep";
import { BOARD_QUESTION_TYPES } from "./PaperSetupStep";
import { QuestionForm, makeEmptyQuestion } from "./QuestionForm";
import { Plus, Trash2, ChevronDown, ChevronUp, Layers, CheckCircle2, AlertCircle, HelpCircle, ToggleLeft, ToggleRight } from "lucide-react";
import { generateClientId, getQuestionKey } from "./clientIdUtils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Props {
  paper: PaperState;
  activeSectionIdx: number;
  onChange: (updates: Partial<PaperState>) => void;
  onNextSection: () => void;
  onPrevSection: () => void;
}

export interface SubsectionGroup {
  id: string;
  type: string;
  label: string;
  target_marks?: number;
  questions: Question[];
}

export function groupQuestionsIntoSubsections(questions: Question[]): SubsectionGroup[] {
  if (!questions || questions.length === 0) return [];

  const groups: SubsectionGroup[] = [];
  let currentGroup: SubsectionGroup | null = null;

  questions.forEach((q) => {
    const customLabel = q.subsection_label;
    const typeInfo = BOARD_QUESTION_TYPES.find((t) => t.key === q.question_type);
    const defaultLabel = typeInfo?.label || q.question_type;
    const labelToUse = customLabel || defaultLabel;
    const qTargetMarks = q.question_data?.target_group_marks;

    if (
      !currentGroup ||
      currentGroup.type !== q.question_type ||
      (customLabel && currentGroup.label !== customLabel)
    ) {
      const groupIdx = groups.length;
      // Use first question's _clientId or question_id for stable group ID
      const stableKey = q.question_data?._clientId || q.question_id || `g${groupIdx}`;
      currentGroup = {
        id: `subsec-${stableKey}`,
        type: q.question_type,
        label: labelToUse,
        target_marks: qTargetMarks,
        questions: [q],
      };
      groups.push(currentGroup);
    } else {
      currentGroup.questions.push(q);
      if (!currentGroup.target_marks && qTargetMarks) {
        currentGroup.target_marks = qTargetMarks;
      }
    }
  });

  return groups;
}

/**
 * Calculate valid "Attempt Any N" options for a subsection group.
 * Returns all N values from 1 to (totalQuestions - 1) so teachers can set e.g. Any 2 of 3, Any 3 of 5, etc.
 */
export function getValidAttemptAnyOptions(_totalMarks: number, totalQuestions: number): number[] {
  if (totalQuestions <= 1) return [];
  const options: number[] = [];
  for (let n = 1; n < totalQuestions; n++) {
    options.push(n);
  }
  return options;
}

export function flattenSubsectionsToQuestions(groups: SubsectionGroup[]): Question[] {
  const flat: Question[] = [];
  let globalOrder = 1;
  groups.forEach((g) => {
    g.questions.forEach((q) => {
      flat.push({
        ...q,
        question_type: q.question_type || g.type,
        subsection_label: g.label,
        question_order: globalOrder++,
      });
    });
  });
  return flat;
}

function EditableSubsectionTitle({
  value,
  onChange,
}: {
  value: string;
  onChange: (newVal: string) => void;
}) {
  const [draft, setDraft] = React.useState(value);
  const isEditing = React.useRef(false);

  React.useEffect(() => {
    if (!isEditing.current) {
      setDraft(value);
    }
  }, [value]);

  return (
    <input
      type="text"
      value={draft}
      onFocus={() => {
        isEditing.current = true;
      }}
      onChange={(e) => {
        const text = e.target.value;
        setDraft(text);
        onChange(text);
      }}
      onBlur={(e) => {
        isEditing.current = false;
        onChange(e.target.value);
      }}
      className="text-sm font-black text-slate-900 bg-white border border-slate-200 hover:border-slate-300 focus:border-[#3335e3] focus:ring-1 focus:ring-[#3335e3] rounded-lg px-2.5 py-1 w-full transition-all outline-none"
      placeholder="Subsection Heading (e.g. Vocabulary Practice)"
    />
  );
}

export default function ConfigureSubsectionsStep({
  paper,
  activeSectionIdx,
  onChange,
  onNextSection,
  onPrevSection,
}: Props) {
  const [isAddTypeModalOpen, setIsAddTypeModalOpen] = useState(false);
  const [collapsedSubsections, setCollapsedSubsections] = useState<Record<string, boolean>>({});

  const section = paper.sections[activeSectionIdx] || paper.sections[0];
  const parsedSection = parseSectionName(section?.section_name || "");
  const sectionLetter = String.fromCharCode(65 + activeSectionIdx);
  const sectionTitle = parsedSection.name || parsedSection.title || `Section ${sectionLetter}`;

  const isLastSection = activeSectionIdx === paper.sections.length - 1;
  const nextSectionLetter = !isLastSection ? String.fromCharCode(65 + activeSectionIdx + 1) : "";

  // Group questions in this section into subsections (question-type groups)
  const subsectionGroups = useMemo(() => {
    const rawQs = section?.questions || [];
    if (rawQs.length === 0) return [];
    return groupQuestionsIntoSubsections(rawQs);
  }, [section]);

  // Update section questions helper
  const updateSectionQuestions = (newGroups: SubsectionGroup[]) => {
    const flattened = flattenSubsectionsToQuestions(newGroups);
    const newSections = [...paper.sections];
    
    // Calculate total section marks
    const sectionMarks = flattened.reduce((acc, q) => acc + (q.marks || 0), 0);
    
    newSections[activeSectionIdx] = {
      ...newSections[activeSectionIdx],
      questions: flattened,
      total_section_marks: sectionMarks,
    };
    
    onChange({ sections: newSections });
  };

  // Subsection Actions
  const handleToggleCollapse = (groupId: string) => {
    setCollapsedSubsections((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleAddSubsectionType = (typeKey: string) => {
    const typeInfo = BOARD_QUESTION_TYPES.find((t) => t.key === typeKey);
    const newQ = makeEmptyQuestion(typeKey, 1) as Question;
    // Assign stable client ID
    newQ.question_data = { ...(newQ.question_data || {}), _clientId: generateClientId() };
    const newGroup: SubsectionGroup = {
      id: `subsec-${Date.now()}-${Math.random()}`,
      type: typeKey,
      label: typeInfo?.label || typeKey,
      questions: [newQ],
    };
    
    updateSectionQuestions([...subsectionGroups, newGroup]);
    setIsAddTypeModalOpen(false);
  };

  const handleDeleteSubsection = (groupIdx: number) => {
    const nextGroups = subsectionGroups.filter((_, i) => i !== groupIdx);
    updateSectionQuestions(nextGroups);
  };

  // Question Actions within a Subsection
  const handleAddQuestionToSubsection = (groupIdx: number) => {
    const group = subsectionGroups[groupIdx];
    const currentAttemptAny = group.questions[0]?.question_data?.attempt_any;
    const currentQMarks = group.questions[0]?.marks || 1;

    // Total allocated marks budget for this subsection group
    const targetGroupMarks = group.target_marks || (currentAttemptAny && currentAttemptAny > 0 ? currentAttemptAny * currentQMarks : group.questions.reduce((sum, q) => sum + (q.marks || 0), 0));
    const newTotalQs = group.questions.length + 1;

    // Divisor is attempt_any N if set, otherwise newTotalQs
    const divisor = (currentAttemptAny && currentAttemptAny > 0) ? currentAttemptAny : newTotalQs;
    const splitMarks = Math.floor(targetGroupMarks / divisor);
    const marksForQs = splitMarks > 0 ? splitMarks : 1;

    const newQ = makeEmptyQuestion(group.type, newTotalQs) as Question;
    newQ.question_data = {
      ...(newQ.question_data || {}),
      _clientId: generateClientId(),
      attempt_any: currentAttemptAny,
      target_group_marks: targetGroupMarks,
    };

    // Auto-split marks evenly across questions based on divisor
    const updatedExistingQs = group.questions.map((q) => ({
      ...q,
      marks: marksForQs,
      question_data: { ...(q.question_data || {}), target_group_marks: targetGroupMarks },
    }));

    const nextGroups = [...subsectionGroups];
    nextGroups[groupIdx] = {
      ...group,
      target_marks: targetGroupMarks,
      questions: [...updatedExistingQs, { ...newQ, marks: marksForQs }],
    };
    updateSectionQuestions(nextGroups);
  };

  const handleUpdateQuestion = (groupIdx: number, qIdx: number, updates: Partial<Question>) => {
    const nextGroups = [...subsectionGroups];
    const group = nextGroups[groupIdx];
    const updatedQs = [...group.questions];
    updatedQs[qIdx] = { ...updatedQs[qIdx], ...updates };
    
    nextGroups[groupIdx] = {
      ...group,
      questions: updatedQs,
    };
    updateSectionQuestions(nextGroups);
  };

  const handleDeleteQuestion = (groupIdx: number, qIdx: number) => {
    const nextGroups = [...subsectionGroups];
    const group = nextGroups[groupIdx];
    const currentAttemptAny = group.questions[0]?.question_data?.attempt_any;
    const currentQMarks = group.questions[0]?.marks || 1;
    const targetGroupMarks = group.target_marks || (currentAttemptAny && currentAttemptAny > 0 ? currentAttemptAny * currentQMarks : group.questions.reduce((sum, q) => sum + (q.marks || 0), 0));

    const filteredQs = group.questions.filter((_, i) => i !== qIdx);
    
    if (filteredQs.length === 0) {
      // Remove entire subsection if all questions are deleted
      nextGroups.splice(groupIdx, 1);
    } else {
      const remainingCount = filteredQs.length;
      let validAttemptAny = currentAttemptAny;
      if (validAttemptAny && validAttemptAny >= remainingCount) {
        validAttemptAny = remainingCount > 1 ? remainingCount - 1 : undefined;
      }

      const divisor = (validAttemptAny && validAttemptAny > 0) ? validAttemptAny : remainingCount;
      const splitMarks = Math.floor(targetGroupMarks / divisor);
      const marksForQs = splitMarks > 0 ? splitMarks : 1;

      const updatedRemainingQs = filteredQs.map((q) => ({
        ...q,
        marks: marksForQs,
        question_data: {
          ...(q.question_data || {}),
          attempt_any: validAttemptAny,
          target_group_marks: targetGroupMarks,
        },
      }));

      nextGroups[groupIdx] = {
        ...group,
        target_marks: targetGroupMarks,
        questions: updatedRemainingQs,
      };
    }
    updateSectionQuestions(nextGroups);
  };

  // ── Attempt Any Handlers ──────────────────────────────────────────────────
  const handleToggleAttemptAny = (groupIdx: number, enable: boolean) => {
    const nextGroups = [...subsectionGroups];
    const group = nextGroups[groupIdx];
    const currentAttemptAny = group.questions[0]?.question_data?.attempt_any;
    const currentQMarks = group.questions[0]?.marks || 1;
    const groupNominalMarks = group.questions.reduce((sum, q) => sum + (q.marks || 0), 0);

    const targetGroupMarks = group.target_marks || (currentAttemptAny && currentAttemptAny > 0 ? currentAttemptAny * currentQMarks : groupNominalMarks);
    const validOptions = getValidAttemptAnyOptions(targetGroupMarks, group.questions.length);
    const defaultAny = enable && validOptions.length > 0 ? validOptions[validOptions.length - 1] : undefined;

    const divisor = enable && defaultAny ? defaultAny : group.questions.length;
    const splitMarks = Math.floor(targetGroupMarks / divisor);
    const marksForQs = splitMarks > 0 ? splitMarks : 1;

    const updatedQs = group.questions.map((q) => ({
      ...q,
      marks: marksForQs,
      question_data: {
        ...q.question_data,
        attempt_any: enable ? defaultAny : undefined,
        target_group_marks: targetGroupMarks,
      },
    }));
    nextGroups[groupIdx] = { ...group, target_marks: targetGroupMarks, questions: updatedQs };
    updateSectionQuestions(nextGroups);
  };

  const handleSetAttemptAny = (groupIdx: number, value: number) => {
    const nextGroups = [...subsectionGroups];
    const group = nextGroups[groupIdx];
    const currentAttemptAny = group.questions[0]?.question_data?.attempt_any;
    const currentQMarks = group.questions[0]?.marks || 1;
    const groupNominalMarks = group.questions.reduce((sum, q) => sum + (q.marks || 0), 0);

    const targetGroupMarks = group.target_marks || (currentAttemptAny && currentAttemptAny > 0 ? currentAttemptAny * currentQMarks : groupNominalMarks);

    const splitMarks = Math.floor(targetGroupMarks / value);
    const marksForQs = splitMarks > 0 ? splitMarks : 1;

    const updatedQs = group.questions.map((q) => ({
      ...q,
      marks: marksForQs,
      question_data: {
        ...q.question_data,
        attempt_any: value,
        target_group_marks: targetGroupMarks,
      },
    }));
    nextGroups[groupIdx] = { ...group, target_marks: targetGroupMarks, questions: updatedQs };
    updateSectionQuestions(nextGroups);
  };

  // Calculate Section Marks (respecting attempt_any for effective marks)
  const sectionTotalMarks = useMemo(() => {
    return subsectionGroups.reduce((acc, g) => {
      const attemptAny = g.questions[0]?.question_data?.attempt_any;
      if (attemptAny && attemptAny > 0) {
        return acc + attemptAny * (g.questions[0]?.marks || 1);
      }
      return acc + g.questions.reduce((qAcc, q) => qAcc + (q.marks || 0), 0);
    }, 0);
  }, [subsectionGroups]);

  const totalAssignedMarks = getTotalAssignedMarks(paper);

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header & Section Marks Summary */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="space-y-1.5">
              <div>
                <span className="inline-block text-[10px] sm:text-xs font-black bg-[#3335e3]/10 text-[#3335e3] px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full uppercase tracking-wider whitespace-nowrap shrink-0">
                  Section {sectionLetter}
                </span>
              </div>
              <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-normal">
                Configure Subsections for Section {sectionLetter}
              </h1>
            </div>
            {sectionTitle && (
              <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
                {sectionTitle}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:flex sm:items-center sm:gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 sm:px-4 sm:py-2.5 text-center">
              <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Section Marks</p>
              <p className="text-base sm:text-lg font-black text-[#3335e3]">{sectionTotalMarks} Marks</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 sm:px-4 sm:py-2.5 text-center">
              <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Paper Target</p>
              <p className="text-base sm:text-lg font-black text-slate-800">
                {totalAssignedMarks} / {paper.total_marks}
              </p>
            </div>
          </div>
        </div>

        {/* Section Progress & Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 text-[11px] sm:text-xs font-semibold text-slate-500">
          <span className="whitespace-nowrap">Configuring Section {activeSectionIdx + 1} of {paper.sections.length}</span>
          <span className="flex items-center gap-1.5 text-emerald-600 whitespace-nowrap">
            <CheckCircle2 size={13} /> {subsectionGroups.length} Subsection Group{subsectionGroups.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Subsections List (Question Type Groups) */}
      <div className="space-y-4 sm:space-y-6">
        {subsectionGroups.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-2xs">
            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
              <Layers className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <h3 className="text-xs sm:text-sm font-black text-slate-700 mb-1">No Subsections Configured</h3>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium max-w-sm">
              Configure question types in Step 3 to generate subsection groups for this section.
            </p>
          </div>
        ) : (
          <>
            {subsectionGroups.map((group, groupIdx) => {
              const isCollapsed = collapsedSubsections[group.id] ?? true;
              const groupMarks = group.questions.reduce((sum, q) => sum + (q.marks || 0), 0);
              const typeInfo = BOARD_QUESTION_TYPES.find((t) => t.key === group.type);
              // Check for attempt_any from question_data
              const attemptAny = group.questions[0]?.question_data?.attempt_any;
              const effectiveMarks = attemptAny && attemptAny > 0
                ? attemptAny * (group.questions[0]?.marks || 1)
                : groupMarks;

              return (
                <div
                  key={group.id || groupIdx}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition-all"
                >
                  {/* Subsection Header Bar */}
                  <div className="p-3.5 sm:p-5 bg-slate-50/80 border-b border-slate-200/60 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleCollapse(group.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors shrink-0"
                        >
                          {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                        </button>
                        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                          <div className="relative flex-1 min-w-[160px] max-w-sm">
                            <EditableSubsectionTitle
                              value={group.label}
                              onChange={(newLabel) => {
                                const nextGroups = [...subsectionGroups];
                                nextGroups[groupIdx] = {
                                  ...group,
                                  label: newLabel,
                                };
                                updateSectionQuestions(nextGroups);
                              }}
                            />
                          </div>
                          <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                            {typeInfo?.emoji || "✏️"} {group.type}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                        {/* Attempt Any Controls */}
                        {(() => {
                          const validOptions = getValidAttemptAnyOptions(groupMarks, group.questions.length);
                          const hasAttemptAny = attemptAny && attemptAny > 0;
                          const marksPerQuestion = hasAttemptAny && attemptAny ? groupMarks / attemptAny : 0;

                          return (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleAttemptAny(groupIdx, !hasAttemptAny)}
                                disabled={!hasAttemptAny && validOptions.length === 0}
                                className={`p-1 rounded-lg transition-colors ${
                                  hasAttemptAny
                                    ? "text-[#3335e3] hover:text-[#3335e3]/80"
                                    : validOptions.length === 0
                                      ? "text-slate-300 cursor-not-allowed"
                                      : "text-slate-400 hover:text-slate-600"
                                }`}
                                title={hasAttemptAny ? "Disable attempt-any choice" : group.questions.length <= 1 ? "Add at least 2 questions to enable choice" : "Enable attempt-any choice"}
                              >
                                {hasAttemptAny ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                              </button>
                              {hasAttemptAny ? (
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                  <span className="text-slate-400">Any</span>
                                  <select
                                    value={attemptAny}
                                    onChange={(e) => handleSetAttemptAny(groupIdx, parseInt(e.target.value))}
                                    className="h-7 px-2 text-xs font-black text-center border border-indigo-200 rounded-lg bg-indigo-50 focus:outline-none focus:ring-1 focus:ring-[#3335e3] appearance-none cursor-pointer"
                                  >
                                    {validOptions.map((n) => (
                                      <option key={n} value={n}>
                                        {n}
                                      </option>
                                    ))}
                                  </select>
                                  <span className="text-slate-400">of {group.questions.length}</span>
                                  <span className="text-[10px] font-bold text-slate-400 ml-1 hidden sm:inline">
                                    ({group.questions[0]?.marks || 1}M each)
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10px] font-medium text-slate-400">
                                  {group.questions.length <= 1
                                    ? "Need 2+ questions"
                                    : "Attempt Any"
                                  }
                                </span>
                              )}
                            </div>
                          );
                        })()}

                        <span className={`text-xs font-black px-3 py-1 rounded-full shadow-2xs ${
                          attemptAny && attemptAny > 0
                            ? "text-amber-700 bg-amber-50 border border-amber-200"
                            : "text-slate-700 bg-white border border-slate-200"
                        }`}>
                          {effectiveMarks} Marks
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Subsection Body (Questions List) */}
                  {!isCollapsed && (
                    <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6">
                      {/* Uneven Mark Distribution / Question Count Alert */}
                      {(() => {
                        const attemptAny = group.questions[0]?.question_data?.attempt_any;
                        const currentQMarks = group.questions[0]?.marks || 1;
                        const targetGroupMarks = group.target_marks || (attemptAny && attemptAny > 0 ? attemptAny * currentQMarks : group.questions.reduce((sum, q) => sum + (q.marks || 0), 0));
                        const divisor = (attemptAny && attemptAny > 0) ? attemptAny : group.questions.length;
                        const qCount = group.questions.length;
                        const isUneven = divisor > 0 && targetGroupMarks > 0 && (targetGroupMarks % divisor !== 0);
                        const sharePerQ = divisor > 0 ? (targetGroupMarks / divisor) : 0;

                        if (!isUneven) return null;

                        return (
                          <div className="bg-amber-50 border-2 border-amber-300/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3 animate-in fade-in duration-200">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-amber-100 rounded-xl text-amber-700 shrink-0 mt-0.5">
                                <AlertCircle className="h-5 w-5" />
                              </div>
                              <div className="flex-1 space-y-1">
                                <h4 className="text-xs sm:text-sm font-black text-amber-950 flex items-center gap-2">
                                  Uneven Mark Distribution Alert
                                </h4>
                                <p className="text-xs font-semibold text-amber-900 leading-relaxed">
                                  The allocated budget of <strong className="font-black underline">{targetGroupMarks} Marks</strong> cannot be evenly split across <strong className="font-black">{attemptAny && attemptAny > 0 ? `${attemptAny} attempted` : `${qCount}`} questions</strong> ({sharePerQ.toFixed(2)} Marks each).
                                </p>
                                <p className="text-xs text-amber-800 font-medium">
                                  Please delete a question to restore equal mark distribution (e.g. {Math.max(1, divisor - 1)} question{divisor - 1 !== 1 ? "s" : ""} = {(targetGroupMarks / Math.max(1, divisor - 1)).toFixed(0)}M each).
                                </p>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-amber-200/80 flex items-center justify-start">
                              <button
                                type="button"
                                onClick={() => handleDeleteQuestion(groupIdx, qCount - 1)}
                                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Delete Question (Q.{groupIdx + 1}.{qCount})
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {group.questions.map((q, qIdx) => {
                        const qNumberLabel = `${groupIdx + 1}.${qIdx + 1}`;

                        return (
                          <div
                            key={getQuestionKey(q)}
                            className="bg-slate-50/50 rounded-2xl border border-slate-200/80 p-3.5 sm:p-5 space-y-4 relative hover:border-[#3335e3]/40 transition-all"
                          >
                            {/* Question Sub-Header */}
                            <div className="flex items-center justify-between gap-4 border-b border-slate-200/60 pb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black bg-[#3335e3] text-white px-2.5 py-0.5 rounded-lg shadow-2xs">
                                  Q.{qNumberLabel}
                                </span>
                                <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide">
                                  {typeInfo?.label || group.type}
                                </span>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">Marks:</span>
                                  <input
                                    type="number"
                                    min={1}
                                    max={50}
                                    value={q.marks || ""}
                                    onKeyDown={(e) => {
                                      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                                        e.preventDefault();
                                      }
                                    }}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === "") {
                                        handleUpdateQuestion(groupIdx, qIdx, { marks: 0 });
                                      } else {
                                        const parsed = parseInt(val, 10);
                                        if (!isNaN(parsed)) {
                                          handleUpdateQuestion(groupIdx, qIdx, { marks: parsed });
                                        }
                                      }
                                    }}
                                    className="w-12 h-6 text-xs font-black text-center focus:outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteQuestion(groupIdx, qIdx)}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-200/50 transition-colors"
                                  title="Delete Question"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>

                            {/* Reused Question Form Component */}
                            <QuestionForm
                              q={q}
                              onChange={(updates) => handleUpdateQuestion(groupIdx, qIdx, updates)}
                            />
                          </div>
                        );
                      })}

                      {/* Add Question Button within Subsection */}
                      <button
                        type="button"
                        onClick={() => handleAddQuestionToSubsection(groupIdx)}
                        className="w-full flex items-center justify-center gap-2 h-11 sm:h-10 border border-dashed border-slate-300 hover:border-[#3335e3] hover:text-[#3335e3] rounded-xl text-xs font-bold text-slate-700 bg-white transition-all shadow-2xs"
                      >
                        <Plus size={15} /> Add Question to Subsection {groupIdx + 1}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
