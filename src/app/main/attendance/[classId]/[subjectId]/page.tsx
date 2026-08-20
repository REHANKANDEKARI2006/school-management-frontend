
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StudentAttendanceCard } from '@/components/school-os/student-attendance-card';
import type { Student, AttendanceRecord, ClassItem, Subject, AttendanceStatus } from '@/types';
import { ArrowLeft, ArrowRight, CalendarDays, CheckSquare, Library, Users, Home, RotateCcw, Check, X, Sparkles, XCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { cn, formatDate } from "@/lib/utils";
import axios from "@/lib/axios";
import { PageSkeleton } from "@/components/ui/skeletons";

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
          const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
          const envUrl = process.env.NEXT_PUBLIC_API_URL;
          const baseUrl = envUrl && envUrl.includes('://')
            ? (envUrl.endsWith('/api') ? envUrl.slice(0, -4) : envUrl)
            : `http://${hostname}:5000`;

          const studentData = studentsRes.data.data.map((s: any) => {
            const rawUrl = s.profile_url || s.avatar || s.profileUrl;
            let fixedUrl = rawUrl;
            
            if (rawUrl && !rawUrl.startsWith('http')) {
              const path = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
              fixedUrl = `${baseUrl}${path}`;
            }

            return {
              ...s,
              id: String(s.student_id),
              avatar: fixedUrl,
              fallback: s.name ? s.name.split(' ').map((n: string) => n[0]).join('') : 'ST'
            };
          });
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
    setCurrentDate(formatDate(today));
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

  const handleUndo = () => {
    if (currentIndex > 0) {
      const prevStudentIndex = currentIndex - 1;
      const prevStudentId = students[prevStudentIndex]?.student_id;
      setAttendanceRecords(prevRecords =>
        prevRecords.map(record =>
          record.studentId === prevStudentId ? { ...record, status: 'pending' } : record
        )
      );
      setCurrentIndex(prevStudentIndex);
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
      const facultyId = storedUserId ? parseInt(storedUserId) : undefined;

      // 1. Create Session
      const sessionRes = await axios.post('/api/attendance/session', {
        class_id: classId,
        section_id: currentClass?.section_id,
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
          staff_id: facultyId,
          records: recordsToSave
        });

        if (recordsRes.data.success) {
          toast({ title: "Success", description: "Attendance records saved successfully." });
          router.push(`/main/attendance/${classId}/${subjectId}/summary?date=${dateString}`);
        }
      }
    } catch (err: any) {
      console.error("Failed to finalize attendance", err);
      const errMsg = err?.response?.data?.message || err.message || "Failed to save attendance records.";
      toast({ title: "Error", description: errMsg, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const markedStudentsCount = attendanceRecords.filter(r => r.status !== 'pending').length;
  const progress = students.length > 0 ? (markedStudentsCount / students.length) * 100 : 0;
  const isLastStudent = currentIndex === students.length - 1;

  if (!currentClass || !currentSubject) {
    return <PageSkeleton />;
  }

  const currentStudentAttendance = currentStudent ? attendanceRecords.find(ar => ar.studentId === currentStudent.student_id) : undefined;

  return (
    <>
      {/* Mobile View (< sm) */}
      <div className="flex sm:hidden w-full justify-center fixed inset-x-0 top-14 bottom-16 bg-slate-50/50 overflow-hidden">
        <MobileAttendanceMarking
          currentClass={currentClass}
          currentSubject={currentSubject}
          currentDate={currentDate}
          students={students}
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
          attendanceRecords={attendanceRecords}
          handleMarkAttendance={handleMarkAttendance}
          handlePrevious={handlePrevious}
          handleNext={handleNext}
          handleFinalize={handleFinalize}
          handleUndo={handleUndo}
          isSubmitting={isSubmitting}
          router={router}
        />
      </div>

      {/* Desktop View (>= sm) - 100% UNCHANGED */}
      <div className="hidden sm:flex container py-8 px-4 flex-col items-center min-h-[calc(100vh-4rem)] bg-[#f4f6fa]/50 max-w-full">
        {/* Header Area */}
        <div className="w-full max-w-6xl mb-12 flex flex-col xl:flex-row items-center justify-center gap-6">
          
          {/* Back Button */}
          <div className="w-full xl:w-auto flex justify-center xl:justify-start">
            <Button 
              onClick={() => router.push('/main/attendance')} 
              variant="outline" 
              className="rounded-xl h-11 px-5 bg-white/60 hover:bg-white/80 border-slate-200 shadow-sm text-slate-700 font-medium transition-all"
            >
              <Home className="mr-2 h-4 w-4 text-slate-500" /> Back to Attendance Dashboard
            </Button>
          </div>

          {/* Info Pill */}
          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3 bg-white/60 backdrop-blur-sm border border-slate-200/60 rounded-xl px-8 py-3.5 text-[15px] font-medium text-slate-700 shadow-sm grow max-w-fit">
            <div className="flex items-center gap-2.5">
              <Users className="h-4 w-4 text-indigo-400" />
              <span>Class: <strong className="text-slate-900">{currentClass.class_name}{currentClass.section_name ? ` - ${currentClass.section_name}` : ''}</strong></span>
            </div>
            <div className="w-px h-5 bg-slate-200 hidden md:block"></div>
            <div className="flex items-center gap-2.5">
              <Library className="h-4 w-4 text-indigo-400" />
              <span>Subject: <strong className="text-slate-900">{currentSubject.subject_name}</strong></span>
            </div>
            <div className="w-px h-5 bg-slate-200 hidden md:block"></div>
            <div className="flex items-center gap-2.5">
              <CalendarDays className="h-4 w-4 text-indigo-400" />
              <span>Date: <strong className="text-slate-900">{currentDate}</strong></span>
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
          <div className="flex flex-col items-center w-full relative">
            <StudentAttendanceCard
              key={currentStudent.id}
              student={currentStudent}
              onMarkPresent={() => handleMarkAttendance('present')}
              onMarkAbsent={() => handleMarkAttendance('absent')}
              currentStatus={currentStudentAttendance?.status}
            />

            <div className="w-full max-w-[500px] mt-8">
              {/* Minimal Progress Divider (Thick blue bar) */}
              <div className="w-full flex flex-col items-center mb-6">
                <div className="h-4 w-full bg-[#e2e8f0] rounded-full overflow-hidden mb-3">
                   <div className="h-full bg-[#4f46e5] transition-all duration-300 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-[14px] font-medium text-slate-500">
                  {markedStudentsCount} of {students.length} students marked
                </p>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between gap-4 mb-8 px-4">
                <Button
                  variant="ghost"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className="rounded-[10px] h-11 px-6 bg-[#f8fafc] hover:bg-[#e2e8f0] text-slate-600 font-medium transition-all"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                </Button>

                {!isLastStudent ? (
                  <Button
                    onClick={handleNext}
                    className="rounded-[10px] h-11 px-8 bg-[#6366f1] hover:bg-[#4f46e5] text-white font-medium shadow-sm transition-all"
                  >
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleFinalize}
                    disabled={isSubmitting}
                    className="rounded-[10px] h-11 px-6 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold shadow-md transition-all"
                  >
                    <CheckSquare className="mr-2 h-4 w-4" /> Review & Finalize
                  </Button>
                )}
              </div>

              {/* Review & Finalize Button - Wide and Centered Below */}
              {markedStudentsCount === students.length && (
                <div className="flex justify-center w-full">
                  <Button
                    onClick={handleFinalize}
                    disabled={isSubmitting}
                    className="rounded-[10px] h-[52px] w-[280px] bg-[#3b82f6] hover:bg-[#2563eb] text-white text-[15px] font-semibold transition-all shadow-md"
                  >
                    <CheckSquare className="mr-2 h-5 w-5" />
                    Review & Finalize
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 space-y-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs font-medium text-muted-foreground">Loading attendance records…</p>
          </div>
        )}
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                  MOBILE NATIVE ATTENDANCE MARKING                          */
/* -------------------------------------------------------------------------- */

interface MobileAttendanceProps {
  currentClass: any;
  currentSubject: any;
  currentDate: string;
  students: any[];
  currentIndex: number;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
  attendanceRecords: any[];
  handleMarkAttendance: (status: AttendanceStatus) => void;
  handlePrevious: () => void;
  handleNext: () => void;
  handleFinalize: () => void;
  handleUndo: () => void;
  isSubmitting: boolean;
  router: any;
}

function MobileAttendanceMarking({
  currentClass,
  currentSubject,
  currentDate,
  students,
  currentIndex,
  setCurrentIndex,
  attendanceRecords,
  handleMarkAttendance,
  handlePrevious,
  handleNext,
  handleFinalize,
  handleUndo,
  isSubmitting,
  router
}: MobileAttendanceProps) {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);
  const [showReviewCard, setShowReviewCard] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tutorialSeen = localStorage.getItem('campus_connect_swipe_tutorial_seen');
      if (!tutorialSeen) {
        setShowTutorial(true);
      }
    }
  }, []);

  const dismissTutorial = () => {
    setShowTutorial(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('campus_connect_swipe_tutorial_seen', 'true');
    }
  };

  const currentStudent = students[currentIndex];
  const currentStudentAttendance = currentStudent
    ? attendanceRecords.find(ar => ar.studentId === currentStudent.student_id)
    : undefined;

  const markedCount = attendanceRecords.filter(r => r.status !== 'pending').length;
  const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
  const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
  const unmarkedCount = students.length - markedCount;
  const progressPercent = students.length > 0 ? (markedCount / students.length) * 100 : 0;
  const isLastStudent = currentIndex === students.length - 1;

  const [isAnimating, setIsAnimating] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (showReviewCard || isAnimating) return;
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || showReviewCard || isAnimating) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    setDragX(diff);
  };

  const handleTouchEnd = () => {
    if (!isDragging || showReviewCard || isAnimating) return;
    setIsDragging(false);
    const threshold = 75;

    if (dragX > threshold) {
      triggerSwipeMark('present');
    } else if (dragX < -threshold) {
      triggerSwipeMark('absent');
    } else {
      setDragX(0);
    }
  };

  const triggerSwipeMark = (status: 'present' | 'absent') => {
    if (isAnimating) return;
    setIsAnimating(true);
    const direction = status === 'present' ? 'right' : 'left';
    setExitDirection(direction);

    setTimeout(() => {
      handleMarkAttendance(status);
      setExitDirection(null);
      setDragX(0);
      setIsAnimating(false);
      if (isLastStudent) {
        setShowReviewCard(true);
      }
    }, 220);
  };

  const handleNextClick = () => {
    if (isAnimating) return;
    if (isLastStudent) {
      setShowReviewCard(true);
    } else {
      setIsAnimating(true);
      setExitDirection('right');
      setTimeout(() => {
        handleNext();
        setExitDirection(null);
        setDragX(0);
        setIsAnimating(false);
      }, 220);
    }
  };

  const handlePreviousClick = () => {
    if (isAnimating || currentIndex === 0) return;
    setIsAnimating(true);
    handlePrevious();
    setExitDirection(null);
    setDragX(0);
    setTimeout(() => {
      setIsAnimating(false);
    }, 200);
  };

  const handleUndoClick = () => {
    if (showReviewCard) {
      setShowReviewCard(false);
      return;
    }
    handleUndo();
  };

  const swipeThreshold = 75;
  const rightOpacity = Math.min(Math.max(dragX / swipeThreshold, 0), 1);
  const leftOpacity = Math.min(Math.max(-dragX / swipeThreshold, 0), 1);

  const dragRatio = Math.min(Math.abs(dragX) / 160, 1);
  const isExiting = exitDirection !== null;

  // Background Card: Smoothly glides from back (scale 0.95, translateY 8px) to front (scale 1.0, translateY 0px)
  const bgCardStyle: React.CSSProperties = {
    transform: isExiting
      ? 'translateY(0px) scale(1.0)'
      : `translateY(${8 - dragRatio * 8}px) scale(${0.95 + dragRatio * 0.05})`,
    opacity: isExiting ? 1 : 0.75 + dragRatio * 0.25,
    transition: isDragging
      ? 'none'
      : 'transform 0.24s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.22s ease-out',
    zIndex: 1,
  };

  // Active Front Card: Smoothly continues swipe off-screen without snapping back to original position
  const frontCardStyle: React.CSSProperties = {
    transform: isExiting
      ? exitDirection === 'right'
        ? 'translateX(120vw) rotate(15deg)'
        : 'translateX(-120vw) rotate(-15deg)'
      : `translateX(${dragX}px) rotate(${dragX * 0.05}deg)`,
    opacity: isExiting ? 0 : 1,
    transition: isDragging
      ? 'none'
      : 'transform 0.24s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.22s ease-out',
    zIndex: 10,
  };

  return (
    <div className="w-full h-full max-h-full flex flex-col justify-between px-3.5 pt-2 pb-2 bg-slate-50/50 text-slate-900 select-none max-w-md mx-auto overflow-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      
      {/* 1. Header Navigation: Compact Left Arrow + Attendance & Undo */}
      <div className="flex items-center justify-between w-full mb-2 shrink-0">
        <button
          onClick={() => router.push('/main/attendance')}
          className="flex items-center gap-1.5 text-slate-700 font-bold text-xs bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 shadow-xs active:scale-95 transition-all"
        >
          <ArrowLeft className="h-4 w-4 text-slate-700" />
          <span>Attendance</span>
        </button>

        {/* Undo Button */}
        <button
          onClick={handleUndoClick}
          disabled={currentIndex === 0 && !showReviewCard && currentStudentAttendance?.status === 'pending'}
          className={cn(
            "flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all border shadow-xs",
            currentIndex === 0 && !showReviewCard && currentStudentAttendance?.status === 'pending'
              ? "bg-slate-100/50 text-slate-300 border-slate-100 cursor-not-allowed"
              : "bg-white text-indigo-600 border-indigo-100 active:scale-95 hover:bg-indigo-50"
          )}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Undo</span>
        </button>
      </div>

      {/* 2. Combined Class, Subject, Date & Progress Card (Matching Wireframe Box 2) */}
      <div className="w-full bg-white rounded-2xl p-2.5 border border-slate-200/80 shadow-xs mb-2 shrink-0 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-700 font-semibold truncate">
            <Users className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
            <span className="truncate">{currentClass?.class_name}{currentClass?.section_name ? ` - ${currentClass?.section_name}` : ''}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 font-medium shrink-0">
            <CalendarDays className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <span>{currentDate}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 pt-1 border-t border-slate-50">
          <Library className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
          <span className="truncate">{currentSubject?.subject_name}</span>
        </div>

        <div className="pt-1 border-t border-slate-50 space-y-1">
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 px-0.5">
            <span>Progress</span>
            <span>{markedCount} of {students.length} Marked</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. First-Time Swipe Tutorial Overlay (Matching Wireframe Box 3) */}
      {showTutorial && !showReviewCard && (
        <div className="w-full bg-indigo-900 text-white rounded-xl p-2 shadow-sm mb-2 flex flex-col gap-1 animate-in fade-in slide-in-from-top-4 duration-300 relative overflow-hidden shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">Swipe Guide</span>
            </div>
            <button
              onClick={dismissTutorial}
              className="text-indigo-200 hover:text-white p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-around bg-indigo-950/60 rounded-lg p-1 text-[11px] font-semibold">
            <div className="flex items-center gap-1 text-rose-300">
              <XCircle className="h-3.5 w-3.5 text-rose-400" />
              <span>Swipe Left = Absent</span>
            </div>
            <div className="h-3.5 w-px bg-indigo-800" />
            <div className="flex items-center gap-1 text-emerald-300">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
              <span>Swipe Right = Present</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. Main Card Area (Student Card Deck vs Review Card) */}
      {!showReviewCard && currentStudent ? (
        <div className="w-full flex-1 min-h-0 flex flex-col justify-between items-center py-1 overflow-hidden">
          
          {/* Card Stack Container - Compact & Centered */}
          <div className="relative w-full h-[285px] my-auto flex items-center justify-center shrink-0">
            
            {/* Background Stacked Card (Peeking Next Card - Moving to Front) */}
            {currentIndex < students.length - 1 && (
              <div
                key={`bg-${students[currentIndex + 1].student_id || students[currentIndex + 1].id}`}
                style={bgCardStyle}
                className="absolute inset-0 w-full h-full bg-white rounded-3xl p-3.5 shadow-sm border border-slate-100/90 text-center pointer-events-none flex flex-col justify-between items-center"
              >
                <div className="flex-1 flex flex-col items-center justify-center my-auto w-full">
                  <div className="relative inline-block mb-1.5">
                    <div className="h-20 w-20 ring-4 ring-slate-100/80 shadow-sm mx-auto overflow-hidden rounded-full bg-slate-50 relative">
                      <img
                        src={students[currentIndex + 1].avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${students[currentIndex + 1].student_id || students[currentIndex + 1].id}&backgroundColor=f3f4f6`}
                        alt={students[currentIndex + 1].name}
                        className="h-full w-full object-cover opacity-80"
                      />
                    </div>
                  </div>
                  <h3 className="text-base font-black text-slate-800 tracking-tight mb-0.5">{students[currentIndex + 1].name}</h3>
                  <p className="text-xs font-bold text-slate-500 mb-0.5">Roll No: {students[currentIndex + 1].roll_number}</p>
                  <p className="text-xs font-medium text-slate-400">Class: {students[currentIndex + 1].class}</p>
                </div>

                <div className="flex justify-center gap-2.5 w-full pt-1.5 mt-auto shrink-0 opacity-60">
                  <div className="flex-1 h-9 text-xs font-extrabold rounded-xl border-2 bg-white text-[#ef4444] border-rose-100 flex items-center justify-center gap-1.5">
                    <X className="h-3.5 w-3.5 stroke-[3]" /> Absent
                  </div>
                  <div className="flex-1 h-9 text-xs font-extrabold rounded-xl border-2 bg-white text-[#22c55e] border-emerald-100 flex items-center justify-center gap-1.5">
                    <Check className="h-3.5 w-3.5 stroke-[3]" /> Present
                  </div>
                </div>
              </div>
            )}

            {/* Active Front Swipeable Student Card */}
            <div
              key={`front-${currentStudent.student_id || currentStudent.id}`}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={frontCardStyle}
              className="w-full h-full bg-white rounded-3xl p-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-slate-100 relative overflow-hidden text-center touch-pan-y flex flex-col justify-between items-center"
            >
              {/* Visual Tint & Badge Feedback during Drag */}
              <div
                style={{ opacity: rightOpacity }}
                className="absolute inset-0 bg-emerald-500/10 border-2 border-emerald-500 rounded-3xl flex items-center justify-start p-4 pointer-events-none transition-opacity z-20"
              >
                <div className="bg-[#22c55e] text-white rounded-2xl px-4 py-2 font-black text-sm uppercase tracking-wider flex items-center gap-2 shadow-md">
                  <Check className="h-5 w-5 stroke-[3]" /> PRESENT
                </div>
              </div>

              <div
                style={{ opacity: leftOpacity }}
                className="absolute inset-0 bg-rose-500/10 border-2 border-rose-500 rounded-3xl flex items-center justify-end p-4 pointer-events-none transition-opacity z-20"
              >
                <div className="bg-[#ef4444] text-white rounded-2xl px-4 py-2 font-black text-sm uppercase tracking-wider flex items-center gap-2 shadow-md">
                  <X className="h-5 w-5 stroke-[3]" /> ABSENT
                </div>
              </div>

              {/* Current Status Pill if pre-marked */}
              {currentStudentAttendance?.status !== 'pending' && (
                <div className="absolute top-2.5 right-2.5 z-20">
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm border",
                      currentStudentAttendance?.status === 'present'
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    )}
                  >
                    {currentStudentAttendance?.status}
                  </span>
                </div>
              )}

              {/* Student Details (Avatar, Name, Roll No, Class) */}
              <div className="flex-1 flex flex-col items-center justify-center my-auto w-full">
                <div className="relative inline-block mb-1.5">
                  <div className="h-20 w-20 ring-4 ring-slate-100 shadow-md mx-auto overflow-hidden rounded-full bg-slate-50 relative">
                    <img
                      src={currentStudent.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${currentStudent.student_id || currentStudent.id}&backgroundColor=f3f4f6`}
                      alt={currentStudent.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (!target.src.includes('dicebear')) {
                          target.src = `https://api.dicebear.com/7.x/notionists/svg?seed=${currentStudent.student_id || currentStudent.id}&backgroundColor=f3f4f6`;
                        }
                      }}
                    />
                  </div>
                </div>

                <h3 className="text-base font-black text-slate-900 tracking-tight mb-0.5">{currentStudent.name}</h3>
                <p className="text-xs font-bold text-slate-600 mb-0.5">Roll No: {currentStudent.roll_number}</p>
                <p className="text-xs font-medium text-slate-400">Class: {currentStudent.class}</p>
              </div>

              {/* Absent & Present Action Buttons - Inside Card */}
              <div className="flex justify-center gap-2.5 w-full pt-1.5 mt-auto shrink-0 z-20">
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerSwipeMark('absent');
                  }}
                  className={cn(
                    "flex-1 h-9.5 text-xs font-extrabold rounded-xl transition-all border-2",
                    currentStudentAttendance?.status === 'absent'
                      ? 'bg-[#ef4444] text-white border-[#ef4444] shadow-md hover:bg-[#dc2626] hover:text-white'
                      : 'bg-white text-[#ef4444] border-rose-100 hover:bg-rose-50 hover:text-[#ef4444]'
                  )}
                >
                  <X className="mr-1.5 h-3.5 w-3.5 stroke-[3]" /> Absent
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerSwipeMark('present');
                  }}
                  className={cn(
                    "flex-1 h-9.5 text-xs font-extrabold rounded-xl transition-all border-2",
                    currentStudentAttendance?.status === 'present'
                      ? 'bg-[#22c55e] text-white border-[#22c55e] shadow-md hover:bg-[#16a34a] hover:text-white'
                      : 'bg-white text-[#22c55e] border-emerald-100 hover:bg-emerald-50 hover:text-[#22c55e]'
                  )}
                >
                  <Check className="mr-1.5 h-3.5 w-3.5 stroke-[3]" /> Present
                </Button>
              </div>
            </div>

          </div>

          {/* Previous / Next Controls Bar - Positioned in Highlighted Red Box */}
          <div className="flex items-center justify-between gap-3 w-full px-1 my-1.5 shrink-0 z-30">
            <Button
              variant="outline"
              onClick={handlePreviousClick}
              disabled={currentIndex === 0}
              className="flex-1 h-11 rounded-2xl border-2 border-slate-200 text-slate-700 font-bold text-xs shadow-sm bg-white active:scale-95 transition-all disabled:opacity-50"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Previous
            </Button>
            <Button
              onClick={handleNextClick}
              className="flex-1 h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md active:scale-95 transition-all"
            >
              {isLastStudent ? "Review" : "Next"} <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>

        </div>
      ) : (
        /* 6. Review & Finalize Card (Same Card Shell Format) */
        <div className="w-full bg-white rounded-3xl p-5 shadow-[0_8px_25px_rgba(0,0,0,0.06)] border border-slate-100 text-center flex flex-col items-center justify-between gap-4 my-auto shrink-0">
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
            <CheckSquare className="h-6 w-6" />
          </div>

          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Review & Finalize</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Double check your attendance records before submitting.</p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 w-full bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm text-center">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Total</span>
              <span className="text-lg font-black text-slate-800">{students.length}</span>
            </div>
            <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100 text-center">
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 block">Present</span>
              <span className="text-lg font-black text-emerald-600">{presentCount}</span>
            </div>
            <div className="bg-rose-50/60 p-2.5 rounded-xl border border-rose-100 text-center">
              <span className="text-[9px] font-bold uppercase tracking-wider text-rose-600 block">Absent</span>
              <span className="text-lg font-black text-rose-600">{absentCount}</span>
            </div>
            <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-100 text-center">
              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 block">Unmarked</span>
              <span className="text-lg font-black text-amber-600">{unmarkedCount}</span>
            </div>
          </div>

          <div className="space-y-2 w-full">
            <Button
              onClick={handleFinalize}
              disabled={isSubmitting}
              className="w-full h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md"
            >
              {isSubmitting ? "Submitting..." : "Finalize Attendance"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowReviewCard(false)}
              className="w-full h-9 rounded-xl border-slate-200 text-slate-600 font-bold text-xs bg-white"
            >
              Back to Edit
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
