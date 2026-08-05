"use client";

import React, { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { createDraft, getPaper, fullSavePaper, upsertSection } from "@/lib/api/question-paper";
import { ensureClientIds } from "./steps/clientIdUtils";
import dynamic from "next/dynamic";
import PaperDetailsStep from "./steps/PaperDetailsStep";
import AddSectionsStep from "./steps/AddSectionsStep";
import ConfigureQuestionsStep from "./steps/ConfigureQuestionsStep";
import ConfigureSubsectionsStep from "./steps/ConfigureSubsectionsStep";
const PreviewStep = dynamic(() => import("./steps/PreviewStep"), {
  loading: () => <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /><p className="mt-2 text-sm text-muted-foreground">Preparing Paper Preview...</p></div>,
});
import { Button } from "@/components/ui/button";
import { useGlobalLoaderStore } from "@/store/useGlobalLoaderStore";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Question {
  question_id: number | string | null;
  question_type: string;
  question_text: string;
  question_data: any;
  marks: number;
  question_order: number;
  answer_key?: string;
  subsection_label?: string;
}

export interface PaperState {
  paper_id: number | null;
  exam_id: number | null | undefined;
  exam_name?: string;
  exam_type?: string;
  title: string;
  class_id: number | null | undefined;
  class_name: string;
  subject_id: number | null | undefined;
  subject: string;
  subject_name?: string;
  total_marks: number;
  duration_mins: number;
  instructions: string;
  status: string;
  academic_year?: string;
  sections: Array<{
    section_id: number | null;
    section_name: string;
    section_order: number;
    total_section_marks: number;
    questions: Question[];
  }>;
}

const STEPS = [
  { num: 1, label: "Paper Details" },
  { num: 2, label: "Add Sections" },
  { num: 3, label: "Configure Questions" },
  { num: 4, label: "Sub-Questions" },
  { num: 5, label: "Preview & Download" },
];

function normalizeClassName(raw: string | null | undefined): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (/^\d{1,2}$/.test(trimmed)) return `Class ${trimmed}`;
  return trimmed;
}

export function getAllQuestions(paper: PaperState): Question[] {
  const allQ: Question[] = [];
  const sortedSections = [...paper.sections].sort(
    (a, b) => (a.section_order || 0) - (b.section_order || 0)
  );
  for (const sec of sortedSections) {
    const sortedQs = [...(sec.questions || [])].sort(
      (a, b) => (a.question_order || 0) - (b.question_order || 0)
    );
    for (const q of sortedQs) {
      allQ.push(q);
    }
  }
  return allQ;
}

export function getTotalAssignedMarks(paper: PaperState): number {
  let total = 0;
  for (const sec of paper.sections) {
    const questions = sec.questions || [];
    if (questions.length === 0) continue;

    // Group questions by subsection_label + question_type to detect attempt_any groups
    let i = 0;
    while (i < questions.length) {
      const q = questions[i];
      const label = q.subsection_label || "";
      const type = q.question_type;
      const attemptAny = q.question_data?.attempt_any;

      // Find all consecutive questions with same label + type
      let groupEnd = i + 1;
      while (groupEnd < questions.length) {
        const next = questions[groupEnd];
        const nextLabel = next.subsection_label || "";
        if (next.question_type !== type || (label && nextLabel !== label)) break;
        groupEnd++;
      }

      if (attemptAny && attemptAny > 0) {
        // Use effective marks: attempt_any × marks_per_question
        total += attemptAny * (q.marks || 1);
      } else {
        // Sum all marks in this group
        for (let j = i; j < groupEnd; j++) {
          total += questions[j].marks || 0;
        }
      }
      i = groupEnd;
    }
  }
  return total;
}

function CreatePaperPageInner() {
  const router  = useRouter();
  const params  = useSearchParams();
  const paperId = params.get("paper_id");

  const [step, setStep]                       = useState(1);
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [loading, setLoading]                 = useState(!!paperId);
  const [saving, setSaving]                   = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const autoSaveTimer                          = useRef<NodeJS.Timeout | null>(null);
  const { increment: loaderIncrement, decrement: loaderDecrement } = useGlobalLoaderStore();

  const [paper, setPaper] = useState<PaperState>({
    paper_id: null,
    exam_id: null,
    title: "",
    class_id: null,
    class_name: "",
    subject_id: null,
    subject: "",
    total_marks: 80,
    duration_mins: 180,
    instructions: "1. All questions are compulsory.\n2. Write neatly and legibly.\n3. Show all working where required.",
    status: "Draft",
    academic_year: "2025–26",
    sections: [],
  });

  // ── Load existing paper ────────────────────────────────────────────────────
  useEffect(() => {
    if (!paperId) return;
    (async () => {
      try {
        setLoading(true);
        const data = await getPaper(paperId);
        if (data) {
          // Ensure every question has a stable _clientId for React keys
          const sections = (data.sections || []).map((sec: any) => ({
            ...sec,
            questions: ensureClientIds(sec.questions || []),
          }));
          setPaper({
            ...data,
            class_name: normalizeClassName(data.class_name),
            subject: data.subject || data.subject_name || "",
            sections,
          });
          if (data.status === "Published") setStep(4);
        }
      } catch (err) {
        console.error("Failed to load paper", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [paperId]);

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const savedStatusTimer              = useRef<NodeJS.Timeout | null>(null);

  // ── Auto-save (sequenced, full-save) ────────────────────────────────────────
  const lastSaveSequence = useRef<number>(0);
  const saveInFlight = useRef<boolean>(false);
  const pendingSave = useRef<PaperState | null>(null);

  const executeAutoSave = useCallback(async (p: PaperState) => {
    if (!p.paper_id) return;
    if (saveInFlight.current) {
      // Queue this as the next save to run after the current one finishes
      pendingSave.current = p;
      return;
    }
    saveInFlight.current = true;
    try {
      setSaving(true);
      setSaveStatus("saving");
      const seq = ++lastSaveSequence.current;
      const savedData = await fullSavePaper(p.paper_id!, p);
      if (seq === lastSaveSequence.current && savedData) {
        // Reconcile DB-assigned IDs back into local state without overwriting live edits
        setPaper(prev => {
          if (prev.paper_id !== savedData.paper_id) return prev;
          const reconciledSections = prev.sections.map((localSec, si) => {
            const dbSec = savedData.sections?.[si];
            if (!dbSec) return localSec;
            // Take the DB section_id, keep local content
            const reconciledQs = (localSec.questions || []).map((localQ, qi) => {
              const dbQ = dbSec.questions?.[qi];
              return {
                ...localQ,
                question_id: dbQ?.question_id ?? localQ.question_id,
              };
            });
            return {
              ...localSec,
              section_id: dbSec.section_id,
              questions: reconciledQs,
            };
          });
          return { ...prev, sections: reconciledSections };
        });
        setSaveStatus("saved");
        if (savedStatusTimer.current) clearTimeout(savedStatusTimer.current);
        savedStatusTimer.current = setTimeout(() => setSaveStatus("idle"), 2000);
      }
    } catch (err) {
      console.warn("Auto-save failed", err);
      setSaveStatus("idle");
    } finally {
      setSaving(false);
      saveInFlight.current = false;
      // If another save was queued while this one was in flight, run it now
      if (pendingSave.current) {
        const nextSave = pendingSave.current;
        pendingSave.current = null;
        executeAutoSave(nextSave);
      }
    }
  }, []);

  const triggerAutoSave = useCallback((p: PaperState) => {
    if (!p.paper_id) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => executeAutoSave(p), 600);
  }, [executeAutoSave]);

  const updateField = useCallback((updates: Partial<PaperState>) => {
    setPaper(prev => {
      const next = { ...prev, ...updates };
      triggerAutoSave(next);
      return next;
    });
  }, [triggerAutoSave]);

  // ── Step Validation ────────────────────────────────────────────────────────
  const validateStep1 = () => {
    if (!paper.class_name) return "Please select a Standard / Class.";
    if (!paper.subject)    return "Please select a Subject.";
    if (!paper.total_marks || paper.total_marks <= 0) return "Total Marks must be greater than 0.";
    return null;
  };

  const validateStep2 = () => {
    if (!paper.sections || paper.sections.length === 0) {
      return "Please add at least one section.";
    }
    // Check that all sections have marks allocated
    const hasMissing = paper.sections.some(sec => !sec.total_section_marks || sec.total_section_marks <= 0);
    if (hasMissing) {
      return "Please allocate marks for all sections before proceeding.";
    }
    // Check that section marks sum to paper total
    const totalSectionMarks = paper.sections.reduce((sum, sec) => sum + (sec.total_section_marks || 0), 0);
    if (totalSectionMarks !== paper.total_marks) {
      return `Total section marks (${totalSectionMarks}) must equal the paper total marks (${paper.total_marks}). ${
        totalSectionMarks > paper.total_marks
          ? `Please reduce by ${totalSectionMarks - paper.total_marks} marks.`
          : `Please allocate ${paper.total_marks - totalSectionMarks} more marks.`
      }`;
    }
    return null;
  };

  // saveSectionQuestions removed — fullSave handles everything transactionally

  // Prevent navigation during active save
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saving || saveStatus === "saving") {
        e.preventDefault();
        e.returnValue = "Auto-save in progress. Are you sure you want to leave?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saving, saveStatus]);

  // ── Navigation Logic ────────────────────────────────────────────────────────
  const goNext = async () => {
    setValidationError(null);

    if (step === 1) {
      const err = validateStep1();
      if (err) { setValidationError(err); return; }
      
      let activePaperId = paper.paper_id;
      let currentPaper = paper;
      
      if (!activePaperId) {
        try {
          setSaving(true);
          setSaveStatus("saving");
          const autoTitle = `${paper.class_name} — ${paper.subject}`;
          const payload = { ...paper, title: paper.title || autoTitle };
          const saved = await createDraft(payload);
          activePaperId = saved.paper_id;
          currentPaper = { ...paper, paper_id: saved.paper_id, title: saved.title || autoTitle };
          setPaper(currentPaper);
          setSaveStatus("saved");
          if (savedStatusTimer.current) clearTimeout(savedStatusTimer.current);
          savedStatusTimer.current = setTimeout(() => setSaveStatus("idle"), 2000);
        } catch {
          setValidationError("Failed to save paper details. Please try again.");
          return;
        } finally {
          setSaving(false);
        }
      }

      // Initialize default sections if empty
      if (currentPaper.sections.length === 0) {
        const defaultSections = [
          { section_id: null, section_name: "SECTION A///Section - A///", section_order: 1, total_section_marks: 0, questions: [] },
          { section_id: null, section_name: "SECTION B///Section - B///", section_order: 2, total_section_marks: 0, questions: [] },
          { section_id: null, section_name: "SECTION C///Section - C///", section_order: 3, total_section_marks: 0, questions: [] }
        ];
        currentPaper = { ...currentPaper, sections: defaultSections };
        setPaper(currentPaper);
      }

      setStep(2);
    } else if (step === 2) {
      const err = validateStep2();
      if (err) { setValidationError(err); return; }

      // Save/upsert sections to DB
      if (paper.paper_id) {
        try {
          setSaving(true);
          setSaveStatus("saving");
          const updatedSections = await Promise.all(
            paper.sections.map(async (sec, idx) => {
              const created = await upsertSection(paper.paper_id!, {
                section_id: sec.section_id || undefined,
                section_name: sec.section_name,
                section_order: idx + 1,
                total_section_marks: sec.total_section_marks || 0,
              });
              return { ...sec, section_id: created.section_id };
            })
          );
          
          setPaper(prev => ({ ...prev, sections: updatedSections }));
          setSaveStatus("saved");
          if (savedStatusTimer.current) clearTimeout(savedStatusTimer.current);
          savedStatusTimer.current = setTimeout(() => setSaveStatus("idle"), 2000);
        } catch (err) {
          console.error("Failed to save paper sections", err);
          setValidationError("Failed to save paper sections. Please try again.");
          return;
        } finally {
          setSaving(false);
        }
      }

      // Proceed to Step 3 (Configure Questions for Section A)
      setActiveSectionIdx(0);
      setStep(3);
    } else if (step === 3) {
      // Per-Section Question Configuration Navigation
      if (activeSectionIdx < paper.sections.length - 1) {
        // Move to next section (e.g. Section B, Section C...)
        setActiveSectionIdx((prev) => prev + 1);
      } else {
        // All sections configured -> Proceed to Step 4 (Configure Sub-Questions for Section A)
        setActiveSectionIdx(0);
        setStep(4);
      }
    } else if (step === 4) {
      // Per-Section Sub-Question Navigation
      if (activeSectionIdx < paper.sections.length - 1) {
        // Move to next section sub-questions (e.g. Section B, Section C...)
        setActiveSectionIdx((prev) => prev + 1);
      } else {
        // Last section configured -> Proceed to Step 5 (Preview & Download)
        // Trigger an immediate save before preview
        if (paper.paper_id) {
          executeAutoSave(paper);
        }
        setStep(5);
      }
    }
  };

  const goBack = () => {
    setValidationError(null);
    if (step === 3) {
      if (activeSectionIdx > 0) {
        setActiveSectionIdx((prev) => prev - 1);
      } else {
        setStep(2);
      }
    } else if (step === 4) {
      if (activeSectionIdx > 0) {
        setActiveSectionIdx((prev) => prev - 1);
      } else {
        // Go back to Configure Questions for last section
        setActiveSectionIdx(paper.sections.length - 1);
        setStep(3);
      }
    } else if (step === 5) {
      // Back to last section's sub-questions
      setActiveSectionIdx(paper.sections.length - 1);
      setStep(4);
    } else if (step > 1) {
      setStep((prev) => prev - 1);
    } else {
      router.push("/main/paper-generator");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#3335e3]" />
        <p className="text-sm text-slate-500 animate-pulse">Loading paper details...</p>
      </div>
    );
  }

  const currentSection = paper.sections[activeSectionIdx];
  const isLastSection = activeSectionIdx === paper.sections.length - 1;
  const nextSectionLetter = !isLastSection ? String.fromCharCode(65 + activeSectionIdx + 1) : "";

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      {/* ── Top Navigation Bar with Step Indicator ── */}
      <div className="border-b bg-white sticky top-0 z-30 shadow-sm print:hidden">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-center relative">
          {/* Connected Step Indicator Centered */}
          <div className="flex items-center gap-2 sm:gap-4">
            {STEPS.map((s, idx) => {
              const isActive = step === s.num;
              const isPast   = step > s.num;
              return (
                <React.Fragment key={s.num}>
                  <button
                    onClick={() => { if (isPast) { setStep(s.num); setValidationError(null); } }}
                    className={`flex items-center gap-2.5 transition-all ${isPast ? "cursor-pointer" : "cursor-default"}`}
                  >
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      isActive ? "bg-[#3335e3] text-white scale-110 shadow-md ring-4 ring-[#3335e3]/20" :
                      isPast   ? "bg-emerald-500 text-white" :
                                 "bg-slate-100 text-slate-400 border border-slate-200"
                    }`}>
                      {isPast ? <CheckCircle2 className="h-4 w-4" /> : s.num}
                    </div>
                    <span className={`text-xs font-extrabold uppercase tracking-widest hidden sm:inline ${
                      isActive ? "text-slate-900" : isPast ? "text-emerald-600" : "text-slate-400"
                    }`}>
                      {s.num === 3 ? `Section ${String.fromCharCode(65 + activeSectionIdx)} Questions` :
                       s.num === 4 ? `Section ${String.fromCharCode(65 + activeSectionIdx)} Sub-Qs` :
                       s.label}
                    </span>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div className={`h-0.5 w-6 sm:w-10 transition-colors ${isPast ? "bg-emerald-500" : "bg-slate-200"}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Auto-Save Status Badge */}
          {saveStatus === "saving" && (
            <div className="absolute right-4 sm:right-6 flex items-center gap-1.5 text-xs font-semibold text-[#3335e3] animate-in fade-in">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Auto-saving...
            </div>
          )}
          {saveStatus === "saved" && (
            <div className="absolute right-4 sm:right-6 flex items-center gap-1.5 text-xs font-bold text-emerald-600 animate-in fade-in">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Saved
            </div>
          )}
        </div>
      </div>

      {/* ── Validation Error Banner ── */}
      {validationError && (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-4 w-full animate-in fade-in">
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm font-bold text-red-700 shadow-sm">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            {validationError}
          </div>
        </div>
      )}

      {/* ── Content Body ── */}
      <div className="flex-1 w-full max-w-[1400px] mx-auto py-8 px-4 sm:px-6 pb-8">
        {step === 1 && <PaperDetailsStep paper={paper} onChange={updateField} />}
        {step === 2 && <AddSectionsStep paper={paper} onChange={updateField} />}
        {step === 3 && (
          <ConfigureQuestionsStep
            paper={paper}
            activeSectionIdx={activeSectionIdx}
            onChange={updateField}
          />
        )}
        {step === 4 && (
          <ConfigureSubsectionsStep
            paper={paper}
            activeSectionIdx={activeSectionIdx}
            onChange={updateField}
            onNextSection={goNext}
            onPrevSection={goBack}
          />
        )}
        {step === 5 && <PreviewStep paper={paper} />}
      </div>

      {/* ── Sticky Bottom Action Bar (Exclusive Navigation Bar) ── */}
      <div className="sticky bottom-0 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 bg-white/95 backdrop-blur-md border-t border-slate-200/80 p-4 z-20 shadow-lg mt-auto">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={goBack}
            className="h-10 px-5 text-xs font-bold rounded-xl border-slate-300 hover:bg-slate-100"
          >
            ← {step === 1 ? "Cancel & Exit" :
               step === 2 ? "Back to Paper Details" :
               step === 3 && activeSectionIdx === 0 ? "Back to Add Sections" :
               step === 3 ? `Back to Section ${String.fromCharCode(65 + activeSectionIdx - 1)}` :
               step === 4 && activeSectionIdx === 0 ? "Back to Questions" :
               step === 4 ? `Back to Section ${String.fromCharCode(65 + activeSectionIdx - 1)}` :
               step === 5 ? "Back to Sub-Questions" :
               "Back"}
          </Button>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 hidden sm:inline">
              {(step === 3 || step === 4)
                ? `Section ${String.fromCharCode(65 + activeSectionIdx)} (${activeSectionIdx + 1}/${paper.sections.length})`
                : `Step ${step} of 5`}
            </span>
            {step < 5 ? (
              <Button
                onClick={goNext}
                disabled={saving}
                className="h-10 px-6 text-xs font-bold bg-[#3335e3] hover:bg-[#3335e3]/90 text-white shadow-sm gap-2 rounded-xl"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {step === 1 ? "Next: Add Sections →" :
                 step === 2 ? `Next: Configure Section A →` :
                 step === 3 && !isLastSection ? `Next: Section ${nextSectionLetter} Questions →` :
                 step === 3 && isLastSection ? "Next: Configure Sub-Questions →" :
                 step === 4 && !isLastSection ? `Next: Section ${nextSectionLetter} Sub-Qs →` :
                 "Next: Preview & Download →"}
              </Button>
            ) : (
              <Button
                onClick={() => router.push("/main/paper-generator")}
                className="h-10 px-6 text-xs font-bold bg-[#3335e3] hover:bg-[#3335e3]/90 text-white shadow-sm gap-2 rounded-xl"
              >
                Exit Wizard
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreatePaperPage() {
  return (
    <Suspense fallback={
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#3335e3]" />
      </div>
    }>
      <CreatePaperPageInner />
    </Suspense>
  );
}
