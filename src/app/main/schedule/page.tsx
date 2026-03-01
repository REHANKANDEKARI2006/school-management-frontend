"use client";

import * as React from "react";
import { CalendarDays, Settings } from "lucide-react";
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
import { getSchoolSchedule, replaceClassSchedule } from "@/lib/api/schedule";
import { ManageScheduleGrid } from "@/components/campus-connect/manage-schedule-grid";

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

export default function SchedulePage() {
  const [schedules, setSchedules] = React.useState<any[]>([]);
  const [classes, setClasses] = React.useState<any[]>([]);
  const [selectedClass, setSelectedClass] = React.useState<string>("");
  const [tab, setTab] = React.useState("view");

  const fetchData = async () => {
    try {
      // 1. Fetch class list so all classes are selectable regardless of schedule existence.
      const clsRes = await axios.get("/api/classes");
      const classData = clsRes.data.data || clsRes.data || [];
      setClasses(classData);

      if (classData.length > 0 && !selectedClass) {
        setSelectedClass(String(classData[0].class_id));
      }

      // 2. Fetch the actual schedules
      const data = await getSchoolSchedule();
      setSchedules(data || []);

    } catch (e: any) {
      console.error("Failed to fetch schedule data", e);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleSaveBulk = async (classId: number, scheduleArray: any[]) => {
    await replaceClassSchedule(classId, scheduleArray);
    await fetchData(); // Reload data
    setTab("view"); // switch back to view
    setSelectedClass(classId.toString());
  };

  const renderScheduleTable = (classId: string) => {
    const classSchedules = schedules.filter(s => s.class_id.toString() === classId);

    // Sort all unique physical periods
    const periods = Array.from(new Set(classSchedules.map(s => s.period_number))).sort((a, b) => a - b);

    if (periods.length === 0) {
      return (
        <div className="text-center py-10 text-muted-foreground border-t mt-4">
          No schedule found for this class. Go to the "Manage Schedule" tab to create one.
        </div>
      );
    }

    let displayPeriodNumber = 1;

    return (
      <div className="overflow-x-auto pb-4">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow className="border-b-0 hover:bg-transparent">
              <TableHead className="w-[150px] font-medium text-muted-foreground">Time</TableHead>
              {DAYS.map((day) => (
                <TableHead key={day.id} className="font-medium text-muted-foreground">{day.name}</TableHead>
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
                  <TableCell className="font-medium align-top pt-6 border-r-transparent">
                    <div className="whitespace-nowrap text-sm">{timeRange}</div>
                    <div className="text-xs text-muted-foreground mt-1">Period {currentDisplayPeriod}</div>
                  </TableCell>

                  {DAYS.map((day) => {
                    const cellData = classSchedules.find(s => s.period_number === periodNum && s.day_of_week === day.id);

                    return (
                      <TableCell key={`${day.id}-${periodNum}`} className="h-[90px] min-w-[140px] align-top px-2 py-3 border-r-transparent">
                        {cellData ? (
                          cellData.is_break ? (
                            <div className="text-center text-xs text-orange-400 font-medium py-2">Break</div>
                          ) : (
                            <div className="bg-blue-50/50 rounded-md p-3 border border-blue-100/50 h-full transition-colors hover:bg-blue-50">
                              <div className="font-semibold text-blue-800 text-sm truncate" title={cellData.subject_name}>{cellData.subject_name}</div>
                              <div className="text-xs text-slate-500 mt-1 truncate" title={`${cellData.staff_first_name} ${cellData.staff_last_name}`}>
                                {cellData.staff_first_name} {cellData.staff_last_name}
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Schedule</h2>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
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

        <TabsContent value="view">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center bg-transparent">
                <div>
                  <CardTitle className="font-headline">Class Schedules</CardTitle>
                  <CardDescription>
                    Select a class to view its schedule.
                  </CardDescription>
                </div>

                {classes.length > 0 && (
                  <Select onValueChange={(val) => setSelectedClass(val)} value={selectedClass}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c.class_id} value={c.class_id.toString()}>
                          {c.class_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {selectedClass ? (
                renderScheduleTable(selectedClass)
              ) : (
                <div className="text-center py-10 text-muted-foreground border rounded-md bg-muted/20">
                  No classes with schedules found. Go to 'Manage Schedule' to create one.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage">
          <ManageScheduleGrid
            onSave={handleSaveBulk}
            existingSchedules={schedules}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
