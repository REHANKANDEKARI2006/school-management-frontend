"use client";

import * as React from "react";
import axios from "@/lib/axios";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { useSearch } from "@/components/campus-connect/search-provider";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

import {
  MoreHorizontal,
  PlusCircle,
  FilePenLine,
  CalendarClock,
  BookOpen,
  Users,
} from "lucide-react";
import { PageSkeleton } from "@/components/ui/skeletons";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { ExamForm } from "@/components/campus-connect/exam-form";
import { GradeEntryForm } from "@/components/campus-connect/grade-entry-form";
import { ViewResultsDialog } from "@/components/campus-connect/view-results-dialog";
import { ROLE, RoleId, ADMIN_GROUP } from "@/config/roles";

/* ===================================================================
   HELPERS
=================================================================== */
const ALLOWED_ROLES: number[] = [...ADMIN_GROUP, ROLE.TEACHER, ROLE.CLASS_TEACHER, ROLE.STUDENT];

function getStatusVariant(status: string) {
  switch (status?.toLowerCase()) {
    case "upcoming":
      return "default";
    case "completed":
      return "secondary";
    case "scheduled":
      return "outline";
    default:
      return "secondary";
  }
}

function formatDateTime(dateTime: string) {
  if (!dateTime) return { date: "—", time: "" };
  const d = new Date(dateTime);
  return {
    date: d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" }),
    time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
  };
}

/* ===================================================================
   COMPONENT
=================================================================== */
export default function ExamsPage() {
  useRoleGuard(ALLOWED_ROLES);
  const router = useRouter();
  const { toast } = useToast();
  const { searchQuery } = useSearch();

  const roleId =
    typeof window !== "undefined"
      ? Number(localStorage.getItem("role_id"))
      : null;
  const isStudent = roleId === ROLE.STUDENT;
  const isTeacher = roleId === ROLE.TEACHER || roleId === ROLE.CLASS_TEACHER;
  const canManage = roleId ? ADMIN_GROUP.includes(roleId as any) : false;
  const userEmail = typeof window !== "undefined" ? localStorage.getItem("user_email") : null;
  const studentClassId = typeof window !== "undefined" ? localStorage.getItem("class_id") : null;

  /* State */
  const [exams, setExams] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [formLoading, setFormLoading] = React.useState(false);
  const [selectedStandard, setSelectedStandard] = React.useState<string>("all");

  /* Dialog visibility */
  const [isScheduleOpen, setIsScheduleOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isGradeOpen, setIsGradeOpen] = React.useState(false);
  const [isResultsOpen, setIsResultsOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<any>(null);

  /* Selected exam for action dialogs */
  const [selectedExam, setSelectedExam] = React.useState<any>(null);

  /* ===== FETCH ===== */
  const fetchExams = React.useCallback(async () => {
    try {
      const url = isStudent && studentClassId ? `/api/exams?class_id=${studentClassId}` : "/api/exams";
      const res = await axios.get(url);
      setExams(res.data.data || []);
    } catch {
      toast({ title: "Error", description: "Failed to load exams", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [isStudent, studentClassId]);

  /* Refresh list after any modification */
  const handleActionSuccess = () => {
    fetchExams();
  };

  React.useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  /* ===== SEARCH FILTER & GROUPING ===== */
  const uniqueStandards = React.useMemo(() => {
    const stds = new Set(exams.map((e) => e.class_name).filter(Boolean));
    return Array.from(stds).sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
  }, [exams]);

  // We group exams by standard (class_name) + exam_name + subject_id to hide duplicate section entries.
  const filtered = React.useMemo(() => {
    let result = exams;

    if (selectedStandard !== "all") {
      result = result.filter((e) => e.class_name === selectedStandard);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.exam_name?.toLowerCase().includes(q) ||
          e.class_name?.toLowerCase().includes(q) ||
          e.subject_name?.toLowerCase().includes(q) ||
          e.computed_status?.toLowerCase().includes(q)
      );
    }

    // Deduplicate logic
    const uniqueExamsMap = new Map<string, any>();
    result.forEach((exam) => {
      // Create a unique key based on exam name, standard (class_name), and subject
      const key = `${exam.exam_name}_${exam.class_name}_${exam.subject_id}`;
      if (!uniqueExamsMap.has(key)) {
        uniqueExamsMap.set(key, { 
          ...exam, 
          section_name: "", 
          all_sections: [exam],
          all_subject_teacher_emails: [exam.subject_teacher_email?.toLowerCase()].filter(Boolean)
        });
      } else {
        const existing = uniqueExamsMap.get(key);
        existing.all_sections.push(exam);
        if (exam.subject_teacher_email) {
          const email = exam.subject_teacher_email.toLowerCase();
          if (!existing.all_subject_teacher_emails.includes(email)) {
            existing.all_subject_teacher_emails.push(email);
          }
        }
      }
    });

    return Array.from(uniqueExamsMap.values());
  }, [exams, searchQuery, selectedStandard]);

  /* ===== CREATE ===== */
  const handleCreate = async (values: any) => {
    setFormLoading(true);
    try {
      const dateTime = `${new Date(values.date).toISOString().split("T")[0]}T${values.time}:00`;
      await axios.post("/api/exams", {
        exam_name: values.exam_name,
        class_id: parseInt(values.class_id),
        subject_id: parseInt(values.subject_id),
        exam_type_id: parseInt(values.exam_type_id),
        date_time: dateTime,
        duration_mins: values.duration_mins,
        total_score: values.total_score,
        min_marks: values.min_marks || null,
        max_marks: values.max_marks || null,
        exam_status_id: parseInt(values.exam_status_id),
      });
      toast({ title: "Exam Scheduled", description: `${values.exam_name} has been created.` });
      setIsScheduleOpen(false);
      handleActionSuccess();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to create exam",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  /* ===== UPDATE ===== */
  const handleUpdate = async (values: any) => {
    if (!selectedExam) return;
    setFormLoading(true);
    try {
      const dateTime = `${new Date(values.date).toISOString().split("T")[0]}T${values.time}:00`;
      await axios.put(`/api/exams/${selectedExam.exam_id}`, {
        exam_name: values.exam_name,
        class_id: parseInt(values.class_id),
        subject_id: parseInt(values.subject_id),
        exam_type_id: parseInt(values.exam_type_id),
        date_time: dateTime,
        duration_mins: values.duration_mins,
        total_score: values.total_score,
        min_marks: values.min_marks || null,
        max_marks: values.max_marks || null,
        exam_status_id: parseInt(values.exam_status_id),
      });
      toast({ title: "Exam Updated", description: `${values.exam_name} has been updated.` });
      setIsEditOpen(false);
      setSelectedExam(null);
      handleActionSuccess();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to update exam",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  /* ===== DELETE ===== */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`/api/exams/${deleteTarget.exam_id}`);
      toast({ title: "Deleted", description: `${deleteTarget.exam_name} has been removed.` });
      setDeleteTarget(null);
      handleActionSuccess();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to delete exam",
        variant: "destructive",
      });
    }
  };

  /* ===================================================================
     RENDER
  =================================================================== */
  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <CardTitle>Examination Management</CardTitle>
            <CardDescription>
              Design papers, schedule tests, and track academic performance
            </CardDescription>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Select value={selectedStandard} onValueChange={setSelectedStandard}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Standard" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Standards</SelectItem>
                {uniqueStandards.map((std) => (
                  <SelectItem key={std} value={std}>
                    Standard {std}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {canManage && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/main/exams/generate")}
                >
                  <FilePenLine className="mr-2 h-4 w-4" />
                  Generate Paper
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsScheduleOpen(true)}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Schedule Exam
                </Button>
              </>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date &amp; Time</TableHead>
                  <TableHead className="text-right">Total Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="p-0">
                      <PageSkeleton rows={4} />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                      No exams found. Click "Schedule Exam" to add one.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((exam) => {
                    const dt = formatDateTime(exam.date_time);
                    const isCompleted = exam.computed_status?.toLowerCase() === "completed" || exam.exam_status_name?.toLowerCase() === "completed";
                    return (
                      <TableRow key={exam.exam_id} className="group">
                        <TableCell>
                          <p className="font-medium">{exam.exam_name}</p>
                          <p className="text-xs text-muted-foreground">{exam.exam_type_name}</p>
                        </TableCell>
                        <TableCell>
                          Standard {exam.class_name}
                        </TableCell>
                        <TableCell>{exam.subject_name}</TableCell>
                        <TableCell>
                          <p className="text-sm">{dt.date}</p>
                          <p className="text-xs text-muted-foreground">{dt.time}</p>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {exam.total_score}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(exam.computed_status)}>
                            {exam.computed_status ? exam.computed_status.charAt(0).toUpperCase() + exam.computed_status.slice(1) : "Unknown"}
                          </Badge>
                        </TableCell>
                        {!isStudent && (
                          <TableCell>
                            <ExamActionMenu
                              exam={exam}
                              canEnterGrades={isCompleted && (canManage || (Boolean(isTeacher && exam.all_subject_teacher_emails?.includes(userEmail?.toLowerCase()))))}
                              canViewResults={isCompleted}
                              canEditDelete={canManage}
                              onEdit={() => { setSelectedExam(exam); setIsEditOpen(true); }}
                              onGrades={() => { 
                                // For teachers, find the specific section/exam they are authorized for
                                const targetExam = isTeacher 
                                  ? exam.all_sections?.find((s: any) => s.subject_teacher_email?.toLowerCase() === userEmail?.toLowerCase())
                                  : exam;
                                setSelectedExam(targetExam || exam); 
                                setIsGradeOpen(true); 
                              }}
                              onResults={() => { setSelectedExam(exam); setIsResultsOpen(true); }}
                              onDelete={() => setDeleteTarget(exam)}
                            />
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card List */}
          <div className="sm:hidden divide-y">
            {loading ? (
              <div className="py-4 px-2">
                <PageSkeleton rows={3} />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">
                No exams found.
              </p>
            ) : (
              filtered.map((exam) => {
                const dt = formatDateTime(exam.date_time);
                const isCompleted = exam.computed_status?.toLowerCase() === "completed" || exam.exam_status_name?.toLowerCase() === "completed";
                return (
                  <div key={exam.exam_id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm">{exam.exam_name}</p>
                        <p className="text-xs text-muted-foreground">{exam.exam_type_name}</p>
                      </div>
                      {!isStudent && (
                        <ExamActionMenu
                          exam={exam}
                          canEnterGrades={isCompleted && (canManage || (Boolean(isTeacher && exam.all_subject_teacher_emails?.includes(userEmail?.toLowerCase()))))}
                          canViewResults={isCompleted}
                          canEditDelete={canManage}
                          onEdit={() => { setSelectedExam(exam); setIsEditOpen(true); }}
                          onGrades={() => { 
                            const targetExam = isTeacher 
                              ? exam.all_sections?.find((s: any) => s.subject_teacher_email?.toLowerCase() === userEmail?.toLowerCase())
                              : exam;
                            setSelectedExam(targetExam || exam); 
                            setIsGradeOpen(true); 
                          }}
                          onResults={() => { setSelectedExam(exam); setIsResultsOpen(true); }}
                          onDelete={() => setDeleteTarget(exam)}
                        />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Standard {exam.class_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {exam.subject_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarClock className="h-3 w-3" />
                        {dt.date} {dt.time}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusVariant(exam.computed_status)}>
                        {exam.computed_status ? exam.computed_status.charAt(0).toUpperCase() + exam.computed_status.slice(1) : "Unknown"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Total: <strong>{exam.total_score}</strong>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* ===== SCHEDULE EXAM DIALOG ===== */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule New Exam</DialogTitle>
            <DialogDescription>Fill in the details to schedule a new exam.</DialogDescription>
          </DialogHeader>
          <ExamForm onSubmit={handleCreate} loading={formLoading} />
        </DialogContent>
      </Dialog>

      {/* ===== EDIT EXAM DIALOG ===== */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) setSelectedExam(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Schedule</DialogTitle>
            <DialogDescription>Update exam details below.</DialogDescription>
          </DialogHeader>
          {selectedExam && (
            <ExamForm
              key={selectedExam.exam_id}
              exam={selectedExam}
              onSubmit={handleUpdate}
              loading={formLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ===== ENTER GRADES DIALOG ===== */}
      <Dialog open={isGradeOpen} onOpenChange={(open) => { setIsGradeOpen(open); if (!open) setSelectedExam(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enter Grades</DialogTitle>
            <DialogDescription>
              {selectedExam?.exam_name} — {selectedExam?.class_name}{selectedExam?.section_name ? ` - ${selectedExam?.section_name}` : ""} · {selectedExam?.subject_name}
            </DialogDescription>
          </DialogHeader>
          {selectedExam && (
            <GradeEntryForm
              key={selectedExam.exam_id}
              exam={selectedExam}
              onSave={handleActionSuccess}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ===== VIEW RESULTS DIALOG ===== */}
      <Dialog open={isResultsOpen} onOpenChange={(open) => { setIsResultsOpen(open); if (!open) setSelectedExam(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Results</DialogTitle>
            <DialogDescription>
              {selectedExam?.exam_name} — {selectedExam?.class_name}{selectedExam?.section_name ? ` - ${selectedExam?.section_name}` : ""} · {selectedExam?.subject_name}
            </DialogDescription>
          </DialogHeader>
          {selectedExam && (
            <ViewResultsDialog
              key={selectedExam.exam_id}
              exam={selectedExam}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ===== DELETE CONFIRM DIALOG ===== */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exam?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.exam_name}</strong> and all its grades. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* ===================================================================
   EXAM ACTION MENU — extracted for reuse in both desktop and mobile
=================================================================== */
function ExamActionMenu({
  exam,
  canEnterGrades,
  canViewResults,
  canEditDelete,
  onEdit,
  onGrades,
  onResults,
  onDelete,
}: {
  exam: any;
  canEnterGrades: boolean;
  canViewResults: boolean;
  canEditDelete: boolean;
  onEdit: () => void;
  onGrades: () => void;
  onResults: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {canEditDelete && (
          <DropdownMenuItem onClick={onEdit}>
            Edit Schedule
          </DropdownMenuItem>
        )}

        {canEnterGrades && (
          <DropdownMenuItem onClick={onGrades}>
            Enter Grades
          </DropdownMenuItem>
        )}

        {canViewResults && (
          <DropdownMenuItem onClick={onResults}>
            View Results
          </DropdownMenuItem>
        )}

        {canEditDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={onDelete}
            >
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
