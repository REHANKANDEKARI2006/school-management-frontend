"use client";

import * as React from "react";
import axios from "@/lib/axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, Lock, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface GradeEntryFormProps {
  exam: any; // full exam row from DB
  onSave: () => void;
}

interface StudentGrade {
  student_id: number;
  name: string;
  marks_obtained: string;
  grade: string;
  saved: boolean;
}

function calculateGrade(marks: number, total: number, minMarks: number | null): string {
  if (minMarks !== null && marks < minMarks) return "F";
  const pct = (marks / total) * 100;
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  return "D";
}

export function GradeEntryForm({ exam, onSave }: GradeEntryFormProps) {
  const { toast } = useToast();
  const [studentGrades, setStudentGrades] = React.useState<StudentGrade[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const isLocked = exam?.marks_status === "Submitted";

  /* ---- Load students for the exam's class + existing grades ---- */
  React.useEffect(() => {
    const load = async () => {
      if (!exam?.class_id) {
        console.warn("GradeEntryForm: No class_id provided for exam", exam);
        setLoading(false);
        return;
      }
      try {
        console.log(`Loading students for class_id: ${exam.class_id} and grades for exam_id: ${exam.exam_id}`);
        const [studentsRes, gradesRes] = await Promise.all([
          axios.get(`/api/students?class_id=${exam.class_id}`),
          axios.get(`/api/exams/grades/${exam.exam_id}`),
        ]);

        const students = studentsRes.data.data || [];
        const existing: any[] = gradesRes.data.data || [];

        const existingMap: Record<number, any> = {};
        existing.forEach((g) => { existingMap[g.student_id] = g; });

        const mapped: StudentGrade[] = students.map((s: any) => {
          const eg = existingMap[s.student_id];
          return {
            student_id: s.student_id,
            name: `${s.stu_first_name} ${s.stu_last_name}`,
            marks_obtained: eg ? String(eg.marks_obtained) : "",
            grade: eg ? eg.grade : "",
            saved: !!eg,
          };
        });

        setStudentGrades(mapped);
      } catch (err: any) {
        console.error("GradeEntryForm load error:", err);
        const msg = err?.response?.data?.message || err.message || "Failed to load students";
        toast({ title: "Error", description: msg, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [exam]);

  const handleMarksChange = (studentId: number, value: string) => {
    if (isLocked) return;
    setStudentGrades((prev) =>
      prev.map((sg) => {
        if (sg.student_id !== studentId) return sg;
        
        let valToSet = value;
        const numVal = parseFloat(value);
        if (!isNaN(numVal)) {
          if (numVal > exam.total_score) {
            valToSet = String(exam.total_score);
            toast({
              title: "Value Capped",
              description: `Marks cannot exceed the maximum score of ${exam.total_score}.`,
              variant: "destructive",
            });
          } else if (numVal < 0) {
            valToSet = "0";
            toast({
              title: "Value Capped",
              description: "Marks cannot be less than 0.",
              variant: "destructive",
            });
          }
        }

        const finalNumVal = parseFloat(valToSet);
        const grade =
          !isNaN(finalNumVal) && exam.total_score
            ? calculateGrade(finalNumVal, exam.total_score, exam.min_marks)
            : "";
        return { ...sg, marks_obtained: valToSet, grade, saved: false };
      })
    );
  };

  const handleSave = async (status: "Draft" | "Submitted") => {
    if (isLocked) return;

    // Validate scores do not exceed total_score or go below 0
    const invalidGrades = studentGrades.filter((sg) => {
      if (sg.marks_obtained === "") return false;
      const val = parseFloat(sg.marks_obtained);
      return isNaN(val) || val < 0 || val > exam.total_score;
    });

    if (invalidGrades.length > 0) {
      toast({
        title: "Validation Error",
        description: `Marks must be between 0 and the max score of ${exam.total_score}.`,
        variant: "destructive",
      });
      return;
    }

    const toSave = studentGrades.filter((sg) => sg.marks_obtained !== "");
    if (toSave.length === 0) {
      toast({ title: "No grades to save", description: "Enter at least one student's marks." });
      return;
    }

    setSaving(true);
    try {
      await axios.post(`/api/exams/bulk-grades/${exam.exam_id}`, {
        grades: toSave.map((sg) => ({
          student_id: sg.student_id,
          marks_obtained: parseFloat(sg.marks_obtained),
          grade: sg.grade,
        })),
        status,
      });

      setStudentGrades((prev) =>
        prev.map((sg) =>
          sg.marks_obtained !== "" ? { ...sg, saved: true } : sg
        )
      );

      toast({
        title: status === "Submitted" ? "Grades Submitted" : "Draft Saved",
        description: status === "Submitted"
          ? `${toSave.length} grade(s) finalized and locked.`
          : `${toSave.length} grade(s) saved as draft.`,
      });
      onSave();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to save grades",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (studentGrades.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-6">
        No students found for this class. Please ensure students are enrolled.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {isLocked && (
        <Alert variant="default" className="border-red-200 bg-red-50 text-red-950">
          <Lock className="h-4 w-4 text-red-600" />
          <AlertTitle className="font-semibold text-red-950">Marks Locked</AlertTitle>
          <AlertDescription className="text-red-700 text-xs">
            These grades have been finalized and locked. Editing is disabled unless an administrator unlocks this entry.
          </AlertDescription>
        </Alert>
      )}

      <div className="text-sm text-muted-foreground flex justify-between items-center">
        <div>
          Total Score: <span className="font-semibold text-foreground">{exam.total_score}</span>
          {exam.min_marks && (
            <> &nbsp;|&nbsp; Pass Marks: <span className="font-semibold text-foreground">{exam.min_marks}</span></>
          )}
        </div>
        {exam.marks_status && (
          <Badge variant={exam.marks_status === "Submitted" ? "default" : "outline"} className={exam.marks_status === "Submitted" ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-100" : "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100"}>
            Status: {exam.marks_status}
          </Badge>
        )}
      </div>

      <div className="max-h-[50vh] overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 min-w-[40px]">#</TableHead>
              <TableHead className="min-w-[140px]">Student Name</TableHead>
              <TableHead className="w-28 min-w-[100px] text-center">Marks</TableHead>
              <TableHead className="w-16 min-w-[70px] text-center">Grade</TableHead>
              <TableHead className="w-10 min-w-[40px] text-center">✓</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {studentGrades.map((sg, idx) => (
              <TableRow key={sg.student_id}>
                <TableCell className="text-muted-foreground text-sm">{idx + 1}</TableCell>
                <TableCell className="font-medium">{sg.name}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    placeholder={`/ ${exam.total_score}`}
                    value={sg.marks_obtained}
                    onChange={(e) => handleMarksChange(sg.student_id, e.target.value)}
                    className="text-center h-8"
                    min={0}
                    max={exam.total_score}
                    disabled={isLocked}
                  />
                </TableCell>
                <TableCell className="text-center">
                  {sg.grade && (
                    <Badge variant={sg.grade === "F" || sg.grade === "Fail" ? "destructive" : "default"}>
                      {sg.grade}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {sg.saved && <Check className="h-4 w-4 text-green-500 mx-auto" />}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {!isLocked && (
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => handleSave("Draft")}
            disabled={saving}
            className="flex-1"
          >
            Save as Draft
          </Button>
          <Button
            onClick={() => handleSave("Submitted")}
            disabled={saving}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Final Submit & Lock
          </Button>
        </div>
      )}
    </div>
  );
}
