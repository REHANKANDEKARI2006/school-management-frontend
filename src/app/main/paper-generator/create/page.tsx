"use client";

import React, { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { createDraft, getPaper, updatePaper, upsertSection, upsertQuestion } from "@/lib/api/question-paper";
import PaperSetupStep from "./steps/PaperSetupStep";
import AddQuestionsStep from "./steps/AddQuestionsStep";
import PreviewStep from "./steps/PreviewStep";
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
}

export interface PaperState {
  paper_id: number | null;
  exam_id: number | null | undefined;
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
  // For internal rendering only
  sections: Array<{
    section_id: number | null;
    section_name: string;
    section_order: number;
    total_section_marks: number;
    questions: Question[];
  }>;
}

const STEPS = [
  { num: 1, label: "Paper Setup" },
  { num: 2, label: "Add Questions" },
  { num: 3, label: "Preview & Download" },
];

/**
 * Normalise the class_name coming from the DB.
 * The `class` table stores plain numbers like "2", "10" etc.
 * The Paper Setup dropdown expects "Class 2", "Class 10" etc.
 */
function normalizeClassName(raw: string | null | undefined): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (/^\d{1,2}$/.test(trimmed)) return `Class ${trimmed}`;
  return trimmed;
}

// ─── Helper: get flat question list from sections ─────────────────────────────
export function getAllQuestions(paper: PaperState): Question[] {
  const allQ: Question[] = [];
  const sortedSections = [...paper.sections].sort(
    (a, b) => (a.section_order || 0) - (b.section_order || 0)
  );
  for (const sec of sortedSections) {
    const sortedQs = [...sec.questions].sort(
      (a, b) => (a.question_order || 0) - (b.question_order || 0)
    );
    for (const q of sortedQs) {
      allQ.push(q);
    }
  }
  return allQ;
}

// ─── Helper: get total assigned marks ────────────────────────────────────────
export function getTotalAssignedMarks(paper: PaperState): number {
  return paper.sections.reduce(
    (acc, sec) => acc + sec.questions.reduce((qAcc, q) => qAcc + (q.marks || 0), 0),
    0
  );
}

function CreatePaperPageInner() {
  const router  = useRouter();
  const params  = useSearchParams();
  const paperId = params.get("paper_id");

  const [step, setStep]                       = useState(1);
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
          // Normalize class_name so the dropdown always gets "Class N" format
          // (the DB may store the raw number, e.g. "2" instead of "Class 2")
          setPaper({
            ...data,
            class_name: normalizeClassName(data.class_name),
            subject: data.subject || data.subject_name || ""
          });
          if (data.status === "Published") setStep(3);
        }
      } catch (err) {
        console.error("Failed to load paper", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [paperId]);

  // ── Auto-save ──────────────────────────────────────────────────────────────
  const triggerAutoSave = useCallback((p: PaperState) => {
    if (!p.paper_id) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      try {
        setSaving(true);
        loaderIncrement("Auto-saving paper…");
        await updatePaper(p.paper_id!, p);
      } catch (err) {
        console.warn("Auto-save failed", err);
      } finally {
        setSaving(false);
        loaderDecrement();
      }
    }, 2000);
  }, [loaderIncrement, loaderDecrement]);

  const updateField = useCallback((updates: Partial<PaperState>) => {
    setPaper(prev => {
      const next = { ...prev, ...updates };
      triggerAutoSave(next);
      return next;
    });
  }, [triggerAutoSave]);

  // ── Step Navigation ────────────────────────────────────────────────────────
  const validateStep1 = () => {
    if (!paper.class_name) return "Please select a Standard / Class.";
    if (!paper.subject)    return "Please select a Subject.";
    if (paper.total_marks <= 0) return "Total Marks must be greater than 0.";
    return null;
  };

  const validateStep2 = () => {
    const totalQ = getAllQuestions(paper).length;
    if (totalQ === 0) return "Please add at least one question.";
    return null;
  };

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
          loaderIncrement("Creating paper draft…");
          const autoTitle = `${paper.class_name} — ${paper.subject}`;
          const payload = { ...paper, title: paper.title || autoTitle };
          const saved = await createDraft(payload);
          activePaperId = saved.paper_id;
          currentPaper = { ...paper, paper_id: saved.paper_id, title: saved.title || autoTitle };
          setPaper(currentPaper);
        } catch {
          setValidationError("Failed to save paper. Please try again.");
          return;
        } finally {
          setSaving(false);
          loaderDecrement();
        }
      }

      // Save/upsert sections that do not have a section_id yet
      if (activePaperId) {
        try {
          setSaving(true);
          loaderIncrement("Saving paper sections…");
          const updatedSections = await Promise.all(
            currentPaper.sections.map(async (sec) => {
              if (!sec.section_id) {
                const created = await upsertSection(activePaperId!, {
                  section_name: sec.section_name,
                  section_order: sec.section_order,
                  total_section_marks: sec.total_section_marks || 0,
                });
                return { ...sec, section_id: created.section_id };
              }
              return sec;
            })
          );
          
          currentPaper = { ...currentPaper, sections: updatedSections };
          setPaper(currentPaper);
        } catch (err) {
          console.error("Failed to save paper sections", err);
          setValidationError("Failed to save paper sections. Please try again.");
          return;
        } finally {
          setSaving(false);
          loaderDecrement();
        }
      }
      setStep(2);
    } else if (step === 2) {
      const err = validateStep2();
      if (err) { setValidationError(err); return; }
      setStep(3);
    }
  };

  const goBack = () => {
    if (step > 1) { setStep(step - 1); setValidationError(null); }
    else router.push("/main/paper-generator");
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#3335e3]" />
        <p className="text-sm text-slate-500 animate-pulse">Loading paper...</p>
      </div>
    );
  }

  const assignedMarks = getTotalAssignedMarks(paper);
  const totalQ = getAllQuestions(paper).length;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/40">
      {/* ── Top Bar ── */}
      <div className="border-b bg-white sticky top-0 z-30 shadow-sm print:hidden wizard-top-bar">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Back */}
          <button
            onClick={goBack}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          {/* Steps */}
          <div className="flex items-center gap-2 sm:gap-4">
            {STEPS.map((s, idx) => {
              const isActive = step === s.num;
              const isPast   = step > s.num;
              return (
                <React.Fragment key={s.num}>
                  <button
                    onClick={() => { if (isPast) { setStep(s.num); setValidationError(null); } }}
                    className={`flex items-center gap-2 transition-all ${isPast ? "cursor-pointer" : "cursor-default"}`}
                  >
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                      isActive ? "bg-[#3335e3] text-white scale-110" :
                      isPast   ? "bg-green-500 text-white" :
                                 "bg-slate-200 text-slate-400"
                    }`}>
                      {isPast ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.num}
                    </div>
                    <span className={`text-[11px] font-bold uppercase tracking-widest hidden sm:inline ${
                      isActive ? "text-slate-900" : isPast ? "text-green-600" : "text-slate-400"
                    }`}>
                      {s.label}
                    </span>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div className={`h-px w-6 sm:w-10 transition-colors ${isPast ? "bg-green-300" : "bg-slate-200"}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {saving && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
            {step < 3 && (
              <Button
                onClick={goNext}
                disabled={saving}
                className="h-9 px-4 sm:px-6 text-xs font-bold bg-[#3335e3] hover:bg-[#3335e3]/90 text-white shadow-sm gap-2"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {step === 1 ? (
                  <><span className="hidden sm:inline">Next: Add Questions</span><span className="sm:hidden">Next</span> →</>
                ) : (
                  <><span className="hidden sm:inline">Next: Preview</span><span className="sm:hidden">Next</span> →</>
                )}
              </Button>
            )}
            {step === 3 && (
              <Button
                variant="outline"
                onClick={() => router.push("/main/paper-generator")}
                className="h-9 px-4 text-xs font-bold"
              >
                Exit
              </Button>
            )}
          </div>
        </div>

        {/* Marks Progress Bar (Step 2 only) */}
        {step === 2 && (
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-2 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  assignedMarks > paper.total_marks ? "bg-red-500" :
                  assignedMarks === paper.total_marks ? "bg-green-500" :
                  "bg-[#3335e3]"
                }`}
                style={{ width: `${Math.min(100, (assignedMarks / paper.total_marks) * 100)}%` }}
              />
            </div>
            <span className={`text-[11px] font-bold whitespace-nowrap ${
              assignedMarks > paper.total_marks ? "text-red-600" :
              assignedMarks === paper.total_marks ? "text-green-600" : "text-slate-500"
            }`}>
              {assignedMarks} / {paper.total_marks} Marks • {totalQ} Q
            </span>
          </div>
        )}
      </div>

      {/* ── Validation Error ── */}
      {validationError && (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-4 w-full">
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm font-semibold text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {validationError}
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <div className="flex-1 w-full max-w-[1400px] mx-auto py-6 px-4 sm:px-6 pb-24">
        {step === 1 && <PaperSetupStep paper={paper} onChange={updateField} />}
        {step === 2 && <AddQuestionsStep paper={paper} onChange={updateField} />}
        {step === 3 && <PreviewStep paper={paper} />}
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
