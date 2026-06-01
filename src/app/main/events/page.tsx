"use client";

import * as React from "react";
import axios from "@/lib/axios";
import { MoreHorizontal, PlusCircle, Award, Calendar as CalendarIcon, MapPin, Image as ImageIcon, Loader2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
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
  DropdownMenuSeparator,
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
import { getEvents, createEvent, updateEvent, deleteEvent, unlockAttendanceEdit } from "@/lib/api/events";
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
  const isTeacher = roleId === ROLE.TEACHER || roleId === ROLE.CLASS_TEACHER || roleId === ROLE.MENTOR;

  const navigateToAttendance = (eventId: number, classId: number) => {
    window.location.href = `/main/events/attendance/${eventId}/${classId}`;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <CardTitle>Events & Activities</CardTitle>
            <CardDescription>
              Manage school events, class participation, and scheduling
            </CardDescription>
          </div>
          
          {isAdmin && (
            <Button
              size="sm"
              onClick={openNewDialog}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Event Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date & Venue</TableHead>
                  <TableHead>Participation</TableHead>
                  {!isStudent && <TableHead className="w-12 text-right pr-6" />}
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
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      No events found. Click "Create Event" to add one.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents.map((event) => {
                    const participationPct = event.class_count && event.class_count > 0 
                      ? Math.round((event.classes_submitted / event.class_count) * 100) 
                      : 0;
                    
                    return (
                      <TableRow 
                        key={event.event_id} 
                        className="group cursor-pointer"
                        onClick={() => openDetailWithTab(event, "overview")}
                      >
                        <TableCell className="pl-6 font-medium">
                          {event.event_name}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {event.event_type}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(event.computed_status)}>
                            {event.computed_status || "Scheduled"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground">
                            <p>{event.event_start_date ? format(new Date(event.event_start_date), "MMM d, yyyy") : "TBD"}</p>
                            <p>{event.venue || "Campus"}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                             <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary transition-all" 
                                  style={{ width: `${participationPct}%` }}
                                />
                             </div>
                             <span className="text-[10px] font-medium text-muted-foreground">{participationPct}%</span>
                          </div>
                        </TableCell>
                        {!isStudent && (
                          <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {!isTeacher && (
                                  <DropdownMenuItem onClick={() => openEditDialog(event)}>Edit Details</DropdownMenuItem>
                                )}
                                {!isTeacher && (
                                  <DropdownMenuItem onClick={() => openCertificateDialog(event)}>Certificates</DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => openDetailWithTab(event, "photos")}>Gallery</DropdownMenuItem>
                                {!isTeacher && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(event)}>Delete Event</DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile List View */}
          <div className="md:hidden flex flex-col gap-3 p-4 bg-muted/10">
            {loading ? (
              <PageSkeleton rows={3} />
            ) : filteredEvents.length === 0 ? (
              <p className="text-center text-muted-foreground py-10 text-sm">No events found.</p>
            ) : (
              filteredEvents.map((event) => (
                <div 
                  key={event.event_id} 
                  onClick={() => openDetailWithTab(event, "overview")}
                  className="bg-background border rounded-xl p-4 shadow-sm relative space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-sm">{event.event_name}</p>
                      <p className="text-xs text-muted-foreground">{event.event_type}</p>
                    </div>
                    {!isStudent && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!isTeacher && (
                              <DropdownMenuItem onClick={() => openEditDialog(event)}>Edit Details</DropdownMenuItem>
                            )}
                            {!isTeacher && (
                              <DropdownMenuItem onClick={() => openCertificateDialog(event)}>Certificates</DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => openDetailWithTab(event, "photos")}>Gallery</DropdownMenuItem>
                            {!isTeacher && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(event)}>Delete Event</DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded-md">
                     <span className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        {event.event_start_date ? format(new Date(event.event_start_date), "MMM d") : "TBD"}
                     </span>
                     <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.venue || "Campus"}
                     </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <Badge variant={getStatusVariant(event.computed_status)}>
                      {event.computed_status || "Scheduled"}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                       Participation: <strong>{event.classes_submitted}/{event.class_count || 0}</strong>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Forms & Dialogs */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="w-[92vw] sm:max-w-lg max-h-[90vh] p-0 border shadow-2xl rounded-2xl flex flex-col overflow-hidden left-[50%] top-[50%] -translate-x-[50%] -translate-y-[50%]">
          <DialogHeader className="p-6 pb-4 bg-slate-50/50 border-b shrink-0">
            <DialogTitle className="text-xl font-bold text-slate-900">
              {selectedEvent ? "Edit Event" : "Create New Event"}
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {selectedEvent 
                ? "Update the details for this event below." 
                : "Enter the details to schedule a new event."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6">
            <EventForm 
              event={selectedEvent} 
              onSubmit={handleFormSubmit}
              loading={formLoading}
            />
          </div>
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
            <AlertDialogTitle>Delete Event?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete <strong>{deleteTarget?.event_name}</strong> and all associated data.
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
      await unlockAttendanceEdit(eventId, classId);
      toast({ title: "Unlocked", description: "Attendance can now be corrected." });
      fetchDetail();
    } catch {
      toast({ title: "Error", description: "Unlock failed", variant: "destructive" });
    }
  };

  if (loading || !eventData) {
    return <div className="p-20 flex flex-col items-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Loading event details...</p>
    </div>;
  }

  return (
    <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] p-0 border shadow-2xl rounded-2xl flex flex-col overflow-hidden left-[50%] top-[50%] -translate-x-[50%] -translate-y-[50%]">
        <DialogHeader className="p-6 border-b bg-white">
          <div className="flex justify-between items-center">
            <div className="space-y-1.5">
              <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">{eventData.event_name}</DialogTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={getStatusVariant(eventData.computed_status)} className="rounded-md uppercase text-[9px] tracking-widest font-bold px-2 py-0.5">{eventData.event_type}</Badge>
                <div className="flex items-center gap-1.5 text-slate-400">
                   <CalendarIcon size={12} />
                   <span className="text-[10px] font-bold uppercase tracking-wider">
                     {eventData.event_start_date ? format(new Date(eventData.event_start_date), "MMM d, yyyy") : "Date TBD"}
                   </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                 <MapPin size={12} className="text-slate-400" />
                 {eventData.venue || "Campus Location"}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center min-w-[80px] h-[80px] border rounded-xl bg-slate-50/50">
               <div className="text-2xl font-black text-slate-900 leading-none">
                 {(() => {
                   const assignments = eventData.class_assignments || [];
                   const submitted = assignments.filter((a: any) => a.attendance_status === 'submitted').length;
                   const total = assignments.length;
                   return total > 0 ? Math.round((submitted / total) * 100) : 0;
                 })()}
                 <span className="text-sm ml-0.5">%</span>
               </div>
               <div className="text-[8px] text-slate-400 uppercase font-bold tracking-widest mt-1">Participation</div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b h-11 px-6 bg-transparent">
            <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-11">Overview</TabsTrigger>
            <TabsTrigger value="classes" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-11">Participants ({eventData.class_assignments?.length || 0})</TabsTrigger>
            <TabsTrigger value="photos" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-11">Gallery</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="p-6 space-y-6">
              <div className="space-y-2">
                 <h3 className="text-xs font-semibold text-muted-foreground uppercase">Description</h3>
                 <p className="text-sm text-slate-600 bg-muted/30 p-4 rounded-lg">
                   {eventData.description || "No briefing provided."}
                 </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-3 bg-muted/20 rounded-lg border">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Timing</span>
                    <div className="text-sm font-bold">
                       {eventData.start_time && eventData.end_time
                         ? `${eventData.start_time.substring(0, 5)} – ${eventData.end_time.substring(0, 5)}`
                         : 'All Day'}
                     </div>
                 </div>
                 <div className="p-3 bg-muted/20 rounded-lg border">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Date Info</span>
                    <div className="text-sm font-bold">{eventData.event_start_date === eventData.event_end_date ? "Single Day" : "Multi-Day"}</div>
                 </div>
              </div>
          </TabsContent>

          <TabsContent value="classes" className="p-4 space-y-2">
              {(eventData.class_assignments?.length ?? 0) === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                  <p className="text-sm">No classes assigned to this event.</p>
                </div>
              ) : eventData.class_assignments?.map((c: any) => {
                const isAttendanceSubmitted = c.attendance_status === 'submitted';
                const isCoordinator = c.coordinator_teacher_id === currentStaffId;
                const coordinatorName = [c.coordinator_first_name, c.coordinator_last_name].filter(Boolean).join(' ') || 'Unassigned';
                return (
                  <div key={c.class_id} className="flex items-center justify-between p-3 border rounded-lg bg-background hover:bg-muted/10 transition-colors">
                     <div>
                        <h4 className="font-semibold text-sm">
                          {c.section_name ? `${c.class_name} (${c.section_name})` : c.class_name}
                        </h4>
                        <p className="text-[10px] text-muted-foreground">Coordinator: {coordinatorName}</p>
                     </div>

                     <div className="flex items-center gap-4">
                        <Badge variant={isAttendanceSubmitted ? "default" : "outline"} className="text-[9px] h-5">
                            {isAttendanceSubmitted ? "Marked" : "Pending"}
                        </Badge>
                        
                        {(isAdmin || isCoordinator) && (
                          <div className="flex items-center gap-1">
                             {isAdmin && isAttendanceSubmitted && (
                               <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleUnlock(c.class_id)}>
                                 <Award size={12} />
                               </Button>
                             )}
                             <Button 
                               size="sm" 
                               variant="outline"
                               className="h-7 text-[10px] font-semibold"
                               onClick={() => onMarkAttendance(eventId, c.class_id)}
                             >
                               {isAttendanceSubmitted ? "Edit" : "Mark"}
                             </Button>
                          </div>
                        )}
                     </div>
                  </div>
                );
              })}
          </TabsContent>

          <TabsContent value="photos" className="p-4">
            <EventGallery 
              eventId={eventId} 
              isAdmin={isAdmin} 
              eventStatus={eventData.computed_status} 
            />
          </TabsContent>
       </Tabs>
        </div>
    </DialogContent>
  );
}
