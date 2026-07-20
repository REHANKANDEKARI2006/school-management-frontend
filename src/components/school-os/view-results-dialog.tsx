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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ViewResultsDialogProps {
  exam: any; // full exam row from DB
}

interface GradeRow {
  student_id: number;
  stu_first_name: string;
  stu_last_name: string;
  marks_obtained: number | null;
  grade: string | null;
}

function calculateResultGrade(marks: number, total: number, minMarks: number | null): string {
  if (minMarks !== null && marks < minMarks) return "F";
  const pct = (marks / total) * 100;
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  return "D";
}

export function ViewResultsDialog({ exam }: ViewResultsDialogProps) {
  const { toast } = useToast();
  const [grades, setGrades] = React.useState<GradeRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({ highest: 0, lowest: 0, average: 0, passed: 0, failed: 0 });

  React.useEffect(() => {
    const load = async () => {
      if (!exam?.exam_id || !exam?.class_id) { setLoading(false); return; }
      try {
        const [studentsRes, gradesRes] = await Promise.all([
          axios.get(`/api/students?class_id=${exam.class_id}`),
          axios.get(`/api/exams/grades/${exam.exam_id}`),
        ]);

        const students = studentsRes.data.data || [];
        const existingGrades: any[] = gradesRes.data.data || [];

        const existingMap: Record<number, any> = {};
        existingGrades.forEach((g) => { existingMap[g.student_id] = g; });

        const mappedData: GradeRow[] = students.map((s: any) => {
          const eg = existingMap[s.student_id];
          let marks = eg ? eg.marks_obtained : null;
          let grade = eg ? eg.grade : null;

          // Recalculate grade for display to ensure consistency with new algorithm
          if (marks !== null && exam.total_score) {
            grade = calculateResultGrade(Number(marks), exam.total_score, exam.min_marks);
          }

          return {
            student_id: s.student_id,
            stu_first_name: s.stu_first_name,
            stu_last_name: s.stu_last_name,
            marks_obtained: marks,
            grade: grade,
          };
        });

        // Sort by student_id (proxy for roll number)
        mappedData.sort((a, b) => a.student_id - b.student_id);

        setGrades(mappedData);

        const validGrades = mappedData.filter((g) => g.marks_obtained !== null);
        if (validGrades.length > 0) {
          const scores = validGrades.map((g) => Number(g.marks_obtained));
          const passThreshold = exam.min_marks || exam.total_score * 0.35;
          setStats({
            highest: Math.max(...scores),
            lowest: Math.min(...scores),
            average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
            passed: scores.filter((s) => s >= passThreshold).length,
            failed: scores.filter((s) => s < passThreshold).length,
          });
        }
      } catch {
        toast({ title: "Error", description: "Failed to load results", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [exam]);

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.text("Examination Result Report", 105, 15, { align: "center" });
      
      doc.setFontSize(12);
      doc.text(`Exam: ${exam.exam_name}`, 14, 25);
      doc.text(`Class: Standard ${exam.class_name}`, 14, 32);
      doc.text(`Subject: ${exam.subject_name}`, 14, 39);
      doc.text(`Total Marks: ${exam.total_score}`, 14, 46);
      doc.text(`Passing Marks: ${exam.min_marks || 'N/A'}`, 14, 53);
      
      // Table
      const tableData = grades.map((g, idx) => [
        g.student_id, // Roll No (student_id)
        `${g.stu_first_name} ${g.stu_last_name}`,
        g.marks_obtained !== null ? g.marks_obtained : "-",
        g.grade || "Pending"
      ]);

      autoTable(doc, {
        startY: 60,
        head: [["Roll No", "Student Name", "Marks Obtained", "Grade"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [63, 81, 181] }
      });

      // Stats
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.text("Summary Stats:", 14, finalY);
      doc.text(`Highest: ${stats.highest} | Lowest: ${stats.lowest} | Average: ${stats.average}`, 14, finalY + 7);
      doc.text(`Total Passed: ${stats.passed} | Total Failed: ${stats.failed}`, 14, finalY + 14);

      doc.save(`${exam.exam_name}_Results.pdf`);
      toast({ title: "Success", description: "PDF downloaded successfully" });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (grades.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-6">
        No students found for this class.
      </p>
    );
  }

  const gradeColor = (g: string) => {
    if (g === "A+" || g === "A") return "default";
    if (g === "B+" || g === "B") return "secondary";
    if (g === "F") return "destructive";
    return "outline";
  };

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-muted-foreground">Results Overview</h3>
        <Button size="sm" variant="outline" onClick={handleDownloadPDF}>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
        {[
          { label: "Highest", value: stats.highest },
          { label: "Lowest", value: stats.lowest },
          { label: "Average", value: stats.average },
          { label: "Passed", value: stats.passed },
          { label: "Failed", value: stats.failed },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-muted/30 p-2">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-lg font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="max-h-[45vh] overflow-y-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Roll No</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead className="text-right">Marks</TableHead>
              <TableHead className="text-center">Grade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grades.map((g) => (
              <TableRow key={g.student_id}>
                <TableCell className="text-muted-foreground font-mono">{g.student_id}</TableCell>
                <TableCell className="font-medium">
                  {g.stu_first_name} {g.stu_last_name}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {g.marks_obtained !== null ? `${g.marks_obtained} / ${exam.total_score}` : <span className="text-muted-foreground font-normal">-</span>}
                </TableCell>
                <TableCell className="text-center">
                  {g.grade ? (
                    <Badge variant={gradeColor(g.grade)}>{g.grade}</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground border-dashed">Pending</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
