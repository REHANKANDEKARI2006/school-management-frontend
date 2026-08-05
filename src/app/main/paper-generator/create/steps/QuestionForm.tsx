"use client";

import React, { useState, useRef } from "react";
import { Question } from "../page";
import { Trash2, Loader2, Upload, Plus } from "lucide-react";
import axios from "@/lib/axios";

export const romanize = (num: number): string => {
  const lookup: Record<number, string> = {
    1: "i", 2: "ii", 3: "iii", 4: "iv", 5: "v",
    6: "vi", 7: "vii", 8: "viii", 9: "ix", 10: "x"
  };
  return lookup[num] || num.toString();
};

export const getMediaUrl = (path: string) => {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  const isProd = typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";
  const defaultBase = isProd ? "https://school-management-backend-production-2fbb.up.railway.app" : "http://localhost:5000";
  const base = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || defaultBase;
  return `${base}${path}`;
};

export const getSubQuestionObj = (subQ: any): { text: string; marks: number; answer?: string } => {
  if (typeof subQ === "string") {
    return { text: subQ, marks: 1, answer: "" };
  }
  return {
    text: subQ?.text || "",
    marks: typeof subQ?.marks === "number" ? subQ.marks : 1,
    answer: subQ?.answer || ""
  };
};

export const compilePassageAnswers = (acts: any[]): string => {
  const result: string[] = [];
  (acts || []).forEach((act: any) => {
    (act.sub_questions || []).forEach((sq: any, subIdx: number) => {
      const sqObj = getSubQuestionObj(sq);
      if (sqObj.answer) {
        result.push(`(${subIdx + 1}) ${sqObj.answer}`);
      }
    });
  });
  return result.join(", ");
};

import { generateClientId } from "./clientIdUtils";

// ─── Empty state builder for each question type ─────────────────────────────
export function makeEmptyQuestion(type: string, order: number): Partial<Question> {
  const _clientId = generateClientId();
  const base = { question_type: type, question_text: "", marks: 2, question_order: order, question_id: null } as any;
  let result: any;
  switch (type) {
    case "MCQ":
      result = { ...base, marks: 1, question_data: { options: ["", "", "", ""], correct: "" } }; break;
    case "FILL_BLANKS":
      result = { ...base, marks: 1, question_data: { correct_answer: "" } }; break;
    case "TRUE_FALSE":
      result = { ...base, marks: 1, question_data: { correct: "True" } }; break;
    case "MATCH_FOLLOWING":
      result = { ...base, question_text: "Match the following Columns:", marks: 4, question_data: { col_a: ["", ""], col_b: ["", ""] } }; break;
    case "VERY_SHORT":
      result = { ...base, marks: 1, question_data: {} }; break;
    case "SHORT_ANSWER":
      result = { ...base, marks: 2, question_data: {} }; break;
    case "LONG_ANSWER":
      result = { ...base, marks: 5, question_data: {} }; break;
    case "PASSAGE_BASED":
      result = {
        ...base,
        marks: 10,
        question_text: "Read the following passage and do the activities:",
        question_data: {
          passage: "",
          activities: [
            {
              id: "act-1",
              heading: "Write whether the following sentences are 'True' or 'False':",
              marks: 2,
              type: "True / False",
              sub_questions: [
                { text: "", marks: 1 },
                { text: "", marks: 1 },
                { text: "", marks: 1 },
                { text: "", marks: 1 }
              ]
            }
          ]
        }
      }; break;
    case "CASE_BASED":
      result = { ...base, marks: 8, question_data: { passage: "", sub_questions: [{ text: "", marks: 2 }, { text: "", marks: 2 }] } }; break;
    case "DIAGRAM_LABEL":
      result = { ...base, marks: 4, question_data: { labels: ["", "", "", ""] } }; break;
    case "NUMERICAL":
      result = { ...base, marks: 3, question_data: {} }; break;
    case "WORD_PROBLEM":
      result = { ...base, marks: 4, question_data: {} }; break;
    case "GIVE_REASONS":
      result = { ...base, marks: 2, question_data: {} }; break;
    case "LETTER":
      result = { ...base, marks: 5, question_data: { bullet_points: ["", ""] } }; break;
    case "ESSAY":
      result = { ...base, marks: 5, question_data: { word_limit: "150-200 words" } }; break;
    default:
      result = { ...base, question_data: {} };
  }
  // Inject stable _clientId into question_data (after switch to avoid being overwritten)
  result.question_data = { ...(result.question_data || {}), _clientId };
  return result;
}

// ─── Input field helper component ───────────────────────────────────────────
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block">{label}</label>
    {children}
  </div>
);

const inputCls = "w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3335e3]/20 focus:border-[#3335e3]/40 bg-white";
const textareaCls = "w-full p-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3335e3]/20 focus:border-[#3335e3]/40 resize-y min-h-[80px] bg-white";

// ─── Reusable Question Form Component ───────────────────────────────────────
export function QuestionForm({
  q,
  onChange,
}: {
  q: Partial<Question>;
  onChange: (updates: Partial<Question>) => void;
}) {
  const qd = q.question_data || {};
  const set = (data: any) => onChange({ question_data: { ...qd, ...data } });

  const type = q.question_type;

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    setUploading(true);
    try {
      const res = await axios.post("/api/upload/question-image", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data.success && res.data.imageUrl) {
        set({ diagram_url: res.data.imageUrl });
      } else {
        alert("Upload failed");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 text-left">
      {/* Question Text */}
      {type !== "PASSAGE_BASED" && (
        <Field label={type === "FILL_BLANKS" ? "Sentence (use ___ for blank)" : type === "TRUE_FALSE" ? "Statement" : type === "CASE_BASED" ? "Case Study Text" : type === "MATCH_FOLLOWING" ? "Instruction" : "Question Text"}>
          <textarea
            value={q.question_text || ""}
            onChange={e => onChange({ question_text: e.target.value })}
            className={textareaCls}
            placeholder={
              type === "FILL_BLANKS" ? "e.g. The capital of India is ___." :
              type === "TRUE_FALSE" ? "e.g. The Earth revolves around the Sun." :
              type === "CASE_BASED" ? "Enter the case study text here..." :
              type === "MATCH_FOLLOWING" ? "e.g. Match the following Columns:" :
              type === "LETTER" ? "e.g. Write a letter to your principal requesting leave." :
              type === "ESSAY" ? "e.g. Write an essay on 'My School'." :
              type === "NUMERICAL" ? "e.g. Find the value of x if 2x + 5 = 15." :
              type === "WORD_PROBLEM" ? "e.g. A car travels 100 km in 2 hours..." :
              type === "GIVE_REASONS" ? "e.g. Why are plants green?" :
              "Enter the question text here..."
            }
          />
        </Field>
      )}

      {/* Diagram / Illustration Uploader */}
      {(type === "NUMERICAL" || type === "CASE_BASED" || type === "DIAGRAM_LABEL") && (
        <Field label="Diagram / Illustration (Optional)">
          <div className="space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleUpload}
              className="hidden"
              accept="image/*"
            />
            {qd.diagram_url ? (
              <div className="relative border border-slate-200 rounded-xl p-3 bg-slate-50 flex items-center gap-4 max-w-md shadow-sm">
                <div className="h-16 w-16 bg-white border border-slate-200 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                  <img
                    src={getMediaUrl(qd.diagram_url)}
                    alt="Uploaded Diagram"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-700 truncate">
                    {qd.diagram_url.split("/").pop()}
                  </p>
                  <p className="text-[10px] text-green-600 font-semibold mt-0.5 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Attached
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => set({ diagram_url: null })}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-200/50 transition-colors"
                  title="Remove diagram"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all max-w-md ${
                  uploading
                    ? "border-slate-300 bg-slate-50"
                    : "border-slate-300 hover:border-[#3335e3] hover:bg-[#3335e3]/5"
                }`}
              >
                {uploading ? (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Loader2 className="h-6 w-6 animate-spin text-[#3335e3]" />
                    <span className="text-xs font-bold text-slate-500">Uploading diagram...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <Upload className="h-5 w-5 text-slate-400 mb-1 mx-auto" />
                    <span className="text-xs font-bold text-slate-700 block">Click to upload diagram</span>
                    <span className="text-[10px] text-slate-400 font-medium block">Supports JPG, PNG, WEBP (Max 5MB)</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </Field>
      )}

      {/* MCQ Options */}
      {type === "MCQ" && (
        <div>
          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block mb-2">Options</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {["A", "B", "C", "D"].map((letter, i) => (
              <div key={letter} className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-500 w-5 shrink-0">({letter})</span>
                <input
                  type="text"
                  placeholder={`Option ${letter}`}
                  value={qd.options?.[i] || ""}
                  onChange={e => {
                    const opts = [...(qd.options || ["", "", "", ""])];
                    opts[i] = e.target.value;
                    set({ options: opts });
                  }}
                  className={inputCls}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Correct Option</label>
            <select
              value={q.answer_key || qd.correct || ""}
              onChange={e => onChange({ answer_key: e.target.value, question_data: { ...qd, correct: e.target.value } })}
              className="h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3335e3]/20 bg-white font-semibold"
            >
              <option value="">Select</option>
              {["A", "B", "C", "D"].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Fill Blanks Answer */}
      {type === "FILL_BLANKS" && (
        <Field label="Correct Answer">
          <input
            type="text"
            placeholder="e.g. New Delhi"
            value={q.answer_key || qd.correct_answer || ""}
            onChange={e => onChange({ answer_key: e.target.value, question_data: { ...qd, correct_answer: e.target.value } })}
            className={inputCls}
          />
        </Field>
      )}

      {/* True / False */}
      {type === "TRUE_FALSE" && (
        <Field label="Correct Answer">
          <select
            value={q.answer_key || qd.correct || "True"}
            onChange={e => onChange({ answer_key: e.target.value, question_data: { ...qd, correct: e.target.value } })}
            className="h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3335e3]/20 bg-white w-40 font-semibold"
          >
            <option value="True">True</option>
            <option value="False">False</option>
          </select>
        </Field>
      )}

      {/* Match the Following */}
      {type === "MATCH_FOLLOWING" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block mb-2">Column A</label>
              <div className="space-y-2">
                {(qd.col_a || ["", ""]).map((item: string, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-4">{i + 1}.</span>
                    <input
                      type="text"
                      placeholder={`Item ${i + 1}`}
                      value={item}
                      onChange={e => {
                        const arr = [...(qd.col_a || [])];
                        arr[i] = e.target.value;
                        set({ col_a: arr });
                      }}
                      className={inputCls}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block mb-2">Column B</label>
              <div className="space-y-2">
                {(qd.col_b || ["", ""]).map((item: string, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-4">{String.fromCharCode(97 + i)}.</span>
                    <input
                      type="text"
                      placeholder={`Item ${String.fromCharCode(97 + i)}`}
                      value={item}
                      onChange={e => {
                        const arr = [...(qd.col_b || [])];
                        arr[i] = e.target.value;
                        set({ col_b: arr });
                      }}
                      className={inputCls}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => set({ col_a: [...(qd.col_a || []), ""], col_b: [...(qd.col_b || []), ""] })}
            className="text-xs font-semibold text-[#3335e3] hover:underline"
          >
            + Add Row
          </button>

          {/* Mappings selection */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mt-2 space-y-2">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block">Correct Mappings</label>
            <div className="space-y-2">
              {(qd.col_a || []).map((_: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-slate-600">Item {idx + 1} matches:</span>
                  <select
                    value={qd.correct_mapping?.[idx] || ""}
                    onChange={e => {
                      const mapping = [...(qd.correct_mapping || [])];
                      while (mapping.length <= idx) mapping.push("");
                      mapping[idx] = e.target.value;
                      const answerKey = ((qd.col_a || []) as string[]).map((_, i: number) => `${i + 1} - (${mapping[i] || '?'})`).join(", ");
                      onChange({
                        answer_key: answerKey,
                        question_data: { ...qd, correct_mapping: mapping }
                      });
                    }}
                    className="h-8 px-2 text-xs border border-slate-200 rounded-lg focus:outline-none bg-white font-medium"
                  >
                    <option value="">Select Option</option>
                    {(qd.col_b || []).map((_: string, bIdx: number) => {
                      const letter = String.fromCharCode(97 + bIdx);
                      return (
                        <option key={letter} value={letter}>
                          ({letter}) {qd.col_b[bIdx] || `Item ${letter}`}
                        </option>
                      );
                    })}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Model Answer inputs */}
      {(type === "VERY_SHORT" || type === "SHORT_ANSWER" || type === "LONG_ANSWER" || type === "NUMERICAL" || type === "WORD_PROBLEM" || type === "GIVE_REASONS") && (
        <Field label={type === "GIVE_REASONS" ? "Reason Answer" : type === "NUMERICAL" || type === "WORD_PROBLEM" ? "Correct Solution" : "Correct / Model Answer"}>
          <textarea
            value={q.answer_key || ""}
            onChange={e => onChange({ answer_key: e.target.value })}
            className={textareaCls}
            placeholder={
              type === "GIVE_REASONS" ? "e.g. Plants are green because they contain chlorophyll." :
              type === "NUMERICAL" ? "e.g. x = 5" :
              type === "WORD_PROBLEM" ? "e.g. Step 1: Distance = Speed * Time = 60 * 3 = 180 km." :
              "Enter correct/model answer..."
            }
          />
        </Field>
      )}

      {/* Case Based — Sub Questions */}
      {type === "CASE_BASED" && (
        <div className="space-y-3">
          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block">Sub Questions &amp; Answers</label>
          {(qd.sub_questions || []).map((sq: any, i: number) => (
            <div key={i} className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex gap-2 items-start">
                <span className="text-xs font-black text-slate-500 mt-2.5 w-6 shrink-0">({String.fromCharCode(97 + i)})</span>
                <input
                  type="text"
                  placeholder={`Sub-question ${i + 1}`}
                  value={sq.text || ""}
                  onChange={e => {
                    const sqs = [...(qd.sub_questions || [])];
                    sqs[i] = { ...sqs[i], text: e.target.value };
                    const compiledAns = sqs.map((subQ, idx) => `(${String.fromCharCode(97 + idx)}) ${subQ.answer || ""}`).filter(a => a.length > 5).join(", ");
                    onChange({
                      answer_key: compiledAns,
                      question_data: { ...qd, sub_questions: sqs }
                    });
                  }}
                  className={`${inputCls} flex-1`}
                />
                <input
                  type="number"
                  min={1}
                  value={sq.marks || 2}
                  onChange={e => {
                    const sqs = [...(qd.sub_questions || [])];
                    sqs[i] = { ...sqs[i], marks: parseInt(e.target.value) || 1 };
                    const newTotalMarks = sqs.reduce((sum: number, s: any) => sum + (parseInt(s.marks) || 1), 0);
                    onChange({
                      marks: newTotalMarks || 1,
                      question_data: { ...qd, sub_questions: sqs }
                    });
                  }}
                  className="h-9 w-16 px-2 text-sm border border-slate-200 rounded-lg focus:outline-none text-center font-bold"
                  title="Marks"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this sub-question?")) {
                      const sqs = (qd.sub_questions || []).filter((_: any, idx: number) => idx !== i);
                      const newTotalMarks = sqs.reduce((sum: number, s: any) => sum + (parseInt(s.marks) || 1), 0);
                      const compiledAns = sqs.map((subQ: any, idx: number) => `(${String.fromCharCode(97 + idx)}) ${subQ.answer || ""}`).filter((a: string) => a.length > 5).join(", ");
                      onChange({
                        marks: newTotalMarks || 1,
                        answer_key: compiledAns,
                        question_data: { ...qd, sub_questions: sqs }
                      });
                    }
                  }}
                  className="mt-1 p-1 text-slate-400 hover:text-red-500 rounded hover:bg-slate-200/60 transition-colors shrink-0"
                  title="Delete Sub-Question"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="pl-8">
                <input
                  type="text"
                  placeholder="Correct Answer"
                  value={sq.answer || ""}
                  onChange={e => {
                    const sqs = [...(qd.sub_questions || [])];
                    sqs[i] = { ...sqs[i], answer: e.target.value };
                    const compiledAns = sqs.map((subQ, idx) => `(${String.fromCharCode(97 + idx)}) ${subQ.answer || ""}`).filter(a => a.length > 5).join(", ");
                    onChange({
                      answer_key: compiledAns,
                      question_data: { ...qd, sub_questions: sqs }
                    });
                  }}
                  className={inputCls}
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              const sqs = [...(qd.sub_questions || []), { text: "", marks: 2, answer: "" }];
              const newTotalMarks = sqs.reduce((sum: number, s: any) => sum + (parseInt(s.marks) || 1), 0);
              onChange({
                marks: newTotalMarks || 1,
                question_data: { ...qd, sub_questions: sqs }
              });
            }}
            className="text-xs font-semibold text-[#3335e3] hover:underline"
          >
            + Add Sub Question
          </button>
        </div>
      )}

      {/* PASSAGE BASED SPECIAL EDITOR */}
      {type === "PASSAGE_BASED" && (
        <div className="space-y-6 border-t border-slate-100 pt-4">
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/60 space-y-4">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Passage Content</h3>
            <Field label="Passage Text / Extract">
              <textarea
                value={qd.passage || ""}
                onChange={e => set({ passage: e.target.value })}
                className={`${textareaCls} min-h-[140px] font-mono text-xs`}
                placeholder="Enter the reading passage content here..."
              />
            </Field>
          </div>

          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/60 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Activity Groups</h3>
              <button
                type="button"
                onClick={() => {
                  const acts = [...(qd.activities || [])];
                  const nextNum = acts.length + 1;
                  
                  let autoHeading = "Write whether the following sentences are 'True' or 'False':";
                  let autoType = "True / False";
                  if (nextNum === 2) { autoType = "Give Reasons"; autoHeading = "Give reasons for the following:"; }
                  else if (nextNum === 3) { autoType = "Vocabulary"; autoHeading = "Write antonyms/synonyms from the extract:"; }
                  else if (nextNum === 4) { autoType = "Do as Directed"; autoHeading = "Do as Directed:"; }

                  const newAct = {
                    id: `act-${Date.now()}-${Math.random()}`,
                    heading: autoHeading,
                    marks: 2,
                    type: autoType,
                    sub_questions: [
                      { text: "", marks: 1, answer: "" },
                      { text: "", marks: 1, answer: "" }
                    ]
                  };
                  const nextActs = [...acts, newAct];
                  const overallTotal = nextActs.reduce((sum: number, a: any) => sum + (a.marks || 0), 0);
                  onChange({
                    question_data: { ...qd, activities: nextActs },
                    marks: overallTotal
                  });
                }}
                className="text-xs font-black text-[#3335e3] hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Add Activity Group
              </button>
            </div>

            {(!qd.activities || qd.activities.length === 0) ? (
              <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg bg-white">
                <p className="text-xs font-bold text-slate-400">No activities added yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {qd.activities.map((act: any, actIdx: number) => (
                  <div key={act.id || actIdx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative space-y-3">
                    <button
                      type="button"
                      onClick={() => {
                        const acts = qd.activities.filter((_: any, i: number) => i !== actIdx);
                        const overallTotal = acts.reduce((sum: number, a: any) => sum + (a.marks || 0), 0);
                        onChange({
                          question_data: { ...qd, activities: acts },
                          marks: overallTotal
                        });
                      }}
                      className="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition-colors"
                      title="Delete Activity Group"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-wide">
                        Group Marks:
                      </span>
                      <span className="text-xs font-black bg-[#3335e3]/10 text-[#3335e3] px-2.5 py-0.5 rounded-full">
                        {act.marks || 0} Marks
                      </span>
                    </div>

                    <div className="space-y-2 pt-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Sub-Questions &amp; Answers</label>
                      {(act.sub_questions || []).map((subQ: any, subIdx: number) => {
                        const sqObj = getSubQuestionObj(subQ);
                        return (
                          <div key={subIdx} className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-100 w-full">
                            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full">
                              <div className="flex items-center gap-2 w-full">
                                <span className="text-xs font-black text-slate-400 w-6 shrink-0">({subIdx + 1})</span>
                                <input
                                  type="text"
                                  value={sqObj.text}
                                  onChange={e => {
                                    const acts = [...qd.activities];
                                    const subQs = [...act.sub_questions];
                                    subQs[subIdx] = { text: e.target.value, marks: sqObj.marks, answer: sqObj.answer || "" };
                                    acts[actIdx] = { ...act, sub_questions: subQs };
                                    onChange({
                                      question_data: { ...qd, activities: acts }
                                    });
                                  }}
                                  className={`${inputCls} flex-1`}
                                  placeholder="Enter sub-question text..."
                                />
                              </div>
                              <div className="flex items-center justify-end w-full sm:w-auto pl-8 sm:pl-0 gap-2 shrink-0">
                                <input
                                  type="number"
                                  min={1}
                                  value={sqObj.marks}
                                  onChange={e => {
                                    const nextMarks = parseInt(e.target.value) || 1;
                                    const acts = [...qd.activities];
                                    const subQs = [...act.sub_questions];
                                    subQs[subIdx] = { text: sqObj.text, marks: nextMarks, answer: sqObj.answer || "" };
                                    
                                    const actTotal = subQs.reduce((sum: number, sq: any) => sum + getSubQuestionObj(sq).marks, 0);
                                    acts[actIdx] = { ...act, sub_questions: subQs, marks: actTotal };
                                    
                                    const overallTotal = acts.reduce((sum: number, a: any) => sum + (a.marks || 0), 0);
                                    onChange({
                                      question_data: { ...qd, activities: acts },
                                      marks: overallTotal
                                    });
                                  }}
                                  className="h-9 w-16 px-2 text-sm border border-slate-200 rounded-lg focus:outline-none text-center font-bold"
                                  title="Marks"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const acts = [...qd.activities];
                                    const subQs = act.sub_questions.filter((_: any, si: number) => si !== subIdx);
                                    
                                    const actTotal = subQs.reduce((sum: number, sq: any) => sum + getSubQuestionObj(sq).marks, 0);
                                    acts[actIdx] = { ...act, sub_questions: subQs, marks: actTotal };
                                    
                                    const overallTotal = acts.reduce((sum: number, a: any) => sum + (a.marks || 0), 0);
                                    onChange({
                                      question_data: { ...qd, activities: acts },
                                      marks: overallTotal
                                    });
                                  }}
                                  className="text-slate-400 hover:text-red-500 p-1"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            <div className="pl-8">
                              <input
                                type="text"
                                placeholder="Correct Answer"
                                value={sqObj.answer || ""}
                                onChange={e => {
                                  const acts = [...qd.activities];
                                  const subQs = [...act.sub_questions];
                                  subQs[subIdx] = { text: sqObj.text, marks: sqObj.marks, answer: e.target.value };
                                  acts[actIdx] = { ...act, sub_questions: subQs };
                                  
                                  const compiled = compilePassageAnswers(acts);
                                  onChange({
                                    answer_key: compiled,
                                    question_data: { ...qd, activities: acts }
                                  });
                                }}
                                className={inputCls}
                              />
                            </div>
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => {
                          const acts = [...qd.activities];
                          const subQs = [...(act.sub_questions || []), { text: "", marks: 1, answer: "" }];
                          
                          const actTotal = subQs.reduce((sum: number, sq: any) => sum + getSubQuestionObj(sq).marks, 0);
                          acts[actIdx] = { ...act, sub_questions: subQs, marks: actTotal };
                          
                          const overallTotal = acts.reduce((sum: number, a: any) => sum + (a.marks || 0), 0);
                          onChange({
                            question_data: { ...qd, activities: acts },
                            marks: overallTotal
                          });
                        }}
                        className="text-xs font-semibold text-[#3335e3] hover:underline flex items-center gap-1 mt-1 pl-8"
                      >
                        <Plus className="h-3 w-3" /> Add Sub-Question
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Diagram Labels */}
      {type === "DIAGRAM_LABEL" && (
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block">Labels to identify</label>
          {(qd.labels || []).map((lbl: string, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 w-4">{i + 1}.</span>
              <input
                type="text"
                placeholder={`Label ${i + 1}`}
                value={lbl}
                onChange={e => {
                  const arr = [...(qd.labels || [])];
                  arr[i] = e.target.value;
                  const answerKey = arr.filter(Boolean).map((l, idx) => `${idx + 1}. ${l}`).join(", ");
                  onChange({
                    answer_key: answerKey,
                    question_data: { ...qd, labels: arr }
                  });
                }}
                className={inputCls}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              const arr = [...(qd.labels || []), ""];
              const answerKey = arr.filter(Boolean).map((l, idx) => `${idx + 1}. ${l}`).join(", ");
              onChange({
                answer_key: answerKey,
                question_data: { ...qd, labels: arr }
              });
            }}
            className="text-xs font-semibold text-[#3335e3] hover:underline"
          >
            + Add Label
          </button>
        </div>
      )}

      {/* Letter Points */}
      {type === "LETTER" && (
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block">Key Points to cover</label>
            {(qd.bullet_points || []).map((pt: string, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 w-4">•</span>
                <input
                  type="text"
                  placeholder={`Point ${i + 1}`}
                  value={pt}
                  onChange={e => {
                    const arr = [...(qd.bullet_points || [])];
                    arr[i] = e.target.value;
                    set({ bullet_points: arr });
                  }}
                  className={inputCls}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => set({ bullet_points: [...(qd.bullet_points || []), ""] })}
              className="text-xs font-semibold text-[#3335e3] hover:underline"
            >
              + Add Point
            </button>
          </div>
          
          <Field label="Sample Letter (Correct Answer)">
            <textarea
              value={q.answer_key || ""}
              onChange={e => onChange({ answer_key: e.target.value })}
              className={`${textareaCls} min-h-[140px] font-serif`}
              placeholder="Write the full sample letter..."
            />
          </Field>
        </div>
      )}

      {/* Essay Sample */}
      {type === "ESSAY" && (
        <Field label="Sample Essay (Correct Answer)">
          <textarea
            value={q.answer_key || ""}
            onChange={e => onChange({ answer_key: e.target.value })}
            className={`${textareaCls} min-h-[140px]`}
            placeholder="Write sample essay..."
          />
        </Field>
      )}
    </div>
  );
}
