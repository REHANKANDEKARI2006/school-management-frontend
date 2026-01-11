
"use client";

import * as React from "react";
import { type Exam } from "./exam-form";
import { type Student } from "@/types";
import { getStudentsByShortClassName } from "@/lib/mock-data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ViewResultsDialogProps {
  exam: Exam;
  onDownloadScorecard: (student: Student) => void;
}

export function ViewResultsDialog({ exam, onDownloadScorecard }: ViewResultsDialogProps) {
  const [students, setStudents] = React.useState<Student[]>([]);
  const [grades, setGrades] = React.useState<{ [studentId: string]: string }>({});

  React.useEffect(() => {
    if (exam.class && exam.id) {
      setStudents(getStudentsByShortClassName(exam.class));
      const gradesStorageKey = `grades-${exam.id}`;
      const savedGrades = localStorage.getItem(gradesStorageKey);
      if (savedGrades) {
        setGrades(JSON.parse(savedGrades));
      }
    }
  }, [exam]);

  if (students.length === 0) {
    return <p className="text-muted-foreground text-center py-4">No students found for class {exam.class}.</p>
  }
  
  const hasGrades = students.some(student => grades[student.id]);

  if (!hasGrades) {
      return <p className="text-muted-foreground text-center py-4">No grades have been entered for this exam yet.</p>
  }

  return (
    <div className="space-y-4">
      <div className="max-h-[60vh] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Roll No.</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead className="text-center w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map(student => (
              grades[student.id] && (
                <TableRow key={student.id}>
                  <TableCell>{student.rollNumber}</TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell className="text-right font-medium">
                    {grades[student.id] ? `${grades[student.id]} / ${exam.totalScore}` : "Not Graded"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="outline" size="sm" onClick={() => onDownloadScorecard(student)}>
                      <Download className="h-3 w-3 mr-1" />
                      Scorecard
                    </Button>
                  </TableCell>
                </TableRow>
              )
            ))}
          </TableBody>
        </Table>
      </div>
      <Button variant="outline" className="w-full" onClick={() => window.print()}>
        Print Results
      </Button>
    </div>
  );
}
