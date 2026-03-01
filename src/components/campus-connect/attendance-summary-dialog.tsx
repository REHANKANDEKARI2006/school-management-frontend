
"use client";

import { useState, useEffect, useCallback } from 'react';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getStudentsForSubjectInClass, getStudentsByClass as getAllStudentsInClass, getClassById, getSubjectById } from '@/lib/mock-data';
import { Check, X, Users, Library, CalendarDays, AlertTriangle } from 'lucide-react';
import { format } from "date-fns";
import { useRouter } from 'next/navigation';
import axios from "@/lib/axios";

interface AttendanceSummaryDialogProps {
  classId: string;
  subjectId: string;
  date: Date;
  sessionId?: string;
}

export function AttendanceSummaryDialog({ classId, subjectId, date, sessionId }: AttendanceSummaryDialogProps) {
  const router = useRouter();
  const [currentClass, setCurrentClass] = useState<any>(null);
  const [currentSubject, setCurrentSubject] = useState<any>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch class and subject details too
      const [classRes, subjectRes] = await Promise.all([
        axios.get(`/api/classes/${classId}`),
        axios.get(`/api/subjects/${subjectId}`)
      ]);

      if (classRes.data.success) setCurrentClass(classRes.data.data);
      if (subjectRes.data.success) setCurrentSubject(subjectRes.data.data);

      let sid = sessionId;

      // If sessionId not provided but date is today, check if session exists
      if (!sid) {
        const dateString = format(date, "yyyy-MM-dd");
        const checkRes = await axios.get(`/api/attendance/session/check?class_id=${classId}&subject_id=${subjectId}&attendance_date=${dateString}`);
        if (checkRes.data.success && checkRes.data.data) {
          sid = checkRes.data.data.session_id;
        }
      }

      if (sid) {
        const res = await axios.get(`/api/attendance/summary?sessionId=${sid}`);
        if (res.data.success) {
          setAttendanceRecords(res.data.data);
        }
      } else {
        setAttendanceRecords([]);
      }
    } catch (err) {
      console.error("Failed to fetch summary", err);
      setError("Failed to load attendance summary.");
    } finally {
      setIsLoading(false);
    }
  }, [classId, subjectId, date, sessionId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
  const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;

  return (
    <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-none shadow-2xl">
      <DialogHeader className="p-6 pb-0">
        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
          <Library className="h-6 w-6 text-indigo-600" />
          Attendance Summary
        </DialogTitle>
        <DialogDescription>
          Records for {currentSubject?.subject_name} on {format(date, "PPP")}.
        </DialogDescription>
      </DialogHeader>

      <div className="p-6">
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-48 space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            <p className="text-muted-foreground text-sm font-medium">Loading records...</p>
          </div>
        ) : !currentClass || !currentSubject ? (
          <div className="p-8 text-center border rounded-xl bg-slate-50">
            <AlertTriangle className="mx-auto h-10 w-10 text-rose-500 mb-2" />
            <p className="font-bold">Sync Failed</p>
            <p className="text-sm text-muted-foreground">Class or subject details not found.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 border rounded-xl bg-slate-50/50">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Class</p>
                <p className="font-bold text-slate-800">{currentClass.class_name}</p>
              </div>
              <div className="p-3 border rounded-xl bg-slate-50/50">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Subject</p>
                <p className="font-bold text-slate-800">{currentSubject.subject_name}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1 p-3 border rounded-xl bg-green-50/50 flex flex-col items-center">
                <span className="text-[10px] font-bold text-green-600 uppercase mb-1">Present</span>
                <span className="text-2xl font-black text-green-600">{presentCount}</span>
              </div>
              <div className="flex-1 p-3 border rounded-xl bg-rose-50/50 flex flex-col items-center">
                <span className="text-[10px] font-bold text-rose-600 uppercase mb-1">Absent</span>
                <span className="text-2xl font-black text-rose-600">{absentCount}</span>
              </div>
            </div>

            <div className="border rounded-xl overflow-hidden shadow-sm">
              <div className="max-h-[40vh] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-slate-50 sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="w-[80px]">Roll</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead className="text-center w-[100px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground italic">
                          No attendance marked yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      attendanceRecords.map((record) => {
                        const isPresent = record.status?.toLowerCase() === 'present';
                        return (
                          <TableRow key={record.student_id}>
                            <TableCell className="font-mono text-xs">{record.roll_number}</TableCell>
                            <TableCell className="font-bold">{record.name}</TableCell>
                            <TableCell className="text-center">
                              {isPresent ? (
                                <span className="inline-flex items-center text-green-600 font-bold text-[11px] uppercase">
                                  <Check className="mr-1 h-3.5 w-3.5" /> Present
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-rose-600 font-bold text-[11px] uppercase">
                                  <X className="mr-1 h-3.5 w-3.5" /> Absent
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <Button
              onClick={() => router.push(`/main/attendance/${classId}/${subjectId}/summary?date=${format(date, "yyyy-MM-dd")}`)}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200"
            >
              View Full Analytics
            </Button>
          </div>
        )}
      </div>
    </DialogContent>
  );
}
