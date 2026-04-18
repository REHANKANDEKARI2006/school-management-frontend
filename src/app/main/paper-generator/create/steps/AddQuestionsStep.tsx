"use client";

import React, { useState, useMemo } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, Layout, BookOpen, Hash, AlertCircle, Layers, ListOrdered, GanttChartSquare, Settings2, Sparkles, Image as ImageIcon } from "lucide-react";
import { PaperState, Section, Question } from "../page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { upsertSection, upsertQuestion, deleteSection, deleteQuestion } from "@/lib/api/question-paper";
import QuestionTypeEditor from "./QuestionTypeEditor";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  paper: PaperState;
  onChange: (updates: Partial<PaperState>) => void;
}

const QUESTION_TYPES = [
  { group: "Objective", types: ["MCQ_TEXT", "MCQ_PICTURE", "TRUE_FALSE", "YES_NO", "ASSERTION_REASON"] },
  { group: "Fill & Match", types: ["FILL_BLANKS", "FILL_WORD_BANK", "MATCH_FOLLOWING", "MATCH_PICTURE"] },
  { group: "Writing", types: ["VSA", "SA", "LONG_ANSWER", "ESSAY", "LETTER"] },
  { group: "Subject Specific", types: ["MATH_SOLVE", "SCIENCE_DIAGRAM", "SST_MAP"] },
];

export default function AddQuestionsStep({ paper, onChange }: Props) {
  const totalAssignedMarks = useMemo(() => {
    return paper.sections.reduce((acc, sec) => 
      acc + sec.questions.reduce((qAcc, q) => qAcc + (q.marks || 0), 0), 0
    );
  }, [paper.sections]);

  const marksPct = (totalAssignedMarks / paper.total_marks) * 100;
  const isOverLimit = totalAssignedMarks > paper.total_marks;
  const isComplete = totalAssignedMarks === paper.total_marks;

  const handleAddSection = async () => {
    const nextOrder = paper.sections.length + 1;
    try {
      const newSec = await upsertSection(paper.paper_id!, {
        section_name: `Section ${String.fromCharCode(64 + nextOrder)}`,
        section_order: nextOrder,
        total_section_marks: 0
      });
      onChange({ sections: [...paper.sections, { ...newSec, questions: [] }] });
    } catch (err) {
      console.error("Section add failed", err);
    }
  };

  const handleAddQuestion = async (sectionId: number, type: string) => {
    const section = paper.sections.find(s => s.section_id === sectionId);
    const nextOrder = (section?.questions.length || 0) + 1;
    try {
      const newQ = await upsertQuestion(sectionId, {
        question_type: type,
        question_text: "",
        question_data: {},
        marks: 1,
        question_order: nextOrder
      });
      
      const updatedSections = paper.sections.map(s => {
        if (s.section_id === sectionId) {
          return { ...s, questions: [...s.questions, newQ] };
        }
        return s;
      });
      onChange({ sections: updatedSections });
    } catch (err) {
       console.error("Question add failed", err);
    }
  };

  const handleUpdateQuestion = async (sectionId: number, questionId: number, updates: Partial<Question>) => {
    let fullQuestion: Question | undefined;
    
    const updatedSections = paper.sections.map(s => {
      if (s.section_id === sectionId) {
        return {
          ...s,
          questions: s.questions.map(q => {
             if (q.question_id === questionId) {
                fullQuestion = { ...q, ...updates };
                return fullQuestion;
             }
             return q;
          })
        };
      }
      return s;
    });

    onChange({ sections: updatedSections });
    
    if (fullQuestion) {
      try {
         await upsertQuestion(sectionId, fullQuestion);
      } catch (err) {
         console.error("Question update failed", err);
      }
    }
  };

  const handleRemoveQuestion = async (sectionId: number, questionId: number) => {
    try {
      await deleteQuestion(questionId);
      const updatedSections = paper.sections.map(s => {
        if (s.section_id === sectionId) {
          return { ...s, questions: s.questions.filter(q => q.question_id !== questionId) };
        }
        return s;
      });
      onChange({ sections: updatedSections });
    } catch (err) {
       console.error("Question delete failed", err);
    }
  };

  return (
    <div className="flex h-full bg-slate-50 relative">
      <div className="flex-1 flex flex-col h-full border-r">
        {/* Header Overlay Style */}
        <div className="bg-white/70 backdrop-blur-xl border-b px-8 py-5 flex items-center justify-between shadow-[0_2px_15px_rgba(0,0,0,0.02)] sticky top-0 z-20">
          <div className="flex items-center gap-6 flex-1 max-w-xl">
             <div className="h-12 w-12 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary">
                <GanttChartSquare className="h-6 w-6" />
             </div>
             <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    <span>Marks Distribution</span>
                    <span className={isOverLimit ? "text-destructive" : isComplete ? "text-green-600" : "text-primary"}>
                        {totalAssignedMarks} / {paper.total_marks} Marks
                    </span>
                </div>
                <Progress value={marksPct} className={`h-2.5 rounded-full ${isOverLimit ? "bg-destructive/10" : "bg-slate-100"}`} />
             </div>
          </div>

          <Button 
            onClick={handleAddSection} 
            className="rounded-2xl h-11 px-6 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all gap-2"
          >
            <Plus className="h-4 w-4" /> New Section
          </Button>
        </div>

        <ScrollArea className="flex-1 p-8">
          <div className="max-w-4xl mx-auto space-y-12 pb-32">
            {paper.sections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
                 <div className="h-24 w-24 rounded-[2rem] bg-white shadow-2xl shadow-slate-200/50 flex items-center justify-center rotate-6 border border-slate-50">
                    <Sparkles className="h-10 w-10 text-primary animate-pulse" />
                 </div>
                 <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-800">Start Your Blueprint</h3>
                    <p className="text-sm text-slate-400 max-w-xs mx-auto font-medium leading-relaxed">Create your first section to begin curating questions for this examination.</p>
                 </div>
                 <Button onClick={handleAddSection} className="rounded-2xl px-10 h-14 text-base font-bold shadow-xl shadow-primary/20">
                   Add Section A
                 </Button>
              </div>
            ) : (
              paper.sections.map((section, sIdx) => (
                <SectionEditor 
                  key={section.section_id || `s-${sIdx}`} 
                  section={section} 
                  order={sIdx + 1}
                  onAddQuestion={(type) => handleAddQuestion(section.section_id!, type)}
                  onUpdateQuestion={(qId, updates) => handleUpdateQuestion(section.section_id!, qId, updates)}
                  onRemoveQuestion={(qId) => handleRemoveQuestion(section.section_id!, qId)}
                  onUpdateSection={(updates) => {
                    const next = [...paper.sections];
                    next[sIdx] = { ...section, ...updates };
                    onChange({ sections: next });
                    if (section.section_id) {
                      upsertSection(paper.paper_id!, { section_id: section.section_id, ...updates });
                    }
                  }}
                  onRemove={() => {
                    if (section.section_id) {
                        deleteSection(section.section_id);
                        onChange({ sections: paper.sections.filter(s => s.section_id !== section.section_id) });
                    }
                  }}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Floating Navigator Card */}
      <div className="w-96 bg-white/40 backdrop-blur-sm p-8 hidden 2xl:block sticky top-0 h-[calc(100vh-8rem)]">
         <Card className="h-full border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
            <CardContent className="p-8 flex flex-col h-full">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.3em] mb-8 flex items-center gap-2">
                   <Layers className="h-3.5 w-3.5" /> Paper Tree
                </h3>
                
                <ScrollArea className="flex-1 -mx-2 px-2">
                    <div className="space-y-10">
                        {paper.sections.map((s, idx) => (
                            <div key={s.section_id || idx} className="space-y-4">
                                <div className="flex items-center justify-between text-[11px] font-black group uppercase tracking-widest text-slate-800 border-b border-slate-50 pb-2">
                                    <span className="truncate flex-1 pr-2">{s.section_name || `Section ${idx+1}`}</span>
                                    <Badge variant="secondary" className="bg-slate-50 text-slate-400 border-none font-black text-[9px] px-2 py-0">
                                        {s.questions.reduce((acc, q) => acc + (q.marks || 0), 0)}M
                                    </Badge>
                                </div>
                                <div className="pl-4 border-l-2 border-slate-50 space-y-3">
                                    {s.questions.map((q, qIdx) => (
                                        <div key={q.question_id || qIdx} className="text-[10px] text-slate-400 flex items-start gap-3 group/item cursor-pointer hover:text-primary transition-colors">
                                            <span className="font-black text-slate-100 group-hover/item:text-primary/20 transition-colors">{qIdx + 1}</span>
                                            <span className="truncate flex-1 font-medium">{q.question_text || `New ${q.question_type.toLowerCase()}`}</span>
                                            <span className="font-black text-primary/40 group-hover/item:text-primary transition-colors">{q.marks}M</span>
                                        </div>
                                    ))}
                                    {s.questions.length === 0 && <span className="italic text-[9px] text-slate-200">Empty section</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <div className="pt-8 border-t border-slate-50 mt-auto">
                    <div className="bg-primary/5 rounded-3xl p-5 flex items-center justify-between">
                         <div className="space-y-0.5">
                            <span className="text-[9px] font-black text-primary/40 uppercase tracking-widest">Total Weight</span>
                            <p className="text-xl font-black text-primary">{totalAssignedMarks} Marks</p>
                         </div>
                         <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center">
                             <Settings2 className="h-5 w-5 text-primary" />
                         </div>
                    </div>
                </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}

function SectionEditor({ section, order, onAddQuestion, onUpdateSection, onRemove, onUpdateQuestion, onRemoveQuestion }: { 
  section: Section; 
  order: number;
  onAddQuestion: (type: string) => void;
  onUpdateSection: (updates: Partial<Section>) => void;
  onRemove: () => void;
  onUpdateQuestion: (qId: number, updates: Partial<Question>) => void;
  onRemoveQuestion: (qId: number) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)] overflow-hidden group/sec transition-all hover:shadow-[0_15px_50px_rgba(0,0,0,0.04)]">
      <div className={`p-6 flex items-center gap-6 transition-all ${collapsed ? "bg-slate-50/50" : "bg-white border-b border-slate-50/50"}`}>
        <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-xl shadow-slate-200">
          {String.fromCharCode(64 + order)}
        </div>
        <Input 
          className="flex-1 font-black text-2xl h-auto border-none p-0 focus-visible:ring-0 bg-transparent text-slate-800 placeholder:text-slate-100"
          value={section.section_name}
          onChange={e => onUpdateSection({ section_name: e.target.value })}
          placeholder="Section Name"
        />
        <div className="flex items-center gap-4">
          <Badge className="bg-indigo-50 text-indigo-500 hover:bg-indigo-50 border-none px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider">
            {section.questions.reduce((acc, q) => acc + (q.marks || 0), 0)} Marks
          </Badge>
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="h-10 w-10 text-slate-300 hover:bg-slate-50 rounded-xl">
            {collapsed ? <ChevronDown className="h-6 w-6" /> : <ChevronUp className="h-6 w-6" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onRemove} className="h-10 w-10 text-slate-100 hover:text-destructive hover:bg-destructive/5 opacity-0 group-hover/sec:opacity-100 transition-all rounded-xl">
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {!collapsed && (
        <div className="p-8 space-y-10 bg-white">
          <div className="space-y-6">
            {section.questions.map((q, qIdx) => (
                <QuestionEditor 
                key={q.question_id || `q-${qIdx}`} 
                question={q} 
                order={qIdx + 1}
                onRemove={() => onRemoveQuestion(q.question_id as number)}
                onUpdate={(u) => onUpdateQuestion(q.question_id as number, u)}
                />
            ))}
          </div>

          <div className="pt-10 border-t border-slate-50">
            <div className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em] text-center relative mb-8">
              <span className="bg-white px-8 relative z-10">Add Question Pattern</span>
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-slate-100/50" />
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {QUESTION_TYPES.flatMap(g => g.types.slice(0, 4)).map(type => (
                <Button 
                  key={type} 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onAddQuestion(type)}
                  className="h-12 text-[10px] font-black uppercase tracking-widest border-dashed border-slate-200 text-slate-400 hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all rounded-2xl"
                >
                   {type.replace("_", " ")}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionEditor({ question, order, onRemove, onUpdate }: {
  question: Question;
  order: number;
  onRemove: () => void;
  onUpdate: (u: Partial<Question>) => void;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("http://localhost:5000/api/upload/question-image", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (result.success) {
        onUpdate({ 
            question_data: { 
                ...(question.question_data || {}), 
                image_url: result.imageUrl 
            } 
        });
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div 
      className={`group relative rounded-[2.5rem] p-8 border transition-all duration-500 ${
        isFocused 
          ? "bg-white border-primary/20 shadow-[0_25px_60px_rgba(0,0,0,0.06)] z-10 scale-[1.01]" 
          : "bg-slate-50/30 border-slate-100 hover:border-slate-200"
      }`}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      <div className="flex gap-8">
        <div className={`mt-1 h-8 w-8 rounded-2xl flex items-center justify-center text-xs font-black transition-all duration-500 ${
            isFocused ? "bg-primary text-white shadow-lg shadow-primary/30 rotate-12" : "bg-white text-slate-300 shadow-sm"
        }`}>
          {order}
        </div>
        <div className="flex-1 space-y-8">
          <div className="space-y-4">
            <Textarea 
                placeholder="Click to type your question content (Supports multi-line)..."
                className="border-none p-0 text-lg font-bold placeholder:text-slate-200 text-slate-800 focus-visible:ring-0 bg-transparent min-h-[40px] resize-none overflow-hidden"
                value={question.question_text}
                rows={1}
                onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height = `${target.scrollHeight}px`;
                }}
                onChange={e => onUpdate({ question_text: e.target.value })}
            />

            {/* Image Preview & Upload */}
            <div className="flex items-center gap-4">
                {question.question_data?.image_url && (
                    <div className="relative group/img h-24 w-24 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                        <img 
                            src={`http://localhost:5000${question.question_data.image_url}`} 
                            className="h-full w-full object-cover"
                            alt="Question"
                        />
                        <button 
                            onClick={() => onUpdate({ question_data: { ...question.question_data, image_url: null } })}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all text-white"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                )}
                
                <label className={`cursor-pointer h-10 px-4 rounded-xl border border-dashed flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${isUploading ? "bg-slate-50 text-slate-300 border-slate-100" : "bg-white text-slate-400 border-slate-200 hover:border-primary/40 hover:text-primary hover:bg-primary/5"}`}>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                    <ImageIcon className="h-3.5 w-3.5" />
                    {isUploading ? "Uploading..." : question.question_data?.image_url ? "Change Image" : "Add Illustration"}
                </label>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-10 border-t border-slate-100/50 pt-6">
            <div className="flex items-center gap-3">
               <span className="text-[10px] font-black p-1 text-slate-300 uppercase tracking-widest">Weightage</span>
              <div className="flex items-center bg-white border border-slate-100 rounded-xl overflow-hidden h-9 shadow-sm transition-all focus-within:border-primary/30">
                <Input 
                  type="number" 
                  className="w-14 h-full text-sm font-black p-0 text-center border-none bg-transparent focus-visible:ring-0 text-primary"
                  value={question.marks}
                  onChange={e => onUpdate({ marks: parseInt(e.target.value) || 0 })}
                />
                <div className="bg-slate-50/50 border-l border-slate-100 px-3 flex items-center h-full">
                  <span className="text-[10px] font-black text-slate-400">MARKS</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black p-1 text-slate-300 uppercase tracking-widest">Format</span>
              <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-xl shadow-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider">
                    {question.question_type.replace("_", " ")}
                </span>
              </div>
            </div>
          </div>

          <div className="animate-in fade-in slide-in-from-top-2 duration-700">
            <QuestionTypeEditor 
              type={question.question_type} 
              data={question.question_data} 
              onChange={data => onUpdate({ question_data: data })} 
            />
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onRemove} 
          className="h-11 w-11 text-slate-100 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive/5 rounded-2xl"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
