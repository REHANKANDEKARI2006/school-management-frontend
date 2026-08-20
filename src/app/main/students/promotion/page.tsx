"use client";

import * as React from "react";
import axios from "@/lib/axios";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { useToast } from "@/hooks/use-toast";
import { PageSkeleton } from "@/components/ui/skeletons";
import { ROLE, ADMIN_GROUP } from "@/config/roles";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  MinusCircle,
  Loader2,
  Users,
  Filter,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";

/* ═══════════════════════════════════════
   TYPES
═══════════════════════════════════════ */
type StudentRow = {
  student_id: number;
  stu_first_name: string;
  stu_last_name: string;
  profile_url: string | null;
  status_name: string | null;
  class_id: number | null;
  class_name: string | null;
  section_name: string | null;
};

type ClassOption = {
  class_id: number;
  class_name: string;
  section_name: string | null;
  student_count: string;
};

type Decision = "promote" | "retain" | null;

type PromotionEntry = {
  student: StudentRow;
  decision: Decision;
  targetClassId: number | null;
};

const ALLOWED_ROLES = [ROLE.MASTER_ADMIN, ROLE.INSTITUTE_ADMIN, ROLE.CLASS_TEACHER];

/* ═══════════════════════════════════════
   COMPONENT
═══════════════════════════════════════ */
export default function PromotionPage() {
  useRoleGuard(ALLOWED_ROLES as number[]);

  const { toast } = useToast();
  const roleId = typeof window !== "undefined" ? Number(localStorage.getItem("role_id")) : null;
  const isAdmin = roleId === ROLE.MASTER_ADMIN || roleId === ROLE.INSTITUTE_ADMIN;

  const [loading, setLoading] = React.useState(true);
  const [students, setStudents] = React.useState<StudentRow[]>([]);
  const [classes, setClasses] = React.useState<ClassOption[]>([]);
  const [entries, setEntries] = React.useState<Map<number, PromotionEntry>>(new Map());
  const [filterClass, setFilterClass] = React.useState<string>("all");
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  /* ─── Fetch Data ─── */
  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [studentsRes, classesRes] = await Promise.all([
        axios.get("/api/promotion/students"),
        axios.get("/api/promotion/classes"),
      ]);

      const stuData: StudentRow[] = studentsRes.data.data;
      const clsData: ClassOption[] = classesRes.data.data;

      setStudents(stuData);
      setClasses(clsData);

      // Build initial entries map
      const map = new Map<number, PromotionEntry>();
      stuData.forEach((s) => {
        map.set(s.student_id, {
          student: s,
          decision: null,
          targetClassId: suggestNextClass(s, clsData),
        });
      });
      setEntries(map);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to load promotion data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ─── Next Class Suggestion Logic ─── */
  function suggestNextClass(student: StudentRow, allClasses: ClassOption[]): number | null {
    if (!student.class_name) return null;

    // Extract numeric part from class name
    const currentNum = parseInt(student.class_name);
    if (isNaN(currentNum)) return null;

    const nextNum = currentNum + 1;

    // Find a class with next number and same section if possible
    let match = allClasses.find(
      (c) => parseInt(c.class_name) === nextNum && c.section_name === student.section_name
    );
    if (match) return match.class_id;

    // Fallback: any class with next number
    match = allClasses.find((c) => parseInt(c.class_name) === nextNum);
    return match?.class_id || null;
  }

  /* ─── Handlers ─── */
  const setDecision = (studentId: number, decision: Decision) => {
    setEntries((prev) => {
      const next = new Map(prev);
      const entry = next.get(studentId);
      if (entry) next.set(studentId, { ...entry, decision });
      return next;
    });
  };

  const setTargetClass = (studentId: number, classId: number) => {
    setEntries((prev) => {
      const next = new Map(prev);
      const entry = next.get(studentId);
      if (entry) next.set(studentId, { ...entry, targetClassId: classId });
      return next;
    });
  };

  const setAllDecision = (decision: Decision) => {
    setEntries((prev) => {
      const next = new Map(prev);
      const filteredIds = filtered.map((s) => s.student_id);
      filteredIds.forEach((id) => {
        const entry = next.get(id);
        if (entry) next.set(id, { ...entry, decision });
      });
      return next;
    });
  };

  const resetAll = () => {
    setEntries((prev) => {
      const next = new Map(prev);
      next.forEach((entry, id) => {
        next.set(id, { ...entry, decision: null });
      });
      return next;
    });
    setSubmitted(false);
  };

  /* ─── Submit ─── */
  const handleSubmit = async () => {
    const promotions: { studentId: number; targetClassId: number }[] = [];

    entries.forEach((entry) => {
      if (entry.decision === "promote" && entry.targetClassId) {
        promotions.push({
          studentId: entry.student.student_id,
          targetClassId: entry.targetClassId,
        });
      }
    });

    if (promotions.length === 0) {
      toast({ title: "No Promotions", description: "No students marked for promotion.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post("/api/promotion/promote", { promotions });
      toast({
        title: "Promotions Applied",
        description: res.data.message,
      });
      setSubmitted(true);
      // Refresh data
      await fetchData();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to apply promotions",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Filtering ─── */
  const filtered = React.useMemo(() => {
    if (filterClass === "all") return students;
    return students.filter((s) => String(s.class_id) === filterClass);
  }, [students, filterClass]);

  const uniqueClasses = React.useMemo(() => {
    const seen = new Map<string, { classId: number; className: string; section: string | null }>();
    students.forEach((s) => {
      if (s.class_id && s.class_name) {
        const key = String(s.class_id);
        if (!seen.has(key)) {
          seen.set(key, { classId: s.class_id, className: s.class_name, section: s.section_name });
        }
      }
    });
    return Array.from(seen.values()).sort((a, b) => {
      const na = parseInt(a.className), nb = parseInt(b.className);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.className.localeCompare(b.className);
    });
  }, [students]);

  /* ─── Stats ─── */
  const stats = React.useMemo(() => {
    let promote = 0, retain = 0, pending = 0;
    entries.forEach((e) => {
      if (e.decision === "promote") promote++;
      else if (e.decision === "retain") retain++;
      else pending++;
    });
    return { promote, retain, pending, total: entries.size };
  }, [entries]);

  /* ─── Format class label ─── */
  const classLabel = (c: ClassOption | undefined) => {
    if (!c) return "—";
    return c.section_name ? `${c.class_name} - ${c.section_name}` : c.class_name;
  };

  const studentClassLabel = (s: StudentRow) => {
    if (!s.class_name) return "Not Assigned";
    return s.section_name ? `${s.class_name} - ${s.section_name}` : s.class_name;
  };

  /* ─── Pagination & Grouping ─── */
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 10;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterClass]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedStudents = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  const groupedPaginatedStudents = React.useMemo(() => {
    const groups: { classLabel: string; students: StudentRow[] }[] = [];
    paginatedStudents.forEach((s) => {
      const label = studentClassLabel(s);
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.classLabel === label) {
        lastGroup.students.push(s);
      } else {
        groups.push({ classLabel: label, students: [s] });
      }
    });
    return groups;
  }, [paginatedStudents]);

  /* ═══════════════════════════════════════
     RENDER
  ═══════════════════════════════════════ */
  if (loading) return <PageSkeleton rows={8} />;

  return (
    <div className="space-y-4 sm:space-y-6 pb-4 sm:pb-10">
      {/* Header */}
      <Card className="border-slate-200/80 shadow-xs rounded-2xl overflow-hidden bg-white">
        <CardHeader className="p-4 sm:p-6 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 hidden md:flex">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">Student Promotion</CardTitle>
                <CardDescription className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
                  {isAdmin ? "Promote students across all classes" : "Promote students in your assigned class"}
                </CardDescription>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto">
              {/* Class Filter */}
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger className="w-full sm:w-[160px] h-10 text-xs font-bold rounded-xl border-slate-200 bg-white">
                  <SelectValue placeholder="Filter Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {uniqueClasses.map((c) => (
                    <SelectItem key={c.classId} value={String(c.classId)}>
                      {c.className}{c.section ? ` - ${c.section}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={resetAll} className="w-full sm:w-auto h-10 px-3 text-xs font-bold rounded-xl border-slate-200 gap-1.5">
                <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                Reset
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Card 1: Total */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 flex items-center gap-3 shadow-2xs">
          <div className="p-2 bg-slate-100 rounded-xl shrink-0">
            <Users className="h-4 w-4 text-slate-600" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Total</p>
            <p className="text-base sm:text-lg font-black text-slate-900">{stats.total}</p>
          </div>
        </div>

        {/* Card 2: Pending */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 flex items-center gap-3 shadow-2xs">
          <div className="p-2 bg-slate-100 rounded-xl shrink-0">
            <AlertTriangle className="h-4 w-4 text-slate-400" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Pending</p>
            <p className="text-base sm:text-lg font-black text-slate-500">{stats.pending}</p>
          </div>
        </div>

        {/* Card 3: Promote */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 flex items-center gap-3 shadow-2xs">
          <div className="p-2 bg-emerald-50 rounded-xl shrink-0">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-wider">Promote</p>
            <p className="text-base sm:text-lg font-black text-emerald-700">{stats.promote}</p>
          </div>
        </div>

        {/* Card 4: Retain */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 flex items-center gap-3 shadow-2xs">
          <div className="p-2 bg-amber-50 rounded-xl shrink-0">
            <MinusCircle className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <p className="text-[10px] text-amber-600 font-extrabold uppercase tracking-wider">Retain</p>
            <p className="text-base sm:text-lg font-black text-amber-700">{stats.retain}</p>
          </div>
        </div>
      </div>

      {/* Decision Progress Card */}
      {stats.total > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Decision Progress</span>
            <span className="text-xs font-black text-slate-900">
              {stats.promote + stats.retain} / {stats.total}
            </span>
          </div>
          <Progress value={((stats.promote + stats.retain) / stats.total) * 100} className="h-2 rounded-full" />
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-0.5">Quick Actions:</span>
        <div className="grid grid-cols-2 gap-2 w-full">
          <Button variant="outline" size="sm" className="h-10 text-xs font-bold gap-1.5 rounded-xl border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100 active:scale-95 transition-all"
            onClick={() => setAllDecision("promote")}>
            <CheckCircle2 className="h-4 w-4" /> Promote All
          </Button>
          <Button variant="outline" size="sm" className="h-10 text-xs font-bold gap-1.5 rounded-xl border-amber-200 text-amber-700 bg-amber-50/50 hover:bg-amber-100 active:scale-95 transition-all"
            onClick={() => setAllDecision("retain")}>
            <MinusCircle className="h-4 w-4" /> Retain All
          </Button>
        </div>
      </div>

      {/* Mobile Paginated Student List View (Strictly sm:hidden) */}
      <div className="sm:hidden w-full flex flex-col gap-3">
        <div className="w-full bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {paginatedStudents.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400 italic">No students found</div>
          ) : (
            groupedPaginatedStudents.map((group, groupIdx) => (
              <div key={groupIdx} className="w-full">
                {/* Sticky Class Group Header */}
                <div className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs px-3.5 py-1.5 text-[10px] font-extrabold text-slate-600 border-y border-slate-200/80 uppercase tracking-wider flex items-center justify-between">
                  <span>Class: {group.classLabel}</span>
                  <span className="text-slate-400 font-bold">{group.students.length} student(s)</span>
                </div>

                {/* Group Student Rows */}
                <div className="divide-y divide-slate-100">
                  {group.students.map((s) => {
                    const entry = entries.get(s.student_id);
                    const decision = entry?.decision || null;
                    const targetId = entry?.targetClassId || null;
                    const targetClass = classes.find((c) => c.class_id === targetId);
                    const initials = (s.stu_first_name?.charAt(0) || "") + (s.stu_last_name?.charAt(0) || "");

                    return (
                      <div
                        key={s.student_id}
                        className={`p-3 flex flex-col gap-2.5 transition-colors ${
                          decision === "promote"
                            ? "bg-emerald-50/40"
                            : decision === "retain"
                            ? "bg-amber-50/40"
                            : "bg-white"
                        }`}
                      >
                        {/* Student Info Row */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <Avatar className="h-9 w-9 shrink-0">
                              <AvatarImage src={s.profile_url || ""} className="object-cover" />
                              <AvatarFallback className="bg-indigo-50 text-indigo-700 text-xs font-black">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-black text-slate-900 text-xs truncate">
                                {s.stu_first_name} {s.stu_last_name}
                              </p>
                              <p className="text-[10px] text-slate-400 font-bold">ID: {s.student_id}</p>
                            </div>
                          </div>

                          <Badge variant="secondary" className="font-bold text-[10px] px-2 py-0.5 rounded-lg shrink-0">
                            {studentClassLabel(s)}
                          </Badge>
                        </div>

                        {/* Decision Buttons & Target Class Selector */}
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100/80">
                          {/* Decision Toggle */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => setDecision(s.student_id, "promote")}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                decision === "promote"
                                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                  : "bg-white text-slate-600 border-slate-200 active:scale-95"
                              }`}
                            >
                              Promote
                            </button>
                            <button
                              onClick={() => setDecision(s.student_id, "retain")}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                decision === "retain"
                                  ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                                  : "bg-white text-slate-600 border-slate-200 active:scale-95"
                              }`}
                            >
                              Retain
                            </button>
                          </div>

                          {/* Target Class Selection */}
                          <div className="min-w-0 flex-1 flex justify-end">
                            {decision === "promote" ? (
                              <div className="flex items-center gap-1.5 w-full max-w-[140px]">
                                <ArrowRight className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                <Select
                                  value={targetId ? String(targetId) : ""}
                                  onValueChange={(v) => setTargetClass(s.student_id, Number(v))}
                                >
                                  <SelectTrigger className="h-9 text-xs font-bold rounded-xl border-slate-200 bg-white w-full">
                                    <SelectValue placeholder="Select class" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {classes.map((c) => (
                                      <SelectItem key={c.class_id} value={String(c.class_id)}>
                                        {classLabel(c)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : decision === "retain" ? (
                              <span className="text-[11px] text-amber-700 font-bold flex items-center gap-1">
                                <MinusCircle className="h-3.5 w-3.5 text-amber-500" />
                                Stays in {studentClassLabel(s)}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">No decision</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Mobile Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-9 px-3 text-xs font-bold rounded-xl border-slate-200"
            >
              Previous
            </Button>
            <span className="text-xs font-extrabold text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-9 px-3 text-xs font-bold rounded-xl border-slate-200"
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Desktop Table View (100% Untouched for Desktop) */}
      <Card className="hidden sm:block border-none shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4 sm:pl-6 min-w-[200px]">Student</TableHead>
                  <TableHead className="min-w-[120px]">Current Class</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="min-w-[140px] text-center">Decision</TableHead>
                  <TableHead className="min-w-[180px]">Target Class</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16 text-slate-400 font-medium">
                      No students found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((s) => {
                    const entry = entries.get(s.student_id);
                    const decision = entry?.decision || null;
                    const targetId = entry?.targetClassId || null;
                    const targetClass = classes.find((c) => c.class_id === targetId);
                    const initials = (s.stu_first_name?.charAt(0) || "") + (s.stu_last_name?.charAt(0) || "");

                    return (
                      <TableRow
                        key={s.student_id}
                        className={
                          decision === "promote"
                            ? "bg-emerald-50/50"
                            : decision === "retain"
                            ? "bg-amber-50/50"
                            : ""
                        }
                      >
                        {/* Student */}
                        <TableCell className="pl-4 sm:pl-6">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 shrink-0">
                              <AvatarImage src={s.profile_url || ""} className="object-cover" />
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 text-sm truncate">
                                {s.stu_first_name} {s.stu_last_name}
                              </p>
                              <p className="text-xs text-slate-400 font-medium">ID: {s.student_id}</p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Current Class */}
                        <TableCell>
                          <Badge variant="secondary" className="font-semibold text-xs">
                            {studentClassLabel(s)}
                          </Badge>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge variant={s.status_name === "Active" ? "default" : "outline"} className="text-xs">
                            {s.status_name || "Active"}
                          </Badge>
                        </TableCell>

                        {/* Decision */}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setDecision(s.student_id, "promote")}
                              className={`px-3 py-1.5 rounded-l-lg text-xs font-bold border transition-all ${
                                decision === "promote"
                                  ? "bg-emerald-600 text-white border-emerald-600"
                                  : "bg-white text-slate-500 border-slate-200 hover:border-emerald-300 hover:text-emerald-600"
                              }`}
                            >
                              Promote
                            </button>
                            <button
                              onClick={() => setDecision(s.student_id, "retain")}
                              className={`px-3 py-1.5 rounded-r-lg text-xs font-bold border transition-all ${
                                decision === "retain"
                                  ? "bg-amber-500 text-white border-amber-500"
                                  : "bg-white text-slate-500 border-slate-200 hover:border-amber-300 hover:text-amber-600"
                              }`}
                            >
                              Retain
                            </button>
                          </div>
                        </TableCell>

                        {/* Target Class */}
                        <TableCell>
                          {decision === "promote" ? (
                            <div className="flex items-center gap-2">
                              <ArrowRight className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                              <Select
                                value={targetId ? String(targetId) : ""}
                                onValueChange={(v) => setTargetClass(s.student_id, Number(v))}
                              >
                                <SelectTrigger className="h-8 text-xs w-[140px]">
                                  <SelectValue placeholder="Select class" />
                                </SelectTrigger>
                                <SelectContent>
                                  {classes.map((c) => (
                                    <SelectItem key={c.class_id} value={String(c.class_id)}>
                                      {classLabel(c)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ) : decision === "retain" ? (
                            <span className="text-xs text-amber-600 font-semibold flex items-center gap-1.5">
                              <MinusCircle className="h-3.5 w-3.5" />
                              Stays in {studentClassLabel(s)}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-300 font-medium">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      {stats.promote > 0 && !submitted && (
        <div className="sticky bottom-4 z-20">
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-3xl mx-auto">
            <div className="text-xs font-medium text-slate-600 text-center sm:text-left">
              <span className="font-extrabold text-emerald-700">{stats.promote}</span> student{stats.promote !== 1 ? "s" : ""} will be promoted
              {stats.retain > 0 && (
                <> · <span className="font-extrabold text-amber-600">{stats.retain}</span> retained</>
              )}
            </div>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full sm:w-auto gap-2 font-bold px-6 h-11 rounded-xl shadow-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
              size="lg"
            >
              <><CheckCircle2 className="h-4 w-4" /> Apply Promotions</>
            </Button>
          </div>
        </div>
      )}

      {/* Success State */}
      {submitted && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-emerald-800 mb-1">Promotions Applied Successfully</h3>
          <p className="text-sm text-emerald-600 mb-4">All selected students have been moved to their new classes.</p>
          <Button variant="outline" onClick={resetAll} className="gap-2 font-bold text-xs rounded-xl">
            <RotateCcw className="h-4 w-4" /> Start New Promotion Cycle
          </Button>
        </div>
      )}
    </div>
  );
}
