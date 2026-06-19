"use client";

import React, { useEffect, useState, useMemo } from "react";
import { PaperState } from "../page";
import { getUpcomingExams } from "@/lib/api/question-paper";
import { CheckCircle2, Sparkles, X } from "lucide-react";

interface Props {
  paper: PaperState;
  onChange: (updates: Partial<PaperState>) => void;
}

// ─── 15 Board Question Types ──────────────────────────────────────────────────
export const BOARD_QUESTION_TYPES = [
  {
    key: "MCQ",
    label: "MCQ",
    desc: "Multiple choice — pick the right option",
    example: "(a) Delhi  (b) Mumbai  (c) Chennai",
    emoji: "🔘",
  },
  {
    key: "FILL_BLANKS",
    label: "Fill in the Blanks",
    desc: "Complete the sentence",
    example: "The capital of India is ___.",
    emoji: "✏️",
  },
  {
    key: "TRUE_FALSE",
    label: "True / False",
    desc: "Mark statement as True or False",
    example: "The Earth is flat. (True / False)",
    emoji: "✅",
  },
  {
    key: "MATCH_FOLLOWING",
    label: "Match the Following",
    desc: "Match Column A with Column B",
    example: "A: Lion → B: Carnivore",
    emoji: "↔️",
  },
  {
    key: "VERY_SHORT",
    label: "One Line Answer",
    desc: "Answer in one line",
    example: "What is photosynthesis?",
    emoji: "📝",
  },
  {
    key: "SHORT_ANSWER",
    label: "Short Answer",
    desc: "Answer in 2–4 sentences",
    example: "Explain the water cycle briefly.",
    emoji: "📄",
  },
  {
    key: "LONG_ANSWER",
    label: "Long Answer",
    desc: "Detailed answer in paragraphs",
    example: "Describe the process of respiration.",
    emoji: "📃",
  },
  {
    key: "PASSAGE_BASED",
    label: "Passage Based",
    desc: "Read passage and answer questions",
    example: "Read and answer: (a) (b) (c)...",
    emoji: "📖",
  },
  {
    key: "DIAGRAM_LABEL",
    label: "Diagram / Label",
    desc: "Label the given diagram",
    example: "Label parts 1, 2, 3 in the diagram.",
    emoji: "🖼️",
  },
  {
    key: "NUMERICAL",
    label: "Solve / Calculate",
    desc: "Math working space question",
    example: "Find: 25 × 4 + 16 ÷ 2",
    emoji: "🔢",
  },
  {
    key: "WORD_PROBLEM",
    label: "Word Problem",
    desc: "Real-life maths problem",
    example: "A train travels 60 km/hr. Find distance in 3 hrs.",
    emoji: "🚆",
  },
  {
    key: "GIVE_REASONS",
    label: "Give Reasons",
    desc: "Explain why something happens",
    example: "Give reasons: Stars appear to twinkle.",
    emoji: "💡",
  },
  {
    key: "LETTER",
    label: "Letter Writing",
    desc: "Write a formal or informal letter",
    example: "Write a letter to your principal requesting...",
    emoji: "✉️",
  },
  {
    key: "ESSAY",
    label: "Essay Writing",
    desc: "Write an essay on the given topic",
    example: "Write an essay on 'My School'.",
    emoji: "📰",
  },
  {
    key: "CASE_BASED",
    label: "Case Study",
    desc: "Analyse the case and answer",
    example: "Read the case: Ravi started a business...",
    emoji: "📊",
  },
];

const CLASSES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const SUBJECTS = [
  "English", "Hindi", "Mathematics", "Science", "Social Studies",
  "Physics", "Chemistry", "Biology", "History", "Geography",
  "Civics", "Computer Science", "Sanskrit", "Marathi", "Economics"
];
const EXAM_TYPES = [
  { value: "unit_test",   label: "Unit Test" },
  { value: "ca",          label: "Class Assessment" },
  { value: "half_yearly", label: "Half Yearly" },
  { value: "annual",      label: "Annual Exam" },
  { value: "practice",    label: "Practice Paper" },
];
const DURATIONS = [
  { value: 30,  label: "30 Minutes" },
  { value: 60,  label: "1 Hour" },
  { value: 90,  label: "1.5 Hours" },
  { value: 120, label: "2 Hours" },
  { value: 150, label: "2.5 Hours" },
  { value: 180, label: "3 Hours" },
];

/**
 * Normalise class_name coming from the DB.
 * The `class` table stores values like "2", "10", "FY CSE" etc.
 * The paper-setup UI expects values in "Class N" format for numeric grades.
 */
function normalizeClassName(raw: string | null | undefined): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  // If it's a pure number (1-12) prefix with "Class "
  if (/^\d{1,2}$/.test(trimmed)) return `Class ${trimmed}`;
  // Otherwise return as-is (e.g. "FY CSE")
  return trimmed;
}

export interface ParsedSection {
  title: string;
  group: string;
  name: string;
}

export function parseSectionName(raw: string): ParsedSection {
  if (!raw) {
    return { title: "", group: "", name: "" };
  }
  const parts = raw.split("///");
  if (parts.length >= 3) {
    return {
      title: parts[0] || "",
      group: parts[1] || "",
      name: parts[2] || "",
    };
  }
  if (parts.length === 2) {
    return {
      title: parts[0] || "",
      group: parts[1] || "",
      name: "",
    };
  }
  return {
    title: raw,
    group: "",
    name: "",
  };
}

export function serializeSectionName(parsed: ParsedSection): string {
  return `${parsed.title.trim()}///${parsed.group.trim()}///${parsed.name.trim()}`;
}

export default function PaperSetupStep({ paper, onChange }: Props) {
  const [exams, setExams] = useState<any[]>([]);

  useEffect(() => {
    getUpcomingExams()
      .then(setExams)
      .catch(() => {});
  }, []);

  // Whether a scheduled exam is currently linked
  const linkedExam = useMemo(
    () => exams.find(ex => ex.exam_id === paper.exam_id) ?? null,
    [exams, paper.exam_id]
  );

  // Build a subjects list that always includes the exam's subject (even if custom)
  const subjectOptions = useMemo(() => {
    const base = [...SUBJECTS];
    if (linkedExam?.subject_name && !base.includes(linkedExam.subject_name)) {
      base.unshift(linkedExam.subject_name);
    }
    return base;
  }, [linkedExam]);

  // Build class options that include the exam's class if it's non-standard
  const classOptions = useMemo(() => {
    const base = CLASSES.map(c => `Class ${c}`);
    if (linkedExam) {
      const norm = normalizeClassName(linkedExam.class_name);
      if (!base.includes(norm)) base.unshift(norm);
    }
    return base;
  }, [linkedExam]);

  // ── Auto-sync effect ──────────────────────────────────────────────────────
  // When linkedExam resolves (i.e. the exams list finishes loading AND a paper
  // already has exam_id set), push the exam's data into the paper state if the
  // fields don't yet reflect it. This handles two cases:
  //   1. Loading an existing saved paper that has exam_id but empty class/subject.
  //   2. A race condition where exams loaded after the user's first selection.
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
  // We intentionally omit `paper` and `onChange` from deps to avoid an
  // infinite loop — we only want to re-run when the resolved exam changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedExam]);

  useEffect(() => {
    if (paper.sections.length === 0) {
      onChange({
        sections: [
          { section_id: null, section_name: "SECTION A///Section - A///", section_order: 1, total_section_marks: 0, questions: [] },
          { section_id: null, section_name: "SECTION B///Section - B///", section_order: 2, total_section_marks: 0, questions: [] },
          { section_id: null, section_name: "SECTION C///Section - C///", section_order: 3, total_section_marks: 0, questions: [] }
        ]
      });
    }
  }, [paper.sections, onChange]);

  const field = (label: string, req?: boolean) => (
    <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
      {label}{req && <span className="text-red-500 ml-0.5">*</span>}
    </span>
  );

  const inputClass = "w-full h-10 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3335e3]/20 focus:border-[#3335e3]/40 bg-white";
  const selectClass = `${inputClass} cursor-pointer`;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-slate-900">Paper Setup</h1>
        <p className="text-sm text-slate-500 mt-1">Fill in the details, then select the question types you need.</p>
      </div>

      {/* ── Section 1: Paper Details ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Paper Details</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Standard */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              {field("Standard / Class", true)}
              {linkedExam && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                  <CheckCircle2 size={10} /> Auto-filled
                </span>
              )}
            </div>
            <select
              value={paper.class_name}
              onChange={e => onChange({ class_name: e.target.value, title: paper.title || `${e.target.value} — ${paper.subject}` })}
              className={`${selectClass} ${linkedExam ? "border-emerald-300 bg-emerald-50/50 font-medium text-slate-800" : ""}`}
            >
              <option value="">Select Class</option>
              {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              {field("Subject", true)}
              {linkedExam && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                  <CheckCircle2 size={10} /> Auto-filled
                </span>
              )}
            </div>
            <select
              value={paper.subject}
              onChange={e => onChange({ subject: e.target.value })}
              className={`${selectClass} ${linkedExam ? "border-emerald-300 bg-emerald-50/50 font-medium text-slate-800" : ""}`}
            >
              <option value="">Select Subject</option>
              {subjectOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Exam Type */}
          <div className="space-y-2">
            {field("Exam Type")}
            <div className="relative">
              <select
                value={paper.exam_id?.toString() || ""}
                onChange={e => {
                  if (!e.target.value) {
                    // Cleared — reset exam link but keep user edits
                    onChange({ exam_id: undefined, class_id: undefined, subject_id: undefined });
                    return;
                  }
                  const selected = exams.find(ex => ex.exam_id.toString() === e.target.value);
                  if (selected) {
                    const normClass = normalizeClassName(selected.class_name);
                    onChange({
                      exam_id: selected.exam_id,
                      class_id: selected.class_id,
                      class_name: normClass,
                      subject_id: selected.subject_id,
                      subject: selected.subject_name || paper.subject,
                      total_marks: selected.total_score || paper.total_marks,
                      duration_mins: selected.duration_mins || paper.duration_mins,
                    });
                  }
                }}
                className={`${selectClass} ${linkedExam ? "pr-8 border-[#3335e3]/40 ring-2 ring-[#3335e3]/10" : ""}`}
              >
                <option value="">
                  {exams.length > 0 ? "Select Upcoming Exam" : "No upcoming exams — enter manually"}
                </option>
                {exams.map(e => (
                  <option key={e.exam_id} value={e.exam_id.toString()}>
                    {e.exam_name} — Class {e.class_name} · {e.subject_name}
                  </option>
                ))}
              </select>
              {linkedExam && (
                <button
                  type="button"
                  title="Clear exam link — edit manually"
                  onClick={() => onChange({ exam_id: undefined, class_id: undefined, subject_id: undefined })}
                  className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            {linkedExam && (
              <p className="flex items-center gap-1 text-[11px] font-medium text-[#3335e3]">
                <Sparkles size={11} />
                Class &amp; Subject auto-filled from this exam
              </p>
            )}
          </div>

          {/* Total Marks */}
          <div className="space-y-2">
            {field("Total Marks", true)}
            <input
              type="number"
              min={1}
              max={500}
              value={paper.total_marks}
              onChange={e => onChange({ total_marks: parseInt(e.target.value) || 0 })}
              className={inputClass}
              placeholder="e.g. 80"
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            {field("Duration")}
            <select
              value={paper.duration_mins}
              onChange={e => onChange({ duration_mins: parseInt(e.target.value) })}
              className={selectClass}
            >
              {DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>

          {/* Academic Year */}
          <div className="space-y-2">
            {field("Academic Year")}
            <select className={selectClass} defaultValue="2025-26">
              <option value="2025-26">2025–26</option>
              <option value="2024-25">2024–25</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Section 2: Main Question Headings ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">
            Main Question Headings
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            {paper.sections.length} headings
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-6">
          Define the main question headings of your paper (e.g. Q.1 Multiple Choice Questions, Q.2 Fill in the Blanks).
        </p>

        {/* Sections List */}
        <div className="space-y-3.5 mb-6">
          {paper.sections.map((sec, idx) => {
            const parsed = parseSectionName(sec.section_name);
            return (
              <div key={idx} className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-xs font-black text-slate-400 w-6">#{idx + 1}</span>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Question Heading</span>
                    <input
                      type="text"
                      value={parsed.title}
                      onChange={e => {
                        const newSecs = [...paper.sections];
                        const newParsed = { ...parsed, title: e.target.value };
                        newSecs[idx].section_name = serializeSectionName(newParsed);
                        onChange({ sections: newSecs });
                      }}
                      className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#3335e3]/20 focus:border-[#3335e3]"
                      placeholder="e.g. Multiple Choice Questions."
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Section Group (Optional)</span>
                    <input
                      type="text"
                      value={parsed.group}
                      onChange={e => {
                        const newSecs = [...paper.sections];
                        const newParsed = { ...parsed, group: e.target.value };
                        newSecs[idx].section_name = serializeSectionName(newParsed);
                        onChange({ sections: newSecs });
                      }}
                      className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#3335e3]/20 focus:border-[#3335e3]"
                      placeholder="e.g. Section - A"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Section Name (Optional)</span>
                    <input
                      type="text"
                      value={parsed.name}
                      onChange={e => {
                        const newSecs = [...paper.sections];
                        const newParsed = { ...parsed, name: e.target.value };
                        newSecs[idx].section_name = serializeSectionName(newParsed);
                        onChange({ sections: newSecs });
                      }}
                      className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#3335e3]/20 focus:border-[#3335e3]"
                      placeholder="e.g. Grammar"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newSecs = paper.sections.filter((_, i) => i !== idx);
                    onChange({ sections: newSecs });
                  }}
                  className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 px-3 py-2 rounded-lg border border-red-100 self-end md:self-center"
                >
                  Delete
                </button>
              </div>
            );
          })}

          {paper.sections.length === 0 && (
            <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-xs text-slate-500 mb-2">No headings defined yet</p>
              <button
                type="button"
                onClick={() => {
                  onChange({
                    sections: [
                      { section_id: null, section_name: "SECTION A///Section - A///", section_order: 1, total_section_marks: 0, questions: [] },
                      { section_id: null, section_name: "SECTION B///Section - B///", section_order: 2, total_section_marks: 0, questions: [] },
                      { section_id: null, section_name: "SECTION C///Section - C///", section_order: 3, total_section_marks: 0, questions: [] }
                    ]
                  });
                }}
                className="text-xs font-bold text-[#3335e3] hover:underline"
              >
                Initialize Default Question Headings (A, B, C)
              </button>
            </div>
          )}
        </div>

        {/* Add Section Button */}
        <button
          type="button"
          onClick={() => {
            const nextLetter = String.fromCharCode(65 + paper.sections.length);
            onChange({
              sections: [
                ...paper.sections,
                {
                  section_id: null,
                  section_name: `SECTION ${nextLetter}///Section - ${nextLetter}///`,
                  section_order: paper.sections.length + 1,
                  total_section_marks: 0,
                  questions: [],
                }
              ]
            });
          }}
          className="flex items-center justify-center gap-2 h-10 px-4 border border-dashed border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:border-[#3335e3] hover:text-[#3335e3] transition-all bg-white"
        >
          + Add Main Question Heading
        </button>
      </div>

      {/* Summary chip */}
      {paper.class_name && paper.subject && (
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
          <span>
            {paper.class_name} • {paper.subject} • {paper.total_marks} Marks •{" "}
            {DURATIONS.find(d => d.value === paper.duration_mins)?.label || `${paper.duration_mins} min`}
          </span>
        </div>
      )}
    </div>
  );
}
