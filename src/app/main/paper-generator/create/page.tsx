"use client";

import React, { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Circle, ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import { createDraft, getPaper, updatePaper } from "@/lib/api/question-paper";
import PaperSetupStep from "./steps/PaperSetupStep";
import AddQuestionsStep from "./steps/AddQuestionsStep";
import PreviewPrintStep from "./steps/PreviewPrintStep";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
export interface PaperState {
  paper_id: number | null;
  exam_id: number | null;
  title: string;
  class_id: number | null;
  class_name: string;
  subject_id: number | null;
  subject: string;
  school_name?: string;
  total_marks: number;
  duration_mins: number;
  instructions: string;
  status: string;
  sections: Section[];
}

export interface Section {
  section_id: number | null;
  section_name: string;
  section_order: number;
  total_section_marks: number;
  questions: Question[];
}

export interface Question {
  question_id: number | string | null;
  question_type: string;
  question_text: string;
  question_data: any;
  marks: number;
  question_order: number;
}

const STEPS = [
  { num: 1, label: "Paper Setup" },
  { num: 2, label: "Build Paper" },
  { num: 3, label: "Preview & Print" },
];

const AUTOSAVE_DELAY = 3000;

function CreatePaperPageInner() {
  const router       = useRouter();
  const params       = useSearchParams();
  const paperId      = params.get("paper_id");

  const [step, setStep]                       = useState(1);
  const [loading, setLoading]                 = useState(!!paperId);
  const [saving, setSaving]                   = useState(false);
  const [savedAt, setSavedAt]                 = useState<Date | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const autoSaveTimer                          = useRef<NodeJS.Timeout | null>(null);

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
    instructions: "1. All questions are compulsory.\n2. Write neatly.",
    status: "Draft",
    sections: []
  });

  // ── Load existing paper ───────────────────────────────────────────────────
  useEffect(() => {
    if (!paperId) return;
    (async () => {
      try {
        setLoading(true);
        const data = await getPaper(paperId);
        if (data) {
          setPaper(data);
          // If already published, go to preview
          if (data.status === "Published") setStep(3);
        }
      } catch (err) {
        console.error("Failed to load paper", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [paperId]);

  // ── Auto-save ─────────────────────────────────────────────────────────────
  const triggerAutoSave = useCallback((p: PaperState) => {
    if (!p.paper_id) return; // Only auto-save if already created
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      try {
        setSaving(true);
        await updatePaper(p.paper_id!, p);
        setSavedAt(new Date());
      } catch (err) {
        console.warn("Auto-save failed", err);
      } finally {
        setSaving(false);
      }
    }, AUTOSAVE_DELAY);
  }, []);

  const updateField = useCallback((updates: Partial<PaperState>) => {
    setPaper(prev => {
      const next = { ...prev, ...updates };
      triggerAutoSave(next);
      return next;
    });
  }, [triggerAutoSave]);

  // ── Validation & Navigation ────────────────────────────────────────────────
  const validateStep1 = () => {
    if (!paper.exam_id) return "Please select an upcoming exam.";
    if (!paper.title)    return "Please enter a paper title.";
    if (paper.total_marks <= 0) return "Total marks must be greater than 0.";
    return null;
  };

  const validateStep2 = () => {
    if (!paper.sections.length) return "Please add at least one section.";
    const totalAssigned = paper.sections.reduce((acc, sec) => 
      acc + sec.questions.reduce((qAcc, q) => qAcc + (q.marks || 0), 0), 0
    );
    if (totalAssigned !== paper.total_marks) {
      return `Marks mismatch: Assigned ${totalAssigned} / Goal ${paper.total_marks}.`;
    }
    return null;
  };

  const goNext = async () => {
    setValidationError(null);
    if (step === 1) {
      const err = validateStep1();
      if (err) { setValidationError(err); return; }
      
      if (!paper.paper_id) {
        try {
          setSaving(true);
          const saved = await createDraft(paper);
          setPaper(prev => ({ ...prev, paper_id: saved.paper_id }));
        } catch (err) {
          setValidationError("Failed to create paper draft.");
          return;
        } finally {
          setSaving(false);
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
    if (step > 1) setStep(step - 1);
    else router.push("/main/paper-generator");
  };

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground animate-pulse">Loading your paper...</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-0 -m-4 sm:-m-6 h-[calc(100vh-3.5rem)] bg-slate-50/30">
      {/* ── Top Bar ── */}
      <div className="border-b bg-white/70 backdrop-blur-xl sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-8">
          <Button variant="ghost" size="sm" onClick={goBack} className="rounded-xl h-10 px-4 gap-2 hover:bg-slate-100 transition-all font-bold text-slate-600">
            <ArrowLeft className="h-4 w-4" />Back
          </Button>

          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-4 bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50">
              {STEPS.map((s, idx) => (
                <React.Fragment key={s.num}>
                  <div className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-500 ${
                      step === s.num ? "bg-white shadow-xl shadow-slate-200/50 scale-105" : ""
                  }`}>
                    <div className={`h-6 w-6 rounded-lg flex items-center justify-center text-[10px] font-black transition-all duration-500 ${
                      step >= s.num ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-400"
                    }`}>
                      {step > s.num ? <CheckCircle2 className="h-4 w-4" /> : s.num}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest hidden lg:block ${
                      step >= s.num ? "text-slate-800" : "text-slate-300"
                    }`}>{s.label}</span>
                  </div>
                  {idx < STEPS.length - 1 && <div className="h-1 w-4 rounded-full bg-slate-200/30" />}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 min-w-[120px] justify-end">
            {saving ? (
              <Badge variant="outline" className="h-9 px-4 rounded-xl border-primary/20 bg-primary/5 text-primary gap-2 animate-pulse transition-all">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[8px]">Saving</span>
              </Badge>
            ) : savedAt ? (
               <div className="flex flex-col items-end opacity-40">
                    <span className="text-[8px] font-black uppercase text-slate-400">Cloud Sync</span>
                    <span className="text-[9px] font-bold text-green-600">Active</span>
               </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Error Area ── */}
      {validationError && (
        <div className="px-6 pt-6 max-w-4xl mx-auto w-full z-20">
          <div className="rounded-[2rem] border border-destructive/20 bg-destructive/5 px-6 py-4 text-xs font-bold text-destructive flex gap-3 items-center shadow-xl shadow-destructive/5 animate-in slide-in-from-top-4">
            <div className="h-8 w-8 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-4 w-4" />
            </div>
            {validationError}
          </div>
        </div>
      )}

      {/* ── Step Content ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="h-full">
          {step === 1 && <PaperSetupStep paper={paper} onChange={updateField} />}
          {step === 2 && <AddQuestionsStep paper={paper} onChange={updateField} />}
          {step === 3 && <PreviewPrintStep paper={paper} />}
        </div>
      </div>

      {/* ── Nav Bar ── */}
      <div className="border-t bg-white/50 backdrop-blur-xl p-6 px-10 shadow-[0_-10px_50px_rgba(0,0,0,0.03)] z-30">
        <div className="max-w-7xl mx-auto flex justify-end">
          <Button onClick={goNext} className="gap-3 px-12 h-14 rounded-[2rem] shadow-2xl shadow-primary/30 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all text-base font-black uppercase tracking-tighter">
            {step === 2 ? "Generate Paper" : "Proceed to Build"}
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CreatePaperPage() {
  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <CreatePaperPageInner />
    </Suspense>
  );
}
