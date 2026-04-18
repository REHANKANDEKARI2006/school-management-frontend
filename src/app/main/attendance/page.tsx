"use client";

import * as React from "react";
import RouteGuard from "@/components/auth/RouteGuard";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { format } from "date-fns";
import axios from "@/lib/axios";
import { BarChart, CheckCircle, XCircle, CalendarDays, Users, PlusCircle, ChevronDown, ChevronUp, FileSpreadsheet, FileText, Share2, Loader2, Download } from "lucide-react";
import { PageSkeleton } from "@/components/ui/skeletons";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AttendanceSummaryDialog } from "@/components/campus-connect/attendance-summary-dialog";

interface SubjectWithAttendance {
  subject_id: string;
  subject_name: string;
  present_count: number;
  absent_count: number;
  status: string;
  session_id: string | null;
}

interface ClassWithSubjects {
  class_id: string;
  class_name: string;
  section_id: string;
  section_name: string;
  subjects: SubjectWithAttendance[];
}

const WhatsAppIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="mr-2 h-4 w-4"
  >
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
  </svg>
);

import { ROLE, ADMIN_GROUP, RoleId } from "@/config/roles";
/* -------------------------------------------------------------------------- */
/*                        STUDENT ATTENDANCE VIEW                            */
/* -------------------------------------------------------------------------- */

const StudentAttendanceView = () => {
  const [history, setHistory] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get("/api/attendance/my-history");
        if (res.data.success) {
          setHistory(res.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch attendance history", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) {
    return <PageSkeleton rows={5} />;
  }

  const presentCount = history.filter((h: any) => h.status === 'present').length;
  const absentCount = history.filter((h: any) => h.status === 'absent').length;
  const total = history.length;
  const attendancePercentage = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
            <CalendarDays className="h-8 w-8 text-primary" />
            My Attendance
          </h1>
          <p className="text-muted-foreground mt-1">Track your daily attendance and subject-wise records.</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm shadow-indigo-100/50 bg-white/60 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendancePercentage}%</div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter mt-1">Current Semester</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm shadow-emerald-100/50 bg-white/60 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Present</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{presentCount}</div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter mt-1">Sessions Attended</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm shadow-rose-100/50 bg-white/60 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Absent</CardTitle>
            <XCircle className="h-4 w-4 text-rose-500/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{absentCount}</div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter mt-1">Sessions Missed</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm shadow-slate-100/50 bg-white/60 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Users className="h-4 w-4 text-slate-500/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-700">{total}</div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter mt-1">Total Recorded</p>
          </CardContent>
        </Card>
      </div>

      {/* History Table */}
      <Card className="border-none shadow-md overflow-hidden bg-white/60 backdrop-blur-sm">
        <CardHeader className="bg-slate-50/40 border-b">
          <CardTitle className="text-xl font-headline">Attendance Log</CardTitle>
          <CardDescription>A complete history of your subject-wise attendance.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {history.length === 0 ? (
            <div className="p-20 text-center text-muted-foreground flex flex-col items-center gap-2">
              <CalendarDays className="h-12 w-12 opacity-10" />
              <p className="font-medium">No attendance records found yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/30 border-b">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Subject</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50">
                  {history.map((record, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">
                        {format(new Date(record.date), "PPP")}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">
                        {record.subjectName}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge 
                          variant="secondary"
                          className={`
                            ${record.status === 'present' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                              : 'bg-rose-50 text-rose-700 border-rose-100'}
                            px-2 py-0.5 font-bold text-[9px] uppercase tracking-tighter border
                          `}
                        >
                          {record.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                        MAIN DASHBOARD PAGE                                 */
/* -------------------------------------------------------------------------- */

export default function AttendanceDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();

  const roleId =
    typeof window !== "undefined"
      ? Number(localStorage.getItem("role_id"))
      : null;

  const isStudentOrGuardian = roleId === ROLE.STUDENT || roleId === ROLE.GUARDIAN;

  const canExport = roleId ? (ADMIN_GROUP as readonly number[]).includes(roleId) : false;
  const [classData, setClassData] = React.useState<ClassWithSubjects[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isExporting, setIsExporting] = React.useState<string | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [isSummaryOpen, setIsSummaryOpen] = React.useState(false);
  const [expandedClasses, setExpandedClasses] = React.useState<Record<string, boolean>>({});
  const [selectedSummary, setSelectedSummary] = React.useState<{
    classId: string;
    subjectId: string;
    date: Date;
    sessionId?: string;
  } | null>(null);

  const fetchDashboardData = React.useCallback(async () => {
    if (isStudentOrGuardian) return; // For students, we use the StudentAttendanceView which fetches its own data
    setIsLoading(true);
    try {
      const dateString = format(selectedDate, "yyyy-MM-dd");
      const response = await axios.get(`/api/attendance/dashboard?date=${dateString}`);

      if (response.data.success) {
        // Group by class and section
        const rawData = response.data.data;
        const grouped: Record<string, ClassWithSubjects> = {};

        rawData.forEach((item: any) => {
          const key = `${item.class_id}-${item.section_id}`;
          if (!grouped[key]) {
            grouped[key] = {
              class_id: item.class_id,
              class_name: item.class_name,
              section_id: item.section_id,
              section_name: item.section_name,
              subjects: []
            };
          }
          grouped[key].subjects.push({
            subject_id: item.subject_id,
            subject_name: item.subject_name,
            present_count: parseInt(item.present_count),
            absent_count: parseInt(item.absent_count),
            status: item.status,
            session_id: item.session_id
          });
        });

        setClassData(Object.values(grouped));
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, isStudentOrGuardian]);

  React.useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // If student or guardian, render the history view
  if (isStudentOrGuardian) {
    return <StudentAttendanceView />;
  }

  const toggleExpand = (key: string) => {
    setExpandedClasses(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFullDayExport = async (cls: ClassWithSubjects, formatType: 'pdf' | 'excel' | 'whatsapp') => {
    const classKey = `${cls.class_id}-${cls.section_id}`;
    setIsExporting(classKey);

    const FULL_DAY_THRESHOLD = 80;

    try {
      toast({ title: "Aggregating Data", description: "Fetching attendance for all subjects..." });

      // 1. Fetch summaries for all subjects
      const summaries = await Promise.all(
        cls.subjects.map(async (sub) => {
          if (!sub.session_id) return null;
          const res = await axios.get(`/api/attendance/summary?sessionId=${sub.session_id}`);
          return {
            subject_id: sub.subject_id,
            subject_name: sub.subject_name,
            records: res.data.success ? res.data.data : []
          };
        })
      );

      const validSummaries = summaries.filter(s => s !== null);
      if (validSummaries.length === 0) {
        toast({ title: "No Data", description: "No attendance data found for this class today.", variant: "destructive" });
        return;
      }

      // 2. Aggregate by student
      const studentMap: Record<string, { name: string, roll: string, attendance: Record<string, string> }> = {};
      const subjectNames: string[] = validSummaries.map(s => s!.subject_name);

      validSummaries.forEach(s => {
        s!.records.forEach((r: any) => {
          if (!studentMap[r.student_id]) {
            studentMap[r.student_id] = {
              name: r.name,
              roll: r.roll_number,
              attendance: {}
            };
          }
          studentMap[r.student_id].attendance[s!.subject_name] = r.status.toLowerCase() === 'present' ? 'P' : 'A';
        });
      });

      const students = Object.values(studentMap).sort((a, b) => a.name.localeCompare(b.name));
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const fileName = `FullDay_Attendance_${cls.class_name.replace(/\s+/g, '_')}_${dateStr}`;

      if (formatType === 'excel') {
        const worksheetData = [
          [`Overall Attendance Summary - ${cls.class_name} - ${cls.section_name}`],
          ["Date", format(selectedDate, "PPP")],
          [],
          ["Roll No.", "Student Name", ...subjectNames]
        ];

        students.forEach(stu => {
          const row = [stu.roll, stu.name];
          subjectNames.forEach(sub => {
            row.push(stu.attendance[sub] || "-");
          });
          worksheetData.push(row);
        });

        const ws = XLSX.utils.aoa_to_sheet(worksheetData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "FullDay");
        XLSX.writeFile(wb, `${fileName}.xlsx`);
      } else {
        // PDF LOGIC
        const totalSubjects = subjectNames.length;
        let fullDayPresentCount = 0;
        let fullDayAbsentCount = 0;

        const tableBody = students.map(stu => {
          const presentCount = Object.values(stu.attendance).filter(v => v === 'P').length;
          const attendedPercentage = totalSubjects > 0 ? (presentCount / totalSubjects) * 100 : 0;
          const isFullDayPresent = attendedPercentage >= FULL_DAY_THRESHOLD;

          if (isFullDayPresent) fullDayPresentCount++;
          else fullDayAbsentCount++;

          const statusText = totalSubjects > 0 
            ? (isFullDayPresent ? 'Present' : 'Absent')
            : "N/A";

          return [
            stu.roll,
            stu.name,
            ...subjectNames.map(sub => stu.attendance[sub] || "-"),
            statusText
          ];
        });

        const generatePDFDoc = () => {
          const doc = new jsPDF('p', 'mm', 'a4'); // Portrait
          doc.setFontSize(20);
          doc.setTextColor(79, 70, 229);
          doc.text("CampusConnect", 14, 20);

          doc.setFontSize(14);
          doc.setTextColor(33, 37, 41);
          doc.text(`Full Day Attendance Summary - ${cls.class_name} ${cls.section_name}`, 14, 30);
          doc.setFontSize(10);
          doc.text(`Date: ${format(selectedDate, "PPP")}`, 14, 37);

          const tableHead = [['Roll No.', 'Student Name', ...subjectNames, 'Full Day Status']];

          autoTable(doc, {
            startY: 45,
            head: tableHead,
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229], textColor: 255 },
            styles: { fontSize: 8 },
          });

          return doc;
        };

        if (formatType === 'pdf') {
          const doc = generatePDFDoc();
          doc.save(`${fileName}.pdf`);
        } else if (formatType === 'whatsapp') {
          // Keep existing WhatsApp logic but with updated generating function
          const summaryText = `*Full Day Attendance Summary*\n*Class:* ${cls.class_name} ${cls.section_name}\n*Date:* ${format(selectedDate, "PPP")}\n\n*Total Students:* ${students.length}\n*Full Day Present:* ${fullDayPresentCount}\n*Full Day Absent:* ${fullDayAbsentCount}`;
          
          const doc = generatePDFDoc();
          const pdfBlob = doc.output('blob');
          const pdfFile = new File([pdfBlob], `${fileName}.pdf`, { type: 'application/pdf' });

          if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
            await navigator.share({
              files: [pdfFile],
              title: 'Full Day Attendance',
              text: summaryText,
            });
          } else {
            doc.save(`${fileName}.pdf`);
            window.open(`https://wa.me/?text=${encodeURIComponent(summaryText)}`, '_blank');
          }
        }
      }

      toast({ title: "Success", description: "Attendance report generated successfully." });
    } catch (error) {
      console.error("Export failed", error);
      toast({ title: "Error", description: "Failed to generate report.", variant: "destructive" });
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <RouteGuard allowedRoles={[...ADMIN_GROUP, ROLE.TEACHER, ROLE.CLASS_TEACHER]}>
      <div className="container mx-auto py-8 px-4 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart className="h-8 w-8 text-indigo-600" />
              Attendance Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Overview of attendance records for the selected date.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-[240px] justify-start text-left font-normal h-11">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {format(selectedDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => d && setSelectedDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button onClick={() => router.push('/main/attendance/new')} className="bg-indigo-600 hover:bg-indigo-700 h-11 px-6">
              <PlusCircle className="mr-2 h-4 w-4" />
              Take Attendance
            </Button>
          </div>
        </div>

        {isLoading ? (
          <PageSkeleton rows={5} />
        ) : classData.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <div className="flex flex-col items-center space-y-4">
              <Users className="h-12 w-12 text-muted-foreground opacity-20" />
              <h3 className="text-xl font-semibold">No Sessions Found</h3>
              <p className="text-muted-foreground max-w-sm">No attendance has been taken for this date yet.</p>
              <Button variant="outline" onClick={() => router.push('/main/attendance/new')}>Start New Session</Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classData.map((cls) => {
              const classKey = `${cls.class_id}-${cls.section_id}`;
              const isExpanded = expandedClasses[classKey];
              const displayedSubjects = isExpanded ? cls.subjects : cls.subjects.slice(0, 4);
              const remainingCount = cls.subjects.length - 4;
              const isFilled = cls.subjects.every(s => s.session_id !== null);

              return (
                <Card key={classKey} className="flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="bg-slate-50/50 border-b py-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-indigo-600" />
                      <CardTitle className="text-xl font-bold">{cls.class_name} - {cls.section_name}</CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                      Attendance status for {format(selectedDate, "MMMM do, yyyy")}.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 flex-grow">
                    <div className="divide-y">
                      {displayedSubjects.map((sub) => (
                        <div
                          key={sub.subject_id}
                          className="group flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors cursor-pointer"
                          onClick={() => {
                            if (sub.session_id) {
                              setSelectedSummary({
                                classId: cls.class_id,
                                subjectId: sub.subject_id,
                                date: selectedDate,
                                sessionId: sub.session_id
                              });
                              setIsSummaryOpen(true);
                            } else {
                              router.push(`/main/attendance/${cls.class_id}/${sub.subject_id}`);
                            }
                          }}
                        >
                          <span className="font-semibold text-slate-700">{sub.subject_name}</span>

                          <div className="text-right">
                            {sub.session_id ? (
                              <div className="flex items-center gap-3">
                                <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                                  <CheckCircle className="h-4 w-4" /> {sub.present_count}
                                </span>
                                <span className="text-red-500 text-sm font-medium flex items-center gap-1">
                                  <XCircle className="h-4 w-4" /> {sub.absent_count}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm font-medium opacity-50 bg-slate-100 px-2 py-0.5 rounded-md">Not taken</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {!isExpanded && remainingCount > 0 && (
                      <button
                        onClick={() => toggleExpand(classKey)}
                        className="w-full py-3 text-sm font-medium text-indigo-600 hover:bg-indigo-50/50 flex items-center justify-center gap-1 border-t border-slate-100"
                      >
                        <ChevronDown className="h-4 w-4" /> View {remainingCount} More Subjects
                      </button>
                    )}
                    {isExpanded && remainingCount > 0 && (
                      <button
                        onClick={() => toggleExpand(classKey)}
                        className="w-full py-3 text-sm font-medium text-slate-500 hover:bg-slate-50 flex items-center justify-center gap-1 border-t border-slate-100"
                      >
                        <ChevronUp className="h-4 w-4" /> Show Less
                      </button>
                    )}
                  </CardContent>

                  <div className="bg-slate-50/80 p-4 border-t flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall Status</p>
                      {isFilled ? (
                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">Ready for Export</span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Incomplete</span>
                      )}
                    </div>

                    {canExport && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!isFilled || isExporting === classKey}
                          onClick={() => handleFullDayExport(cls, 'excel')}
                          className="flex-1 h-9 rounded-lg bg-white"
                        >
                          {isExporting === classKey ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />}
                          Excel
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!isFilled || isExporting === classKey}
                          onClick={() => handleFullDayExport(cls, 'pdf')}
                          className="flex-1 h-9 rounded-lg bg-white"
                        >
                          {isExporting === classKey ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3.5 w-3.5 mr-1.5" />}
                          PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!isFilled || isExporting === classKey}
                          onClick={() => handleFullDayExport(cls, 'whatsapp')}
                          className="flex-1 h-9 rounded-lg bg-white"
                        >
                          {isExporting === classKey ? <Loader2 className="h-3 w-3 animate-spin" /> : <WhatsAppIcon />}
                          Share
                        </Button>
                      </div>
                    )}
                    {!isFilled && canExport && (
                      <p className="text-[9px] text-center text-slate-400 italic">Fill all subject attendance to enable full day export.</p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
          {selectedSummary && (
            <AttendanceSummaryDialog {...selectedSummary} />
          )}
        </Dialog>
      </div>
    </RouteGuard>
  );
}
