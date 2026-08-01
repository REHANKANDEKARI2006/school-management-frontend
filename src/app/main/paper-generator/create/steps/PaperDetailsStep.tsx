"use client";

import React, { useEffect, useState, useMemo } from "react";
import { PaperState } from "../page";
import { getUpcomingExams } from "@/lib/api/question-paper";
import { getClasses } from "@/lib/api/classes";
import axios from "@/lib/axios";
import { CheckCircle2, Sparkles, X, FileText, Clock, Award, Calendar, BookOpen, GraduationCap } from "lucide-react";

interface Props {
  paper: PaperState;
  onChange: (updates: Partial<PaperState>) => void;
}

export const CLASSES_FALLBACK = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
export const SUBJECTS_FALLBACK = [
  "English", "Hindi", "Mathematics", "Science", "Social Studies",
  "Physics", "Chemistry", "Biology", "History", "Geography",
  "Civics", "Computer Science", "Sanskrit", "Marathi", "Economics"
];
export const EXAM_TYPES = [
  { value: "unit_test", label: "Unit Test" },
  { value: "ca", label: "Class Assessment" },
  { value: "half_yearly", label: "Half Yearly" },
  { value: "annual", label: "Annual Exam" },
  { value: "practice", label: "Practice Paper" },
];
export const DURATIONS = [
  { value: 30, label: "30 Minutes" },
  { value: 60, label: "1 Hour" },
  { value: 90, label: "1.5 Hours" },
  { value: 120, label: "2 Hours" },
  { value: 150, label: "2.5 Hours" },
  { value: 180, label: "3 Hours" },
  { value: 210, label: "3.5 Hours" },
];
export const ACADEMIC_YEARS = ["2025–26", "2024–25", "2026–27"];

export function normalizeClassName(raw: string | null | undefined): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (/^\d{1,2}$/.test(trimmed)) return `Class ${trimmed}`;
  return trimmed;
}

export default function PaperDetailsStep({ paper, onChange }: Props) {
  const [exams, setExams] = useState<any[]>([]);
  const [apiClasses, setApiClasses] = useState<string[]>([]);

  useEffect(() => {
    getUpcomingExams()
      .then(setExams)
      .catch(() => {});

    getClasses()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const names = data.map((c: any) => normalizeClassName(c.class_name || c.name || String(c.id)));
          setApiClasses(names);
        }
      })
      .catch(() => {});
  }, []);

  const linkedExam = useMemo(
    () => exams.find((ex) => ex.exam_id === paper.exam_id) ?? null,
    [exams, paper.exam_id]
  );

  const subjectOptions = useMemo(() => {
    const base = [...SUBJECTS_FALLBACK];
    if (linkedExam?.subject_name && !base.includes(linkedExam.subject_name)) {
      base.unshift(linkedExam.subject_name);
    }
    return base;
  }, [linkedExam]);

  const classOptions = useMemo(() => {
    const base = apiClasses.length > 0 ? apiClasses : CLASSES_FALLBACK.map((c) => `Class ${c}`);
    if (linkedExam) {
      const norm = normalizeClassName(linkedExam.class_name);
      if (!base.includes(norm)) base.unshift(norm);
    }
    return base;
  }, [apiClasses, linkedExam]);

  // Sync details from linked upcoming exam if present
  useEffect(() => {
    if (!linkedExam) return;
    const normClass = normalizeClassName(linkedExam.class_name);
    const needsUpdate =
      paper.class_name !== normClass ||
      paper.subject !== (linkedExam.subject_name || "");
    if (!needsUpdate) return;
    onChange({
      class_name: normClass,
      class_id: linkedExam.class_id,
      subject: linkedExam.subject_name || paper.subject,
      subject_id: linkedExam.subject_id,
      total_marks: linkedExam.total_score || paper.total_marks,
      duration_mins: linkedExam.duration_mins || paper.duration_mins,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedExam]);

  const fieldLabel = (label: string, req?: boolean) => (
    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
      {label}{req && <span className="text-red-500 font-bold ml-0.5">*</span>}
    </span>
  );

  const inputClass = "w-full h-11 px-3.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3335e3]/20 focus:border-[#3335e3] bg-white transition-all shadow-sm";
  const selectClass = `${inputClass} cursor-pointer`;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Step Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Paper Details</h1>
        <p className="text-sm text-slate-500 mt-1">Configure class, subject, exam type, duration, and general paper guidelines.</p>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#3335e3]" /> General Configuration
          </h2>
          {linkedExam && (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
              <CheckCircle2 size={12} /> Auto-filled from Exam
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Standard / Class */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              {fieldLabel("Standard / Class", true)}
            </div>
            <select
              value={paper.class_name}
              onChange={(e) =>
                onChange({
                  class_name: e.target.value,
                  title: paper.title || (e.target.value ? `${e.target.value} — ${paper.subject || "Paper"}` : ""),
                })
              }
              className={`${selectClass} ${linkedExam ? "border-emerald-300 bg-emerald-50/40 font-semibold text-slate-800" : ""}`}
            >
              <option value="">Select Class</option>
              {classOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              {fieldLabel("Subject", true)}
            </div>
            <select
              value={paper.subject}
              onChange={(e) =>
                onChange({
                  subject: e.target.value,
                  title: paper.title || (paper.class_name ? `${paper.class_name} — ${e.target.value}` : e.target.value),
                })
              }
              className={`${selectClass} ${linkedExam ? "border-emerald-300 bg-emerald-50/40 font-semibold text-slate-800" : ""}`}
            >
              <option value="">Select Subject</option>
              {subjectOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Exam Type / Linked Exam */}
          <div className="space-y-2">
            {fieldLabel("Exam Type")}
            <div className="relative">
              <select
                value={paper.exam_id?.toString() || paper.exam_type || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    onChange({ exam_id: undefined, exam_type: "", class_id: undefined, subject_id: undefined });
                    return;
                  }
                  const selectedExam = exams.find((ex) => ex.exam_id.toString() === val);
                  if (selectedExam) {
                    const normClass = normalizeClassName(selectedExam.class_name);
                    onChange({
                      exam_id: selectedExam.exam_id,
                      exam_type: selectedExam.exam_type || "unit_test",
                      class_id: selectedExam.class_id,
                      class_name: normClass,
                      subject_id: selectedExam.subject_id,
                      subject: selectedExam.subject_name || paper.subject,
                      total_marks: selectedExam.total_score || paper.total_marks,
                      duration_mins: selectedExam.duration_mins || paper.duration_mins,
                    });
                  } else {
                    onChange({ exam_type: val, exam_id: undefined });
                  }
                }}
                className={`${selectClass} ${linkedExam ? "pr-8 border-[#3335e3]/40 ring-2 ring-[#3335e3]/10 font-semibold" : ""}`}
              >
                <option value="">Select Exam Type</option>
                <optgroup label="Upcoming Scheduled Exams">
                  {exams.map((ex) => (
                    <option key={ex.exam_id} value={ex.exam_id.toString()}>
                      {ex.exam_name} — {ex.class_name} · {ex.subject_name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Standard Exam Types">
                  {EXAM_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </optgroup>
              </select>
              {linkedExam && (
                <button
                  type="button"
                  title="Clear exam link"
                  onClick={() => onChange({ exam_id: undefined, class_id: undefined, subject_id: undefined })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Total Marks */}
          <div className="space-y-2">
            {fieldLabel("Total Marks", true)}
            <div className="relative">
              <input
                type="number"
                min={1}
                max={500}
                value={paper.total_marks || ""}
                onChange={(e) => onChange({ total_marks: parseInt(e.target.value) || 0 })}
                className={inputClass}
                placeholder="e.g. 80"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                Marks
              </span>
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            {fieldLabel("Duration")}
            <select
              value={paper.duration_mins}
              onChange={(e) => onChange({ duration_mins: parseInt(e.target.value) })}
              className={selectClass}
            >
              {DURATIONS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          {/* Academic Year */}
          <div className="space-y-2">
            {fieldLabel("Academic Year")}
            <select
              value={paper.academic_year || "2025–26"}
              onChange={(e) => onChange({ academic_year: e.target.value })}
              className={selectClass}
            >
              {ACADEMIC_YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Paper Instructions */}
        <div className="space-y-2 pt-2">
          {fieldLabel("Paper Instructions")}
          <textarea
            value={paper.instructions || ""}
            onChange={(e) => onChange({ instructions: e.target.value })}
            rows={4}
            className="w-full p-3.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3335e3]/20 focus:border-[#3335e3] bg-white resize-y min-h-[100px] leading-relaxed shadow-sm font-sans"
            placeholder="Enter line-separated instructions for students, e.g.:&#10;1. All questions are compulsory.&#10;2. Write neatly and legibly.&#10;3. Show working where required."
          />
        </div>
      </div>

      {/* Summary Footer Chip */}
      {paper.class_name && paper.subject && (
        <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[#3335e3] flex items-center justify-center font-bold text-white shrink-0">
              ✓
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Paper Draft</p>
              <p className="text-sm font-black text-white mt-0.5">
                {paper.class_name} • {paper.subject} • {paper.total_marks} Marks
              </p>
            </div>
          </div>
          <div className="text-xs font-semibold text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            Duration: {DURATIONS.find((d) => d.value === paper.duration_mins)?.label || `${paper.duration_mins} min`}
          </div>
        </div>
      )}
    </div>
  );
}
