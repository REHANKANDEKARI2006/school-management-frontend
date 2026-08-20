"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FileText, Plus, Clock, Layers, Copy, Trash2,
  ChevronRight, Search, Zap, BookOpen, GraduationCap, Calendar
} from "lucide-react";
import { listPapers, duplicatePaper, deletePaper } from "@/lib/api/question-paper";
import { cn, formatDate } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { PageSkeleton } from "@/components/ui/skeletons";
import { useFeedback } from "@/components/school-os/feedback-provider";

interface Paper {
  paper_id: number; title: string; class_name: string; section: string | null;
  subject: string; exam_type: string; exam_date: string | null;
  total_marks: number; status: "draft" | "final";
  created_at: string; updated_at: string;
}

const EXAM_TYPE_LABELS: Record<string, string> = {
  unit_test: "Unit Test", ca: "Class Assessment",
  half_yearly: "Half Yearly", annual: "Annual Exam", practice: "Practice Paper",
};

const QUICK_TEMPLATES = [
  { key: "unit_test",   label: "Unit Test",      icon: Zap,           marks: "25–40 M", desc: "Short, focused" },
  { key: "ca",          label: "Class Assess.",  icon: BookOpen,      marks: "50–70 M", desc: "Medium format" },
  { key: "half_yearly", label: "Half Yearly",    icon: Calendar,      marks: "80 M",    desc: "Full structured" },
  { key: "annual",      label: "Annual Exam",    icon: GraduationCap, marks: "80 M",    desc: "Comprehensive" },
];

const formatDateStr = (dateStr: string) => {
  if (!dateStr) return "—";
  return formatDate(dateStr);
};

export default function PaperGeneratorLandingPage() {
  const router = useRouter();
  const { showWarning } = useFeedback();
  const [papers, setPapers]         = useState<Paper[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filterType, setFilterType] = useState("all");
  const [dupeId, setDupeId]         = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const data = await listPapers(); setPapers(data || []); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreateNew = (examType?: string) => {
    const params = examType ? `?exam_type=${examType}` : "";
    router.push(`/main/paper-generator/create${params}`);
  };

  const handleOpen = (id: number) => {
    router.push(`/main/paper-generator/create?paper_id=${id}`);
  };

  const handleDuplicate = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDupeId(id);
    try {
      const copy = await duplicatePaper(id);
      router.push(`/main/paper-generator/create?paper_id=${copy.paper_id}`);
    } finally { setDupeId(null); }
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    showWarning(
      "Delete Question Paper?",
      "This will permanently delete this question paper record. This action cannot be undone.",
      async () => {
        await deletePaper(id);
        await load();
      },
      "Yes, Delete"
    );
  };

  const filtered = papers.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.subject.toLowerCase().includes(q)
      || p.class_name.toLowerCase().includes(q)
      || (p.title || "").toLowerCase().includes(q);
    const matchType = filterType === "all" || p.exam_type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6 pb-2 sm:pb-0 animate-in fade-in duration-300">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="hidden md:block">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Question Paper Generator</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Create, manage and print beautifully formatted question papers.</p>
        </div>
        <Button
          id="create-new-paper-btn"
          onClick={() => handleCreateNew()}
          className="w-full sm:w-auto h-11 sm:h-10 text-xs sm:text-sm font-bold bg-[#3335e3] hover:bg-[#3335e3]/90 text-white rounded-xl shadow-sm gap-2"
        >
          <Plus className="h-4 w-4" />
          Create New Paper
        </Button>
      </div>

      {/* ── Quick Start ── */}
      <Card className="rounded-2xl border-slate-200/80 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100/80 bg-slate-50/50">
          <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-[#3335e3]" /> Quick Start Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {QUICK_TEMPLATES.map(t => (
            <button
              key={t.key}
              id={`quick-start-${t.key}`}
              onClick={() => handleCreateNew(t.key)}
              className="h-full flex flex-col justify-between items-start gap-2 rounded-xl border border-slate-200 p-3.5 sm:p-4 text-left hover:border-[#3335e3]/40 hover:bg-indigo-50/30 transition-all group bg-white shadow-2xs"
            >
              <div className="space-y-1.5 w-full">
                <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#3335e3] group-hover:scale-105 transition-transform">
                  <t.icon className="h-4 w-4" />
                </div>
                <p className="font-bold text-xs sm:text-sm text-slate-800 leading-tight">{t.label}</p>
                <p className="text-[11px] text-slate-400 line-clamp-1">{t.desc}</p>
              </div>
              <Badge variant="secondary" className="mt-1 text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200/60 rounded-md px-2 py-0.5">
                {t.marks}
              </Badge>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* ── Saved Papers ── */}
      <Card className="rounded-2xl border-slate-200/80 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <CardTitle className="text-base sm:text-lg font-black text-slate-900">Saved Papers</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              {filtered.length} paper{filtered.length !== 1 ? "s" : ""} found
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                id="paper-search-input"
                placeholder="Search by subject…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-10 sm:h-9 w-full text-xs rounded-xl border-slate-200 focus:ring-2 focus:ring-[#3335e3]/20"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[140px] h-10 sm:h-9 text-xs rounded-xl border-slate-200 font-semibold">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Types</SelectItem>
                {Object.entries(EXAM_TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <PageSkeleton />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <FileText className="h-10 w-10 text-slate-300 mb-3" />
              <p className="text-slate-700 font-bold text-sm">No papers found</p>
              <p className="text-slate-400 text-xs mt-1">Click "Create New Paper" to get started</p>
            </div>
          ) : (
            <>
              {/* Mobile View — Cards Layout */}
              <div className="sm:hidden divide-y divide-slate-100">
                {filtered.map(p => (
                  <div
                    key={p.paper_id}
                    id={`paper-row-${p.paper_id}`}
                    onClick={() => handleOpen(p.paper_id)}
                    className="p-4 space-y-3 hover:bg-slate-50/80 active:bg-slate-100 transition-colors cursor-pointer"
                  >
                    {/* Top Row: Icon + Title + Badges */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#3335e3] shrink-0 mt-0.5">
                          <Layers className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-xs text-slate-900 leading-snug truncate">
                            {p.title || `Class ${p.class_name} — ${p.subject}`}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-[10px] font-bold text-slate-600 border-slate-200 px-2 py-0">
                              {EXAM_TYPE_LABELS[p.exam_type] || p.exam_type}
                            </Badge>
                            {p.status === "draft" && (
                              <Badge variant="secondary" className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0">
                                Draft
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Middle Row: Class, Marks, Date info */}
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                      <span>Std {p.class_name}{p.section ? `-${p.section}` : ""} · {p.total_marks} Marks</span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="h-3 w-3" />{formatDate(p.updated_at)}
                      </span>
                    </div>

                    {/* Bottom Action Row: Copy, Delete, Expand Chevron */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          id={`reuse-paper-${p.paper_id}`}
                          disabled={dupeId === p.paper_id}
                          onClick={e => handleDuplicate(p.paper_id, e)}
                          title="Duplicate"
                          className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-[#3335e3] hover:border-[#3335e3]/30 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-2xs"
                        >
                          <Copy className="h-3.5 w-3.5" /> Duplicate
                        </button>
                        <button
                          type="button"
                          id={`delete-paper-${p.paper_id}`}
                          onClick={e => handleDelete(p.paper_id, e)}
                          title="Delete"
                          className="h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 flex items-center justify-center active:scale-95 transition-all shadow-2xs"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-[#3335e3]">
                        Edit Paper <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View — Table Row Layout (Pixel-Identical) */}
              <div className="hidden sm:block divide-y divide-slate-100">
                {filtered.map(p => (
                  <div
                    key={p.paper_id}
                    id={`paper-row-${p.paper_id}`}
                    onClick={() => handleOpen(p.paper_id)}
                    className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50/80 cursor-pointer group transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <Layers className="h-5 w-5 text-slate-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-slate-900 truncate">
                            {p.title || `Class ${p.class_name} — ${p.subject}`}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {EXAM_TYPE_LABELS[p.exam_type] || p.exam_type}
                          </Badge>
                          {p.status === "draft" && (
                            <Badge variant="secondary" className="text-xs">Draft</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 flex-wrap">
                          <span>Std {p.class_name}{p.section ? `-${p.section}` : ""}</span>
                          <span>·</span>
                          <span>{p.total_marks} Marks</span>
                          {p.exam_date && <><span>·</span><span>{formatDate(p.exam_date)}</span></>}
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />{formatDate(p.updated_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <Button
                          size="icon" variant="ghost"
                          id={`reuse-paper-${p.paper_id}`}
                          disabled={dupeId === p.paper_id}
                          onClick={e => handleDuplicate(p.paper_id, e)}
                          title="Duplicate"
                          className="h-8 w-8 text-slate-500 hover:text-[#3335e3]"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon" variant="ghost"
                          id={`delete-paper-${p.paper_id}`}
                          onClick={e => handleDelete(p.paper_id, e)}
                          title="Delete"
                          className="h-8 w-8 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
