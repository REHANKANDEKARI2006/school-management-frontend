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
import { Loader2 } from "lucide-react";

// The prototype design does not show Saturday
const DAYS = [
  { id: 1, name: "Monday" },
  { id: 2, name: "Tuesday" },
  { id: 3, name: "Wednesday" },
  { id: 4, name: "Thursday" },
  { id: 5, name: "Friday" },
];

const to12h = (time: string) => {
  if (!time) return "";
  const [hStr, mStr] = time.split(":");
  const h = parseInt(hStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${period}`;
};

interface Props {
  faculty: any; // Using the faculty object passed from the parent
}

export function FacultySchedule({ faculty }: Props) {
  const [schedules, setSchedules] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/schedule/my?staff_id=${faculty.staff_id}`);
        setSchedules(res.data.data || []);
      } catch (error) {
        console.error("Failed to fetch faculty schedule", error);
      } finally {
        setLoading(false);
      }
    };
    if (faculty?.staff_id) {
      fetchSchedule();
    }
  }, [faculty?.staff_id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Sort periods
  const periods = Array.from(new Set(schedules.map(s => s.period_number))).sort((a, b) => a - b);

  if (periods.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground border rounded-md mt-4">
        No schedule assigned to this faculty member.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto mt-4 w-full">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b">
            <TableHead className="w-[120px] font-medium text-slate-500 py-4">Time</TableHead>
            {DAYS.map((day) => (
              <TableHead key={day.id} className="font-medium text-slate-500 py-4">{day.name}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {periods.map((periodNum) => {
            const sampleSchedule = schedules.find(s => s.period_number === periodNum);
            const timeStr = sampleSchedule && sampleSchedule.start_time 
              ? to12h(sampleSchedule.start_time.substring(0, 5))
              : `Period ${periodNum}`;

            return (
              <TableRow key={periodNum} className="hover:bg-transparent border-b">
                <TableCell className="font-medium text-sm text-foreground py-5">
                  {timeStr}
                </TableCell>

                {DAYS.map((day) => {
                  const cellData = schedules.find(s => s.period_number === periodNum && s.day_of_week === day.id);

                  if (!cellData) {
                    return (
                      <TableCell key={`${day.id}-${periodNum}`} className="py-5 text-sm text-foreground">
                        Free
                      </TableCell>
                    );
                  }

                  if (cellData.is_break) {
                     return (
                        <TableCell key={`${day.id}-${periodNum}`} className="py-5 text-sm font-medium text-blue-600">
                          Lunch
                        </TableCell>
                     );
                  }

                  const classText = `${cellData.class_name}${cellData.section_name ? `-${cellData.section_name}` : ""}`;
                  const subjectText = cellData.subject_name || "";

                  return (
                    <TableCell key={`${day.id}-${periodNum}`} className="py-5 text-sm">
                      <div className="font-medium text-foreground">{classText}</div>
                      {subjectText && <div className="text-muted-foreground text-xs mt-0.5">{subjectText}</div>}
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
}
