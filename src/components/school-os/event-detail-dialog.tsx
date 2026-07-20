"use client";

import * as React from "react";
import { format } from "date-fns";
import { 
  Calendar, MapPin, Users, Clock, AlertCircle, 
  CheckCircle2, ChevronRight, User, Info, 
  ShieldCheck, ArrowRight, ExternalLink
} from "lucide-react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getEventById, unlockAttendanceEdit } from "@/lib/api/events";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface EventDetailDialogProps {
  eventId: number;
  onMarkAttendance: (eventId: number, classId: number) => void;
  isAdmin?: boolean;
  currentStaffId?: number;
}

export function EventDetailDialog({ eventId, onMarkAttendance, isAdmin, currentStaffId }: EventDetailDialogProps) {
  const { toast } = useToast();
  const [event, setEvent] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchDetail = React.useCallback(async () => {
    try {
      const data = await getEventById(eventId);
      setEvent(data);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load event details", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [eventId, toast]);

  React.useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleUnlock = async (classId: number) => {
    try {
      await unlockAttendanceEdit(eventId, classId);
      toast({ title: "Unlocked", description: "Attendance unlocked for editing." });
      fetchDetail();
    } catch (err) {
      toast({ title: "Error", description: "Failed to unlock attendance", variant: "destructive" });
    }
  }

  if (loading) {
    return (
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-[2.5rem] border-none">
        <div className="p-8 space-y-6">
          <Skeleton className="h-8 w-1/2 rounded-lg" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-4">
             <Skeleton className="h-16 rounded-2xl" />
             <Skeleton className="h-16 rounded-2xl" />
          </div>
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </DialogContent>
    );
  }

  if (!event) return null;

  const isMultiDay = event.event_start_date !== event.event_end_date;

  return (
    <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-white">
      <div className="bg-slate-900 px-8 py-10 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full -ml-24 -mb-24 blur-3xl" />
        
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              {event.event_type}
            </Badge>
            <Badge variant="outline" className="border-white/20 text-white/60 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
              ID: CC-EV-{event.event_id}
            </Badge>
          </div>
          
          <DialogTitle className="text-3xl font-black tracking-tight leading-tight uppercase">
            {event.event_name}
          </DialogTitle>
          
          <div className="flex flex-wrap items-center gap-6 mt-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                <Calendar className="h-5 w-5 text-blue-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Date</span>
                <span className="text-sm font-bold">
                  {isMultiDay 
                    ? `${format(new Date(event.event_start_date), "MMM d")} - ${format(new Date(event.event_end_date), "MMM d, yyyy")}`
                    : format(new Date(event.event_start_date), "MMMM do, yyyy")
                  }
                </span>
              </div>
            </div>

            {event.start_time && (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                  <Clock className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Time</span>
                  <span className="text-sm font-bold">{event.start_time.substring(0, 5)} - {event.end_time?.substring(0, 5)}</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                <MapPin className="h-5 w-5 text-rose-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Location</span>
                <span className="text-sm font-bold">{event.venue}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="max-h-[60vh]">
        <div className="p-8 space-y-8">
          {/* Description */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
               <Info className="h-3 w-3" /> About Event
            </h3>
            <p className="text-slate-600 leading-relaxed font-medium">
              {event.description}
            </p>
          </div>

          <Separator className="bg-slate-100" />

          {/* Participating Classes */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                 <Users className="h-3 w-3" /> Participation & Attendance
              </h3>
              <Badge variant="outline" className="border-slate-100 text-slate-400 font-bold px-3 py-1 rounded-full text-[9px] uppercase tracking-widest bg-slate-50">
                 {event.class_assignments?.length || 0} Classes Participating
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {event.class_assignments?.map((ca: any) => {
                const isCoordinator = ca.coordinator_teacher_id === currentStaffId;
                const canMark = isAdmin || isCoordinator;
                const progress = ca.attendance_summary ? (ca.attendance_summary.present + ca.attendance_summary.absent) / ca.attendance_summary.total * 100 : 0;
                const isSubmitted = ca.attendance_status === 'submitted';

                return (
                  <div key={ca.id} className="group p-5 rounded-[2rem] border border-slate-100 bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-14 w-14 rounded-2xl bg-slate-50 flex flex-col items-center justify-center border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                           <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">CL</span>
                           <span className="text-xl font-black text-slate-800 leading-none">{ca.class_name}</span>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="font-bold text-slate-800 text-sm">{ca.section_name || "General"}</div>
                          <div className="flex items-center gap-2">
                             <Avatar className="h-5 w-5 rounded-full border border-slate-200">
                               <AvatarImage src={ca.coordinator_profile_url} />
                               <AvatarFallback className="text-[8px] font-bold">
                                 {ca.coordinator_first_name?.charAt(0)}
                               </AvatarFallback>
                             </Avatar>
                             <span className="text-[11px] font-bold text-slate-500">
                               {ca.coordinator_first_name ? `${ca.coordinator_first_name} ${ca.coordinator_last_name}` : "No Coordinator"}
                             </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {isSubmitted ? (
                          <div className="flex items-center gap-2">
                             <div className="flex flex-col items-end mr-2">
                               <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Attendance Submitted</span>
                               <span className="text-[9px] font-bold text-slate-400">
                                 {ca.attendance_summary?.present} Present / {ca.attendance_summary?.total} Total
                               </span>
                             </div>
                             {isAdmin && (
                               <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full hover:bg-rose-50 hover:text-rose-600 text-slate-300" onClick={() => handleUnlock(ca.class_id)}>
                                 <ShieldCheck className="h-4 w-4" />
                               </Button>
                             )}
                             <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                          </div>
                        ) : (
                          canMark ? (
                            <Button 
                              size="sm" 
                              className="rounded-full bg-blue-600 hover:bg-blue-800 h-10 px-6 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-100 transition-all active:scale-95 flex items-center gap-2"
                              onClick={() => onMarkAttendance(event.event_id, ca.class_id)}
                            >
                              Mark Attendance <ArrowRight className="h-3 w-3" />
                            </Button>
                          ) : (
                            <Badge variant="outline" className="border-slate-100 text-slate-400 font-bold px-4 py-1.5 rounded-full text-[9px] uppercase tracking-widest">
                               Not Started
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timetable Impact / Displaced Periods */}
          {event.period_exchanges?.length > 0 && (
            <div className="bg-amber-50/50 p-8 rounded-[2.5rem] border border-amber-100/50 space-y-4">
              <div className="flex items-center gap-3">
                 <div className="p-2.5 bg-amber-100 rounded-2xl text-amber-600 shadow-sm border border-amber-200/50">
                    <AlertCircle className="h-5 w-5" />
                 </div>
                 <div>
                    <h4 className="text-base font-black text-amber-900 uppercase tracking-tight">Timetable Override Notice</h4>
                    <p className="text-[11px] text-amber-700 font-medium">This event is displacing regular class periods for participating classes.</p>
                 </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {event.period_exchanges.map((ex: any, idx: number) => (
                  <div key={idx} className="bg-white/80 p-4 rounded-2xl border border-amber-100/50 flex flex-col gap-1.5 group">
                    <div className="flex items-center justify-between">
                       <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Period {ex.original_period_number}</span>
                       <Badge className="bg-amber-100 text-amber-700 text-[8px] font-bold p-0 px-2 h-4 rounded-full border-amber-200">EXCHANGED</Badge>
                    </div>
                    <div className="text-xs font-bold text-slate-700">{ex.original_subject}</div>
                    <div className="text-[10px] font-medium text-slate-400 flex items-center justify-between">
                       <span>{ex.class_name} {ex.section_name}</span>
                       <span className="text-amber-500 font-bold">{format(new Date(ex.exchange_date), "MMM d")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </DialogContent>
  );
}
