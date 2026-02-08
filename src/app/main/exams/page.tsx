"use client";

import * as React from "react";
import RouteGuard from "@/components/auth/RouteGuard";

import { MoreHorizontal, PlusCircle, FilePenLine } from "lucide-react";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { useToast } from "@/hooks/use-toast";
import { ExamForm, type Exam } from "@/components/campus-connect/exam-form";
import { GradeEntryForm } from "@/components/campus-connect/grade-entry-form";
import { useSearch } from "@/components/campus-connect/search-provider";
import { ViewResultsDialog } from "@/components/campus-connect/view-results-dialog";
import { ScorecardDialog } from "@/components/campus-connect/scorecard";
import type { Student } from "@/types";
import { useRouter } from "next/navigation";

const initialExams: Exam[] = [
  {
    id: "1",
    name: "Mid-Term Examination",
    class: "10-A",
    subject: "Science",
    date: new Date("2024-09-15"),
    time: "10:00 AM",
    duration: 180,
    totalScore: 100,
    status: "Upcoming",
  },
  {
    id: "2",
    name: "First Unit Test",
    class: "12-B",
    subject: "Mathematics",
    date: new Date("2024-08-20"),
    time: "09:00 AM",
    duration: 90,
    totalScore: 50,
    status: "Completed",
  },
  {
    id: "3",
    name: "Annual Examination",
    class: "11-A",
    subject: "Physics",
    date: new Date("2025-03-10"),
    time: "01:00 PM",
    duration: 180,
    totalScore: 100,
    status: "Scheduled",
  },
];

const getStatusVariant = (status: Exam["status"]) => {
  switch (status) {
    case "Completed":
      return "secondary";
    case "Upcoming":
      return "default";
    case "Scheduled":
      return "outline";
    default:
      return "secondary";
  }
};

export default function ExamsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { searchQuery } = useSearch();

  const [exams, setExams] = React.useState<Exam[]>(initialExams);
  const [selectedExam, setSelectedExam] = React.useState<Exam | undefined>();
  const [selectedStudent, setSelectedStudent] = React.useState<Student | undefined>();

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isGradeEntryOpen, setIsGradeEntryOpen] = React.useState(false);
  const [isResultsOpen, setIsResultsOpen] = React.useState(false);
  const [isScorecardOpen, setIsScorecardOpen] = React.useState(false);

  const filteredExams = React.useMemo(() => {
    if (!searchQuery) return exams;
    return exams.filter(
      exam =>
        exam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.class.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, exams]);

  const handleFormSubmit = (data: Exam) => {
    if (data.id) {
      setExams(prev => prev.map(e => (e.id === data.id ? data : e)));
      toast({ title: "Exam Updated" });
    } else {
      setExams(prev => [...prev, { ...data, id: (prev.length + 1).toString() }]);
      toast({ title: "Exam Scheduled" });
    }
    setIsFormOpen(false);
    setSelectedExam(undefined);
  };

  return (
    <RouteGuard allowedRoles={[1, 2]}>
      <Card>
        <CardHeader>
          <div className="flex justify-between">
            <div>
              <CardTitle>Exams</CardTitle>
              <CardDescription>Manage exams & results</CardDescription>
            </div>
            <Button onClick={() => setIsFormOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Schedule Exam
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExams.map(exam => (
                <TableRow key={exam.id}>
                  <TableCell>{exam.name}</TableCell>
                  <TableCell>{exam.class}</TableCell>
                  <TableCell>{exam.subject}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(exam.status)}>
                      {exam.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedExam(exam);
                            setIsGradeEntryOpen(true);
                          }}
                        >
                          Enter Grades
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedExam(exam);
                            setIsResultsOpen(true);
                          }}
                        >
                          View Results
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            setExams(prev => prev.filter(e => e.id !== exam.id))
                          }
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>

        {/* Dialogs */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent>
            <ExamForm onSubmit={handleFormSubmit} exam={selectedExam} />
          </DialogContent>
        </Dialog>

        <Dialog open={isGradeEntryOpen} onOpenChange={setIsGradeEntryOpen}>
          <DialogContent>
            {selectedExam && (
              <GradeEntryForm
                exam={selectedExam}
                onSave={() => setIsGradeEntryOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={isResultsOpen} onOpenChange={setIsResultsOpen}>
          <DialogContent>
            {selectedExam && (
              <ViewResultsDialog
                exam={selectedExam}
                onDownloadScorecard={student => {
                  setSelectedStudent(student);
                  setIsResultsOpen(false);
                  setIsScorecardOpen(true);
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={isScorecardOpen} onOpenChange={setIsScorecardOpen}>
          <DialogContent className="p-0">
            {selectedExam && selectedStudent && (
              <ScorecardDialog
                exam={selectedExam}
                student={selectedStudent}
              />
            )}
          </DialogContent>
        </Dialog>
      </Card>
    </RouteGuard>
  );
}
