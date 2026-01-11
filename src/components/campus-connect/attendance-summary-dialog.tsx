
"use client";

import { useState, useEffect, useCallback } from 'react';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getStudentsForSubjectInClass, getStudentsByClass as getAllStudentsInClass, getClassById, getSubjectById } from '@/lib/mock-data';
import type { Student, AttendanceRecord, ClassItem, Subject, AttendanceStatus } from '@/types';
import { Check, X, Users, Library, CalendarDays, AlertTriangle } from 'lucide-react';
import { format } from "date-fns";
import { useRouter } from 'next/navigation';

interface AttendanceSummaryDialogProps {
  classId: string;
  subjectId: string;
  date: Date;
}

export function AttendanceSummaryDialog({ classId, subjectId, date }: AttendanceSummaryDialogProps) {
  const router = useRouter();
  const [currentClass, setCurrentClass] = useState<ClassItem | null>(null);
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [allStudentsInClassForLookup, setAllStudentsInClassForLookup] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const classData = getClassById(classId);
    const subjectData = getSubjectById(subjectId);
    const allStudents = getAllStudentsInClass(classId);
    setAllStudentsInClassForLookup(allStudents);

    if(classData) setCurrentClass(classData);
    if(subjectData) setCurrentSubject(subjectData);

    const dateString = format(date, "yyyy-MM-dd");
    const key = `attendance-${classId}-${subjectId}-${dateString}`;
    const storedRecordsRaw = localStorage.getItem(key);

    if (storedRecordsRaw) {
      try {
        const records: AttendanceRecord[] = JSON.parse(storedRecordsRaw);
        setAttendanceRecords(records.filter(r => r.status !== 'pending'));
      } catch (e) {
        console.error("Failed to parse attendance records for dialog", e);
        setAttendanceRecords([]);
      }
    } else {
        setAttendanceRecords([]);
    }

    setIsLoading(false);
  }, [classId, subjectId, date]);
  
  const getStudentDetails = useCallback((studentId: string): { name: string; rollNumber: string } => {
    const student = allStudentsInClassForLookup.find(s => s.id === studentId);
    return {
        name: student?.name || 'Unknown Student',
        rollNumber: student?.rollNumber || 'N/A'
    };
  }, [allStudentsInClassForLookup]);

  const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
  const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;

  return (
    <DialogContent className="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle className="text-xl">Attendance Summary</DialogTitle>
        <DialogDescription>
          Read-only summary for {currentSubject?.name} on {format(date, "PPP")}.
        </DialogDescription>
      </DialogHeader>
      <div className="max-h-[70vh] overflow-y-auto pr-2">
        <Card className="shadow-none border-0">
          <CardContent className="p-0">
             {isLoading ? (
                <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : !currentClass || !currentSubject ? (
                <div className="text-center py-4">
                    <AlertTriangle className="mx-auto h-8 w-8 text-destructive mb-2" />
                    <p>Could not load class or subject data.</p>
                </div>
            ) : attendanceRecords.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No attendance data found for this day.</p>
            ) : (
            <>
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground pb-4">
                <div className="flex items-center"><Users className="mr-2 h-4 w-4 text-primary" /> Class: <span className="font-semibold text-foreground ml-1">{currentClass.name}</span></div>
                <div className="flex items-center"><Library className="mr-2 h-4 w-4 text-primary" /> Subject: <span className="font-semibold text-foreground ml-1">{currentSubject.name}</span></div>
            </div>
            <div className="flex gap-4 pb-4">
                <span className="font-semibold text-green-600">Present: {presentCount}</span>
                <span className="font-semibold text-destructive">Absent: {absentCount}</span>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Roll No.</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.map((record) => {
                  const studentInfo = getStudentDetails(record.studentId);
                  if (studentInfo.name === 'Unknown Student') return null;

                  return (
                    <TableRow key={record.studentId}>
                      <TableCell>{studentInfo.rollNumber}</TableCell>
                      <TableCell>{studentInfo.name}</TableCell>
                      <TableCell className="text-center">
                        {record.status === 'present' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Check className="mr-1 h-3 w-3" /> Present
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <X className="mr-1 h-3 w-3" /> Absent
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <Button 
                variant="secondary" 
                className="w-full mt-6"
                onClick={() => router.push(`/dashboard/attendance/${classId}/${subjectId}/summary?date=${format(date, "yyyy-MM-dd")}`)}
            >
                View Full Interactive Summary
            </Button>
            </>
            )}
          </CardContent>
        </Card>
      </div>
    </DialogContent>
  );
}
