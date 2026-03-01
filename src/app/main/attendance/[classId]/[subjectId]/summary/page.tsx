
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AttendanceStatus } from '@/types';
import { FileSpreadsheet, FileText, Users, Library, CalendarDays, Download, Check, X, AlertTriangle, Edit3, Home, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, isValid } from 'date-fns';
import axios from "@/lib/axios";

// Inline SVG for WhatsApp icon
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


export default function AttendanceSummaryPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const classId = params.classId as string;
  const subjectId = params.subjectId as string;
  const dateQueryParam = searchParams.get('date');

  const [currentClass, setCurrentClass] = useState<any>(null);
  const [currentSubject, setCurrentSubject] = useState<any>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const date = dateQueryParam ? new Date(dateQueryParam) : new Date();
    return isValid(date) ? date : new Date();
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd');

      const [classRes, subjectRes, checkRes] = await Promise.all([
        axios.get(`/api/classes/${classId}`),
        axios.get(`/api/subjects/${subjectId}`),
        axios.get(`/api/attendance/session/check?class_id=${classId}&subject_id=${subjectId}&attendance_date=${dateString}`)
      ]);

      if (classRes.data.success) setCurrentClass(classRes.data.data);
      if (subjectRes.data.success) setCurrentSubject(subjectRes.data.data);

      if (checkRes.data.success && checkRes.data.data) {
        const sid = checkRes.data.data.session_id;
        setSessionId(sid);
        const summaryRes = await axios.get(`/api/attendance/summary?sessionId=${sid}`);
        if (summaryRes.data.success) {
          setAttendanceRecords(summaryRes.data.data);
        }
      } else {
        setSessionId(null);
        setAttendanceRecords([]);
      }
    } catch (err) {
      console.error("Failed to fetch summary data", err);
      toast({ title: "Error", description: "Could not load attendance summary.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [classId, subjectId, selectedDate, toast]);

  useEffect(() => {
    fetchSummary();

    const dateString = format(selectedDate, 'yyyy-MM-dd');
    if (typeof window !== 'undefined') {
      const newUrl = `${window.location.pathname}?date=${dateString}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
  }, [fetchSummary, selectedDate]);

  const handleDateSelect = (date?: Date) => {
    if (date) {
      setSelectedDate(date);
    }
  }

  const presentCount = attendanceRecords.filter(r => r.status === 'Present' || r.status === 'present').length;
  const absentCount = attendanceRecords.filter(r => r.status === 'Absent' || r.status === 'absent').length;

  const handleExport = (formatType: 'pdf' | 'excel') => {
    toast({
      title: `Exporting to ${formatType.toUpperCase()}`,
      description: `Preparing attendance data for download. This is a placeholder action.`,
    });
  };

  const handleShareToWhatsApp = () => {
    if (!currentClass || !currentSubject || attendanceRecords.length === 0) {
      toast({ title: "Cannot Share", description: "No attendance data available to share.", variant: "destructive" });
      return;
    }

    let summaryText = `*Attendance Summary*\n\n`;
    summaryText += `*Class:* ${currentClass.class_name || currentClass.name}\n`;
    summaryText += `*Subject:* ${currentSubject.subject_name || currentSubject.name}\n`;
    summaryText += `*Date:* ${format(selectedDate, "PPP")}\n\n`;
    summaryText += `*Present:* ${presentCount}\n`;
    summaryText += `*Absent:* ${absentCount}\n\n`;
    summaryText += `*Student Details:*\n`;

    attendanceRecords.forEach(record => {
      summaryText += `- *${record.name}* (\`${record.roll_number}\`): *${record.status.toUpperCase()}*\n`;
    });

    const encodedText = encodeURIComponent(summaryText);
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;

    window.open(whatsappUrl, '_blank');

    toast({
      title: "Sharing to WhatsApp",
      description: "Sharing text summary.",
    });
  };

  const handleStatusToggle = async (studentId: string, currentStatus: string) => {
    if (!sessionId) return;

    try {
      const newStatusId = (currentStatus === 'Present' || currentStatus === 'present') ? 2 : 1;
      const res = await axios.put('/api/attendance/record', {
        session_id: sessionId,
        student_id: studentId,
        status_id: newStatusId
      });

      if (res.data.success) {
        toast({ title: "Updated", description: "Attendance status updated successfully." });
        fetchSummary(); // Refresh data
      }
    } catch (err) {
      console.error("Failed to update status", err);
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentClass || !currentSubject) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Data Not Found</h2>
        <p className="text-muted-foreground mb-4">Could not retrieve class or subject information.</p>
        <Button onClick={() => router.push('/dashboard/attendance')}>Go Back to Attendance</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button onClick={() => router.push('/main/attendance')} variant="outline" className="rounded-xl">
            <Home className="mr-2 h-4 w-4" /> Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Attendance Analytics</h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => handleExport('excel')} variant="outline" className="rounded-xl" disabled={attendanceRecords.length === 0}>
            <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" /> Export
          </Button>
          <Button onClick={handleShareToWhatsApp} className="bg-green-600 hover:bg-green-700 text-white rounded-xl" disabled={attendanceRecords.length === 0}>
            <WhatsAppIcon /> Share
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>Session information and reporting date.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-indigo-600" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold">Class</p>
                  <p className="font-bold">{currentClass.class_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Library className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold">Subject</p>
                  <p className="font-bold">{currentSubject.subject_name}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm font-bold mb-2">Select Date</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal h-11 rounded-xl">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {format(selectedDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={selectedDate} onSelect={(d) => d && setSelectedDate(d)} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center p-3 rounded-xl bg-green-50 text-green-700">
                <p className="text-[10px] font-bold uppercase">Present</p>
                <p className="text-2xl font-black">{presentCount}</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-rose-50 text-rose-700">
                <p className="text-[10px] font-bold uppercase">Absent</p>
                <p className="text-2xl font-black">{absentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle>Attendance Register</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {attendanceRecords.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground italic">
                No records found for this date.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Roll</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="text-center w-[120px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords.map((record) => {
                    const isPresent = record.status?.toLowerCase() === 'present';
                    return (
                      <TableRow key={record.student_id}>
                        <TableCell className="font-mono text-xs text-slate-500">{record.roll_number}</TableCell>
                        <TableCell className="font-bold">{record.name}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusToggle(record.student_id, record.status)}
                            className={`rounded-full px-4 h-8 text-[11px] font-bold uppercase ${isPresent ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                              }`}
                          >
                            {isPresent ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                            {record.status}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center">
        <Button onClick={() => router.push('/main/attendance/new')} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 px-8">
          <PlusCircle className="mr-2 h-4 w-4" /> Start New Session
        </Button>
      </div>
    </div>
  );
}
