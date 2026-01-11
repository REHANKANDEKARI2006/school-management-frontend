
"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type Faculty } from "./faculty-form";

interface FacultyScheduleProps {
    faculty: Faculty;
}

const facultySchedules: {[key: string]: { [day: string]: string[] }} = {
  "Dr. Evelyn Reed": {
    Monday: ["10-A Physics", "11-A Physics", "Lunch", "Lab Duty", "Free"],
    Tuesday: ["11-A Physics", "Free", "Lunch", "10-A Physics", "Lab Duty"],
    Wednesday: ["Free", "10-A Physics", "Lunch", "11-A Physics", "Free"],
    Thursday: ["Lab Duty", "11-A Physics", "Lunch", "Free", "10-A Physics"],
    Friday: ["10-A Physics", "Lab Duty", "Lunch", "11-A Physics", "Free"],
  },
  "Mr. Benjamin Carter": {
    Monday: ["12-B Calculus", "11-B Pre-Calc", "Lunch", "Free", "12-B Calculus"],
    Tuesday: ["11-B Pre-Calc", "Free", "Lunch", "12-B Calculus", "11-B Pre-Calc"],
    Wednesday: ["Free", "12-B Calculus", "Lunch", "11-B Pre-Calc", "Free"],
    Thursday: ["12-B Calculus", "11-B Pre-Calc", "Lunch", "Free", "12-B Calculus"],
    Friday: ["11-B Pre-Calc", "Free", "Lunch", "12-B Calculus", "11-B Pre-Calc"],
  },
   "Ms. Sophia Loren": {
    Monday: ["On Leave"], Tuesday: ["On Leave"], Wednesday: ["On Leave"], Thursday: ["On Leave"], Friday: ["On Leave"],
  },
  "default": {
    Monday: ["Free", "Class", "Lunch", "Class", "Free"],
    Tuesday: ["Class", "Free", "Lunch", "Free", "Class"],
    Wednesday: ["Free", "Class", "Lunch", "Class", "Free"],
    Thursday: ["Class", "Free", "Lunch", "Free", "Class"],
    Friday: ["Free", "Class", "Lunch", "Class", "Free"],
  }
};


const timeSlots = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM"];
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export function FacultySchedule({ faculty }: FacultyScheduleProps) {
  const scheduleData = facultySchedules[faculty.name] || facultySchedules.default;

  return (
    <div className="w-full">
        <Table>
        <TableHeader>
            <TableRow>
            <TableHead className="w-[100px]">Time</TableHead>
            {days.map((day) => (
                <TableHead key={day}>{day}</TableHead>
            ))}
            </TableRow>
        </TableHeader>
        <TableBody>
            {timeSlots.map((time, timeIndex) => (
            <TableRow key={time}>
                <TableCell className="font-medium">{time}</TableCell>
                {days.map((day, dayIndex) => (
                <TableCell key={`${dayIndex}-${timeIndex}`}>
                    {scheduleData[day].length === 1 ? (
                        <div className="font-semibold text-primary">
                            {scheduleData[day][0]}
                        </div>
                    ) : scheduleData[day][timeIndex] === "Lunch" ? (
                    <div className="font-semibold text-primary">
                        {scheduleData[day][timeIndex]}
                    </div>
                    ) : (
                    scheduleData[day][timeIndex]
                    )}
                </TableCell>
                ))}
            </TableRow>
            ))}
        </TableBody>
        </Table>
    </div>
  );
}
