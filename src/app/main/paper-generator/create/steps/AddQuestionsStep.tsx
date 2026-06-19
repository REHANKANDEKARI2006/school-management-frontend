"use client";

import React, { useState, useCallback, useRef } from "react";
import { PaperState, Question, getAllQuestions, getTotalAssignedMarks } from "../page";
import { BOARD_QUESTION_TYPES, parseSectionName, serializeSectionName } from "./PaperSetupStep";
import { upsertQuestion, deleteQuestion, upsertSection } from "@/lib/api/question-paper";
import { Plus, Trash2, Edit2, Loader2, Upload } from "lucide-react";
import axios from "@/lib/axios";

interface Props {
  paper: PaperState;
  onChange: (updates: Partial<PaperState>) => void;
}

const romanize = (num: number): string => {
  const lookup: Record<number, string> = {
    1: "i", 2: "ii", 3: "iii", 4: "iv", 5: "v",
    6: "vi", 7: "vii", 8: "viii", 9: "ix", 10: "x"
  };
  return lookup[num] || num.toString();
};

const getQuestionLetter = (qText: string, defaultLetter: string = "B") => {
  const match = qText?.match(/\(([A-Z])\)/);
  return match ? match[1] : defaultLetter;
};

const getMediaUrl = (path: string) => {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  const base = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000";
  return `${base}${path}`;
};

const getSubQuestionObj = (subQ: any): { text: string; marks: number; answer?: string } => {
  if (typeof subQ === "string") {
    return { text: subQ, marks: 1, answer: "" };
  }
  return {
    text: subQ?.text || "",
    marks: typeof subQ?.marks === "number" ? subQ.marks : 1,
    answer: subQ?.answer || ""
  };
};

const compilePassageAnswers = (acts: any[]): string => {
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

// ─── Empty state builder for each type ────────────────────────────────────────
function makeEmptyQuestion(type: string, order: number): Partial<Question> {
  const base = { question_type: type, question_text: "", marks: 2, question_order: order, question_id: null };
  switch (type) {
    case "MCQ":
      return { ...base, marks: 1, question_data: { options: ["", "", "", ""], correct: "" } };
    case "FILL_BLANKS":
      return { ...base, marks: 1, question_data: { correct_answer: "" } };
    case "TRUE_FALSE":
      return { ...base, marks: 1, question_data: { correct: "True" } };
    case "MATCH_FOLLOWING":
      return { ...base, question_text: "Match the following Columns:", marks: 4, question_data: { col_a: ["", ""], col_b: ["", ""] } };
    case "VERY_SHORT":
      return { ...base, marks: 1, question_data: {} };
    case "SHORT_ANSWER":
      return { ...base, marks: 2, question_data: {} };
    case "LONG_ANSWER":
      return { ...base, marks: 5, question_data: {} };
    case "PASSAGE_BASED":
      return {
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
      };
    case "CASE_BASED":
      return { ...base, marks: 8, question_data: { passage: "", sub_questions: [{ text: "", marks: 2 }, { text: "", marks: 2 }] } };
    case "DIAGRAM_LABEL":
      return { ...base, marks: 4, question_data: { labels: ["", "", "", ""] } };
    case "NUMERICAL":
      return { ...base, marks: 3, question_data: {} };
    case "WORD_PROBLEM":
      return { ...base, marks: 4, question_data: {} };
    case "GIVE_REASONS":
      return { ...base, marks: 2, question_data: {} };
    case "LETTER":
      return { ...base, marks: 5, question_data: { bullet_points: ["", ""] } };
    case "ESSAY":
      return { ...base, marks: 5, question_data: { word_limit: "150-200 words" } };
    default:
      return { ...base, question_data: {} };
  }
}

// ─── Input field component ────────────────────────────────────────────────────
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block">{label}</label>
    {children}
  </div>
);

const inputCls = "w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3335e3]/20 focus:border-[#3335e3]/40";
const textareaCls = "w-full p-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3335e3]/20 focus:border-[#3335e3]/40 resize-y min-h-[80px]";

// ─── Type-specific form fields ────────────────────────────────────────────────
function QuestionForm({
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
    <div className="space-y-4">
      {/* Question Text — common to all types except match and passage-based */}
      {type !== "PASSAGE_BASED" && (
        <Field label={type === "FILL_BLANKS" ? "Sentence (use ___ for blank)" : type === "TRUE_FALSE" ? "Statement" : type === "CASE_BASED" ? "Case Study Text" : type === "MATCH_FOLLOWING" ? "Instruction" : "Question"}>
          <textarea
            value={q.question_text || ""}
            onChange={e => onChange({ question_text: e.target.value })}
            className={textareaCls}
            placeholder={
              type === "FILL_BLANKS" ? "e.g. The capital of India is ___." :
              type === "TRUE_FALSE" ? "e.g. The Earth revolves around the Sun." :
              type === "CASE_BASED" ? "Enter the case study here..." :
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

      {/* Diagram / Illustration Uploader (specifically for NUMERICAL, CASE_BASED, DIAGRAM_LABEL) */}
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
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all max-w-md ${
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
                    <Upload className="h-6 w-6 text-slate-400 mb-1" />
                    <span className="text-xs font-bold text-slate-700">Click to upload diagram</span>
                    <span className="text-[10px] text-slate-400 font-medium">Supports JPG, PNG, WEBP (Max 5MB)</span>
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
              className="h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3335e3]/20 bg-white"
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
            className="h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3335e3]/20 bg-white w-40"
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

      {/* Model Answer inputs for VERY_SHORT, SHORT_ANSWER, LONG_ANSWER, NUMERICAL, WORD_PROBLEM, GIVE_REASONS */}
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

      {/* Case Based — Legacy Sub Questions */}
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
                    onChange({
                      question_data: { ...qd, sub_questions: sqs }
                    });
                  }}
                  className="h-9 w-16 px-2 text-sm border border-slate-200 rounded-lg focus:outline-none text-center"
                  title="Marks"
                />
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
              onChange({
                question_data: { ...qd, sub_questions: sqs }
              });
            }}
            className="text-xs font-semibold text-[#3335e3] hover:underline"
          >
            + Add Sub Question
          </button>
        </div>
      )}

      {/* ─── PASSAGE BASED SPECIAL EDITOR ────────────────────────────────────── */}
      {type === "PASSAGE_BASED" && (
        <div className="space-y-6 border-t border-slate-100 pt-4">
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/60 space-y-4">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Section 1: Main Passage Info</h3>
            
            <Field label="Passage Content (Text)">
              <textarea
                value={qd.passage || ""}
                onChange={e => set({ passage: e.target.value })}
                className={`${textareaCls} min-h-[150px] font-mono text-xs`}
                placeholder="Enter the reading passage content here..."
              />
            </Field>
          </div>

          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/60 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Section 2: Activity Groups</h3>
              <button
                type="button"
                onClick={() => {
                  const acts = [...(qd.activities || [])];
                  const nextNum = acts.length + 1;
                  
                  // Auto prefill heading for next activity group
                  let autoHeading = "Write whether the following sentences are 'True' or 'False':";
                  let autoType = "True / False";
                  if (nextNum === 2) { autoType = "Give Reasons"; autoHeading = "Give reasons for the following:"; }
                  else if (nextNum === 3) { autoType = "Vocabulary"; autoHeading = "Write antonyms/synonyms from the extract:"; }
                  else if (nextNum === 4) { autoType = "Do as Directed"; autoHeading = "Do as Directed:"; }
                  else if (nextNum === 5) { autoType = "Personal Response"; autoHeading = "Personal Response:"; }

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

            {/* List of activity groups */}
            {(!qd.activities || qd.activities.length === 0) ? (
              <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg bg-white">
                <p className="text-xs font-bold text-slate-400">No activities added yet. Click above to add one.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {qd.activities.map((act: any, actIdx: number) => {
                  return (
                    <div key={act.id || actIdx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative space-y-3">
                      {/* Delete button */}
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

                      {/* Display Read-only Group Marks */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-wide">
                          Total Group Marks:
                        </span>
                        <span className="text-xs font-black bg-[#3335e3]/10 text-[#3335e3] px-2.5 py-1 rounded-full">
                          {act.marks || 0} M
                        </span>
                      </div>

                      {/* Sub questions */}
                      <div className="space-y-2 pt-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Sub-Questions &amp; Answers</label>
                        {(act.sub_questions || []).map((subQ: any, subIdx: number) => {
                          const roman = `(${romanize(subIdx + 1)})`;
                          const sqObj = getSubQuestionObj(subQ);
                          return (
                            <div key={subIdx} className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-100 w-full animate-in fade-in">
                              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full">
                                <div className="flex items-center gap-2 w-full">
                                  <span className="text-xs font-black text-slate-400 w-6 sm:w-8 text-right shrink-0">{roman}</span>
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
                                    className="h-9 w-16 px-2 text-sm border border-slate-200 rounded-lg focus:outline-none text-center"
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
                                    className="text-slate-400 hover:text-red-500 p-1 bg-white rounded shadow-sm border border-slate-100 sm:border-none sm:shadow-none sm:bg-transparent"
                                    title="Remove sub-question"
                                  >
                                    <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                                  </button>
                                </div>
                              </div>
                              <div className="pl-8 sm:pl-10">
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
                          className="text-xs font-semibold text-[#3335e3] hover:underline flex items-center gap-1 mt-1 pl-10"
                        >
                          <Plus className="h-3 w-3" /> Add Sub-Question
                        </button>
                      </div>
                    </div>
                  );
                })}
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

      {/* Letter — Bullet Points + Sample Letter */}
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
              className={`${textareaCls} min-h-[150px] font-serif`}
              placeholder="Write the full sample letter..."
            />
          </Field>
        </div>
      )}

      {/* Essay — Word Limit + Sample Essay */}
      {type === "ESSAY" && (
        <div className="space-y-3">
          <Field label="Word Limit">
            <input
              type="text"
              placeholder="e.g. 150-200 words"
              value={qd.word_limit || ""}
              onChange={e => set({ word_limit: e.target.value })}
              className={inputCls}
            />
          </Field>

          <Field label="Sample Essay (Correct Answer)">
            <textarea
              value={q.answer_key || ""}
              onChange={e => onChange({ answer_key: e.target.value })}
              className={`${textareaCls} min-h-[150px]`}
              placeholder="Write the full sample essay..."
            />
          </Field>
        </div>
      )}

      {/* Marks */}
      {type !== "PASSAGE_BASED" ? (
        <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Marks</label>
          <input
            type="number"
            min={1}
            max={20}
            value={q.marks || 1}
            onChange={e => onChange({ marks: parseInt(e.target.value) || 1 })}
            className="h-9 w-20 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3335e3]/20 text-center font-bold"
          />
        </div>
      ) : (
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-wide">
            Total Question Marks:
          </span>
          <span className="text-xs font-black bg-[#3335e3] text-white px-3 py-1 rounded-full">
            {q.marks || 0} M
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AddQuestionsStep({ paper, onChange }: Props) {
  const [activeType, setActiveType] = useState<string | null>(null);
  const [editingQ, setEditingQ]     = useState<Partial<Question> | null>(null);
  const [saving, setSaving]         = useState(false);
  const [justAdded, setJustAdded]   = useState(false);
  const [inlineAddingTypeForQId, setInlineAddingTypeForQId] = useState<string | null>(null);
  const [inlineAddingToSectionId, setInlineAddingToSectionId] = useState<number | string | null>(null);

  // Derive the active types from sections
  const activeSections = paper.sections;
  const selectedTypeKeys = BOARD_QUESTION_TYPES.map(t => t.key);

  const allQuestions = getAllQuestions(paper);
  const assignedMarks = getTotalAssignedMarks(paper);

  // ── Ensure a default section exists ────────────────────────────────────────
  const getOrCreateSection = useCallback(async (typeKey: string): Promise<number | null> => {
    const section = paper.sections.find(s => s.section_name === typeKey);
    if (section?.section_id) return section.section_id;

    if (!paper.paper_id) return null;

    try {
      const created = await upsertSection(paper.paper_id, {
        section_name: typeKey,
        section_order: paper.sections.length + 1,
        total_section_marks: 0,
      });
      
      const sectionExists = paper.sections.some(s => s.section_name === typeKey);
      if (sectionExists) {
        onChange({
          sections: paper.sections.map(s =>
            s.section_name === typeKey ? { ...s, section_id: created.section_id } : s
          ),
        });
      } else {
        onChange({
          sections: [
            ...paper.sections,
            {
              section_id: created.section_id,
              section_name: typeKey,
              section_order: paper.sections.length + 1,
              total_section_marks: 0,
              questions: [],
            }
          ],
        });
      }
      return created.section_id;
    } catch {
      // If section doesn't exist in paper yet, create inline
      if (!paper.sections.find(s => s.section_name === typeKey)) {
        onChange({
          sections: [
            ...paper.sections,
            { section_id: null, section_name: typeKey, section_order: paper.sections.length + 1, total_section_marks: 0, questions: [] },
          ],
        });
      }
      return null;
    }
  }, [paper, onChange]);

  const openNewQuestion = async (typeKey: string) => {
    setActiveType(typeKey);
    // Automatically default inlineAddingToSectionId to the first section
    const matchingSection = paper.sections.find(s => s.section_name === typeKey || s.section_name.toUpperCase() === typeKey);
    const targetSec = matchingSection || paper.sections[0];
    if (targetSec) {
      setInlineAddingToSectionId(targetSec.section_id || null);
    } else {
      setInlineAddingToSectionId(null);
    }
    const orderNum = targetSec ? targetSec.questions.length + 1 : 1;
    setEditingQ(makeEmptyQuestion(typeKey, orderNum) as Partial<Question>);
  };

  const saveQuestion = async (addAnother: boolean = false) => {
    if (!editingQ || !activeType) return;
    setSaving(true);
    try {
      let sectionId = inlineAddingToSectionId;
      if (!sectionId && editingQ.question_id) {
        const existingSec = paper.sections.find(s => s.questions.some(sq => sq.question_id === editingQ.question_id));
        sectionId = existingSec?.section_id || null;
      }
      if (!sectionId) {
        sectionId = await getOrCreateSection(activeType);
      }

      // Calculate final order if undefined
      let finalOrder = editingQ.question_order;
      if (finalOrder === undefined || finalOrder === null) {
        const targetSec = paper.sections.find(s => String(s.section_id) === String(sectionId));
        finalOrder = targetSec ? targetSec.questions.length + 1 : 1;
      }

      let savedQ: Question | null = null;

      if (sectionId && paper.paper_id) {
        const saved = await upsertQuestion(sectionId, {
          ...editingQ,
          question_type: activeType,
          question_order: finalOrder,
        });
        savedQ = saved;

        onChange({
          sections: paper.sections.map(s => {
            if (String(s.section_id) === String(sectionId)) {
              const newOrder = saved.question_order;
              let updatedQuestions = s.questions.map(exQ => {
                if (exQ.question_id !== saved.question_id && exQ.question_order >= newOrder) {
                  return { ...exQ, question_order: exQ.question_order + 1 };
                }
                return exQ;
              });

              const existingIdx = updatedQuestions.findIndex(exQ => exQ.question_id === saved.question_id);
              if (existingIdx >= 0) {
                updatedQuestions[existingIdx] = saved;
              } else {
                updatedQuestions.push(saved);
              }
              return { ...s, questions: updatedQuestions.sort((a, b) => (a.question_order || 0) - (b.question_order || 0)) };
            }
            return s;
          }),
        });
      } else {
        // Offline/local add (no paper_id yet or API failed)
        const localQ: Question = {
          question_id: editingQ.question_id || `local_${Date.now()}`,
          question_type: activeType,
          question_text: editingQ.question_text || "",
          question_data: editingQ.question_data || {},
          marks: editingQ.marks || 1,
          question_order: finalOrder,
        };
        savedQ = localQ;

        onChange({
          sections: paper.sections.map(s => {
            if (String(s.section_id) === String(sectionId) || s.section_name === activeType) {
              const newOrder = localQ.question_order;
              let updatedQuestions = s.questions.map(exQ => {
                if (exQ.question_id !== localQ.question_id && exQ.question_order >= newOrder) {
                  return { ...exQ, question_order: exQ.question_order + 1 };
                }
                return exQ;
              });
              const existingIdx = updatedQuestions.findIndex(exQ => exQ.question_id === localQ.question_id);
              if (existingIdx >= 0) {
                updatedQuestions[existingIdx] = localQ;
              } else {
                updatedQuestions.push(localQ);
              }
              return { ...s, questions: updatedQuestions.sort((a, b) => (a.question_order || 0) - (b.question_order || 0)) };
            }
            return s;
          }),
        });
      }

      if (addAnother && savedQ) {
        const nextOrder = savedQ.question_order + 1;
        setEditingQ(makeEmptyQuestion(activeType, nextOrder) as Partial<Question>);
        setInlineAddingTypeForQId(String(savedQ.question_id));
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 4000);
      } else {
        setEditingQ(null);
        setActiveType(null);
        setInlineAddingTypeForQId(null);
        setInlineAddingToSectionId(null);
      }
    } catch (err) {
      console.error("Save question failed", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (q: Question) => {
    if (!confirm("Remove this question?")) return;
    if (q.question_id && !String(q.question_id).startsWith("local_")) {
      await deleteQuestion(q.question_id).catch(console.error);
    }
    onChange({
      sections: paper.sections.map(s => ({
        ...s,
        questions: s.questions.filter(sq => sq.question_id !== q.question_id),
      })),
    });
  };

  const handleEdit = (q: Question) => {
    setActiveType(q.question_type);
    
    // Migrate legacy PASSAGE_BASED on-the-fly when opening for editing
    if (q.question_type === "PASSAGE_BASED" && q.question_data && !q.question_data.activities) {
      const qd = { ...q.question_data };
      const legacySqs = qd.sub_questions?.map((sq: any) => typeof sq === "string" ? sq : sq.text || "") || ["", ""];
      qd.activities = [
        {
          id: "act-legacy",
          heading: "Answer the following questions based on the passage:",
          marks: q.marks || 8,
          type: "One Line Answers",
          sub_questions: legacySqs
        }
      ];
      if (!qd.passage && q.question_text && q.question_text !== "Read the following passage and do the activities:") {
        qd.passage = q.question_text;
      }
      setEditingQ({
        ...q,
        question_text: "Read the following passage and do the activities:",
        question_data: qd
      });
    } else {
      setEditingQ({ ...q });
    }
  };

  const typeInfo = (key: string) =>
    BOARD_QUESTION_TYPES.find(t => t.key === key);

  if (activeSections.length === 0) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <p className="text-5xl mb-4">📝</p>
        <h2 className="text-lg font-black text-slate-800 mb-2">No board sections defined</h2>
        <p className="text-sm text-slate-500 mb-6">Go back to Paper Setup and initialize or add at least one board section (e.g. SECTION A) to start adding questions.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-black text-slate-900">Add Questions</h1>
        <p className="text-sm text-slate-500 mt-1">
          Click a type card to add a question. All questions auto-number in the preview.
        </p>
      </div>

      {/* ── Section Headings Editor (Main Question Titles) ── */}
      {paper.sections.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>📝</span> Edit Main Question Headings (Section Titles)
            </h3>
            <span className="text-[10px] font-bold text-slate-400">Edits update the live preview on the right immediately</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {paper.sections.map((sec, idx) => {
              const parsed = parseSectionName(sec.section_name);
              return (
                <div key={sec.section_id || idx} className="space-y-1 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                  <label className="text-[10.5pt] font-black text-slate-500 block">
                    Q.{idx + 1} Title
                  </label>
                  <input
                    type="text"
                    value={parsed.title}
                    onChange={e => {
                      const newParsed = { ...parsed, title: e.target.value };
                      const newSecs = paper.sections.map((s, i) =>
                        i === idx ? { ...s, section_name: serializeSectionName(newParsed) } : s
                      );
                      onChange({ sections: newSecs });
                    }}
                    className={`${inputCls} h-9 text-xs font-bold bg-white border-slate-200 rounded-lg px-3 focus:ring-2 focus:ring-[#3335e3]/20`}
                    placeholder="e.g. Solve the MCQs"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── LEFT: Type Selector + Question List ── */}
        <div className="flex-1 space-y-4">

          {/* Question Type Cards */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Click to Add Question</p>
            <div className="flex flex-wrap gap-2">
              {selectedTypeKeys.map(key => {
                const info = typeInfo(key);
                if (!info) return null;
                const qCount = paper.sections
                  .find(s => s.section_name === key)?.questions.length || 0;
                return (
                  <button
                    key={key}
                    onClick={() => openNewQuestion(key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold transition-all ${
                      activeType === key && editingQ
                        ? "bg-[#3335e3] text-white border-[#3335e3]"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:border-[#3335e3]/40 hover:bg-[#3335e3]/5"
                    }`}
                  >
                    <span>{info.emoji}</span>
                    <span>{info.label}</span>
                    {qCount > 0 && (
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                        activeType === key && editingQ ? "bg-white/20 text-white" : "bg-[#3335e3]/10 text-[#3335e3]"
                      }`}>
                        {qCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Add Form (inline, not modal) */}
          {editingQ && activeType && !inlineAddingTypeForQId && !editingQ.question_id && (
            <div className="bg-white rounded-2xl border-2 border-[#3335e3]/30 shadow-md p-5 sm:p-6 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{typeInfo(activeType)?.emoji}</span>
                  <h3 className="font-black text-sm text-slate-900">{typeInfo(activeType)?.label}</h3>
                </div>
                <button
                  onClick={() => { setEditingQ(null); setActiveType(null); }}
                  className="text-slate-400 hover:text-slate-700 text-sm"
                >
                  ✕
                </button>
              </div>

              {justAdded && (
                <div className="bg-green-50 text-green-700 text-xs font-bold px-3 py-2.5 rounded-lg border border-green-200 mb-4 animate-in fade-in zoom-in-95 flex items-center gap-1.5 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-ping" />
                  <span>✓ Sub-question successfully added! You can add another below.</span>
                </div>
              )}

              <div className="bg-slate-50 text-[11px] font-medium text-slate-600 p-3 rounded-lg border border-slate-100 mb-4">
                💡 <strong>Board Format Tip:</strong> Sub-questions added here will automatically number as <strong>i), ii), iii)...</strong> under the main <strong>Q.{paper.sections.filter(s => s.questions?.length > 0).length + 1} {typeInfo(activeType)?.label}</strong> section header in the final printed layout.
              </div>

              {/* Target Section Selector */}
              {paper.sections.length > 0 && (
                <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide block">
                    Target Board Section
                  </label>
                  <select
                    value={inlineAddingToSectionId || ""}
                    onChange={e => setInlineAddingToSectionId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full h-9 px-3 text-xs font-bold bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3335e3]/20 focus:border-[#3335e3]/40 cursor-pointer"
                  >
                    {paper.sections.map((sec, idx) => (
                      <option key={sec.section_id || idx} value={sec.section_id || ""}>
                        Q.{idx + 1} {sec.section_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <QuestionForm
                q={editingQ}
                onChange={updates => setEditingQ(prev => prev ? { ...prev, ...updates } : prev)}
              />

              <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-slate-100">
                <button
                  onClick={() => saveQuestion(false)}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#3335e3] text-white text-sm font-bold rounded-xl hover:bg-[#3335e3]/90 disabled:opacity-50 transition-all shadow-sm"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {editingQ.question_id ? "Save Changes" : "Save & Close"}
                </button>
                
                <button
                  onClick={() => saveQuestion(true)}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-all shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  Save & Add Another
                </button>
                
                <button
                  onClick={() => { setEditingQ(null); setActiveType(null); }}
                  className="px-4 py-2.5 text-sm font-bold text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ── All Questions List (Structured by Main Questions / Sections) ── */}
          {paper.sections.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-200">
              <div className="px-4 sm:px-6 py-4 bg-slate-50/50 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-800">All Questions (Structured)</h3>
                <span className="text-xs font-semibold text-slate-500">{allQuestions.length} questions</span>
              </div>

              {(() => {
                let sectionNumber = 0;
                return paper.sections.map((sec, secIdx) => {
                  sectionNumber++;
                  const questions = sec.questions || [];
                  const secMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);

                  return (
                    <div key={sec.section_id || secIdx} className="space-y-0">
                      {/* Section Title Header */}
                      <div className="bg-slate-50/40 px-4 sm:px-6 py-3 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-black text-slate-700 tracking-wide">
                          Q.{sectionNumber} {sec.section_name}
                        </span>
                        <span className="text-[10px] font-black bg-[#3335e3]/10 text-[#3335e3] px-2 py-0.5 rounded-full">
                          {questions.length} questions • {secMarks}M
                        </span>
                      </div>

                      {/* Nested Questions in this Section */}
                      <div className="divide-y divide-slate-100 pl-4 sm:pl-6 bg-white">
                        {questions.length === 0 ? (
                          <div className="py-8 text-center bg-slate-50/30 border border-dashed border-slate-200 rounded-xl my-4 mr-4 sm:mr-6 p-4 animate-in fade-in duration-200">
                            <p className="text-xs font-bold text-slate-500 mb-3">This section currently has no questions.</p>
                            <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg mx-auto">
                              {BOARD_QUESTION_TYPES.slice(0, 6).map(t => (
                                <button
                                  key={t.key}
                                  type="button"
                                  onClick={() => {
                                    setInlineAddingToSectionId(sec.section_id || null);
                                    setActiveType(t.key);
                                    setEditingQ(makeEmptyQuestion(t.key, 1) as Partial<Question>);
                                  }}
                                  className="text-[10px] font-bold bg-white text-slate-700 border border-slate-200 hover:border-[#3335e3] hover:text-[#3335e3] px-2.5 py-1.5 rounded-lg shadow-sm hover:shadow transition-all"
                                >
                                  + {t.label}
                                </button>
                              ))}
                              
                              <select
                                value=""
                                onChange={e => {
                                  if (!e.target.value) return;
                                  setInlineAddingToSectionId(sec.section_id || null);
                                  setActiveType(e.target.value);
                                  setEditingQ(makeEmptyQuestion(e.target.value, 1) as Partial<Question>);
                                  e.target.value = "";
                                }}
                                className="text-[10px] font-bold bg-white text-slate-600 border border-slate-200 px-2 py-1.5 rounded-lg hover:border-[#3335e3] cursor-pointer shadow-sm"
                              >
                                <option value="">More Types...</option>
                                {BOARD_QUESTION_TYPES.slice(6).map(t => (
                                  <option key={t.key} value={t.key}>+ {t.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ) : (
                          questions.map((q, qIdx) => {
                          const info = typeInfo(q.question_type);
                          const isEditingThis = editingQ && editingQ.question_id === q.question_id;
                          const isAddingBeneathThis = inlineAddingTypeForQId === String(q.question_id) && editingQ && !editingQ.question_id;
                          const roman = romanize(qIdx + 1);

                          return (
                            <div
                              key={q.question_id || qIdx}
                              className="py-4 pr-4 sm:pr-6 border-b border-slate-100 last:border-b-0"
                            >
                              {isEditingThis ? (
                                /* Inline Editor for Editing */
                                <div className="bg-slate-50/50 p-4 rounded-xl border-2 border-[#3335e3]/30 shadow-sm space-y-4">
                                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 mb-2">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-sm">{info?.emoji}</span>
                                      <span className="text-xs font-black text-slate-700 uppercase">Edit Sub-Question ({roman})</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-400">Inline Editing</span>
                                  </div>
                                  
                                  <QuestionForm
                                    q={editingQ!}
                                    onChange={updates => setEditingQ(prev => prev ? { ...prev, ...updates } : prev)}
                                  />

                                  <div className="flex flex-wrap gap-2.5 pt-3 border-t border-slate-200/60">
                                    <button
                                      onClick={() => saveQuestion(false)}
                                      disabled={saving}
                                      className="flex items-center gap-1.5 px-4 py-2 bg-[#3335e3] text-white text-xs font-bold rounded-lg hover:bg-[#3335e3]/90 disabled:opacity-50 transition-all shadow-sm"
                                    >
                                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                                      Save Changes
                                    </button>
                                    <button
                                      onClick={() => { setEditingQ(null); setActiveType(null); setInlineAddingTypeForQId(null); }}
                                      className="px-4 py-2 text-xs font-bold text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-50 bg-white"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                /* Standard Question Display */
                                <div className="space-y-2">
                                  <div className="flex items-start gap-3">
                                    {/* Number */}
                                    <div className="h-6 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-normal text-slate-600 shrink-0 mt-0.5">
                                      {roman}
                                    </div>
                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <span className="text-[10px]">{info?.emoji}</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{info?.label}</span>
                                      </div>
                                      <p className="text-sm text-slate-700 leading-snug">
                                        {q.question_text || <span className="text-slate-400 italic">No question text</span>}
                                      </p>
                                      
                                      {/* MCQ Option previews in list */}
                                      {q.question_type === "MCQ" && q.question_data?.options && (
                                        <div className="grid grid-cols-2 gap-2 mt-2 max-w-md bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                                          {q.question_data.options.map((opt: string, optIdx: number) => (
                                            opt.trim() ? (
                                              <div key={optIdx} className="flex gap-1.5 text-xs text-slate-500 font-medium">
                                                <span className="font-bold shrink-0">{String.fromCharCode(65 + optIdx)})</span>
                                                <span className="truncate">{opt}</span>
                                              </div>
                                            ) : null
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    {/* Marks */}
                                    <div className="text-xs font-black text-slate-500 shrink-0 mt-1">
                                      [{q.marks}M]
                                    </div>
                                    {/* Actions */}
                                    <div className="flex gap-1 shrink-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => handleEdit(q)}
                                        className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#3335e3] hover:bg-[#3335e3]/5 transition-colors"
                                      >
                                        <Edit2 className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(q)}
                                        className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Inline Actions Row */}
                                  <div className="pl-11 flex flex-wrap items-center gap-3 pt-1">
                                    <span className="text-[10px] font-bold text-slate-400 select-none">Add beneath:</span>
                                    <button
                                      onClick={() => {
                                        setActiveType(q.question_type);
                                        setInlineAddingTypeForQId(String(q.question_id));
                                        setInlineAddingToSectionId(sec.section_id || null);
                                        setEditingQ(makeEmptyQuestion(q.question_type, q.question_order + 1) as Partial<Question>);
                                      }}
                                      className="text-[10.5px] font-black text-[#3335e3] hover:underline bg-[#3335e3]/5 hover:bg-[#3335e3]/10 px-2 py-0.5 rounded transition-all flex items-center gap-0.5"
                                    >
                                      <Plus className="h-3.5 w-3.5" /> {info?.label || "Same Type"}
                                    </button>
                                    
                                    <select
                                      value=""
                                      onChange={e => {
                                        if (!e.target.value) return;
                                        setActiveType(e.target.value);
                                        setInlineAddingTypeForQId(String(q.question_id));
                                        setInlineAddingToSectionId(sec.section_id || null);
                                        setEditingQ(makeEmptyQuestion(e.target.value, q.question_order + 1) as Partial<Question>);
                                        e.target.value = "";
                                      }}
                                      className="text-[10.5px] font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 px-1.5 py-0.5 rounded cursor-pointer transition-all outline-none"
                                    >
                                      <option value="">+ Different Type...</option>
                                      {BOARD_QUESTION_TYPES.map(t => (
                                        <option key={t.key} value={t.key}>{t.label}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              )}

                              {/* Inline Adding Editor Box directly beneath */}
                              {isAddingBeneathThis && (
                                <div className="mt-3 ml-11 bg-green-50/20 p-4 rounded-xl border-2 border-green-500/30 shadow-sm space-y-4 animate-in slide-in-from-top-1 duration-200">
                                  <div className="flex items-center justify-between border-b border-green-200/50 pb-2 mb-2">
                                    <div className="flex items-center gap-1.5 text-green-800">
                                      <span className="text-sm">{info?.emoji}</span>
                                      <span className="text-xs font-black uppercase tracking-wider">Add Question Beneath sub-question ({roman})</span>
                                    </div>
                                    <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Inline Adding</span>
                                  </div>

                                  {justAdded && (
                                    <div className="bg-green-500/10 text-green-800 text-xs font-bold px-3 py-2 rounded-lg border border-green-200/50 mb-3 animate-pulse flex items-center gap-1.5">
                                      <span>✓</span> Sub-question added successfully! Add another below.
                                    </div>
                                  )}

                                  <QuestionForm
                                    q={editingQ!}
                                    onChange={updates => setEditingQ(prev => prev ? { ...prev, ...updates } : prev)}
                                  />

                                  <div className="flex flex-wrap gap-2.5 pt-3 border-t border-green-200/50">
                                    <button
                                      onClick={() => saveQuestion(false)}
                                      disabled={saving}
                                      className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-lg disabled:opacity-50 transition-all shadow-sm"
                                    >
                                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                                      Save & Close
                                    </button>
                                    <button
                                      onClick={() => saveQuestion(true)}
                                      disabled={saving}
                                      className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg disabled:opacity-50 transition-all shadow-sm"
                                    >
                                      <Plus className="h-3.5 w-3.5" />
                                      Save & Add Another
                                    </button>
                                    <button
                                      onClick={() => { setEditingQ(null); setActiveType(null); setInlineAddingTypeForQId(null); }}
                                      className="px-4 py-2 text-xs font-bold text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-50 bg-white"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}

          {allQuestions.length === 0 && !editingQ && (
            <div className="text-center py-14 bg-white rounded-2xl border border-dashed border-slate-300">
              <p className="text-3xl mb-3">📝</p>
              <p className="text-sm font-semibold text-slate-500">No questions added yet</p>
              <p className="text-xs text-slate-400 mt-1">Click a type card above to start adding questions</p>
            </div>
          )}
        </div>

        {/* ── RIGHT: Stats Panel ── */}
        <div className="w-full lg:w-64 shrink-0 space-y-4">
          {/* Paper Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Paper Summary</p>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-semibold">Class</span>
                <span className="font-bold text-slate-800">{paper.class_name || "—"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-semibold">Subject</span>
                <span className="font-bold text-slate-800">{paper.subject || "—"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-semibold">Total Marks</span>
                <span className="font-bold text-slate-800">{paper.total_marks}</span>
              </div>
              <div className="h-px bg-slate-100" />
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-semibold">Assigned</span>
                <span className={`font-black ${assignedMarks > paper.total_marks ? "text-red-600" : assignedMarks === paper.total_marks ? "text-green-600" : "text-[#3335e3]"}`}>
                  {assignedMarks}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-semibold">Remaining</span>
                <span className={`font-bold ${paper.total_marks - assignedMarks < 0 ? "text-red-500" : "text-slate-700"}`}>
                  {Math.max(0, paper.total_marks - assignedMarks)}
                </span>
              </div>
            </div>

            {/* Mini progress bar */}
            <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  assignedMarks > paper.total_marks ? "bg-red-500" :
                  assignedMarks === paper.total_marks ? "bg-green-500" : "bg-[#3335e3]"
                }`}
                style={{ width: `${Math.min(100, (assignedMarks / paper.total_marks) * 100)}%` }}
              />
            </div>
            {assignedMarks === paper.total_marks && (
              <p className="text-center text-[11px] font-black text-green-600 mt-2">✓ Marks complete!</p>
            )}
            {assignedMarks > paper.total_marks && (
              <p className="text-center text-[11px] font-black text-red-600 mt-2">⚠ Exceeded by {assignedMarks - paper.total_marks}M</p>
            )}
          </div>

          {/* Questions by type */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Questions by Type</p>
            <div className="space-y-2">
              {BOARD_QUESTION_TYPES.map(t => {
                const count = allQuestions.filter(q => q.question_type === t.key).length;
                if (count === 0) return null;
                return (
                  <div key={t.key} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span>{t.emoji}</span>
                      <span className="text-slate-600 font-semibold">{t.label}</span>
                    </div>
                    <span className="font-black text-[#3335e3]">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
