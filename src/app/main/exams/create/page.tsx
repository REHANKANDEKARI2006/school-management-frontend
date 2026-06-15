"use client";

import * as React from "react";
import axios from "@/lib/axios";
import { useRouter, useSearchParams } from "next/navigation";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { useToast } from "@/hooks/use-toast";
import { useFeedback } from "@/components/campus-connect/feedback-provider";
import { cn } from "@/lib/utils";

import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Send,
  Loader2,
  BookOpen,
  ClipboardList,
  GraduationCap,
  CheckCircle2,
  FileText,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import {
  ExamTimetablePreview,
  TimetableSubjectRow,
} from "@/components/campus-connect/exam-timetable-preview";
import { ADMIN_GROUP } from "@/config/roles";

/* ===================================================================
   ROLE GUARD
=================================================================== */
const ALLOWED_ROLES: number[] = [...ADMIN_GROUP];

/* ===================================================================
   HELPERS
=================================================================== */
let _rowCounter = 0;
function newRowId() {
  return `row_${Date.now()}_${++_rowCounter}`;
}

function getDayShort(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { weekday: "short" });
}

function calcDuration(start: string, end: string): string {
  if (!start || !end) return "";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const t = eh * 60 + em - (sh * 60 + sm);
  if (t <= 0) return "";
  const h = Math.floor(t / 60), m = t % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function addMinutesToTime(startTime: string, minutes: number): string {
  if (!startTime) return "";
  const [h, m] = startTime.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const eh = Math.floor(total / 60) % 24;
  const em = total % 60;
  return `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
}

function currentAcademicYear(): string {
  const n = new Date(), y = n.getFullYear();
  return n.getMonth() >= 5 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

/* ===================================================================
   SUBJECT ROW  — Single-line table layout
=================================================================== */
interface RowProps {
  row: TimetableSubjectRow;
  subjects: { subject_id: number; subject_name: string }[];
  onChange: (id: string, field: keyof TimetableSubjectRow, value: string) => void;
  onDelete: (id: string) => void;
  isOnly: boolean;
  idx: number;
}

function SubjectRow({ row, subjects, onChange, onDelete, isOnly, idx }: RowProps) {
  const dur = calcDuration(row.start_time, row.end_time);
  const day = getDayShort(row.date);
  const filled = !!(row.subject_id && row.date && row.start_time && row.end_time);

  return (
    <div
      className={cn(
        "grid grid-cols-[30px_220px_135px_50px_110px_110px_65px_32px] gap-2 items-center px-3 py-2 rounded-lg border transition-all duration-150",
        filled
          ? "border-primary/20 bg-primary/[0.01] shadow-sm"
          : "border-border bg-background hover:border-primary/15"
      )}
    >
      {/* 1. Index Badge */}
      <span
        className={cn(
          "h-5 w-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0",
          filled ? "bg-primary text-white" : "bg-muted text-muted-foreground"
        )}
      >
        {idx + 1}
      </span>

      {/* 2. Subject Dropdown */}
      <div className="min-w-0">
        <Select
          value={row.subject_id || ""}
          onValueChange={(val) => {
            const s = subjects.find((x) => String(x.subject_id) === val);
            onChange(row.id, "subject_id", val);
            onChange(row.id, "subject_name", s?.subject_name || "");
          }}
        >
          <SelectTrigger className="h-8 text-xs w-full bg-background border-input hover:border-primary/30">
            <SelectValue placeholder="Select subject…" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((s) => (
              <SelectItem key={s.subject_id} value={String(s.subject_id)}>
                {s.subject_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 3. Date Input */}
      <Input
        type="date"
        value={row.date}
        onChange={(e) => onChange(row.id, "date", e.target.value)}
        className="h-8 text-xs px-2 bg-background border-input hover:border-primary/30 cursor-pointer"
      />

      {/* 4. Day Badge */}
      <div className="flex justify-center">
        <span
          className={cn(
            "text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 text-center w-full block truncate",
            day
              ? "text-primary bg-primary/10 border border-primary/15"
              : "text-muted-foreground/30 bg-muted/30"
          )}
        >
          {day || "—"}
        </span>
      </div>

      {/* 5. Start Time */}
      <Input
        type="time"
        value={row.start_time}
        onChange={(e) => onChange(row.id, "start_time", e.target.value)}
        className="h-8 text-xs px-2 bg-background border-input hover:border-primary/30 cursor-pointer"
      />

      {/* 6. End Time */}
      <Input
        type="time"
        value={row.end_time}
        onChange={(e) => onChange(row.id, "end_time", e.target.value)}
        className="h-8 text-xs px-2 bg-background border-input hover:border-primary/30 cursor-pointer"
      />

      {/* 7. Duration Badge */}
      <div className="flex justify-center">
        {dur ? (
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded text-center w-full block truncate">
            {dur}
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground/20 text-center w-full block">—</span>
        )}
      </div>

      {/* 8. Delete Button */}
      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
          onClick={() => onDelete(row.id)}
          disabled={isOnly}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

/* ===================================================================
   SUBJECT COLUMN HEADERS
=================================================================== */
function SubjectColumnHeaders() {
  return (
    <div className="grid grid-cols-[30px_220px_135px_50px_110px_110px_65px_32px] gap-2 items-center px-3 mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 border border-transparent">
      <div>#</div>
      <div>Subject Name</div>
      <div>Exam Date</div>
      <div className="text-center">Day</div>
      <div>Start Time</div>
      <div>End Time</div>
      <div className="text-center">Duration</div>
      <div></div>
    </div>
  );
}


/* ===================================================================
   MAIN PAGE
=================================================================== */

export default function CreateExamPage() {
  useRoleGuard(ALLOWED_ROLES);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { showSuccess } = useFeedback();

  const isEdit = searchParams.get("edit") === "true";
  const editExamName = searchParams.get("exam_name");
  const editClassName = searchParams.get("class_name");
  const editExamTypeId = searchParams.get("exam_type_id");

  const [classes, setClasses] = React.useState<{ class_id: number; label: string; class_name?: string }[]>([]);
  const [uniqueStandards, setUniqueStandards] = React.useState<{ id: number; name: string }[]>([]);
  const [originalExams, setOriginalExams] = React.useState<any[]>([]);
  const [subjects, setSubjects] = React.useState<{ subject_id: number; subject_name: string }[]>([]);
  const [examTypes, setExamTypes] = React.useState<{ exam_type_id: number; exam_type_name: string }[]>([]);
  const [dropdownLoading, setDropdownLoading] = React.useState(true);

  const [examName, setExamName] = React.useState("");
  const [selectedClassId, setSelectedClassId] = React.useState("");
  const [selectedClassName, setSelectedClassName] = React.useState("");
  const [selectedExamTypeId, setSelectedExamTypeId] = React.useState("");
  const [selectedExamTypeName, setSelectedExamTypeName] = React.useState("");
  const [academicYear, setAcademicYear] = React.useState(currentAcademicYear());
  const [instructions, setInstructions] = React.useState("");

  const [rows, setRows] = React.useState<TimetableSubjectRow[]>([
    { id: newRowId(), subject_name: "", subject_id: "", date: todayStr(), start_time: "10:00", end_time: "13:00" },
  ]);

  const [savingDraft, setSavingDraft] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);
  const [savedCount, setSavedCount] = React.useState(0);
  const [totalToSave, setTotalToSave] = React.useState(0);

  React.useEffect(() => {
    const load = async () => {
      try {
        const [cR, sR, tR] = await Promise.all([
          axios.get("/api/classes/class-enrollments/list"),
          axios.get("/api/subjects"),
          axios.get("/api/exams/types"),
        ]);
        const clsData: any[] = cR.data.data || [];
        setClasses(clsData);
        const seen = new Map<string, { id: number; name: string }>();
        clsData.forEach((c) => {
          const n = c.class_name || (c.label ?? "").split(" - ")[0];
          if (n && !seen.has(n)) seen.set(n, { id: c.class_id, name: n });
        });
        const standards = Array.from(seen.values()).sort((a, b) => {
          const na = parseInt(a.name), nb = parseInt(b.name);
          return !isNaN(na) && !isNaN(nb) ? na - nb : a.name.localeCompare(b.name);
        });
        setUniqueStandards(standards);
        setSubjects(sR.data.data || []);
        setExamTypes(tR.data.data || []);

        if (isEdit && editExamName && editClassName && editExamTypeId) {
          const eR = await axios.get("/api/exams");
          const allExams: any[] = eR.data.data || [];
          const matched = allExams.filter(
            (e) =>
              e.exam_name === editExamName &&
              String(e.class_name) === editClassName &&
              String(e.exam_type_id) === editExamTypeId
          );
          if (matched.length > 0) {
            setOriginalExams(matched);
            setExamName(editExamName);

            // Find class ID from standard name
            const matchedStd = standards.find((s) => String(s.name) === editClassName);
            if (matchedStd) {
              setSelectedClassId(String(matchedStd.id));
              setSelectedClassName(matchedStd.name);
            } else {
              setSelectedClassId(editClassName);
              setSelectedClassName(editClassName);
            }

            setSelectedExamTypeId(editExamTypeId);
            const matchedType = (tR.data.data || []).find((t: any) => String(t.exam_type_id) === editExamTypeId);
            setSelectedExamTypeName(matchedType?.exam_type_name || "");

            // Group by subject_id to show a single timetable row
            const seenSubjects = new Set<string>();
            const initialRows: TimetableSubjectRow[] = [];
            matched.forEach((e) => {
              const subId = String(e.subject_id);
              if (!seenSubjects.has(subId)) {
                seenSubjects.add(subId);
                const date = e.date_time.split("T")[0];
                const start_time = e.date_time.split("T")[1].substring(0, 5);
                const end_time = addMinutesToTime(start_time, e.duration_mins);
                initialRows.push({
                  id: newRowId(),
                  subject_id: subId,
                  subject_name: e.subject_name,
                  date,
                  start_time,
                  end_time
                });
              }
            });
            if (initialRows.length > 0) {
              setRows(initialRows);
            }
          }
        }
      } catch {
        toast({ title: "Error", description: "Failed to load form data", variant: "destructive" });
      } finally {
        setDropdownLoading(false);
      }
    };
    load();
  }, [isEdit, editExamName, editClassName, editExamTypeId]);

  const handleRowChange = (id: string, field: keyof TimetableSubjectRow, value: string) =>
    setRows((p) => p.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const handleAddRow = () => {
    const last = rows[rows.length - 1];
    setRows((p) => [...p, {
      id: newRowId(), subject_name: "", subject_id: "",
      date: last?.date || todayStr(),
      start_time: last?.start_time || "10:00",
      end_time: last?.end_time || "13:00",
    }]);
  };

  const handleDeleteRow = (id: string) => setRows((p) => p.filter((r) => r.id !== id));

  const validate = (): string | null => {
    if (!examName.trim()) return "Please enter an exam name.";
    if (!selectedClassId) return "Please select a class.";
    if (!selectedExamTypeId) return "Please select an exam type.";
    if (!academicYear.trim()) return "Please enter an academic year.";
    const v = rows.filter((r) => r.subject_id);
    if (v.length === 0) return "Please add at least one subject.";
    for (const r of v) {
      if (!r.date) return `Set a date for ${r.subject_name}.`;
      if (!r.start_time || !r.end_time) return `Set times for ${r.subject_name}.`;
    }
    return null;
  };

  const handleSave = async (isDraft: boolean) => {
    const err = validate();
    if (err) { toast({ title: "Incomplete", description: err, variant: "destructive" }); return; }

    const validRows = rows.filter((r) => r.subject_id && r.date && r.start_time && r.end_time);
    const standardName = uniqueStandards.find((s) => String(s.id) === selectedClassId)?.name || selectedClassId;
    const exam_status_id = isDraft ? 1 : 2;

    setSavedCount(0); setTotalToSave(validRows.length);
    if (isDraft) setSavingDraft(true); else setPublishing(true);

    // 1. Delete subjects that are no longer in the rows (deleted from timetable builder)
    const currentSubjectIds = new Set(validRows.map((r) => String(r.subject_id)));
    const examsToDelete = originalExams.filter((e) => !currentSubjectIds.has(String(e.subject_id)));
    for (const e of examsToDelete) {
      try {
        await axios.delete(`/api/exams/${e.exam_id}`);
      } catch (err) {
        console.error("Failed to delete exam", e.exam_id, err);
      }
    }

    const originalSubjectIds = new Set(originalExams.map((e) => String(e.subject_id)));
    const errors: string[] = [];

    for (const row of validRows) {
      try {
        const [sh, sm] = row.start_time.split(":").map(Number);
        const [eh, em] = row.end_time.split(":").map(Number);
        const duration_mins = Math.max(eh * 60 + em - (sh * 60 + sm), 1);
        const isExisting = originalSubjectIds.has(String(row.subject_id));

        if (isExisting) {
          // Update matching existing records (for all sections)
          const matches = originalExams.filter((e) => String(e.subject_id) === String(row.subject_id));
          for (const e of matches) {
            await axios.put(`/api/exams/${e.exam_id}`, {
              exam_name: examName.trim(),
              class_id: e.class_id, // keep the specific section's class_id
              subject_id: parseInt(row.subject_id),
              exam_type_id: parseInt(selectedExamTypeId),
              date_time: `${row.date}T${row.start_time}:00`,
              duration_mins,
              total_score: e.total_score || 100,
              min_marks: e.min_marks,
              max_marks: e.max_marks,
              exam_status_id,
            });
          }
        } else {
          // Create fresh for all sections of that standard
          await axios.post("/api/exams", {
            exam_name: examName.trim(),
            class_id: standardName, // standard name (e.g. "2") maps to all sections
            subject_id: parseInt(row.subject_id),
            exam_type_id: parseInt(selectedExamTypeId),
            date_time: `${row.date}T${row.start_time}:00`,
            duration_mins,
            total_score: 100,
            min_marks: null,
            max_marks: null,
            exam_status_id,
          });
        }
        setSavedCount((c) => c + 1);
      } catch (e: any) {
        errors.push(`${row.subject_name}: ${e?.response?.data?.message || "Failed"}`);
      }
    }

    setSavingDraft(false); setPublishing(false); setSavedCount(0); setTotalToSave(0);

    if (errors.length > 0) {
      toast({ title: "Partial Save", description: `${validRows.length - errors.length} saved, ${errors.length} failed.`, variant: "destructive" });
    } else {
      showSuccess(
        isDraft ? "Draft Saved" : "Timetable Published",
        isDraft ? `${examName} saved with ${validRows.length} subject(s).`
                : `${examName} published with ${validRows.length} subject(s).`
      );
      router.push("/main/exams");
    }
  };

  const isBusy = savingDraft || publishing;
  const filledCount = rows.filter((r) => r.subject_id).length;

  /* ── RENDER ── */
  return (
    <div className="flex flex-col gap-4 pb-12">

      {/* ── Page header ── */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => router.push("/main/exams")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors group w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Exams
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-foreground">Create Exam Timetable</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Fill exam details, add subjects with dates, then publish.
            </p>
          </div>
          {/* Step indicators */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full bg-primary text-primary-foreground shadow-sm">
              <ClipboardList className="h-3 w-3" />
              1 · Details
            </span>
            <span className="w-5 h-px bg-border" />
            <span className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full bg-background border border-primary/30 text-primary">
              <BookOpen className="h-3 w-3" />
              2 · Subjects
            </span>
          </div>
        </div>
      </div>

      {/* ── Step 1: Exam Details (Full Width at Top) ── */}
      <Card className="shadow-sm border-border bg-card">
        <CardHeader className="pt-4 pb-3 px-5">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">Exam Details</CardTitle>
              <CardDescription className="text-[11px] mt-0">Basic info about this exam</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-5 pb-5">
          {dropdownLoading ? (
            <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading…</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Exam Name */}
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="exam-name" className="text-xs font-semibold text-foreground/80">
                    Exam Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="exam-name"
                    placeholder="e.g. Unit Test 1, Mid-Term Examination"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    className="h-9 text-sm bg-background border-input hover:border-primary/20 focus-visible:ring-primary/25"
                  />
                </div>

                {/* Class */}
                <div className="space-y-1.5">
                  <Label htmlFor="class-sel" className="text-xs font-semibold text-foreground/80">
                    Class <span className="text-destructive">*</span>
                  </Label>
                  <Select value={selectedClassId} onValueChange={(v) => {
                    setSelectedClassId(v);
                    setSelectedClassName(uniqueStandards.find((s) => String(s.id) === v)?.name || v);
                  }}>
                    <SelectTrigger id="class-sel" className="h-9 text-sm bg-background border-input hover:border-primary/20">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueStandards.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>Class {s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Exam Type */}
                <div className="space-y-1.5">
                  <Label htmlFor="exam-type" className="text-xs font-semibold text-foreground/80">
                    Exam Type <span className="text-destructive">*</span>
                  </Label>
                  <Select value={selectedExamTypeId} onValueChange={(v) => {
                    setSelectedExamTypeId(v);
                    setSelectedExamTypeName(examTypes.find((t) => String(t.exam_type_id) === v)?.exam_type_name || "");
                  }}>
                    <SelectTrigger id="exam-type" className="h-9 text-sm bg-background border-input hover:border-primary/20">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {examTypes.map((t) => (
                        <SelectItem key={t.exam_type_id} value={String(t.exam_type_id)}>
                          {t.exam_type_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Academic Year */}
                <div className="space-y-1.5 md:col-span-1">
                  <Label htmlFor="acad-year" className="text-xs font-semibold text-foreground/80">Academic Year</Label>
                  <Input
                    id="acad-year"
                    placeholder="2025-26"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="h-9 text-sm bg-background border-input hover:border-primary/20 focus-visible:ring-primary/25"
                  />
                </div>

                {/* Instructions */}
                <div className="space-y-1.5 md:col-span-3">
                  <Label htmlFor="instructions" className="text-xs font-semibold text-foreground/80">
                    Instructions <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="instructions"
                    placeholder="e.g. All questions are compulsory"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="h-9 text-sm bg-background border-input hover:border-primary/20 focus-visible:ring-primary/25"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 12-Column Grid for Bottom Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* ════ LEFT panel: Subject Schedule (7/12) ════ */}
        <div className="lg:col-span-7 flex flex-col gap-4">

          {/* ── Step 2: Subject Schedule ── */}
          <Card className="shadow-sm border-border bg-card">
            <CardHeader className="pt-4 pb-3 px-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">Subject Schedule</CardTitle>
                    <CardDescription className="text-[11px] mt-0">
                      Dates &amp; duration fill automatically
                    </CardDescription>
                  </div>
                </div>
                <Badge
                  variant={filledCount > 0 ? "default" : "secondary"}
                  className="text-[10px] font-mono shrink-0 mt-0.5"
                >
                  {filledCount}/{rows.length} filled
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="px-5 pb-5 space-y-2">
              {/* Horizontal Scroll wrapper for responsive viewports */}
              <div className="overflow-x-auto pb-2 -mx-2 px-2">
                <div className="min-w-[820px] space-y-2">
                  {/* Column labels */}
                  <SubjectColumnHeaders />

                  {/* Subject rows — single line layout */}
                  <div className="space-y-2">
                    {rows.map((row, idx) => (
                      <SubjectRow
                        key={row.id}
                        row={row}
                        subjects={subjects}
                        onChange={handleRowChange}
                        onDelete={handleDeleteRow}
                        isOnly={rows.length === 1}
                        idx={idx}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Add Subject */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRow}
                disabled={isBusy}
                className="w-full gap-2 mt-2 border-dashed border-primary/40 text-primary text-xs font-semibold hover:bg-primary/5 hover:border-primary/60"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Subject
              </Button>
            </CardContent>
          </Card>

          {/* ── Action bar ── */}
          <Card className="shadow-sm border-border bg-card">
            <CardContent className="px-5 py-4">
              {/* Saving progress */}
              {isBusy && totalToSave > 0 && (
                <div className="mb-3 px-3 py-2.5 rounded-lg bg-primary/5 border border-primary/15 flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold">Saving {savedCount} of {totalToSave} subjects…</p>
                    <div className="mt-1 h-1 rounded-full bg-primary/10 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${totalToSave > 0 ? (savedCount / totalToSave) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  {filledCount} subject{filledCount !== 1 ? "s" : ""} ready
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSave(true)}
                    disabled={isBusy}
                    className="gap-1.5 text-xs"
                  >
                    {savingDraft ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save Draft
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleSave(false)}
                    disabled={isBusy}
                    className="gap-1.5 text-xs font-semibold"
                  >
                    {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    Publish Timetable
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ════ RIGHT panel: Live Preview (5/12) ════ */}
        <div className="lg:col-span-5 flex flex-col gap-3 sticky top-20">
          {/* Section label */}
          <div className="flex items-center gap-2">
            <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Live Preview
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <ExamTimetablePreview
            examName={examName}
            className={selectedClassName}
            examType={selectedExamTypeName}
            academicYear={academicYear}
            instructions={instructions}
            rows={rows}
          />

          {/* Tip */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/30 border border-border/60">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary/50 mt-0.5 shrink-0" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Preview updates live. Use{" "}
              <strong className="text-foreground">Download / Print PDF</strong>{" "}
              to export a school-formatted A4 timetable.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

