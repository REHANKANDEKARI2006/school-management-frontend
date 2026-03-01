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
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ViewResultsDialogProps {
  exam: any; // full exam row from DB
}

interface GradeRow {
  grade_id: number;
  student_id: number;
  marks_obtained: number;
  grade: string;
  stu_first_name: string;
  stu_last_name: string;
}

export function ViewResultsDialog({ exam }: ViewResultsDialogProps) {
  const { toast } = useToast();
  const [grades, setGrades] = React.useState<GradeRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({ highest: 0, lowest: 0, average: 0, passed: 0, failed: 0 });

  React.useEffect(() => {
    const load = async () => {
      if (!exam?.exam_id) { setLoading(false); return; }
      try {
        const res = await axios.get(`/api/exams/grades/${exam.exam_id}`);
        const data: GradeRow[] = res.data.data || [];
        setGrades(data);

        if (data.length > 0) {
          const scores = data.map((g) => g.marks_obtained);
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
        No results found. Please enter grades first.
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

      <div className="max-h-[50vh] overflow-y-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead className="text-right">Marks</TableHead>
              <TableHead className="text-center">Grade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grades.map((g, idx) => (
              <TableRow key={g.grade_id}>
                <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                <TableCell className="font-medium">
                  {g.stu_first_name} {g.stu_last_name}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {g.marks_obtained} / {exam.total_score}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={gradeColor(g.grade)}>{g.grade}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
