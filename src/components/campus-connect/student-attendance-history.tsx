
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getSubjectById, getStudentById } from "@/lib/mock-data";
import { type Student, type AttendanceRecord } from "@/types";
import { Check, X, CalendarClock } from "lucide-react";

interface AttendanceHistoryProps {
  student: Student;
}

type HistoricalRecord = {
  date: string;
  subjectName: string;
  status: 'present' | 'absent' | 'pending';
};

const getStatusVariant = (status: string) => {
    switch (status) {
        case "present": return "default";
        case "absent": return "destructive";
        default: return "secondary";
    }
}

export function StudentAttendanceHistory({ student }: AttendanceHistoryProps) {
  const [history, setHistory] = React.useState<HistoricalRecord[]>([]);

  React.useEffect(() => {
    const fetchHistory = () => {
      if (typeof window === "undefined" || !student) return;

      const studentWithSubjects = getStudentById(student.id);
      if (!studentWithSubjects?.subjectIds) {
        setHistory([]);
        return;
      }
      
      const allRecords: HistoricalRecord[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("attendance-")) {
          const parts = key.split('-');
          // key format: attendance-{classId}-{subjectId}-{date}
          if (parts.length === 4) {
            const subjectId = parts[2];
            const date = parts[3];

            // Check if student is enrolled in this subject
            if (studentWithSubjects.subjectIds.includes(subjectId)) {
                const storedRecordsRaw = localStorage.getItem(key);
                if (storedRecordsRaw) {
                    try {
                        const records: AttendanceRecord[] = JSON.parse(storedRecordsRaw);
                        const studentRecord = records.find(r => r.studentId === student.id);

                        if (studentRecord && studentRecord.status !== 'pending') {
                            const subject = getSubjectById(subjectId);
                            allRecords.push({
                                date,
                                subjectName: subject?.name || 'Unknown Subject',
                                status: studentRecord.status,
                            });
                        }
                    } catch (e) {
                        console.error(`Failed to parse attendance for key ${key}`, e);
                    }
                }
            }
          }
        }
      }
      
      // Sort by date descending
      allRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setHistory(allRecords);
    };

    fetchHistory();
  }, [student]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Attendance History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {history.length > 0 ? (
          <div className="max-h-48 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((record, index) => (
                  <TableRow key={index}>
                    <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                    <TableCell>{record.subjectName}</TableCell>
                    <TableCell className="text-right">
                       <Badge variant={getStatusVariant(record.status)} className="capitalize">
                        {record.status === 'present' ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                         {record.status}
                       </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No attendance history found for this student.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
