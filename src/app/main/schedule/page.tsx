"use client";

import * as React from "react";
import { CalendarDays, Settings, Loader2, Download } from "lucide-react";
import { PageSkeleton } from "@/components/ui/skeletons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSchoolSchedule, replaceClassSchedule, getMySchedule } from "@/lib/api/schedule";
import { ManageScheduleGrid } from "@/components/campus-connect/manage-schedule-grid";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "@/hooks/use-toast";
import { startOfWeek, format } from "date-fns";

const DAYS = [
  { id: 1, name: "Monday" },
  { id: 2, name: "Tuesday" },
  { id: 3, name: "Wednesday" },
  { id: 4, name: "Thursday" },
  { id: 5, name: "Friday" },
  { id: 6, name: "Saturday" },
];

import axios from "@/lib/axios";

// Convert "HH:MM" (24h) → "H:MM AM/PM"
const to12h = (time: string) => {
  const [hStr, mStr] = time.split(":");
  const h = parseInt(hStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${period}`;
};

import { ROLE, RoleId, ADMIN_GROUP } from "@/config/roles";

export default function SchedulePage() {
  const [schedules, setSchedules] = React.useState<any[]>([]);
  const [classes, setClasses] = React.useState<any[]>([]);
  const [selectedClass, setSelectedClass] = React.useState<string>("");
  const [tab, setTab] = React.useState("view");
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  const roleId =
    typeof window !== "undefined"
      ? Number(localStorage.getItem("role_id"))
      : null;
  const isStudent = roleId === ROLE.STUDENT;
  const canManage = roleId ? ADMIN_GROUP.includes(roleId as any) : false;
  const userName = typeof window !== "undefined" ? localStorage.getItem("user_name") : null;
  const studentClassId = typeof window !== "undefined" ? localStorage.getItem("class_id") : null;

  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. Fetch class list so all classes are selectable regardless of schedule existence.
      const clsRes = await axios.get("/api/classes");
      const classData = clsRes.data.data || clsRes.data || [];
      setClasses(classData);

      if (isStudent && studentClassId) {
        setSelectedClass(studentClassId);
      } else if (classData.length > 0 && !selectedClass) {
        setSelectedClass(String(classData[0].class_id));
      }

      // 2. Fetch the actual schedules
      if (isStudent && studentClassId) {
        // Fetch specific week for student to show substitutes
        const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
        const data = await getMySchedule({ 
          class_id: parseInt(studentClassId),
          week_start: weekStart
        });
        setSchedules(data || []);
      } else {
        const data = await getSchoolSchedule();
        setSchedules(data || []);
      }

    } catch (e: any) {
      console.error("Failed to fetch schedule data", e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [isStudent, studentClassId]);

  const handleSaveBulk = async (classId: number, scheduleArray: any[]) => {
    await replaceClassSchedule(classId, scheduleArray);
    await fetchData(); // Reload data
    setTab("view"); // switch back to view
    setSelectedClass(classId.toString());
  };

  const handleDownloadPDF = async () => {
    if (!selectedClass) return;
    const cls = classes.find(c => c.class_id.toString() === selectedClass);
    const className = cls ? `${cls.class_name}${cls.section_name ? ` - ${cls.section_name}` : ""}` : "Class";

    try {
      toast({ title: "Generating PDF", description: "Preparing your branded timetable..." });
      
      const response = await axios.get(`/api/documents/timetable/${selectedClass}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${className}_Timetable.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast({ title: "Success", description: "Timetable downloaded successfully." });
    } catch (error) {
      console.error("Failed to download timetable PDF", error);
      toast({ 
        title: "Download Failed", 
        description: "Could not generate the branded timetable. Please try again.",
        variant: "destructive"
      });
    }
  };

  const renderScheduleTable = (classId: string) => {
    const classSchedules = schedules.filter(s => s.class_id.toString() === classId);

    // Sort all unique physical periods
    const periods = Array.from(new Set(classSchedules.map(s => s.period_number))).sort((a, b) => a - b);

    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary/50" />
          <p className="text-sm">Fetching timetable...</p>
        </div>
      );
    }

    if (periods.length === 0) {
      return (
        <div className="text-center py-10 text-muted-foreground border-t mt-4 font-medium italic">
          {isStudent 
            ? "No schedule has been posted for your class yet."
            : 'No schedule found for this class. Go to the "Manage Schedule" tab to create one.'
          }
        </div>
      );
    }

    let displayPeriodNumber = 1;

    return (
      <div className="w-full overflow-x-auto pb-4">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="border-b-0 hover:bg-transparent">
              <TableHead className="w-[110px] font-medium text-muted-foreground text-xs">Time</TableHead>
              {DAYS.map((day) => (
                <TableHead key={day.id} className="font-medium text-muted-foreground text-xs">{day.name}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {periods.map((periodNum, index) => {
              const sampleSchedule = classSchedules.find(s => s.period_number === periodNum);
              const timeRange = sampleSchedule
                ? `${to12h(sampleSchedule.start_time.substring(0, 5))} – ${to12h(sampleSchedule.end_time.substring(0, 5))}`
                : `Period ${periodNum}`;

              // Check if this row is completely a break
              const cellsInPeriod = classSchedules.filter(s => s.period_number === periodNum);
              const isLunchBreak = cellsInPeriod.length > 0 && cellsInPeriod.every(s => s.is_break);

              if (isLunchBreak) {
                return (
                  <TableRow key={periodNum} className="border-b-0 hover:bg-transparent group">
                    <TableCell className="font-medium text-sm text-foreground align-top pt-6">
                      <div className="whitespace-nowrap">{timeRange}</div>
                    </TableCell>
                    <TableCell colSpan={DAYS.length} className="pt-4 pb-2">
                      <div className="w-full bg-orange-50/50 rounded-full py-2 border border-orange-100 flex items-center justify-center">
                        <span className="text-orange-500 font-semibold tracking-wider text-xs uppercase">Lunch Break</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }

              const currentDisplayPeriod = displayPeriodNumber;
              displayPeriodNumber++; // Increment only for academic classes

              return (
                <TableRow key={periodNum} className="border-b-0 hover:bg-transparent">
                  <TableCell className="font-medium align-top pt-4 border-r-transparent">
                    <div className="whitespace-nowrap text-[11px] leading-tight font-bold">{timeRange}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">Period {currentDisplayPeriod}</div>
                  </TableCell>

                  {DAYS.map((day) => {
                    const cellData = classSchedules.find(s => s.period_number === periodNum && s.day_of_week === day.id);

                    const isMyPeriod = userName && cellData && userName.trim().toLowerCase() === `${cellData.staff_first_name || ''} ${cellData.staff_last_name || ''}`.trim().toLowerCase();

                    return (
                      <TableCell key={`${day.id}-${periodNum}`} className="h-[75px] min-w-[110px] align-top px-1.5 py-2 border-r-transparent">
                        {cellData ? (
                          cellData.is_break ? (
                            <div className="text-center text-[10px] text-orange-400 font-medium py-1">Break</div>
                          ) : (
                            <div className={`rounded-md p-2 border h-full transition-all duration-300 ${
                               cellData.is_substitute
                                 ? "bg-purple-50 border-purple-200 hover:bg-purple-100/80 shadow-sm"
                                 : isMyPeriod
                                   ? "bg-emerald-100/60 border-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-700/50 ring-1 ring-emerald-400"
                                   : "bg-blue-50/50 border-blue-100/50 hover:bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900/30 dark:hover:bg-blue-900/30"
                              }`}>
                              <div className={`font-semibold text-[11px] leading-tight truncate ${
                                cellData.is_substitute
                                  ? "text-purple-900"
                                  : isMyPeriod
                                    ? "text-emerald-900 dark:text-emerald-300"
                                    : "text-blue-800 dark:text-blue-300"
                              }`} title={cellData.subject_name}>
                                {cellData.subject_name}
                                {cellData.is_substitute && (
                                  <Badge variant="outline" className="ml-1 h-3 px-0.5 text-[7px] border-purple-300 bg-purple-100 text-purple-700">SUB</Badge>
                                )}
                              </div>
                              <div className={`text-[10px] mt-0.5 truncate opacity-80 ${
                                cellData.is_substitute
                                  ? "text-purple-700 font-medium"
                                  : isMyPeriod
                                    ? "text-emerald-700 dark:text-emerald-500 font-medium"
                                    : "text-slate-500 dark:text-slate-400"
                              }`} title={`${cellData.effective_first_name || cellData.staff_first_name} ${cellData.effective_last_name || cellData.staff_last_name}`}>
                                {cellData.effective_first_name || cellData.staff_first_name} {cellData.effective_last_name || cellData.staff_last_name}
                              </div>
                            </div>
                          )
                        ) : (
                          <div className="h-full rounded-md border border-dashed border-muted/50 flex items-center justify-center">
                            <span className="text-muted-foreground/30 text-xs">-</span>
                          </div>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Schedule</h2>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        {canManage && (
          <div className="flex items-center">
            <TabsList>
              <TabsTrigger value="view">
                <CalendarDays className="h-4 w-4 mr-2" />
                View Schedule
              </TabsTrigger>
              <TabsTrigger value="manage">
                <Settings className="h-4 w-4 mr-2" />
                Manage Schedule
              </TabsTrigger>
            </TabsList>
          </div>
        )}

        <TabsContent value="view">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-transparent">
                <div>
                  <CardTitle className="font-headline">
                    {isStudent ? "Your Class Schedule" : "Class Schedules"}
                  </CardTitle>
                  <CardDescription>
                    {isStudent ? "Weekly timetable for your current grade" : "Select a class to view its schedule."}
                  </CardDescription>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                  {!isStudent && classes.length > 0 && (
                    <Select onValueChange={(val) => setSelectedClass(val)} value={selectedClass}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((c) => (
                          <SelectItem key={c.class_id} value={c.class_id.toString()}>
                            {c.class_name}{c.section_name ? ` - ${c.section_name}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {selectedClass && (
                    <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={loading}>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 overflow-hidden">
              {loading ? (
                <PageSkeleton rows={5} />
              ) : selectedClass ? (
                renderScheduleTable(selectedClass)
              ) : (
                <div className="text-center py-10 text-muted-foreground border rounded-md bg-muted/20">
                  {isStudent 
                    ? "Your class schedule is not available."
                    : "No classes with schedules found. Go to 'Manage Schedule' to create one."
                  }
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {canManage && (
          <TabsContent value="manage">
            <ManageScheduleGrid
              onSave={handleSaveBulk}
              existingSchedules={schedules}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
