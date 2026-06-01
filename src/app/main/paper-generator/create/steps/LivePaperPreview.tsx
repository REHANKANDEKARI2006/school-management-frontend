"use client";

import React, { useEffect, useState } from "react";
import { PaperState, getAllQuestions } from "../page";
import { BOARD_QUESTION_TYPES } from "./PaperSetupStep";
import axios from "@/lib/axios";
import { formatDate } from "@/lib/utils";

const getSectionTitle = (name: string): string => {
  const lookup: Record<string, string> = {
    MCQ: "Solve the MCQs",
    FILL_BLANKS: "Fill in the blanks",
    TRUE_FALSE: "State whether True or False",
    MATCH_FOLLOWING: "Match the following Columns",
    VERY_SHORT: "Answer the following questions in one line each",
    SHORT_ANSWER: "Answer the following questions in brief (Short Answers)",
    LONG_ANSWER: "Answer the following questions in detail (Long Answers)",
    PASSAGE_BASED: "Read the following passage and do the activities",
    DIAGRAM_LABEL: "Label the given diagram according to instructions",
    NUMERICAL: "Solve the following calculations",
    WORD_PROBLEM: "Solve the following word problems",
    GIVE_REASONS: "Give reasons for the following",
    LETTER: "Letter Writing",
    ESSAY: "Essay Writing",
    CASE_BASED: "Read the case study and answer the questions"
  };
  return lookup[name] || name;
};

const getQuestionLetter = (qText: string, defaultLetter: string = "B") => {
  const match = qText?.match(/\(([A-Z])\)/);
  return match ? match[1] : defaultLetter;
};

const romanize = (num: number): string => {
  const lookup: Record<number, string> = {
    1: "i", 2: "ii", 3: "iii", 4: "iv", 5: "v",
    6: "vi", 7: "vii", 8: "viii", 9: "ix", 10: "x",
    11: "xi", 12: "xii", 13: "xiii", 14: "xiv", 15: "xv",
    16: "xvi", 17: "xvii", 18: "xviii", 19: "xix", 20: "xx"
  };
  return lookup[num] || num.toString();
};

const getActivityHeading = (act: any): string => {
  if (act.heading && act.heading.trim()) return act.heading;
  const lookup: Record<string, string> = {
    "True / False": "Write whether the following sentences are 'True' or 'False':",
    "MCQ": "Choose the correct alternative:",
    "Give Reasons": "Give reasons for the following:",
    "Vocabulary": "Write antonyms/synonyms from the extract:",
    "Grammar": "Grammar / Do as Directed:",
    "Do as Directed": "Do as Directed:",
    "One Line Answers": "Answer the following in one line:",
    "Personal Response": "Personal Response:",
    "Fill in the Blanks": "Fill in the blanks with correct words:",
    "Match the Following": "Match the columns:"
  };
  return lookup[act.type] || act.type || "Activity";
};

interface Props {
  paper: PaperState;
  fullSize?: boolean;
}

export default function LivePaperPreview({ paper, fullSize = false }: Props) {
  const [school, setSchool] = useState<any>(null);

  useEffect(() => {
    axios.get("/api/school-profile").then(res => {
      if (res.data.success) setSchool(res.data.data);
    }).catch(() => {});
  }, []);

  const getMediaUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("data:")) return path;
    const base = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000";
    return `${base}${path}`;
  };

  const primaryColor = school?.primary_color || "#1a1a2e";

  const durationLabel = () => {
    const m = paper.duration_mins;
    if (!m) return "3 Hours";
    if (m < 60) return `${m} Minutes`;
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem > 0 ? `${h} Hr ${rem} Min` : `${h} Hour${h > 1 ? "s" : ""}`;
  };

  // Fix 4: A4 page simulation — fullSize = true gives exact A4 dimensions
  // For the preview panel (scale-down mode), we set a fixed A4 width and show
  // the paper across simulated page breaks rather than one endless scroll.
  const PAGE_HEIGHT_MM = 297;
  const PAGE_MARGIN_MM = 5;

  const paperCls = fullSize
    ? "w-[210mm] min-h-[297mm] bg-white"
    : "w-[210mm] bg-white scale-[0.62] origin-top-left";

  // Fix 1: tighter line-height applied via inline style to mirror EJS 1.2
  const paperStyle: React.CSSProperties = {
    fontFamily: "'Times New Roman', Times, serif",
    lineHeight: 1.2,
  };

  // Determine clean display title dynamically
  const displayTitle = (() => {
    if (paper.exam_name) return paper.exam_name;
    const lookup: Record<string, string> = {
      unit_test: "Unit Test",
      ca: "Continuous Assessment",
      half_yearly: "Half-Yearly Examination",
      annual: "Annual Examination",
      practice: "Practice Paper"
    };
    if (paper.exam_type && lookup[paper.exam_type]) {
      return lookup[paper.exam_type];
    }
    let title = paper.title || "Examination";
    title = title.replace(/^Class\s+Class\s+\d+\s*—\s*/i, "");
    title = title.replace(/^Class\s+\d+\s*—\s*/i, "");
    return title;
  })();

  // Strip duplicate "Class " from class name in details row
  const displayClass = paper.class_name ? paper.class_name.replace(/^Class\s+/i, "") : "Class";

  const [paginatedPages, setPaginatedPages] = useState<any[][]>([]);

  // 1. Define visual blocks for linear document layout
  const blocks: any[] = [];

  // Header Block (School Header, Exam Info, Instructions)
  blocks.push({
    type: "header",
    key: "header",
    render: () => (
      <div className="block pb-1">
        {/* School Name */}
        <div className="relative z-10 text-center mb-0.5">
          <h1
            className="font-black uppercase leading-tight tracking-wide"
            style={{ fontSize: "20pt", color: primaryColor }}
          >
            {school?.school_name || "SCHOOL NAME"}
          </h1>
          {/* Show organization_name (institution name) instead of address */}
          {(school?.organization_name || school?.address) && (
            <p className="text-[8pt] text-slate-600 font-medium mt-0.5">
              {school.organization_name || school.address}
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="relative z-10 border-t-[3px] border-b border-slate-900 pt-[2px] mb-1" />

        {/* Exam Info Row 1: Time | Title | Marks */}
        <div className="relative z-10 text-[9pt] font-bold mb-0.5" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", lineHeight: 1.2 }}>
          <span style={{ textAlign: "left" }}>Time: {durationLabel()}</span>
          <span
            style={{ color: primaryColor, fontSize: "10pt", fontWeight: 900, textDecoration: "underline", textAlign: "center" }}
          >
            {displayTitle}
          </span>
          <span style={{ textAlign: "right" }}>Max. Marks: {paper.total_marks || 80}</span>
        </div>

        {/* Exam Info Row 2: Subject | Class | Date */}
        <div className="relative z-10 text-[9pt] font-bold mb-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", lineHeight: 1.2 }}>
          <span style={{ textAlign: "left" }}>Subject: {paper.subject || "Subject"}</span>
          <span style={{ textAlign: "center" }}>Class: {displayClass}</span>
          <span style={{ textAlign: "right" }}>Date: {formatDate(new Date())}</span>
        </div>

        {/* Instructions Box */}
        {paper.instructions && (
          <div className="relative z-10 border border-slate-800 px-2.5 py-1.5 mb-3">
            <p className="text-[8.5pt] font-black uppercase underline mb-0.5">Instructions:</p>
            <div>
              {paper.instructions.split("\n").filter(Boolean).map((line: string, i: number) => (
                <div key={i} className="flex gap-1.5 text-[8pt] font-semibold text-slate-800" style={{ lineHeight: 1.2 }}>
                  <span className="shrink-0">{i + 1}.</span>
                  <span>{line.replace(/^\d+\.\s*/, "")}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Separator */}
        <div className="relative z-10 border-t-2 border-slate-900 mb-3" />
      </div>
    )
  });

  // Section and Question blocks
  let globalQNum = 0;
  paper.sections
    .filter(s => s.questions && s.questions.length > 0)
    .forEach((sec, secIdx) => {
      globalQNum++;
      const currentQNum = globalQNum;
      const secTitle = getSectionTitle(sec.section_name);
      const secMarks = sec.questions.reduce((sum, q) => sum + (q.marks || 0), 0);

      // Section Header block
      blocks.push({
        type: "section_header",
        key: `sec-${sec.section_id || secIdx}`,
        render: () => (
          <div className="flex justify-between items-baseline pb-0.5 mb-1.5 gap-8 w-full pt-3">
            <span className="font-black text-[10.5pt] text-slate-900 tracking-wide flex-1 min-w-0">
              Q.{currentQNum} {secTitle}
            </span>
            <div className="w-[70px] text-right shrink-0">
              <span className="text-[10pt] font-black text-slate-800 whitespace-nowrap">
                [{secMarks} Marks]
              </span>
            </div>
          </div>
        )
      });

      // Individual Question blocks
      sec.questions.forEach((q, qIdx) => {
        const roman = romanize(qIdx + 1);
        blocks.push({
          type: "question",
          key: `q-${q.question_id || qIdx}`,
          render: () => (
            <div className="pl-2 mt-2 break-inside-avoid">
              <div className="flex items-start justify-between gap-8 w-full">
                <div className="flex items-start gap-1.5 flex-1 min-w-0">
                  <span className="font-normal text-[10pt] shrink-0 w-8 text-right">{roman})</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10pt] font-normal text-slate-900 whitespace-pre-wrap" style={{ lineHeight: 1.2 }}>
                      {q.question_text ? (
                        <span dangerouslySetInnerHTML={{ __html: q.question_text }} />
                      ) : q.question_type !== "MATCH_FOLLOWING" ? (
                        <span>…</span>
                      ) : null}
                      {q.question_type === "ESSAY" && q.question_data?.word_limit && (
                        <span className="text-[8.5pt] font-normal italic text-slate-500 ml-1.5">
                          (Word Limit: {q.question_data.word_limit})
                        </span>
                      )}
                    </div>

                    {q.question_data?.diagram_url && (
                      <div className="my-2 max-w-[280px]">
                        <img
                          src={getMediaUrl(q.question_data.diagram_url)}
                          alt="Diagram"
                          className="max-h-[220px] object-contain border border-slate-200 rounded"
                        />
                      </div>
                    )}

                    {/* MCQ Options */}
                    {q.question_type === "MCQ" && q.question_data?.options && (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-1">
                        {q.question_data.options.map((opt: string, i: number) => (
                          opt.trim() ? (
                            <div key={i} className="flex gap-1.5 text-[9.5pt] font-normal break-inside-avoid" style={{ lineHeight: 1.2 }}>
                              <span className="shrink-0 font-bold">{String.fromCharCode(65 + i)})</span>
                              <span>{opt}</span>
                            </div>
                          ) : null
                        ))}
                      </div>
                    )}

                    {/* True/False */}
                    {q.question_type === "TRUE_FALSE" && (
                      <div className="flex gap-6 mt-1">
                        {["True", "False"].map(val => (
                          <div key={val} className="flex items-center gap-1.5 text-[9.5pt] font-normal break-inside-avoid">
                            <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-700" />
                            <span>{val}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Match the Following */}
                    {q.question_type === "MATCH_FOLLOWING" && q.question_data?.col_a && (
                      <table className="match-table" style={{ width: "100%", borderCollapse: "collapse", marginTop: "4pt", fontSize: "9pt" }}>
                        <thead>
                          <tr style={{ backgroundColor: "#f8fafc" }}>
                            <th style={{ border: "1px solid #000", padding: "3pt 8pt", textAlign: "left", fontWeight: 900, width: "50%" }}>Column A</th>
                            <th style={{ border: "1px solid #000", padding: "3pt 8pt", textAlign: "left", fontWeight: 900, width: "50%" }}>Column B</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(q.question_data.col_a || []).map((a: string, i: number) => (
                            <tr key={i}>
                              <td style={{ border: "1px solid #000", padding: "3pt 8pt", textAlign: "left", fontWeight: "normal" }}>
                                <span style={{ fontWeight: 900, marginRight: "4px" }}>{i + 1}.</span>
                                <span>{a}</span>
                              </td>
                              <td style={{ border: "1px solid #000", padding: "3pt 8pt", textAlign: "left", fontWeight: "normal" }}>
                                <span style={{ fontWeight: 900, marginRight: "4px" }}>({String.fromCharCode(97 + i)})</span>
                                <span>{q.question_data.col_b?.[i] || ""}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {/* CASE_BASED Legacy Rendering */}
                    {q.question_type === "CASE_BASED" && q.question_data?.sub_questions?.length > 0 && (
                      <div className="mt-2 ml-3 block">
                        {q.question_data.sub_questions.map((sq: any, i: number) => (
                          <div key={i} className="flex items-start justify-between gap-8 mt-1 break-inside-avoid">
                            <div className="flex items-start gap-1.5 flex-1">
                              <span className="font-normal text-[9.5pt] shrink-0">({String.fromCharCode(97 + i)})</span>
                              <span className="text-[9.5pt] font-normal text-slate-900" style={{ lineHeight: 1.2 }}>
                                {sq.text || "Sub-question"}
                              </span>
                            </div>
                            <span className="text-[9pt] font-normal text-slate-600 shrink-0">[{sq.marks}M]</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* PASSAGE_BASED Board Style Rendering */}
                    {q.question_type === "PASSAGE_BASED" && (() => {
                      const qd = q.question_data || {};
                      const qLetter = getQuestionLetter(q.question_text || "", "B");
                      let activities = qd.activities;
                      if (!activities) {
                        activities = [
                          {
                            id: "legacy",
                            heading: "Answer the following questions based on the passage:",
                            marks: q.marks || 8,
                            type: "One Line Answers",
                            sub_questions: qd.sub_questions?.map((sq: any) => sq.text || sq) || []
                          }
                        ];
                      }

                      const renderAct = (act: any, actIdx: number) => {
                        const headingNum = `${qLetter}${actIdx + 1}`;
                        return (
                          <div key={act.id || actIdx} className="mt-3 break-inside-avoid">
                            <div className="flex justify-between items-baseline gap-8 mb-1">
                              <span className="text-[9.5pt] font-black text-slate-900">
                                {headingNum}. {getActivityHeading(act)}
                              </span>
                              <span className="text-[9.5pt] font-black text-slate-800 shrink-0">
                                ({act.marks || 2})
                              </span>
                            </div>
                            {act.sub_questions && act.sub_questions.length > 0 && (
                              <div className="pl-5 block">
                                {act.sub_questions.map((subQ: any, subIdx: number) => {
                                  const romanSub = `(${romanize(subIdx + 1)})`;
                                  const sqText = typeof subQ === "string" ? subQ : subQ?.text || "";
                                  const sqMarks = typeof subQ === "string" ? null : subQ?.marks;
                                  return (
                                    <div key={subIdx} className="flex items-start justify-between gap-8 mt-1 break-inside-avoid w-full">
                                      <div className="flex items-start gap-2 flex-1">
                                        <span className="font-normal text-[9.5pt] text-slate-800 shrink-0 w-8 text-right">
                                          {romanSub}
                                        </span>
                                        <div className="flex-1 text-[9.5pt] font-normal text-slate-900 whitespace-pre-wrap" style={{ lineHeight: 1.2 }}>
                                          {sqText || "…"}
                                        </div>
                                      </div>
                                      {sqMarks !== null && sqMarks !== undefined && (
                                        <span className="text-[9pt] font-normal text-slate-600 shrink-0">[{sqMarks}M]</span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      };

                      return (
                        <div className="mt-2">
                          {qd.passage && (
                            <div className="border border-slate-900 px-3 py-2 my-3 bg-white text-[9.5pt] font-medium text-slate-900 whitespace-pre-wrap select-text" style={{ lineHeight: 1.3 }}>
                              {qd.passage}
                            </div>
                          )}
                          {activities.map((act: any, idx: number) => renderAct(act, idx))}
                        </div>
                      );
                    })()}

                    {/* Diagram Labels */}
                    {q.question_type === "DIAGRAM_LABEL" && q.question_data?.labels?.length > 0 && (
                      <div className="mt-2 ml-3 block">
                        <p className="text-[9pt] font-normal italic text-slate-600 mb-1">
                          Label the following in the given diagram:
                        </p>
                        <div className="grid grid-cols-2 gap-1">
                          {q.question_data.labels.map((lbl: string, i: number) => (
                            lbl.trim() ? (
                              <div key={i} className="flex gap-1.5 text-[9.5pt] font-normal break-inside-avoid" style={{ lineHeight: 1.2 }}>
                                <span className="font-bold shrink-0">{i + 1}.</span>
                                <span>{lbl}</span>
                              </div>
                            ) : null
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Letter — Bullet Points */}
                    {q.question_type === "LETTER" && q.question_data?.bullet_points?.some((p: string) => p.trim()) && (
                      <div className="mt-2 ml-3 border-l-2 border-slate-300 pl-3 block">
                        <p className="text-[9pt] font-bold text-slate-600 mb-0.5">Points to cover:</p>
                        <ul className="block">
                          {q.question_data.bullet_points.filter((p: string) => p.trim()).map((pt: string, i: number) => (
                            <li key={i} className="text-[9.5pt] font-normal flex gap-1.5 mt-0.5 break-inside-avoid" style={{ lineHeight: 1.2 }}>
                              <span>•</span><span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  </div>
                </div>
                <div className="w-[70px] text-right shrink-0">
                  <span className="text-[9pt] font-normal text-slate-700 whitespace-nowrap">
                    [{q.marks} Marks]
                  </span>
                </div>
              </div>
            </div>
          )
        });
      });
    });

  // Footer Block (Asterisks divider)
  blocks.push({
    type: "footer",
    key: "footer",
    render: () => (
      <div className="relative z-10 mt-8 flex justify-center items-center">
        <p className="text-[11pt] font-black uppercase tracking-[0.5em] text-slate-800">* * * * *</p>
      </div>
    )
  });

  // 2. Measure DOM block heights & Paginate blocks dynamically
  useEffect(() => {
    const timer = setTimeout(() => {
      const heights: Record<string, number> = {};
      blocks.forEach(block => {
        const el = document.getElementById(`measure-${block.key}`);
        if (el) {
          heights[block.key] = el.offsetHeight;
        }
      });

      const pages: any[][] = [];
      let currentPage: any[] = [];
      let currentHeight = 0;
      // MAX_PAGE_HEIGHT inside simulated 297mm container with pt-[9mm] px-[15mm] pb-[15mm]
      // 297mm A4 is ~1122.6px. Subtracting margins gives roughly 990px printable content height.
      const MAX_PAGE_HEIGHT = 990;

      blocks.forEach(block => {
        const blockHeight = heights[block.key] || 90;

        if (block.type === "section_header" && currentHeight + blockHeight > MAX_PAGE_HEIGHT - 120) {
          if (currentPage.length > 0) pages.push(currentPage);
          currentPage = [block];
          currentHeight = blockHeight;
        } else if (currentHeight + blockHeight > MAX_PAGE_HEIGHT) {
          if (currentPage.length > 0) pages.push(currentPage);
          currentPage = [block];
          currentHeight = blockHeight;
        } else {
          currentPage.push(block);
          currentHeight += blockHeight;
        }
      });

      if (currentPage.length > 0) {
        pages.push(currentPage);
      }

      setPaginatedPages(pages);
    }, 150);

    return () => clearTimeout(timer);
  }, [paper, school]);

  // 3. Fallback Render during measurements
  if (paginatedPages.length === 0) {
    return (
      <div
        className={`mx-auto shadow-2xl relative print:shadow-none print:m-0 print:border-none ${paperCls}`}
        style={paperStyle}
      >
        {/* Hidden measurement container */}
        <div className="absolute top-0 left-0 opacity-0 pointer-events-none w-[210mm] pt-[9mm] px-[15mm] pb-[15mm] z-0" style={paperStyle}>
          {blocks.map(block => (
            <div id={`measure-${block.key}`} key={block.key} className="w-full block">
              {block.render()}
            </div>
          ))}
        </div>

        {/* Fallback full size single container */}
        <div className="relative min-h-[297mm] pt-[9mm] px-[15mm] pb-[15mm]">
          <div className="absolute top-[5mm] left-[5mm] right-[5mm] bottom-[5mm] border-2 border-black pointer-events-none z-50" />
          <div className="relative z-10 block">
            {blocks.map(block => (
              <div key={block.key}>{block.render()}</div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 4. Premium Paginated A4 Sheets Preview Render
  return (
    <div className="space-y-6 print:space-y-0 print:gap-0">
      {/* Hidden measurement container */}
      <div className="absolute top-0 left-0 opacity-0 pointer-events-none w-[210mm] pt-[9mm] px-[15mm] pb-[15mm] z-0" style={paperStyle}>
        {blocks.map(block => (
          <div id={`measure-${block.key}`} key={block.key} className="w-full block">
            {block.render()}
          </div>
        ))}
      </div>

      {/* Rendered A4 simulated pages */}
      {paginatedPages.map((pageBlocks, pageIdx) => (
        <div
          key={pageIdx}
          className={`mx-auto shadow-2xl relative bg-white w-[210mm] h-[297mm] pt-[9mm] px-[15mm] pb-[15mm] overflow-hidden print:shadow-none print:m-0 print:border-none print-page-sheet ${
            !fullSize ? "scale-[0.62] origin-top-left" : ""
          }`}
          style={paperStyle}
        >
          {/* Solid Black Page Border Frame */}
          <div className="absolute top-[5mm] left-[5mm] right-[5mm] bottom-[5mm] border-2 border-black pointer-events-none z-50 page-border-frame" />

          {/* Watermark (Rendered on every page!) */}
          {school?.show_watermark && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45 pointer-events-none z-0 select-none">
              <span className="text-[90px] font-extrabold opacity-[0.025] whitespace-nowrap text-slate-900">
                {school?.school_name?.split(" ")[0] || "SCHOOL"}
              </span>
            </div>
          )}

          {/* Content Wrapper */}
          <div className="relative z-10 block h-[277mm] overflow-hidden">
            {pageBlocks.map(block => (
              <div key={block.key} className="w-full block">
                {block.render()}
              </div>
            ))}
          </div>

          {/* Page Indicator (Bottom Center inside border) */}
          <div className="absolute bottom-[8mm] left-1/2 -translate-x-1/2 z-50 text-[9pt] font-semibold text-slate-400 print:hidden select-none">
            Page {pageIdx + 1} of {paginatedPages.length}
          </div>
        </div>
      ))}
    </div>
  );
}
