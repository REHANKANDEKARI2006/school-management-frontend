
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface GradeEntryFormProps {
  exam: Exam;
  onSave: () => void;
}

export function GradeEntryForm({ exam, onSave }: GradeEntryFormProps) {
  const { toast } = useToast();
  const [students, setStudents] = React.useState<Student[]>([]);
  const [grades, setGrades] = React.useState<{ [studentId: string]: string }>({});

  const gradesStorageKey = React.useMemo(() => `grades-${exam.id}`, [exam.id]);

  React.useEffect(() => {
    if (exam.class) {
      setStudents(getStudentsByShortClassName(exam.class));
      const savedGrades = localStorage.getItem(gradesStorageKey);
      if (savedGrades) {
        setGrades(JSON.parse(savedGrades));
      }
    }
  }, [exam, gradesStorageKey]);

  const handleGradeChange = (studentId: string, value: string) => {
    setGrades(prev => ({ ...prev, [studentId]: value }));
  };

  const handleSaveGrades = () => {
    localStorage.setItem(gradesStorageKey, JSON.stringify(grades));
    toast({
      title: "Grades Saved",
      description: `Grades for ${exam.name} have been successfully saved.`,
    });
    onSave();
  };
  
  if(students.length === 0) {
      return <p className="text-muted-foreground text-center py-4">No students found for class {exam.class}. Please ensure students are assigned to this class.</p>
  }

  return (
    <div className="space-y-4">
      <div className="max-h-[60vh] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Roll No.</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead className="w-[150px] text-center">Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map(student => (
              <TableRow key={student.id}>
                <TableCell className="w-[100px]">{student.rollNumber}</TableCell>
                <TableCell>{student.name}</TableCell>
                <TableCell className="w-[150px]">
                  <Input
                    type="text"
                    placeholder={`Score / ${exam.totalScore}`}
                    value={grades[student.id] || ""}
                    onChange={(e) => handleGradeChange(student.id, e.target.value)}
                    className="text-center"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Button onClick={handleSaveGrades} className="w-full">
        Save Grades
      </Button>
    </div>
  );
}
