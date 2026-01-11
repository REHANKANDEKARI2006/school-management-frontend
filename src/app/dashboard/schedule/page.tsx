
"use client";

import * as React from "react";
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
import { Separator } from "@/components/ui/separator";

const mySchedule = {
  Monday: ["Mathematics", "Physics", "Lunch", "History", "English"],
  Tuesday: ["Chemistry", "Biology", "Lunch", "Geography", "Physical Ed."],
  Wednesday: ["English", "Mathematics", "Lunch", "Physics", "History"],
  Thursday: ["Biology", "Chemistry", "Lunch", "Physical Ed.", "Geography"],
  Friday: ["History", "English", "Lunch", "Mathematics", "Physics"],
};

const schoolSchedule = {
  "Class 10": {
    "Section A": {
      Monday: ["Mathematics", "Physics", "Lunch", "History", "English"],
      Tuesday: ["Chemistry", "Biology", "Lunch", "Geography", "Physical Ed."],
      Wednesday: ["English", "Mathematics", "Lunch", "Physics", "History"],
      Thursday: ["Biology", "Chemistry", "Lunch", "Physical Ed.", "Geography"],
      Friday: ["History", "English", "Lunch", "Mathematics", "Physics"],
    },
    "Section B": {
      Monday: ["History", "English", "Lunch", "Mathematics", "Physics"],
      Tuesday: ["Physics", "Chemistry", "Lunch", "Biology", "English"],
      Wednesday: ["Mathematics", "Geography", "Lunch", "History", "Physical Ed."],
      Thursday: ["English", "Biology", "Lunch", "Chemistry", "Mathematics"],
      Friday: ["Geography", "Physics", "Lunch", "English", "History"],
    },
  },
  "Class 11": {
    "Section A": {
      Monday: ["Physics", "Chemistry", "Lunch", "Biology", "English"],
      Tuesday: ["Mathematics", "Geography", "Lunch", "History", "Physical Ed."],
      Wednesday: ["Biology", "English", "Lunch", "Physics", "Chemistry"],
      Thursday: ["History", "Mathematics", "Lunch", "Physical Ed.", "Geography"],
      Friday: ["Chemistry", "Physics", "Lunch", "English", "Mathematics"],
    },
    "Section B": {
      Monday: ["Biology", "English", "Lunch", "Physics", "Chemistry"],
      Tuesday: ["History", "Mathematics", "Lunch", "Physical Ed.", "Geography"],
      Wednesday: ["Physics", "Chemistry", "Lunch", "Biology", "English"],
      Thursday: ["Mathematics", "Geography", "Lunch", "History", "Physical Ed."],
      Friday: ["English", "Biology", "Lunch", "Chemistry", "Mathematics"],
    },
  },
  "Class 12": {
    "Section A": {
      Monday: ["English", "Biology", "Lunch", "Chemistry", "Mathematics"],
      Tuesday: ["Physics", "Chemistry", "Lunch", "Biology", "English"],
      Wednesday: ["History", "Mathematics", "Lunch", "Physical Ed.", "Geography"],
      Thursday: ["Mathematics", "Geography", "Lunch", "History", "Physical Ed."],
      Friday: ["Biology", "English", "Lunch", "Physics", "Chemistry"],
    },
    "Section B": {
      Monday: ["Physical Ed.", "History", "Lunch", "Geography", "Mathematics"],
      Tuesday: ["English", "Biology", "Lunch", "Chemistry", "Mathematics"],
      Wednesday: ["Physics", "Chemistry", "Lunch", "Biology", "English"],
      Thursday: ["History", "Mathematics", "Lunch", "Physical Ed.", "Geography"],
      Friday: ["Chemistry", "Physics", "Lunch", "English", "Mathematics"],
    },
  },
};

const timeSlots = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM"];
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

type ClassName = keyof typeof schoolSchedule;

export default function SchedulePage() {
  const [selectedClass, setSelectedClass] = React.useState<ClassName>("Class 10");

  const renderScheduleTable = (scheduleData: { [day: string]: string[] }) => (
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
                {scheduleData[day][timeIndex] === "Lunch" ? (
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
  );

  return (
    <Tabs defaultValue="my-schedule">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="my-schedule">My Schedule</TabsTrigger>
          <TabsTrigger value="school-schedule">School Schedule</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="my-schedule">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">My Weekly Schedule</CardTitle>
            <CardDescription>
              Your personal class schedule for the week.
            </CardDescription>
          </CardHeader>
          <CardContent>{renderScheduleTable(mySchedule)}</CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="school-schedule">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="font-headline">Full School Schedule</CardTitle>
                <CardDescription>
                  View schedules for all classes and teachers.
                </CardDescription>
              </div>
              <Select onValueChange={(value: ClassName) => setSelectedClass(value)} defaultValue={selectedClass}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(schoolSchedule).map((className) => (
                    <SelectItem key={className} value={className}>{className}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(schoolSchedule[selectedClass]).map(
              ([section, scheduleData]) => (
                <div key={section}>
                  <h3 className="text-xl font-bold tracking-tight mb-2 font-headline">{`${selectedClass} - ${section}`}</h3>
                  {renderScheduleTable(scheduleData)}
                </div>
              )
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
