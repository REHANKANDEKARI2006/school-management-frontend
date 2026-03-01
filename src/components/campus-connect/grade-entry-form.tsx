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
import { Loader2, Check } from "lucide-react";

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

function calculateGrade(marks: number, total: number): string {
  const pct = (marks / total) * 100;
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 40) return "D";
  return "F";
}

export function GradeEntryForm({ exam, onSave }: GradeEntryFormProps) {
  const { toast } = useToast();
  const [studentGrades, setStudentGrades] = React.useState<StudentGrade[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

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
    setStudentGrades((prev) =>
      prev.map((sg) => {
        if (sg.student_id !== studentId) return sg;
        const numVal = parseFloat(value);
        const grade =
          !isNaN(numVal) && exam.total_score
            ? calculateGrade(numVal, exam.total_score)
            : "";
        return { ...sg, marks_obtained: value, grade, saved: false };
      })
    );
  };

  const handleSaveAll = async () => {
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
      });

      setStudentGrades((prev) =>
        prev.map((sg) =>
          sg.marks_obtained !== "" ? { ...sg, saved: true } : sg
        )
      );

      toast({
        title: "Grades Saved",
        description: `${toSave.length} grade(s) saved for ${exam.exam_name}.`,
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
      <div className="text-sm text-muted-foreground">
        Total Score: <span className="font-semibold text-foreground">{exam.total_score}</span>
        {exam.min_marks && (
          <> &nbsp;|&nbsp; Pass Marks: <span className="font-semibold text-foreground">{exam.min_marks}</span></>
        )}
      </div>

      <div className="max-h-[55vh] overflow-y-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead className="w-28 text-center">Marks</TableHead>
              <TableHead className="w-16 text-center">Grade</TableHead>
              <TableHead className="w-10 text-center">✓</TableHead>
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
                  />
                </TableCell>
                <TableCell className="text-center">
                  {sg.grade && (
                    <Badge variant={sg.grade === "F" ? "destructive" : "default"}>
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

      <Button onClick={handleSaveAll} className="w-full" disabled={saving}>
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save All Grades
      </Button>
    </div>
  );
}
