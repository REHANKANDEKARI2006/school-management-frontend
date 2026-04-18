"use client";

import React from "react";
import { PaperState } from "../page";

interface Props {
  paper: PaperState;
  fullSize?: boolean;
}

export default function LivePaperPreview({ paper, fullSize = false }: Props) {
  return (
    <div className={`mx-auto bg-white shadow-2xl origin-top transition-all duration-500 ease-in-out ${fullSize ? "w-[210mm] min-h-[297mm] p-[25mm]" : "w-[180mm] min-h-[250mm] p-[15mm] scale-75 rounded-2xl"}`}>
      {/* Professional Academic Header matching Sample */}
      <div className="flex flex-col items-center text-center space-y-1 mb-6">
        <h1 className="text-xl font-bold uppercase tracking-tight text-slate-900 leading-tight border-b-2 border-slate-900 px-4">
          {paper.school_name || "CHHATTISGARH GOVT. ENGLISH MEDIUM SCHOOLS"}
        </h1>
        <h2 className="text-lg font-bold uppercase text-slate-900 tracking-wider">
          {paper.title || "ANNUAL EXAMINATION 2025"}
        </h2>
        <h3 className="text-sm font-bold uppercase text-slate-800 tracking-widest">
          CLASS - {paper.class_name || "I"}
        </h3>
        <p className="text-sm font-medium text-slate-700">
          Subject: {paper.subject || "English"}
        </p>
        
        <div className="w-full flex justify-between mt-4 text-xs font-bold text-slate-900 border-t border-slate-200 pt-2 px-2">
           <span>Time : {Math.floor(paper.duration_mins/60)} hours</span>
           <span>M.M : {paper.total_marks}</span>
        </div>
      </div>

      {/* Instructions Box matching Sample */}
      <div className="mb-8 p-3 border-2 border-slate-900 rounded-sm">
        <div className="text-[11px] leading-relaxed text-slate-900 font-bold whitespace-pre-wrap">
          <span className="mr-2">Note:</span>
          {paper.instructions ? (
              <div className="mt-1 pl-10 space-y-1">
                  {paper.instructions.split('\n').map((line, i) => (
                      <div key={i} className="flex gap-4">
                          <span className="w-4">{i + 1}.</span>
                          <span>{line}</span>
                      </div>
                  ))}
              </div>
          ) : (
             <div className="mt-1 pl-10 space-y-1">
                <div className="flex gap-4"><span className="w-4">1.</span><span>All questions are compulsory.</span></div>
                <div className="flex gap-4"><span className="w-4">2.</span><span>Each question carries assigned marks.</span></div>
             </div>
          )}
        </div>
      </div>

      {/* Sections & Questions */}
      <div className="space-y-10">
        {paper.sections.map((section, sIdx) => {
          return (
            <div key={sIdx} className="space-y-6">
              {/* Questions Stack */}
              <div className="space-y-10">
                {section.questions.map((q, qIdx) => (
                  <div key={q.question_id || qIdx} className="relative group">
                    <div className="flex gap-4 items-start mb-4">
                        <span className="text-sm font-bold text-slate-900 w-10 flex-shrink-0">Q.{qIdx + 1}.</span>
                        <div className="flex-1">
                            {/* Question Text with HTML & Pre-wrap support */}
                            <div 
                                className="text-sm font-bold text-slate-900 leading-normal mb-4 whitespace-pre-wrap"
                                dangerouslySetInnerHTML={{ __html: q.question_text || "...................................................................." }}
                            />

                            {/* Single Question Image */}
                            {q.question_data?.image_url && (
                                <div className="mb-6 max-w-md">
                                    <img 
                                        src={`http://localhost:5000${q.question_data.image_url}`} 
                                        className="h-auto max-h-48 rounded-md shadow-sm border border-slate-100 object-contain" 
                                        alt="Question Illustration" 
                                    />
                                </div>
                            )}
                            
                            {/* MCQ Options Rendering (Text) - Shows for all types if content exists */}
                            {q.question_data?.options && q.question_data.options.length > 0 && (
                                <div className="grid grid-cols-4 gap-4 mt-4">
                                    {q.question_data.options.map((opt: string, i: number) => (
                                        <div key={i} className="text-xs text-slate-900 font-semibold flex gap-2">
                                            <span className="font-bold">({String.fromCharCode(97 + i)})</span>
                                            <span>{opt}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* MCQ Picture Options Rendering */}
                            {q.question_type === "MCQ_PICTURE" && q.question_data?.options_images && (
                                <div className="grid grid-cols-4 gap-6 mt-6">
                                    {q.question_data.options_images.map((img: string, i: number) => (
                                        <div key={i} className="flex flex-col items-center gap-2">
                                            <div className="h-28 w-full border border-slate-100 rounded-lg bg-slate-50/10 flex items-center justify-center p-2 shadow-sm">
                                                {img ? <img src={`http://localhost:5000${img}`} className="h-full w-full object-contain" alt="Opt" /> : <div className="text-[8px] text-slate-200">No Image</div>}
                                            </div>
                                            <span className="text-xs font-bold">({String.fromCharCode(97 + i)})</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {q.question_type === "ASSERTION_REASON" && q.question_data && (
                                <div className="space-y-2 pl-4 text-xs font-semibold text-slate-900 border-l-2 border-slate-100">
                                    <p><span className="font-bold">(A)</span> {q.question_data.assertion}</p>
                                    <p><span className="font-bold">(R)</span> {q.question_data.reason}</p>
                                </div>
                            )}

                            {q.question_type === "MATCH_FOLLOWING" && q.question_data?.pairs && (
                                <div className="mt-8 flex justify-center">
                                    <div className="w-[70%]">
                                        <div className="flex mb-4">
                                            <div className="w-1/2 font-black text-sm text-slate-900 pl-[30px]">A</div>
                                            <div className="w-1/2 font-black text-sm text-slate-900 pl-[30px]">B</div>
                                        </div>
                                        <div className="space-y-4">
                                            {q.question_data.pairs.map((p: any, pi: number) => (
                                                <div key={pi} className="flex items-start">
                                                    <div className="w-1/2 flex gap-0 text-xs font-bold text-slate-900">
                                                        <span className="min-w-[30px]">{pi + 1})</span>
                                                        <div className="flex flex-col">
                                                            {p.img_a && <img src={`http://localhost:5000${p.img_a}`} className="h-12 w-20 object-contain rounded-sm border mb-1" alt="A" />}
                                                            <span>{p.a}</span>
                                                        </div>
                                                    </div>
                                                    <div className="w-1/2 flex gap-0 text-xs font-bold text-slate-900">
                                                        <span className="min-w-[25px]">{String.fromCharCode(97 + pi)})</span>
                                                        <div className="flex flex-col">
                                                            {p.img_b && <img src={`http://localhost:5000${p.img_b}`} className="h-12 w-20 object-contain rounded-sm border mb-1" alt="B" />}
                                                            <span>{p.b}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Optional Marks on right */}
                        <div className="text-[10px] font-bold text-slate-400 self-start pt-1">
                            [{q.marks}M]
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

    <div className="mt-16 pt-6 border-t border-slate-900">
        <div className="flex justify-between items-end opacity-40">
           <div className="text-[8px] font-bold uppercase tracking-widest leading-relaxed">
              <p>CAMPUSCONNECT ACADEMIC SUITE</p>
              <p>QP-ID: {paper.paper_id || "DRAFT"}</p>
           </div>
           <p className="text-[9px] font-black uppercase tracking-[0.6em] text-slate-900 border-x-2 border-slate-900 px-10">
             END OF PAPER
           </p>
           <div className="w-24 border-b border-slate-900 pb-1 text-[8px] font-black text-center uppercase tracking-widest">
              Signature
           </div>
        </div>
    </div>
    </div>
  );
}
