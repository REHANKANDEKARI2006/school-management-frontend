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
  Loader2,
  CalendarClock,
  BookOpen,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

/* ===================================================================
   HELPERS
=================================================================== */
const ALLOWED_ROLES = [1, 2];

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

  /* State */
  const [exams, setExams] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [formLoading, setFormLoading] = React.useState(false);

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
      const res = await axios.get("/api/exams");
      setExams(res.data.data || []);
    } catch {
      toast({ title: "Error", description: "Failed to load exams", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { fetchExams(); }, [fetchExams]);

  /* Refresh list after any modification */
  const handleActionSuccess = () => {
    fetchExams();
  };

  /* ===== SEARCH FILTER ===== */
  const filtered = React.useMemo(() => {
    if (!searchQuery) return exams;
    const q = searchQuery.toLowerCase();
    return exams.filter(
      (e) =>
        e.exam_name?.toLowerCase().includes(q) ||
        e.class_name?.toLowerCase().includes(q) ||
        e.subject_name?.toLowerCase().includes(q) ||
        e.exam_status_name?.toLowerCase().includes(q)
    );
  }, [exams, searchQuery]);

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
        <CardHeader className="flex flex-row justify-between">
          <div>
            <CardTitle>Examination Management</CardTitle>
            <CardDescription>
              Design papers, schedule tests, and track academic performance
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
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
                    <TableCell colSpan={7} className="py-12 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
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
                    return (
                      <TableRow key={exam.exam_id} className="group">
                        <TableCell>
                          <p className="font-medium">{exam.exam_name}</p>
                          <p className="text-xs text-muted-foreground">{exam.exam_type_name}</p>
                        </TableCell>
                        <TableCell>
                          {exam.class_name}
                          {exam.section_name ? ` - ${exam.section_name}` : ""}
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
                          <Badge variant={getStatusVariant(exam.exam_status_name)}>
                            {exam.exam_status_name || "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <ExamActionMenu
                            exam={exam}
                            onEdit={() => { setSelectedExam(exam); setIsEditOpen(true); }}
                            onGrades={() => { setSelectedExam(exam); setIsGradeOpen(true); }}
                            onResults={() => { setSelectedExam(exam); setIsResultsOpen(true); }}
                            onDelete={() => setDeleteTarget(exam)}
                          />
                        </TableCell>
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
              <div className="py-12 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">
                No exams found.
              </p>
            ) : (
              filtered.map((exam) => {
                const dt = formatDateTime(exam.date_time);
                return (
                  <div key={exam.exam_id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm">{exam.exam_name}</p>
                        <p className="text-xs text-muted-foreground">{exam.exam_type_name}</p>
                      </div>
                      <ExamActionMenu
                        exam={exam}
                        onEdit={() => { setSelectedExam(exam); setIsEditOpen(true); }}
                        onGrades={() => { setSelectedExam(exam); setIsGradeOpen(true); }}
                        onResults={() => { setSelectedExam(exam); setIsResultsOpen(true); }}
                        onDelete={() => setDeleteTarget(exam)}
                      />
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {exam.class_name}{exam.section_name ? ` - ${exam.section_name}` : ""}
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
                      <Badge variant={getStatusVariant(exam.exam_status_name)}>
                        {exam.exam_status_name || "Unknown"}
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
  onEdit,
  onGrades,
  onResults,
  onDelete,
}: {
  exam: any;
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
        <DropdownMenuItem onClick={onEdit}>
          Edit Schedule
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onGrades}>
          Enter Grades
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onResults}>
          View Results
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={onDelete}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
