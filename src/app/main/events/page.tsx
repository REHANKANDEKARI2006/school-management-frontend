"use client";

import * as React from "react";
import axios from "@/lib/axios";
import { MoreHorizontal, PlusCircle, Award, Calendar as CalendarIcon, MapPin, Image as ImageIcon } from "lucide-react";
import { PageSkeleton } from "@/components/ui/skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { EventForm, type Event } from "@/components/campus-connect/event-form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSearch } from "@/components/campus-connect/search-provider";
import { EventCertificateDialog } from "@/components/campus-connect/event-certificate";
import { getEvents, createEvent, updateEvent, deleteEvent } from "@/lib/api/events";
import { format } from "date-fns";
import { EventGallery } from "@/components/campus-connect/event-gallery";

const getStatusVariant = (status: string) => {
  switch (status?.toLowerCase()) {
    case "completed":
      return "secondary";
    case "upcoming":
      return "default";
    case "scheduled":
      return "outline";
    case "ongoing":
      return "default"; // or a custom variant if available
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
}

import { ROLE } from "@/config/roles";

export default function EventsPage() {
  const { toast } = useToast();
  const { searchQuery } = useSearch();
  const [events, setEvents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [formLoading, setFormLoading] = React.useState(false);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedEvent, setSelectedEvent] = React.useState<any>(undefined);
  const [isCertificateOpen, setIsCertificateOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<any>(null);

  const roleId =
    typeof window !== "undefined"
      ? Number(localStorage.getItem("role_id"))
      : null;
  const isStudent = roleId === ROLE.STUDENT;

  const fetchEventsData = React.useCallback(async () => {
    try {
      const studentClassId = typeof window !== "undefined" ? localStorage.getItem("class_id") : null;
      const url = isStudent && studentClassId ? `/api/events?class_id=${studentClassId}` : "/api/events";
      const res = await axios.get(url);
      setEvents(res.data.data || []);
    } catch {
      toast({ title: "Error", description: "Failed to load events", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [isStudent, toast]);

  React.useEffect(() => {
    fetchEventsData();
  }, [fetchEventsData]);

  const filteredEvents = React.useMemo(() => {
    if (!searchQuery) {
      return events;
    }
    const q = searchQuery.toLowerCase();
    return events.filter(event =>
      event.event_name?.toLowerCase().includes(q) ||
      event.description?.toLowerCase().includes(q) ||
      event.computed_status?.toLowerCase().includes(q) ||
      event.venue?.toLowerCase().includes(q)
    );
  }, [searchQuery, events]);

  const handleFormSubmit = async (values: any) => {
    setFormLoading(true);
    try {
      const payload = {
        ...values,
        event_start_date: values.event_start_date ? format(new Date(values.event_start_date), 'yyyy-MM-dd') : undefined,
        event_end_date: values.event_end_date ? format(new Date(values.event_end_date), 'yyyy-MM-dd') : undefined,
      };

      if (selectedEvent) {
        await updateEvent(selectedEvent.event_id, payload);
        toast({ title: "Event Updated", description: `${values.event_name} has been updated.` });
      } else {
        await createEvent(payload);
        toast({ title: "Event Created", description: `${values.event_name} has been added.` });
      }
      setIsFormOpen(false);
      setSelectedEvent(undefined);
      fetchEventsData();
    } catch (err: any) {
      console.error("Event creation failed:", err);
      const errorMessage = err?.response?.data?.message || err?.message || "Operation failed";
      const errorDetail = err?.response?.data?.error_code ? ` (Code: ${err.response.data.error_code})` : "";
      
      toast({
        title: "Error Creating Event",
        description: `${errorMessage}${errorDetail}`,
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEvent(deleteTarget.event_id);
      toast({ title: "Event Deleted", description: `${deleteTarget.event_name} has been removed.` });
      setDeleteTarget(null);
      fetchEventsData();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Deletion failed",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (event: any) => {
    setSelectedEvent(event);
    setIsFormOpen(true);
  }

  const openNewDialog = () => {
    setSelectedEvent(undefined);
    setIsFormOpen(true);
  }

  const openCertificateDialog = (event: any) => {
    setSelectedEvent(event);
    setIsCertificateOpen(true);
  }

  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const [defaultDetailTab, setDefaultDetailTab] = React.useState("overview");
  
  const openDetailWithTab = (event: any, tab: string = "overview") => {
    setSelectedEvent(event);
    setDefaultDetailTab(tab);
    setIsDetailOpen(true);
  };

  const staffId = typeof window !== "undefined" ? Number(localStorage.getItem("staff_id")) : undefined;
  const isAdmin = roleId === ROLE.MASTER_ADMIN || roleId === ROLE.INSTITUTE_ADMIN;

  const navigateToAttendance = (eventId: number, classId: number) => {
    window.location.href = `/main/events/attendance/${eventId}/${classId}`;
  }

  return (
    <>
      <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="font-bold text-2xl tracking-tight text-slate-800">Events & Activities</CardTitle>
              <CardDescription className="text-slate-500 font-medium">Manage class-specific events, scheduling, and attendance.</CardDescription>
            </div>
            {!isStudent && (
              <Button size="sm" className="gap-2 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 h-10 px-6 rounded-xl font-bold shadow-lg shadow-blue-100 transition-all active:scale-95" onClick={openNewDialog}>
                <PlusCircle className="h-4 w-4" />
                <span>Create Event</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto min-h-[400px]">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="w-[80px] hidden sm:table-cell pl-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Preview</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Event Details</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Type & Status</TableHead>
                  <TableHead className="hidden md:table-cell text-[10px] font-black uppercase tracking-widest text-slate-400">Date, Time & Venue</TableHead>
                  <TableHead className="hidden lg:table-cell text-[10px] font-black uppercase tracking-widest text-slate-400">Participants</TableHead>
                  {!isStudent && <TableHead className="w-12 text-right pr-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="p-0">
                      <PageSkeleton rows={5} />
                    </TableCell>
                  </TableRow>
                ) : filteredEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CalendarIcon className="h-10 w-10 text-slate-200" />
                        <p className="text-slate-400 font-medium italic">No events found matching your criteria.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents.map((event) => (
                    <TableRow 
                      key={event.event_id} 
                      className="group border-slate-50 hover:bg-blue-50/20 transition-colors cursor-pointer"
                      onClick={() => openDetailWithTab(event, "overview")}
                    >
                      <TableCell className="hidden sm:table-cell pl-6">
                        <Avatar className="h-12 w-12 rounded-2xl bg-white border border-slate-100 shadow-sm transition-transform group-hover:scale-110">
                          <AvatarFallback className="rounded-2xl bg-blue-50 text-blue-600 font-black text-xs">
                            {event.event_name?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{event.event_name}</div>
                          <div className="text-[11px] text-slate-400 font-medium max-w-[250px] line-clamp-1">
                            {event.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <Badge variant={getStatusVariant(event.computed_status)} className="rounded-full px-3 py-0 h-5 text-[10px] font-bold uppercase tracking-tight">
                              {event.computed_status || "Scheduled"}
                            </Badge>
                          </div>
                          <Badge variant="outline" className="w-fit border-slate-200 text-slate-500 text-[9px] font-bold uppercase tracking-widest bg-white">
                            {event.event_type || "School Event"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                            <CalendarIcon className="h-3.5 w-3.5 text-blue-500" />
                            {event.event_start_date ? (
                              event.event_start_date === event.event_end_date 
                                ? format(new Date(event.event_start_date), "MMM d, yyyy")
                                : `${format(new Date(event.event_start_date), "MMM d")} - ${format(new Date(event.event_end_date), "MMM d, yyyy")}`
                            ) : event.event_date ? format(new Date(event.event_date), "MMM d, yyyy") : "No date"}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400">
                            <MapPin className="h-3 w-3" />
                            {event.venue || "No venue"}
                            {event.start_time && (
                              <span className="ml-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-bold border border-slate-200">
                                {event.start_time.substring(0, 5)} - {event.end_time?.substring(0, 5)}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex flex-col gap-1">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {event.class_count > 0 ? `${event.class_count} Participating Classes` : "General School Event"}
                          </div>
                          {event.class_count > 0 && (
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-emerald-500 transition-all duration-1000" 
                                  style={{ width: `${(event.classes_submitted / event.class_count) * 100}%` }}
                                />
                              </div>
                              <span className="text-[9px] font-black text-emerald-600 uppercase">
                                {Math.round((event.classes_submitted / event.class_count) * 100)}% Marked
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      {!isStudent && (
                        <TableCell className="text-right pr-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition-all">
                                <MoreHorizontal className="h-5 w-5 text-slate-400" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-xl border-slate-100">
                              <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2">Event Controls</DropdownMenuLabel>
                              <DropdownMenuItem className="rounded-xl px-3 py-2 cursor-pointer font-bold text-slate-700 focus:bg-blue-50 focus:text-blue-600" onClick={() => openEditDialog(event)}>
                                Edit Configuration
                              </DropdownMenuItem>
                              <DropdownMenuItem className="rounded-xl px-3 py-2 cursor-pointer font-bold text-slate-700 focus:bg-blue-50 focus:text-blue-600" onClick={() => openCertificateDialog(event)}>
                                <Award className="mr-2 h-4 w-4" />
                                Generate Certificates
                              </DropdownMenuItem>
                              <DropdownMenuItem className="rounded-xl px-3 py-2 cursor-pointer font-bold text-slate-700 focus:bg-blue-50 focus:text-blue-600" onClick={() => openDetailWithTab(event, "photos")}>
                                <ImageIcon className="mr-2 h-4 w-4" />
                                Photo Gallery
                              </DropdownMenuItem>
                              <div className="h-px bg-slate-100 my-1 mx-1" />
                              <DropdownMenuItem
                                className="rounded-xl px-3 py-2 cursor-pointer font-bold text-rose-600 focus:bg-rose-50 focus:text-rose-600"
                                onClick={() => setDeleteTarget(event)}
                              >
                                Delete Permanent
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[750px] p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
          <div className="bg-blue-600 px-8 py-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
            <DialogHeader className="relative z-10">
              <DialogTitle className="text-2xl font-black tracking-tight">{selectedEvent ? "Configure Event" : "Create New Activity"}</DialogTitle>
              <DialogDescription className="text-blue-100 font-medium opacity-80">
                {selectedEvent ? "Modify the schedule and participation rules for this event." : "Set up a new school-wide or class-specific activity with period exchange logic."}
              </DialogDescription>
            </DialogHeader>
          </div>
          <ScrollArea className="max-h-[80vh] p-8">
            <EventForm
              onSubmit={handleFormSubmit}
              event={selectedEvent}
              loading={formLoading}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={isCertificateOpen} onOpenChange={setIsCertificateOpen}>
        {selectedEvent && <EventCertificateDialog event={selectedEvent} />}
      </Dialog>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        {selectedEvent && (
          <EventDetailDialog 
            eventId={selectedEvent.event_id} 
            onMarkAttendance={navigateToAttendance}
            isAdmin={isAdmin}
            currentStaffId={staffId}
            defaultTab={defaultDetailTab}
          />
        )}
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the event
              <strong> {deleteTarget?.event_name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function EventDetailDialog({ eventId, onMarkAttendance, isAdmin, currentStaffId, defaultTab = "overview" }: { 
  eventId: number; 
  onMarkAttendance: (eid: number, cid: number) => void;
  isAdmin: boolean;
  currentStaffId?: number;
  defaultTab?: string;
}) {
  const [eventData, setEventData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  const fetchDetail = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/events/${eventId}`);
      setEventData(res.data.data);
    } catch {
      toast({ title: "Error", description: "Could not load event details", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [eventId, toast]);

  React.useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleUnlock = async (classId: number) => {
    try {
      await axios.post(`/api/events/unlock-attendance`, { eventId, classId });
      toast({ title: "Unlocked", description: "Attendance can now be corrected." });
      fetchDetail();
    } catch {
      toast({ title: "Error", description: "Unlock failed", variant: "destructive" });
    }
  };

  if (loading || !eventData) {
    return <div className="p-10 flex flex-col items-center gap-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      <p className="text-sm font-bold text-slate-400">Loading details...</p>
    </div>;
  }

  return (
    <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
       <DialogHeader className="sr-only">
         <DialogTitle>{eventData.event_name}</DialogTitle>
       </DialogHeader>
       <div className="bg-slate-900 px-8 py-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full -mr-32 -mt-32 blur-[80px]" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Badge className="bg-blue-600 text-white border-none rounded-md px-2 py-0.5 text-[10px] uppercase font-black tracking-widest">{eventData.event_type || 'Event'}</Badge>
                <div className="flex items-center gap-1.5 text-blue-400">
                  <CalendarIcon size={14} />
                  <span className="text-xs font-bold tracking-tight">{format(new Date(eventData.event_start_date), "MMMM d, yyyy")}</span>
                </div>
              </div>
              <h2 className="text-3xl font-black tracking-tight leading-none uppercase">{eventData.event_name}</h2>
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <MapPin size={12} className="text-blue-500" />
                {eventData.venue}
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-3xl p-4 border border-white/10 text-center min-w-[120px]">
               <div className="text-2xl font-black text-blue-400">{eventData.attendance_percentage}%</div>
               <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Participation</div>
            </div>
          </div>
       </div>

       <Tabs defaultValue={defaultTab} className="w-full">
          <div className="bg-slate-50 px-8 border-b border-slate-100">
            <TabsList className="bg-transparent h-14 p-0 gap-8">
              <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 h-14 rounded-none px-0 text-xs font-black uppercase tracking-widest text-slate-400">Overview</TabsTrigger>
              <TabsTrigger value="classes" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 h-14 rounded-none px-0 text-xs font-black uppercase tracking-widest text-slate-400">Participants ({eventData.classes?.length || 0})</TabsTrigger>
              <TabsTrigger value="photos" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 h-14 rounded-none px-0 text-xs font-black uppercase tracking-widest text-slate-400">Event Photos</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="m-0">
            <ScrollArea className="h-[450px]">
              <div className="p-8 space-y-8">
                 <div className="space-y-3">
                   <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">About the Event</h3>
                   <p className="text-sm text-slate-600 leading-relaxed font-medium bg-slate-50 p-6 rounded-3xl border border-slate-100">
                     {eventData.description || "No description provided."}
                   </p>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <div className="p-6 bg-white border border-slate-100 rounded-3xl space-y-4 shadow-sm">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Schedule Timeline</h3>
                      <div className="space-y-3">
                         <div className="flex items-center justify-between">
                           <span className="text-xs font-bold text-slate-500">Start Time</span>
                           <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{eventData.start_time?.substring(0, 5) || "N/A"}</span>
                         </div>
                         <div className="flex items-center justify-between">
                           <span className="text-xs font-bold text-slate-500">End Time</span>
                           <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{eventData.end_time?.substring(0, 5) || "N/A"}</span>
                         </div>
                      </div>
                   </div>
                   
                   <div className="p-6 bg-white border border-slate-100 rounded-3xl space-y-4 shadow-sm">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Event Statistics</h3>
                      <div className="space-y-4">
                         <div className="flex justify-between items-end">
                            <span className="text-xs font-bold text-slate-500">Attendance</span>
                            <span className="text-[10px] font-black text-slate-400">{eventData.att_present}/{eventData.att_total} Students</span>
                         </div>
                         <Progress value={eventData.attendance_percentage} className="h-2 rounded-full" />
                      </div>
                   </div>
                 </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="classes" className="m-0">
            <ScrollArea className="h-[450px]">
              <div className="p-8 space-y-4">
                 {eventData.classes?.map((c: any) => {
                   const isCoordinator = c.coordinator_id === currentStaffId;
                   return (
                     <div key={c.class_id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-white border border-slate-100 rounded-[2rem] hover:border-blue-200 transition-all gap-4">
                        <div className="flex items-center gap-4">
                           <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xs border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                             {c.class_name[0]}
                           </div>
                           <div className="space-y-0.5">
                             <h4 className="font-bold text-slate-800">{c.class_name}</h4>
                             <div className="flex items-center gap-2">
                               <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Coordinator:</span>
                               <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">{c.coordinator_name}</span>
                             </div>
                           </div>
                        </div>

                        <div className="flex items-center gap-3">
                           <div className="text-right mr-4">
                             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</div>
                             <Badge variant="outline" className={cn(
                               "text-[9px] font-black uppercase h-5",
                               c.attendance_completed ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                             )}>
                               {c.attendance_completed ? "Completed" : "Pending"}
                             </Badge>
                           </div>
                           
                           {(isAdmin || isCoordinator) && (
                             <div className="flex items-center gap-2">
                                {isAdmin && c.attendance_completed && (
                                  <Button variant="ghost" size="sm" className="h-9 w-9 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => handleUnlock(c.class_id)}>
                                    <Award size={16} /> {/* Replace with unlock icon if available */}
                                  </Button>
                                )}
                                <Button 
                                  size="sm" 
                                  className={cn(
                                    "h-10 px-5 rounded-xl font-bold gap-2",
                                    c.attendance_completed ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-blue-600 text-white hover:bg-blue-700"
                                  )}
                                  onClick={() => onMarkAttendance(eventId, c.class_id)}
                                >
                                  {c.attendance_completed ? "Update" : "Mark Attendance"}
                                  <ChevronRight size={14} />
                                </Button>
                             </div>
                           )}
                        </div>
                     </div>
                   );
                 })}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="photos" className="m-0">
            <ScrollArea className="h-[450px]">
               <div className="p-8 space-y-4">
                <EventGallery 
                  eventId={eventId} 
                  isAdmin={isAdmin} 
                  eventStatus={eventData.computed_status} 
                />
               </div>
            </ScrollArea>
          </TabsContent>
       </Tabs>
    </DialogContent>
  );
}

// Re-defining icons for the component if not already imported or available
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
