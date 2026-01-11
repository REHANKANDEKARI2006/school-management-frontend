
"use client";

import * as React from "react";
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
    date: "2024-09-15",
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
    date: "2024-08-20",
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
    date: "2025-03-10",
    time: "01:00 PM",
    duration: 180,
    totalScore: 100,
    status: "Scheduled",
  },
  {
    id: "4",
    name: "Half-Yearly Examination",
    class: "9-C",
    subject: "History",
    date: "2024-11-05",
    time: "10:00 AM",
    duration: 150,
    totalScore: 80,
    status: "Upcoming",
  },
  {
    id: "5",
    name: "Second Unit Test",
    class: "10-A",
    subject: "English",
    date: "2024-10-01",
    time: "11:00 AM",
    duration: 60,
    totalScore: 30,
    status: "Scheduled",
  },
   {
    id: "6",
    name: "Annual Examination",
    class: "12-B",
    subject: "Biology",
    date: "2025-03-15",
    time: "10:00 AM",
    duration: 180,
    totalScore: 70,
    status: "Scheduled",
  },
];

const getStatusVariant = (status: string) => {
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
}

export default function ExamsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { searchQuery } = useSearch();
  const [exams, setExams] = React.useState(initialExams);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isGradeEntryOpen, setIsGradeEntryOpen] = React.useState(false);
  const [isResultsOpen, setIsResultsOpen] = React.useState(false);
  const [isScorecardOpen, setIsScorecardOpen] = React.useState(false);
  const [selectedExam, setSelectedExam] = React.useState<Exam | undefined>(undefined);
  const [selectedStudentForScorecard, setSelectedStudentForScorecard] = React.useState<Student | undefined>(undefined);

  const filteredExams = React.useMemo(() => {
    if (!searchQuery) {
      return exams;
    }
    return exams.filter(exam =>
      exam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.class.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, exams]);

  const handleFormSubmit = (examData: Exam) => {
    if (selectedExam && examData.id) {
      // Update existing exam
      setExams(exams.map(e => e.id === examData.id ? { ...e, ...examData } : e));
      toast({ title: "Exam Updated", description: `${examData.name} has been updated.` });
    } else {
      // Add new exam
      const newExam = { ...examData, id: (exams.length + 1).toString() };
      setExams([...exams, newExam]);
      toast({ title: "Exam Scheduled", description: `${examData.name} has been added.` });
    }
    setIsFormOpen(false);
    setSelectedExam(undefined);
  };

  const openEditDialog = (exam: Exam) => {
    setSelectedExam(exam);
    setIsFormOpen(true);
  }

  const openNewDialog = () => {
    setSelectedExam(undefined);
    setIsFormOpen(true);
  }
  
  const openGradeEntryDialog = (exam: Exam) => {
    setSelectedExam(exam);
    setIsGradeEntryOpen(true);
  };

  const openResultsDialog = (exam: Exam) => {
    setSelectedExam(exam);
    setIsResultsOpen(true);
  };
  
  const openScorecardDialog = (student: Student, exam: Exam) => {
    setSelectedStudentForScorecard(student);
    setSelectedExam(exam);
    setIsResultsOpen(false);
    setIsScorecardOpen(true);
  };

  const handleDelete = (examToDelete: Exam) => {
    setExams(exams.filter(exam => exam.id !== examToDelete.id));
    toast({ title: "Exam Deleted", description: `${examToDelete.name} has been removed.` });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                  <CardTitle className="font-headline">Exams</CardTitle>
                  <CardDescription>Manage exam schedules, grading, and results.</CardDescription>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button size="sm" variant="outline" className="gap-1 w-full sm:w-auto" onClick={() => router.push('/dashboard/exams/generate')}>
                    <FilePenLine className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Generate Paper
                    </span>
                </Button>
                <Button size="sm" className="gap-1 w-full sm:w-auto" onClick={openNewDialog}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Schedule Exam
                    </span>
                </Button>
              </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam</TableHead>
                <TableHead className="hidden sm:table-cell">Class</TableHead>
                <TableHead className="hidden md:table-cell">Subject</TableHead>
                <TableHead className="hidden lg:table-cell">Date & Time</TableHead>
                <TableHead className="hidden sm:table-cell">Total Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell className="font-medium">
                    {exam.name}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{exam.class}</TableCell>
                  <TableCell className="hidden md:table-cell">{exam.subject}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex flex-col">
                      <span>{exam.date}</span>
                      <span className="text-xs text-muted-foreground">{exam.time}</span>
                    </div>
                  </TableCell>
                   <TableCell className="hidden sm:table-cell">{exam.totalScore}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(exam.status)}>
                      {exam.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => openEditDialog(exam)}>Edit Schedule</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openGradeEntryDialog(exam)}>Enter Grades</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openResultsDialog(exam)}>View Results</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(exam)}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedExam ? "Edit Exam" : "Schedule New Exam"}</DialogTitle>
            <DialogDescription>
              {selectedExam ? "Update the details of the exam." : "Fill in the details to schedule a new exam."}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto pr-6">
            <ExamForm onSubmit={handleFormSubmit} exam={selectedExam} />
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isGradeEntryOpen} onOpenChange={setIsGradeEntryOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enter Grades</DialogTitle>
            {selectedExam && (
                <DialogDescription>
                    {`Entering grades for ${selectedExam.name} (${selectedExam.subject}) - Class ${selectedExam.class}. Total Score: ${selectedExam.totalScore}`}
                </DialogDescription>
            )}
          </DialogHeader>
          {selectedExam && <GradeEntryForm exam={selectedExam} onSave={() => setIsGradeEntryOpen(false)} />}
        </DialogContent>
      </Dialog>
      <Dialog open={isResultsOpen} onOpenChange={setIsResultsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>View Results</DialogTitle>
             {selectedExam && (
                <DialogDescription>
                    {`Showing results for ${selectedExam.name} (${selectedExam.subject}) - Class ${selectedExam.class}. Total Score: ${selectedExam.totalScore}`}
                </DialogDescription>
            )}
          </DialogHeader>
          {selectedExam && <ViewResultsDialog exam={selectedExam} onDownloadScorecard={(student) => openScorecardDialog(student, selectedExam)} />}
        </DialogContent>
      </Dialog>
       <Dialog open={isScorecardOpen} onOpenChange={setIsScorecardOpen}>
        <DialogContent className="sm:max-w-4xl p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Student Scorecard</DialogTitle>
          </DialogHeader>
          {selectedExam && selectedStudentForScorecard && (
            <ScorecardDialog 
              exam={selectedExam}
              student={selectedStudentForScorecard}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
