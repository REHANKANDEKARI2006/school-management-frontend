"use client";

import React, { useState, useEffect } from "react";
import { GraduationCap, BookOpen, Clock, Hash, AlertCircle, FileText, ChevronDown, CheckCircle2, Sparkles, Wand2 } from "lucide-react";
import { PaperState } from "../page";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { getUpcomingExams } from "@/lib/api/question-paper";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  paper: PaperState;
  onChange: (updates: Partial<PaperState>) => void;
}

export default function PaperSetupStep({ paper, onChange }: Props) {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getUpcomingExams().then(setExams).finally(() => setLoading(false));
  }, []);

  const handleExamChange = (val: string) => {
    const selected = exams.find(e => e.exam_id.toString() === val);
    if (selected) {
      onChange({
        exam_id: selected.exam_id,
        class_id: selected.class_id,
        class_name: selected.class_name,
        subject_id: selected.subject_id,
        subject: selected.subject_name,
        total_marks: selected.total_score,
        title: `${selected.class_name} ${selected.subject_name} - ${selected.exam_name}`
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="flex flex-col items-center text-center space-y-4 mb-12">
        <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center rotate-3 border border-primary/20 shadow-xl shadow-primary/5">
          <Wand2 className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Configure Paper</h1>
          <p className="text-slate-500 max-w-md mx-auto">Select an academic event and define the high-level specifications for your question paper.</p>
        </div>
      </div>

      <div className="grid gap-8">
        {/* Exam Selection Card */}
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/50 backdrop-blur-sm rounded-[2rem] overflow-hidden">
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
              <div className="h-8 w-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <FileText className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-slate-800">Academic Context</h3>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Select Upcoming Examination</Label>
              <Select value={paper.exam_id?.toString()} onValueChange={handleExamChange}>
                <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-white/80 shadow-sm text-base font-bold text-slate-700 hover:border-primary/30 transition-all">
                  <SelectValue placeholder="Browse available exams..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                  {exams.map(e => (
                    <SelectItem key={e.exam_id} value={e.exam_id.toString()} className="p-3 focus:bg-slate-50 rounded-xl m-1">
                      <div className="flex flex-col items-start gap-1">
                        <span className="font-bold text-slate-800">{e.exam_name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[9px] font-black uppercase text-indigo-500 bg-indigo-50/50 border-indigo-100/50 rounded-lg">
                            {e.class_name}
                          </Badge>
                          <span className="text-[10px] text-slate-400 font-medium">| {e.subject_name}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {paper.exam_id && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Target Standard</span>
                    <span className="text-sm font-bold text-slate-700">{paper.class_name}</span>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Target Subject</span>
                    <span className="text-sm font-bold text-slate-700">{paper.subject}</span>
                  </div>
                </div>
              </div>
            )}

            {paper.exam_id && (
              <div className="space-y-3 pt-4 border-t border-slate-50 animate-in fade-in slide-in-from-top-4 duration-700">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">School Name (Optional Override)</Label>
                <div className="relative">
                  <Input 
                    placeholder="e.g. CHHATTISGARH GOVT. ENGLISH MEDIUM SCHOOLS"
                    value={paper.school_name || ""}
                    onChange={e => onChange({ school_name: e.target.value })}
                    className="h-14 rounded-2xl border-slate-100 bg-white/80 pr-12 font-bold text-slate-700"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-200">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-medium italic">Leave empty to use the default school name from branding settings.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/50 backdrop-blur-sm rounded-[2rem]">
          <CardContent className="p-8 space-y-8">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-slate-800">Paper Specifications</h3>
            </div>

            <div className="grid gap-8">
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Formal Title</Label>
                <Input 
                  placeholder="e.g. Mid-Term Assessment 2026"
                  className="h-12 rounded-2xl border-slate-100 bg-white/80 shadow-sm font-bold text-slate-700 focus-visible:ring-primary/20"
                  value={paper.title}
                  onChange={e => onChange({ title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Hash className="h-3 w-3" /> Max Marks
                  </Label>
                  <Input 
                    type="number"
                    className="h-12 rounded-2xl border-slate-100 bg-white/80 shadow-sm font-black text-center text-slate-700 text-lg"
                    value={paper.total_marks}
                    onChange={e => onChange({ total_marks: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Clock className="h-3 w-3" /> Duration (min)
                  </Label>
                  <Input 
                    type="number"
                    className="h-12 rounded-2xl border-slate-100 bg-white/80 shadow-sm font-black text-center text-slate-700 text-lg"
                    value={paper.duration_mins}
                    onChange={e => onChange({ duration_mins: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <AlertCircle className="h-3 w-3" /> Official Instructions
                </Label>
                <Textarea 
                  placeholder="Enter paper-wide instructions..."
                  className="min-h-[120px] rounded-[2rem] border-slate-100 bg-white/80 shadow-sm font-medium text-slate-600 p-6 leading-relaxed resize-none focus-visible:ring-primary/20"
                  value={paper.instructions}
                  onChange={e => onChange({ instructions: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
