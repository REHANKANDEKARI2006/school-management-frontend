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

import { format } from "date-fns";
import axios from "@/lib/axios";
import { BarChart, CheckCircle, XCircle, CalendarDays, Users, PlusCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog } from "@/components/ui/dialog";
import { AttendanceSummaryDialog } from "@/components/campus-connect/attendance-summary-dialog";

interface SubjectWithAttendance {
  subject_id: string;
  subject_name: string;
  present_count: number;
  absent_count: number;
  status: string;
  session_id: string | null;
}

interface ClassWithSubjects {
  class_id: string;
  class_name: string;
  section_id: string;
  section_name: string;
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
    sessionId?: string;
  } | null>(null);

  const fetchDashboardData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const dateString = format(selectedDate, "yyyy-MM-dd");
      const response = await axios.get(`/api/attendance/dashboard?date=${dateString}`);

      if (response.data.success) {
        // Group by class and section
        const rawData = response.data.data;
        const grouped: Record<string, ClassWithSubjects> = {};

        rawData.forEach((item: any) => {
          const key = `${item.class_id}-${item.section_id}`;
          if (!grouped[key]) {
            grouped[key] = {
              class_id: item.class_id,
              class_name: item.class_name,
              section_id: item.section_id,
              section_name: item.section_name,
              subjects: []
            };
          }
          grouped[key].subjects.push({
            subject_id: item.subject_id,
            subject_name: item.subject_name,
            present_count: parseInt(item.present_count),
            absent_count: parseInt(item.absent_count),
            status: item.status,
            session_id: item.session_id
          });
        });

        setClassData(Object.values(grouped));
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  React.useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <RouteGuard allowedRoles={[1, 2, 3, 4]}>
      <div className="container mx-auto py-8 px-4 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart className="h-8 w-8 text-indigo-600" />
              Attendance Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Overview of attendance records for the selected date.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-[240px] justify-start text-left font-normal h-11">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {format(selectedDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => d && setSelectedDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button onClick={() => router.push('/main/attendance/new')} className="bg-indigo-600 hover:bg-indigo-700 h-11 px-6">
              <PlusCircle className="mr-2 h-4 w-4" />
              Take Attendance
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-muted-foreground font-medium">Loading attendance data...</p>
          </div>
        ) : classData.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <div className="flex flex-col items-center space-y-4">
              <Users className="h-12 w-12 text-muted-foreground opacity-20" />
              <h3 className="text-xl font-semibold">No Sessions Found</h3>
              <p className="text-muted-foreground max-w-sm">No attendance has been taken for this date yet.</p>
              <Button variant="outline" onClick={() => router.push('/main/attendance/new')}>Start New Session</Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classData.map((cls) => (
              <Card key={`${cls.class_id}-${cls.section_id}`} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="bg-slate-50/50 border-b py-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-600" />
                    <CardTitle className="text-xl font-bold">{cls.class_name} - {cls.section_name}</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Attendance status for each subject on {format(selectedDate, "MMMM do, yyyy")}.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {cls.subjects.map((sub) => (
                      <div
                        key={sub.subject_id}
                        className="group flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors cursor-pointer"
                        onClick={() => {
                          if (sub.session_id) {
                            setSelectedSummary({
                              classId: cls.class_id,
                              subjectId: sub.subject_id,
                              date: selectedDate,
                              sessionId: sub.session_id
                            });
                            setIsSummaryOpen(true);
                          } else {
                            router.push(`/main/attendance/${cls.class_id}/${sub.subject_id}`);
                          }
                        }}
                      >
                        <span className="font-semibold text-slate-700">{sub.subject_name}</span>

                        <div className="text-right">
                          {sub.session_id ? (
                            <div className="flex items-center gap-3">
                              <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                                <CheckCircle className="h-4 w-4" /> {sub.present_count}
                              </span>
                              <span className="text-red-500 text-sm font-medium flex items-center gap-1">
                                <XCircle className="h-4 w-4" /> {sub.absent_count}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm font-medium opacity-50 bg-slate-100 px-2 py-0.5 rounded-md">Not taken</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
          {selectedSummary && (
            <AttendanceSummaryDialog {...selectedSummary} />
          )}
        </Dialog>
      </div>
    </RouteGuard>
  );
}
