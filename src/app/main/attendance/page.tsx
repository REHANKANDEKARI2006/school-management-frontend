"use client";

import * as React from "react";
import RouteGuard from "@/components/auth/RouteGuard";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  getClasses,
  getSubjectsForClass,
  getStudentsForSubjectInClass,
} from "@/lib/mock-data";

import type { ClassItem, Subject, AttendanceRecord } from "@/types";

import {
  PlusCircle,
  Users,
  BarChart,
  CheckCircle,
  XCircle,
  CalendarDays,
} from "lucide-react";

import { format } from "date-fns";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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

export default function AttendanceDashboardPage() {
  const router = useRouter();
  const [classData, setClassData] = React.useState<ClassWithSubjects[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [isSummaryOpen, setIsSummaryOpen] = React.useState(false);
  const [selectedSummary, setSelectedSummary] = React.useState<{
    classId: string;
    subjectId: string;
    date: Date;
  } | null>(null);

  React.useEffect(() => {
    const dateString = format(selectedDate, "yyyy-MM-dd");
    const classes = getClasses();

    const data: ClassWithSubjects[] = classes.map((cls) => {
      const subjectsForClass = getSubjectsForClass(cls.id);

      const subjectsWithAttendance = subjectsForClass.map((sub) => {
        const key = `attendance-${cls.id}-${sub.id}-${dateString}`;
        const stored = localStorage.getItem(key);

        let present = 0;
        let absent = 0;
        let total = 0;

        if (stored) {
          const records: AttendanceRecord[] = JSON.parse(stored);
          present = records.filter((r) => r.status === "present").length;
          absent = records.filter((r) => r.status === "absent").length;
          total = records.length;
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

  return (
    <RouteGuard allowedRoles={[1, 2, 3, 4]}>
      <>
        {isLoading ? (
          <div className="flex justify-center items-center h-[60vh]">
            Loading...
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart /> Attendance Dashboard
                    </CardTitle>
                    <CardDescription>
                      Attendance overview by date
                    </CardDescription>
                  </div>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline">
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {format(selectedDate, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(d) => d && setSelectedDate(d)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </CardHeader>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classData.map((cls) => (
                <Card key={cls.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users /> {cls.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {cls.subjects.map((sub) => (
                      <Button
                        key={sub.id}
                        variant="outline"
                        className="w-full justify-between"
                        disabled={!sub.date}
                        onClick={() => {
                          setSelectedSummary({
                            classId: cls.id,
                            subjectId: sub.id,
                            date: selectedDate,
                          });
                          setIsSummaryOpen(true);
                        }}
                      >
                        {sub.name}
                        {sub.date ? (
                          <span className="flex gap-2">
                            <span className="text-green-600 flex items-center gap-1">
                              <CheckCircle size={14} /> {sub.present}
                            </span>
                            <span className="text-red-600 flex items-center gap-1">
                              <XCircle size={14} /> {sub.absent}
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            Not taken
                          </span>
                        )}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Dialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
              {selectedSummary && (
                <AttendanceSummaryDialog {...selectedSummary} />
              )}
            </Dialog>
          </div>
        )}
      </>
    </RouteGuard>
  );
}
