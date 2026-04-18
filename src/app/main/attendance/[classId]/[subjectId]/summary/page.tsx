
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
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  const generatePDF = () => {
    const doc = new jsPDF();
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const displayDate = format(selectedDate, "PPP");

    // Add title and metadata
    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229); // Indigo-600
    doc.text("CampusConnect", 14, 22);

    doc.setFontSize(14);
    doc.setTextColor(33, 37, 41);
    doc.text("Attendance Summary", 14, 32);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Class: ${currentClass.class_name}${currentClass.section_name ? ` - ${currentClass.section_name}` : ''}`, 14, 42);
    doc.text(`Subject: ${currentSubject.subject_name}`, 14, 47);
    doc.text(`Date: ${displayDate}`, 14, 52);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 57);

    // Stats summary
    doc.setFontSize(11);
    doc.setTextColor(22, 163, 74); // Green-600
    doc.text(`Present: ${presentCount}`, 14, 67);
    doc.setTextColor(220, 38, 38); // Red-600
    doc.text(`Absent: ${absentCount}`, 45, 67);

    // Table
    const tableData = attendanceRecords.map(record => [
      record.roll_number,
      record.name,
      record.status.toUpperCase()
    ]);

    autoTable(doc, {
      startY: 72,
      head: [['Roll No.', 'Student Name', 'Status']],
      body: tableData,
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { top: 72 },
    });

    return doc;
  };

  const handleExport = (formatType: 'pdf' | 'excel') => {
    if (!currentClass || !currentSubject || attendanceRecords.length === 0) return;

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const fileName = `Attendance_${currentClass.class_name.replace(/\s+/g, '_')}_${currentSubject.subject_name.replace(/\s+/g, '_')}_${dateStr}`;

    if (formatType === 'excel') {
      try {
        // Prepare data for Excel
        const worksheetData = [
          ["Attendance Summary"],
          ["Class", `${currentClass.class_name}${currentClass.section_name ? ` - ${currentClass.section_name}` : ''}`],
          ["Subject", currentSubject.subject_name],
          ["Date", format(selectedDate, "PPP")],
          ["Present", presentCount],
          ["Absent", absentCount],
          [], // Empty row
          ["Roll No.", "Student Name", "Status"]
        ];

        attendanceRecords.forEach(record => {
          worksheetData.push([record.roll_number, record.name, record.status]);
        });

        const ws = XLSX.utils.aoa_to_sheet(worksheetData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Attendance");

        XLSX.writeFile(wb, `${fileName}.xlsx`);

        toast({
          title: "Export Successful",
          description: "Attendance data has been exported to Excel.",
        });
      } catch (error) {
        console.error("Excel Export Error:", error);
        toast({ title: "Export Failed", description: "Failed to generate Excel file.", variant: "destructive" });
      }
    } else {
      try {
        const doc = generatePDF();
        doc.save(`${fileName}.pdf`);

        toast({
          title: "Export Successful",
          description: "Attendance data has been exported to PDF.",
        });
      } catch (error) {
        console.error("PDF Export Error:", error);
        toast({ title: "Export Failed", description: "Failed to generate PDF document.", variant: "destructive" });
      }
    }
  };

  const handleShareToWhatsApp = async () => {
    if (!currentClass || !currentSubject || attendanceRecords.length === 0) {
      toast({ title: "Cannot Share", description: "No attendance data available to share.", variant: "destructive" });
      return;
    }

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const fileName = `Attendance_${currentClass.class_name.replace(/\s+/g, '_')}_${currentSubject.subject_name.replace(/\s+/g, '_')}_${dateStr}.pdf`;

    let summaryText = `*Attendance Summary*\n\n`;
    summaryText += `*Class:* ${currentClass.class_name}${currentClass.section_name ? ` - ${currentClass.section_name}` : ''}\n`;
    summaryText += `*Subject:* ${currentSubject.subject_name}\n`;
    summaryText += `*Date:* ${format(selectedDate, "PPP")}\n\n`;
    summaryText += `*Present:* ${presentCount}\n`;
    summaryText += `*Absent:* ${absentCount}\n\n`;
    summaryText += `*Student Details:*\n`;

    attendanceRecords.forEach(record => {
      summaryText += `- *${record.name}* (\`${record.roll_number}\`): *${record.status.toUpperCase()}*\n`;
    });

    try {
      // 1. Try to generate and share the PDF file if supported
      const doc = generatePDF();
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: 'Attendance Summary PDF',
          text: summaryText,
        });
        toast({ title: "Shared", description: "Attendance summary shared successfully." });
        return;
      }
    } catch (err) {
      console.warn("Web Share failed, falling back to URL shared", err);
    }

    // 2. Fallback to WhatsApp Web URL + Auto-download PDF
    try {
      const doc = generatePDF();
      doc.save(fileName); // Provide file for manual attachment

      const encodedText = encodeURIComponent(summaryText);
      const whatsappUrl = `https://wa.me/?text=${encodedText}`;
      window.open(whatsappUrl, '_blank');

      toast({
        title: "Sharing to WhatsApp",
        description: "PDF downloaded for manual attachment; summary text sent to WhatsApp.",
      });
    } catch (err) {
      console.error("WhatsApp share fallback failed", err);
      toast({ title: "Error", description: "Failed to share to WhatsApp.", variant: "destructive" });
    }
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
    <div className="container mx-auto py-8 px-4 flex flex-col items-center min-h-[calc(100vh-80px)]">
      <div className="w-full max-w-5xl mb-6 flex justify-start">
        <Button onClick={() => router.push('/main/attendance')} variant="outline" className="rounded-lg h-10 px-4 bg-white/50 border-slate-200">
          <Home className="mr-2 h-4 w-4" /> Back to Attendance Dashboard
        </Button>
      </div>

      <div className="w-full max-w-5xl">
        <Card className="shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b pb-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">Attendance Summary</CardTitle>
                <CardDescription className="text-sm mt-1 flex items-center gap-1">Review the attendance records. Click on a status to edit. <Edit3 className="h-3 w-3" /></CardDescription>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-10 rounded-lg text-slate-700 w-full md:w-auto">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {format(selectedDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar mode="single" selected={selectedDate} onSelect={(d) => d && setSelectedDate(d)} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4 bg-white border border-slate-200 rounded-lg px-6 py-3 text-sm font-medium text-slate-700 w-fit">
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
                <span>Date: <strong>{format(selectedDate, "PPP")}</strong></span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4 text-sm font-bold">
              <span className="text-green-600">Present: {presentCount}</span>
              <span className="text-red-500">Absent: {absentCount}</span>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {attendanceRecords.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground italic">
                No records found for this date.
              </div>
            ) : (
              <div className="px-6 pb-6">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-slate-200 hover:bg-transparent">
                      <TableHead className="w-[150px] text-slate-500 font-medium">Roll No.</TableHead>
                      <TableHead className="text-slate-500 font-medium">Student Name</TableHead>
                      <TableHead className="text-center w-[200px] text-slate-500 font-medium">Status (Click to Edit)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceRecords.map((record) => {
                      const isPresent = record.status?.toLowerCase() === 'present';
                      return (
                        <TableRow key={record.student_id} className="border-b-slate-100 border-b last:border-0 hover:bg-slate-50/50">
                          <TableCell className="text-slate-600 font-mono text-sm">{record.roll_number}</TableCell>
                          <TableCell className="font-medium text-slate-900">{record.name}</TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusToggle(record.student_id, record.status)}
                              className={`rounded-full px-4 h-8 text-xs font-semibold ${isPresent ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-500 hover:bg-red-100'
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
              </div>
            )}
          </CardContent>

          <div className="bg-slate-50/50 p-6 border-t border-slate-100 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => handleExport('excel')} variant="outline" className="rounded-lg bg-white" disabled={attendanceRecords.length === 0}>
                <FileSpreadsheet className="mr-2 h-4 w-4 text-slate-500" /> Export to Excel
              </Button>
              <Button onClick={() => handleExport('pdf')} variant="outline" className="rounded-lg bg-white" disabled={attendanceRecords.length === 0}>
                <FileText className="mr-2 h-4 w-4 text-slate-500" /> Export to PDF
              </Button>
              <Button onClick={handleShareToWhatsApp} variant="outline" className="rounded-lg bg-white" disabled={attendanceRecords.length === 0}>
                <WhatsAppIcon /> Share to WhatsApp
              </Button>
            </div>
            <Button onClick={() => router.push('/main/attendance/new')} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
              <PlusCircle className="mr-2 h-4 w-4" /> New Attendance Session
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
