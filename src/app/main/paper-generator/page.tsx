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

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this paper permanently?")) return;
    await deletePaper(id);
    await load();
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
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Question Paper Generator</h1>
          <p className="text-muted-foreground text-sm">Create, manage and print beautifully formatted question papers.</p>
        </div>
        <Button id="create-new-paper-btn" onClick={() => handleCreateNew()}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Paper
        </Button>
      </div>

      {/* ── Quick Start ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Quick Start Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {QUICK_TEMPLATES.map(t => (
            <button
              key={t.key}
              id={`quick-start-${t.key}`}
              onClick={() => handleCreateNew(t.key)}
              className="flex flex-col items-start gap-1 rounded-lg border p-4 text-left hover:bg-muted transition-colors"
            >
              <t.icon className="h-5 w-5 text-primary mb-1" />
              <p className="font-semibold text-sm">{t.label}</p>
              <p className="text-xs text-muted-foreground">{t.desc}</p>
              <Badge variant="secondary" className="mt-1 text-xs">{t.marks}</Badge>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* ── Saved Papers ── */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
          <div>
            <CardTitle>Saved Papers</CardTitle>
            <CardDescription>
              {filtered.length} paper{filtered.length !== 1 ? "s" : ""} found
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="paper-search-input"
                placeholder="Search by subject…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-9 w-full"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[140px] h-9">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(EXAM_TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <PageSkeleton />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">No papers yet</p>
              <p className="text-muted-foreground/60 text-sm mt-1">Click "Create New Paper" to get started</p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map(p => (
                <div
                  key={p.paper_id}
                  id={`paper-row-${p.paper_id}`}
                  onClick={() => handleOpen(p.paper_id)}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 px-4 sm:px-6 py-4 hover:bg-muted/50 cursor-pointer group transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                    <Layers className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5 sm:mt-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">
                          {p.title || `Class ${p.class_name} — ${p.subject}`}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {EXAM_TYPE_LABELS[p.exam_type] || p.exam_type}
                        </Badge>
                        {p.status === "draft" && (
                          <Badge variant="secondary" className="text-xs">Draft</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span>Std {p.class_name}{p.section ? `-${p.section}` : ""}</span>
                        <span className="hidden sm:inline">·</span>
                        <span>{p.total_marks} Marks</span>
                        {p.exam_date && <><span className="hidden sm:inline">·</span><span>{formatDate(p.exam_date)}</span></>}
                        <span className="hidden sm:inline">·</span>
                        <span className="flex items-center gap-1 w-full sm:w-auto mt-1 sm:mt-0">
                          <Clock className="h-3 w-3" />{formatDate(p.updated_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 mt-2 sm:mt-0 pl-9 sm:pl-0">
                    <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <Button
                        size="icon" variant="ghost"
                        id={`reuse-paper-${p.paper_id}`}
                        disabled={dupeId === p.paper_id}
                        onClick={e => handleDuplicate(p.paper_id, e)}
                        title="Duplicate"
                        className="h-8 w-8"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon" variant="ghost"
                        id={`delete-paper-${p.paper_id}`}
                        onClick={e => handleDelete(p.paper_id, e)}
                        title="Delete"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
