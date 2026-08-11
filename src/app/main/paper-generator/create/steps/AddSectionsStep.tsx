"use client";

import React, { useState } from "react";
import { PaperState } from "../page";
import { GripVertical, Plus, Trash2, Edit2, Layers, ArrowUp, ArrowDown, Check, AlertCircle } from "lucide-react";

interface Props {
  paper: PaperState;
  onChange: (updates: Partial<PaperState>) => void;
}

export interface ParsedSection {
  title: string;
  group: string;
  name: string;
}

export function parseSectionName(raw: string): ParsedSection {
  if (!raw) return { title: "", group: "", name: "" };
  const parts = raw.split("///");
  if (parts.length >= 3) {
    return { title: parts[0] || "", group: parts[1] || "", name: parts[2] || "" };
  }
  if (parts.length === 2) {
    return { title: parts[0] || "", group: parts[1] || "", name: "" };
  }
  return { title: raw, group: "", name: "" };
}

export function serializeSectionName(parsed: ParsedSection): string {
  return `${parsed.title || ""}///${parsed.group || ""}///${parsed.name || ""}`;
}

const BADGE_COLORS = [
  { bg: "bg-emerald-500/10", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  { bg: "bg-indigo-500/10", text: "text-indigo-700", border: "border-indigo-200", dot: "bg-indigo-500" },
  { bg: "bg-purple-500/10", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500" },
  { bg: "bg-amber-500/10", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  { bg: "bg-rose-500/10", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500" },
  { bg: "bg-cyan-500/10", text: "text-cyan-700", border: "border-cyan-200", dot: "bg-cyan-500" },
  { bg: "bg-sky-500/10", text: "text-sky-700", border: "border-sky-200", dot: "bg-sky-500" },
];

function getBadgeStyle(index: number) {
  return BADGE_COLORS[index % BADGE_COLORS.length];
}

function getSectionTag(index: number): string {
  const letter = String.fromCharCode(65 + index);
  return `Section ${letter}`;
}

export default function AddSectionsStep({ paper, onChange }: Props) {
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  // Initialize default sections if empty
  const sections = paper.sections.length > 0
    ? paper.sections
    : [
        { section_id: null, section_name: "SECTION A///Section - A///", section_order: 1, total_section_marks: 0, questions: [] },
        { section_id: null, section_name: "SECTION B///Section - B///", section_order: 2, total_section_marks: 0, questions: [] },
        { section_id: null, section_name: "SECTION C///Section - C///", section_order: 3, total_section_marks: 0, questions: [] }
      ];

  const handleUpdateSectionName = (index: number, newName: string) => {
    const nextSections = [...sections];
    const letter = String.fromCharCode(65 + index);
    const parsed = parseSectionName(nextSections[index].section_name);
    
    // Update name while preserving title and group structure
    const updatedParsed: ParsedSection = {
      title: parsed.title || `SECTION ${letter}`,
      group: parsed.group || `Section - ${letter}`,
      name: newName
    };
    
    nextSections[index] = {
      ...nextSections[index],
      section_name: serializeSectionName(updatedParsed)
    };

    onChange({ sections: nextSections });
  };

  const handleAddSection = () => {
    const nextIdx = sections.length;
    const letter = String.fromCharCode(65 + nextIdx);
    const newSec = {
      section_id: null,
      section_name: serializeSectionName({
        title: `SECTION ${letter}`,
        group: `Section - ${letter}`,
        name: ""
      }),
      section_order: nextIdx + 1,
      total_section_marks: 0,
      questions: []
    };
    onChange({ sections: [...sections, newSec] });
  };

  const handleUpdateSectionMarks = (index: number, marks: number) => {
    const nextSections = [...sections];
    nextSections[index] = {
      ...nextSections[index],
      total_section_marks: marks
    };
    onChange({ sections: nextSections });
  };

  const handleDeleteSection = (index: number) => {
    const filtered = sections.filter((_, i) => i !== index);
    // Re-index remaining sections order
    const reindexed = filtered.map((sec, i) => {
      const letter = String.fromCharCode(65 + i);
      const parsed = parseSectionName(sec.section_name);
      return {
        ...sec,
        section_order: i + 1,
        section_name: serializeSectionName({
          title: `SECTION ${letter}`,
          group: `Section - ${letter}`,
          name: parsed.name
        })
      };
    });
    onChange({ sections: reindexed });
  };

  const handleMoveSection = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= sections.length) return;
    const reordered = [...sections];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);

    // Update section tags & orders after reordering
    const updated = reordered.map((sec, i) => {
      const letter = String.fromCharCode(65 + i);
      const parsed = parseSectionName(sec.section_name);
      return {
        ...sec,
        section_order: i + 1,
        section_name: serializeSectionName({
          title: `SECTION ${letter}`,
          group: `Section - ${letter}`,
          name: parsed.name
        })
      };
    });
    onChange({ sections: updated });
  };

  // HTML5 Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    handleMoveSection(draggedIdx, index);
    setDraggedIdx(index);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  // Calculate total section marks vs paper total marks
  const totalSectionMarks = sections.reduce((sum, sec) => sum + (sec.total_section_marks || 0), 0);
  const paperTotalMarks = paper.total_marks || 0;
  const marksMatch = totalSectionMarks === paperTotalMarks;
  const hasMissingMarks = sections.some(sec => !sec.total_section_marks || sec.total_section_marks <= 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Add Sections</h1>
        <p className="text-sm text-slate-500 mt-1">Define the main sections of your paper, allocate marks for each section, and drag to reorder.</p>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-[#3335e3]" />
            <h2 className="text-base font-black text-slate-800">Paper Structure</h2>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {sections.length} Section{sections.length !== 1 ? "s" : ""} Defined
          </span>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">Reorder</th>
                <th className="py-3.5 px-4 w-36">Section Tag</th>
                <th className="py-3.5 px-6">Section Name / Title</th>
                <th className="py-3.5 px-4 w-32 text-center">Marks</th>
                <th className="py-3.5 px-4 w-28 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sections.map((sec, idx) => {
                const parsed = parseSectionName(sec.section_name);
                const badge = getBadgeStyle(idx);
                const tagLabel = getSectionTag(idx);
                const isDragging = draggedIdx === idx;

                return (
                  <tr
                    key={sec.section_id || idx}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`group transition-colors hover:bg-slate-50/80 ${
                      isDragging ? "opacity-40 bg-indigo-50/50" : ""
                    }`}
                  >
                    {/* Drag Handle Column */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors">
                          <GripVertical className="h-4 w-4" />
                        </span>
                        <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveSection(idx, idx - 1)}
                            className="text-slate-400 hover:text-slate-700 disabled:opacity-20 p-0.5"
                            title="Move Up"
                          >
                            <ArrowUp size={10} />
                          </button>
                          <button
                            type="button"
                            disabled={idx === sections.length - 1}
                            onClick={() => handleMoveSection(idx, idx + 1)}
                            className="text-slate-400 hover:text-slate-700 disabled:opacity-20 p-0.5"
                            title="Move Down"
                          >
                            <ArrowDown size={10} />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Section Badge / Tag */}
                    <td className="py-4 px-4 align-middle">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider ${badge.bg} ${badge.text} ${badge.border}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                        {tagLabel}
                      </div>
                    </td>

                    {/* Section Title Input */}
                    <td className="py-4 px-6 align-middle">
                      <input
                        type="text"
                        value={parsed.name}
                        onChange={(e) => handleUpdateSectionName(idx, e.target.value)}
                        placeholder={`e.g. ${
                          idx === 0 ? "Reading Comprehension" :
                          idx === 1 ? "Grammar & Vocabulary" :
                          idx === 2 ? "Literature & Writing" :
                          "Section Title"
                        }`}
                        className="w-full h-10 px-3.5 text-sm font-semibold border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#3335e3]/20 focus:border-[#3335e3] transition-all"
                      />
                    </td>

                    {/* Section Marks Input */}
                    <td className="py-4 px-4 align-middle text-center">
                      <input
                        type="number"
                        min={0}
                        max={999}
                        value={sec.total_section_marks || ""}
                        onKeyDown={(e) => {
                          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                            e.preventDefault();
                          }
                        }}
                        onWheel={(e) => e.currentTarget.blur()}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "") {
                            handleUpdateSectionMarks(idx, 0);
                          } else {
                            const parsed = parseInt(val, 10);
                            if (!isNaN(parsed)) {
                              handleUpdateSectionMarks(idx, parsed);
                            }
                          }
                        }}
                        placeholder="0"
                        className={`w-20 h-10 px-2 text-sm font-black text-center border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#3335e3]/20 focus:border-[#3335e3] transition-all mx-auto [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                          !sec.total_section_marks || sec.total_section_marks <= 0
                            ? "border-amber-300 bg-amber-50/50"
                            : "border-slate-200"
                        }`}
                      />
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right align-middle">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleDeleteSection(idx)}
                          disabled={sections.length <= 1}
                          className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                          title="Delete Section"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Marks Summary Footer */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-200/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Total Section Marks:</span>
              <span className={`text-sm font-black px-3 py-1 rounded-full ${
                marksMatch
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}>
                {totalSectionMarks} / {paperTotalMarks} Marks
              </span>
            </div>
            {!marksMatch && totalSectionMarks > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600">
                <AlertCircle className="h-3.5 w-3.5" />
                {totalSectionMarks > paperTotalMarks
                  ? `Section marks exceed paper total by ${totalSectionMarks - paperTotalMarks}`
                  : `${paperTotalMarks - totalSectionMarks} marks remaining to allocate`
                }
              </div>
            )}
          </div>
        </div>

        {/* Add Section Button */}
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleAddSection}
            className="flex items-center gap-2 h-10 px-5 bg-white border border-slate-300 hover:border-[#3335e3] hover:text-[#3335e3] rounded-xl text-xs font-bold text-slate-700 shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" /> Add New Section
          </button>
          <p className="text-xs text-slate-400 font-medium">
            Drag rows to reorder. Allocate marks for each section.
          </p>
        </div>
      </div>
    </div>
  );
}
