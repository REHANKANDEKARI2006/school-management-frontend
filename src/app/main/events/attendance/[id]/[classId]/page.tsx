"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ChevronLeft, Search, Save, CheckCircle2, 
  XCircle, Filter, Users, ArrowRight, Loader2,
  Info, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { getEventAttendance, submitEventAttendance } from "@/lib/api/events";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function EventAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const eventId = params.id as string;
  const classId = params.classId as string;
  const staffId = typeof window !== "undefined" ? Number(localStorage.getItem("staff_id")) : 0;

  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [data, setData] = React.useState<any>(null);
  const [attendanceRecords, setAttendanceRecords] = React.useState<any[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getEventAttendance(eventId, classId);
        setData(res);
        
        // Initialize records from students and existing attendance
        const initialRecords = res.students.map((student: any) => {
          const existing = res.attendance.find((a: any) => a.student_id === student.student_id);
          return {
            student_id: student.student_id,
            name: student.name,
            roll_number: student.roll_number,
            status: existing ? existing.status : "present", // Default to present
            remarks: existing ? existing.remarks : "",
          };
        });
        setAttendanceRecords(initialRecords);
      } catch (err) {
        toast({ title: "Error", description: "Failed to load attendance data", variant: "destructive" });
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [eventId, classId, toast, router]);

  const updateStatus = (studentId: number, status: "present" | "absent") => {
    setAttendanceRecords(prev => prev.map(r => r.student_id === studentId ? { ...r, status } : r));
  };

  const updateRemarks = (studentId: number, remarks: string) => {
    setAttendanceRecords(prev => prev.map(r => r.student_id === studentId ? { ...r, remarks } : r));
  };

  const markAllStatus = (status: "present" | "absent") => {
    setAttendanceRecords(prev => prev.map(r => ({ ...r, status })));
    toast({ title: `All Marked ${status.charAt(0).toUpperCase() + status.slice(1)}`, description: `Attendance status updated for all students.` });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await submitEventAttendance(eventId, classId, attendanceRecords, staffId);
      toast({ title: "Attendance Submitted", description: "Records saved and regular attendance auto-populated." });
      router.push("/main/events");
    } catch (err) {
      toast({ title: "Submission Failed", description: "Failed to save attendance records", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRecords = attendanceRecords.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.roll_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const presentCount = attendanceRecords.filter(r => r.status === "present").length;
  const absentCount = attendanceRecords.filter(r => r.status === "absent").length;
  const totalCount = attendanceRecords.length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Loading Participant Registry...</p>
      </div>
    );
  }

  const isSubmitted = data?.is_submitted;

  return (
    <div className="max-w-[1000px] mx-auto space-y-8 pb-32">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <Button variant="ghost" className="w-fit -ml-2 text-slate-400 hover:text-blue-600 h-8 gap-2 font-bold px-3 rounded-full" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4" /> Back to Events
        </Button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Badge className="bg-blue-600/10 text-blue-600 border-blue-600/20 hover:bg-blue-600/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                {data.event.event_type}
              </Badge>
              {isSubmitted && (
                <Badge className="bg-emerald-500 text-white border-none px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-emerald-100">
                  <CheckCircle2 className="h-3 w-3" /> Submitted
                </Badge>
              )}
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">{data.event.event_name}</h1>
            <div className="flex items-center gap-4 text-slate-400 font-bold text-sm">
               <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-blue-500" /> Class {data.assignment.class_name} {data.assignment.section_name}</span>
               <span className="w-1 h-1 bg-slate-200 rounded-full" />
               <span>{format(new Date(), "EEEE, MMMM do")}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm">
             <div className="px-6 py-2 border-r border-slate-50">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</div>
                <div className="text-2xl font-black text-slate-800 leading-none">{totalCount}</div>
             </div>
             <div className="px-6 py-2 border-r border-slate-50">
                <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Present</div>
                <div className="text-2xl font-black text-emerald-500 leading-none">{presentCount}</div>
             </div>
             <div className="px-6 py-2 pr-6">
                <div className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Absent</div>
                <div className="text-2xl font-black text-rose-500 leading-none">{absentCount}</div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main List */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Search by name or roll no..." 
                    className="h-12 pl-11 rounded-2xl border-none bg-white shadow-inner focus:ring-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                {!isSubmitted && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-12 rounded-2xl border-slate-200 text-slate-600 font-bold hover:bg-emerald-50 hover:text-emerald-600" onClick={() => markAllStatus("present")}>
                      All Present
                    </Button>
                    <Button variant="outline" size="sm" className="h-12 rounded-2xl border-slate-200 text-slate-600 font-bold hover:bg-rose-50 hover:text-rose-600" onClick={() => markAllStatus("absent")}>
                      All Absent
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[60vh]">
                <div className="divide-y divide-slate-50">
                  <AnimatePresence mode="popLayout">
                    {filteredRecords.map((record) => (
                      <motion.div 
                        layout
                        key={record.student_id} 
                        className="p-6 flex items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 rounded-xl group-hover:scale-105 transition-transform">
                             <AvatarFallback className="bg-slate-100 text-slate-500 font-black text-xs uppercase rounded-xl">
                                {record.name.substring(0, 2)}
                             </AvatarFallback>
                          </Avatar>
                          <div className="space-y-0.5">
                             <div className="font-bold text-slate-800">{record.name}</div>
                             <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Roll: {record.roll_number}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {!isSubmitted ? (
                            <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl gap-1">
                              <button
                                onClick={() => updateStatus(record.student_id, "present")}
                                className={cn(
                                  "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                  record.status === "present" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" : "text-slate-400 hover:text-slate-600"
                                )}
                              >
                                Present
                              </button>
                              <button
                                onClick={() => updateStatus(record.student_id, "absent")}
                                className={cn(
                                  "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                  record.status === "absent" ? "bg-rose-500 text-white shadow-lg shadow-rose-200" : "text-slate-400 hover:text-slate-600"
                                )}
                              >
                                Absent
                              </button>
                            </div>
                          ) : (
                            <Badge className={cn(
                              "px-6 py-2 rounded-full font-black uppercase text-[10px] tracking-widest",
                              record.status === "present" ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-100" : "bg-rose-100 text-rose-600 hover:bg-rose-100"
                            )}>
                              {record.status}
                            </Badge>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 bg-blue-600 text-white overflow-hidden p-8 space-y-6 sticky top-8">
            <div className="space-y-2">
               <h3 className="text-lg font-black uppercase tracking-tight leading-none">Event Context</h3>
               <p className="text-xs text-blue-100 font-medium opacity-80">Managing attendance for this session will automatically bridge records to regular classes.</p>
            </div>

            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
                     <Info className="h-4 w-4 text-blue-200" />
                  </div>
                  <div className="text-xs font-bold leading-tight">
                     Automated bridging enabled. Displaced periods will be populated upon submission.
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
                     <AlertTriangle className="h-4 w-4 text-amber-300" />
                  </div>
                  <div className="text-xs font-bold leading-tight">
                     Verify all present students before finalized submission. Changes require Admin unlock.
                  </div>
               </div>
            </div>

            {!isSubmitted ? (
               <Button 
                className="w-full h-16 bg-white text-blue-600 hover:bg-blue-50 rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/20 active:scale-95 transition-all gap-2"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                Finalize & Submit
              </Button>
            ) : (
              <div className="bg-white/10 p-5 rounded-2xl border border-white/10 flex flex-col items-center gap-3">
                 <div className="h-10 w-10 bg-emerald-400 rounded-full flex items-center justify-center shadow-lg shadow-emerald-400/20">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                 </div>
                 <div className="text-center">
                    <div className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Submission Recorded</div>
                    <div className="text-[11px] font-bold text-white/80 mt-1 italic">Records are now locked for synchronization.</div>
                 </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
