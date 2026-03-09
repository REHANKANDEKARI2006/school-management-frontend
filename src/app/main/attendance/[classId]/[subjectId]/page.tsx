
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StudentAttendanceCard } from '@/components/campus-connect/student-attendance-card';
import type { Student, AttendanceRecord, ClassItem, Subject, AttendanceStatus } from '@/types';
import { ArrowLeft, ArrowRight, CalendarDays, CheckSquare, Library, Users, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import axios from "@/lib/axios";

export default function AttendancePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const classId = params.classId as string;
  const subjectId = params.subjectId as string;

  const [currentClass, setCurrentClass] = useState<any>(null);
  const [currentSubject, setCurrentSubject] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classRes, subjectRes, studentsRes] = await Promise.all([
          axios.get(`/api/classes/${classId}`),
          axios.get(`/api/subjects/${subjectId}`),
          axios.get(`/api/attendance/students?classId=${classId}`)
        ]);

        if (classRes.data.success) setCurrentClass(classRes.data.data);
        if (subjectRes.data.success) setCurrentSubject(subjectRes.data.data);

        if (studentsRes.data.success) {
          const studentData = studentsRes.data.data;
          setStudents(studentData);

          // Check if session already exists for today to pre-fill attendance
          const dateString = format(new Date(), 'yyyy-MM-dd');
          const sectionId = classRes.data.data?.section_id;

          let existingRecords: any[] = [];
          if (sectionId) {
            try {
              const checkRes = await axios.get(`/api/attendance/session/check`, {
                params: { class_id: classId, section_id: sectionId, subject_id: subjectId, attendance_date: dateString }
              });
              if (checkRes.data.success && checkRes.data.data?.session_id) {
                const summaryRes = await axios.get(`/api/attendance/summary?sessionId=${checkRes.data.data.session_id}`);
                if (summaryRes.data.success) {
                  existingRecords = summaryRes.data.data;
                }
              }
            } catch (e) {
              console.warn("No existing session found or error fetching it.");
            }
          }

          setAttendanceRecords(studentData.map((s: any) => {
            const existing = existingRecords.find(r => r.student_id === s.student_id);
            let mappedStatus = 'pending';
            if (existing) {
              if (existing.status === 'Present') mappedStatus = 'present';
              else if (existing.status === 'Absent' || existing.status === 'On Leave' || existing.status === 'Late') mappedStatus = 'absent';
            }
            return {
              studentId: s.student_id,
              status: mappedStatus
            };
          }));
        }
      } catch (err) {
        console.error("Failed to fetch attendance data", err);
        toast({ title: "Error", description: "Failed to load class, subject or student data.", variant: "destructive" });
      }
    };

    fetchData();

    const today = new Date();
    setCurrentDate(today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  }, [classId, subjectId, toast]);

  const currentStudent = useMemo(() => students[currentIndex], [students, currentIndex]);

  const handleMarkAttendance = (status: AttendanceStatus) => {
    if (!currentStudent) return;

    setAttendanceRecords(prevRecords =>
      prevRecords.map(record =>
        record.studentId === currentStudent.student_id ? { ...record, status } : record
      )
    );

    if (currentIndex < students.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < students.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleFinalize = async () => {
    if (students.length === 0) {
      toast({ title: "No Students", description: "Cannot finalize attendance with no students.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const today = new Date();
      const dateString = format(today, 'yyyy-MM-dd');

      const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null;
      const facultyId = storedUserId ? parseInt(storedUserId) : 76;

      // 1. Create Session
      const sessionRes = await axios.post('/api/attendance/session', {
        class_id: classId,
        section_id: currentClass.section_id,
        subject_id: subjectId,
        attendance_date: dateString,
        faculty_id: facultyId,
        created_by: facultyId
      });

      if (sessionRes.data.success) {
        const sessionId = sessionRes.data.data.session_id;

        // 2. Create Records
        const recordsToSave = attendanceRecords.map(r => ({
          student_id: r.studentId,
          status_id: r.status === 'present' ? 1 : 2, // 1: Present, 2: Absent
          remarks: ''
        }));

        const recordsRes = await axios.post('/api/attendance/record', {
          session_id: sessionId,
          records: recordsToSave
        });

        if (recordsRes.data.success) {
          router.push(`/main/attendance/${classId}/${subjectId}/summary?date=${dateString}`);
        }
      }
    } catch (err) {
      console.error("Failed to finalize attendance", err);
      toast({ title: "Error", description: "Failed to save attendance records.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const markedStudentsCount = attendanceRecords.filter(r => r.status !== 'pending').length;
  const progress = students.length > 0 ? (markedStudentsCount / students.length) * 100 : 0;

  if (!currentClass || !currentSubject) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentStudentAttendance = currentStudent ? attendanceRecords.find(ar => ar.studentId === currentStudent.student_id) : undefined;

  return (
    <div className="container mx-auto py-8 px-4 flex flex-col items-center">
      <div className="w-full max-w-5xl mb-8 relative">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-6">
          <div className="w-full flex justify-center lg:absolute lg:top-0 lg:left-0 lg:w-auto">
            <Button onClick={() => router.push('/main/attendance')} variant="outline" className="rounded-lg h-10 px-4 bg-white/50 border-slate-200">
              <Home className="mr-2 h-4 w-4" /> Back to Attendance Dashboard
            </Button>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-4 bg-white/50 border border-slate-200 rounded-lg px-6 py-3 text-sm font-medium text-slate-700 w-fit">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-500" />
              <span>Class: <strong>{currentClass.class_name}{currentClass.section_name ? ` - ${currentClass.section_name}` : ''}</strong></span>
            </div>
            <div className="w-px h-4 bg-slate-300 hidden md:block"></div>
            <div className="flex items-center gap-2">
              <Library className="h-4 w-4 text-indigo-500" />
              <span>Subject: <strong>{currentSubject.subject_name}</strong></span>
            </div>
            <div className="w-px h-4 bg-slate-300 hidden md:block"></div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-indigo-500" />
              <span>Date: <strong>{currentDate}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {students.length === 0 ? (
        <Card className="w-full max-w-md text-center p-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <h3 className="text-xl font-bold">No Students Found</h3>
          <Button onClick={() => router.push('/main/attendance')} className="mt-4">Return</Button>
        </Card>
      ) : currentStudent ? (
        <div className="flex flex-col items-center w-full">
          <StudentAttendanceCard
            student={currentStudent}
            onMarkPresent={() => handleMarkAttendance('present')}
            onMarkAbsent={() => handleMarkAttendance('absent')}
            currentStatus={currentStudentAttendance?.status}
          />

          <div className="w-full max-w-sm mt-8 space-y-6">
            <div className="space-y-3">
              <Progress value={progress} className="h-2.5 bg-slate-100" />
              <p className="text-center text-sm font-medium text-slate-500">
                {markedStudentsCount} of {students.length} students marked
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="flex-1 rounded-xl h-11 text-slate-500"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              <Button
                onClick={handleNext}
                disabled={currentIndex === students.length - 1}
                className="flex-1 rounded-xl h-11 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {markedStudentsCount === students.length && (
              <Button
                onClick={handleFinalize}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl mt-4"
                disabled={isSubmitting}
              >
                <CheckSquare className="mr-2 h-5 w-5" />
                {isSubmitting ? "Finalizing..." : "Review & Finalize"}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      )}
    </div>
  );
}
