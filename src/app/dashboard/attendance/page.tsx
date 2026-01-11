
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getClasses, getSubjectsForClass, getStudentsForSubjectInClass } from "@/lib/mock-data";
import type { ClassItem, Subject, AttendanceRecord } from "@/types";
import { PlusCircle, Users, BarChart, CheckCircle, XCircle, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { AttendanceSummaryDialog } from "@/components/campus-connect/attendance-summary-dialog";
import { Dialog } from "@/components/ui/dialog";

interface SubjectWithAttendance extends Subject {
  present: number;
  absent: number;
  total: number;
  date: string | null;
}

interface ClassWithSubjects extends ClassItem {
  subjects: SubjectWithAttendance[];
}

// Function to seed dummy data for testing
const seedDummyData = () => {
    const addDays = (date: Date, days: number) => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    const today = new Date();
    const yesterday = addDays(today, -1);
    const dayBefore = addDays(today, -2);
    
    const datesToSeed = [
        { date: yesterday, dateString: format(yesterday, "yyyy-MM-dd") },
        { date: dayBefore, dateString: format(dayBefore, "yyyy-MM-dd") }
    ];

    const classId = '1'; // Class 10 - Section A
    const subjectId = '102'; // Science
    const students = getStudentsForSubjectInClass(classId, subjectId);

    if(students.length === 0) return;

    datesToSeed.forEach(({ dateString }) => {
        const key = `attendance-${classId}-${subjectId}-${dateString}`;

        if (!localStorage.getItem(key)) {
            const dummyRecords: AttendanceRecord[] = students.map((student, index) => {
                // Make some absent
                if(index % 3 === 0) {
                    return { studentId: student.id, status: 'absent' };
                }
                return { studentId: student.id, status: 'present' };
            });
            localStorage.setItem(key, JSON.stringify(dummyRecords));
        }
    });
};


export default function AttendanceDashboardPage() {
  const router = useRouter();
  const [classData, setClassData] = React.useState<ClassWithSubjects[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [isSummaryOpen, setIsSummaryOpen] = React.useState(false);
  const [selectedSummary, setSelectedSummary] = React.useState<{ classId: string; subjectId: string; date: Date } | null>(null);

  React.useEffect(() => {
    // Seed dummy data on initial load if it's not there
    seedDummyData();
  }, []);

  React.useEffect(() => {
    const dateString = format(selectedDate, "yyyy-MM-dd");
    const classes = getClasses();
    
    const data: ClassWithSubjects[] = classes.map(cls => {
      const subjectsForClass = getSubjectsForClass(cls.id);
      const subjectsWithAttendance: SubjectWithAttendance[] = subjectsForClass.map(sub => {
        const key = `attendance-${cls.id}-${sub.id}-${dateString}`;
        const storedRecordsRaw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
        
        let present = 0;
        let absent = 0;
        let total = 0;

        if (storedRecordsRaw) {
          try {
            const records: AttendanceRecord[] = JSON.parse(storedRecordsRaw);
            present = records.filter(r => r.status === 'present').length;
            absent = records.filter(r => r.status === 'absent').length;
            total = records.filter(r => r.status !== 'pending').length;
          } catch (e) {
            console.error(`Failed to parse attendance for key ${key}`, e);
          }
        }

        return {
          ...sub,
          present,
          absent,
          total,
          date: total > 0 ? dateString : null,
        };
      });

      return {
        ...cls,
        subjects: subjectsWithAttendance,
      };
    });

    setClassData(data);
    setIsLoading(false);
  }, [selectedDate]);

  const handleDateSelect = (date?: Date) => {
    if (date) {
      setSelectedDate(date);
    }
  };
  
  const handleOpenSummary = (classId: string, subjectId: string) => {
    setSelectedSummary({ classId, subjectId, date: selectedDate });
    setIsSummaryOpen(true);
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                  <CardTitle className="font-headline text-2xl flex items-center gap-2">
                    <BarChart className="h-6 w-6"/>
                    Attendance Dashboard
                  </CardTitle>
                  <CardDescription>Overview of attendance records for the selected date.</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-[240px] justify-start text-left font-normal">
                            <CalendarDays className="mr-2 h-4 w-4" />
                            <span>{format(selectedDate, "PPP")}</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <Calendar mode="single" selected={selectedDate} onSelect={handleDateSelect} initialFocus />
                    </PopoverContent>
                </Popover>
                <Button size="lg" className="gap-2 w-full sm:w-auto" onClick={() => router.push('/dashboard/attendance/new')}>
                    <PlusCircle className="h-5 w-5" />
                    <span className="sm:whitespace-nowrap">
                    Take Attendance
                    </span>
                </Button>
              </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classData.map(cls => (
          <Card key={cls.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary"/>
                {cls.name}
              </CardTitle>
              <CardDescription>Attendance status for each subject on {format(selectedDate, "PPP")}.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {cls.subjects.map(sub => (
                  <Button 
                    variant="outline" 
                    key={sub.id} 
                    className="w-full h-auto justify-between items-center py-2 px-4"
                    onClick={() => sub.date ? handleOpenSummary(cls.id, sub.id) : null}
                    disabled={!sub.date}
                    >
                    <span className="font-medium text-left">{sub.name}</span>
                    {sub.date ? (
                      <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
                              <CheckCircle className="h-4 w-4"/> {sub.present}
                          </div>
                          <div className="flex items-center gap-1 text-sm font-semibold text-red-600">
                              <XCircle className="h-4 w-4"/> {sub.absent}
                          </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not taken</span>
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
    <Dialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
      {selectedSummary && <AttendanceSummaryDialog {...selectedSummary} />}
    </Dialog>
  </>
  );
}
