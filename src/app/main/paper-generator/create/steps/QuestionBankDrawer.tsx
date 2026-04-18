"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, X, Database, Plus, CheckSquare, Square } from "lucide-react";
import { searchQuestionBank } from "@/lib/api/question-paper";
import { QuestionItem } from "../page";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Props {
  open: boolean; onClose: () => void;
  class_name: string; subject: string;
  questionType: string; marksPerQ: number;
  onAdd: (items: QuestionItem[]) => void;
}

const DIFF_BADGE: Record<string, string> = {
  easy:   "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  hard:   "bg-red-100 text-red-700",
};

export default function QuestionBankDrawer({
  open, onClose, class_name, subject, questionType, marksPerQ, onAdd
}: Props) {
  const [results, setResults]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(false);
  const [search, setSearch]     = useState("");
  const [filterType, setFilter] = useState(questionType);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const data = await searchQuestionBank({
        class_name, subject,
        question_type: filterType || undefined,
        search:        search || undefined,
        limit:         50,
      });
      setResults(data || []);
    } catch (e) { console.error(e); setResults([]); }
    finally { setLoading(false); }
  }, [open, class_name, subject, filterType, search]);

  useEffect(() => {
    if (open) load();
    else { setSelected(new Set()); setSearch(""); }
  }, [open, load]);

  const toggleSelect = (id: number) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const handleAdd = () => {
    const items: QuestionItem[] = results
      .filter(r => selected.has(r.question_id))
      .map(r => ({
        id: `bank-${r.question_id}-${Date.now()}`,
        text: r.question_text, difficulty: r.difficulty || "",
        marks: r.marks || marksPerQ, type: r.question_type,
        options: r.options?.map((o: any) => o.text || o) || undefined,
        answer: r.answer || undefined,
      }));
    onAdd(items);
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md z-50 bg-background border-l flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b">
          <Database className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="font-semibold text-sm">Question Bank</p>
            <p className="text-xs text-muted-foreground">{subject} · Class {class_name}</p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && load()}
              placeholder="Search questions… (Enter to search)"
              className="pl-8 text-sm" />
          </div>
          <Input
            value={filterType}
            onChange={e => setFilter(e.target.value)}
            placeholder="Filter by type (e.g. MCQ, SA, LA)"
            className="text-sm" />
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
            ))
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Database className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground text-sm">No questions found</p>
              <p className="text-muted-foreground/60 text-xs mt-1">Questions can be added by admins or teachers</p>
            </div>
          ) : (
            results.map(r => {
              const isSel = selected.has(r.question_id);
              return (
                <div key={r.question_id} onClick={() => toggleSelect(r.question_id)}
                  className={`rounded-lg border p-3 cursor-pointer transition-colors ${
                    isSel ? "bg-primary/5 border-primary" : "hover:bg-muted"
                  }`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      {isSel
                        ? <CheckSquare className="h-4 w-4 text-primary" />
                        : <Square className="h-4 w-4 text-muted-foreground" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-clamp-2">{r.question_text}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge variant="outline" className="text-xs">{r.question_type}</Badge>
                        {r.difficulty && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${DIFF_BADGE[r.difficulty] || ""}`}>
                            {r.difficulty}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">{r.marks} M</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-3">
          <Button
            id="bank-add-selected-btn"
            onClick={handleAdd}
            disabled={selected.size === 0}
            className="w-full gap-2"
          >
            <Plus className="h-4 w-4" />
            Add {selected.size > 0 ? `${selected.size} Selected` : "Selected"} Question{selected.size !== 1 ? "s" : ""}
          </Button>
        </div>
      </div>
    </>
  );
}
