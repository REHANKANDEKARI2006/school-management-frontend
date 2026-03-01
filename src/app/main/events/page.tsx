"use client";

import * as React from "react";
import { MoreHorizontal, PlusCircle, Award, Loader2, Calendar as CalendarIcon, MapPin } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { EventForm, type Event } from "@/components/campus-connect/event-form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSearch } from "@/components/campus-connect/search-provider";
import { EventCertificateDialog } from "@/components/campus-connect/event-certificate";
import { getEvents, createEvent, updateEvent, deleteEvent } from "@/lib/api/events";
import { format } from "date-fns";

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

  const fetchEventsData = React.useCallback(async () => {
    try {
      const data = await getEvents();
      setEvents(data || []);
    } catch {
      toast({ title: "Error", description: "Failed to load events", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

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
      event.event_status_name?.toLowerCase().includes(q) ||
      event.venue?.toLowerCase().includes(q)
    );
  }, [searchQuery, events]);

  const handleFormSubmit = async (values: any) => {
    setFormLoading(true);
    try {
      const payload = {
        ...values,
        event_date: format(values.event_date, 'yyyy-MM-dd'),
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
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Operation failed",
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

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="font-headline text-2xl">Events</CardTitle>
              <CardDescription>Manage school events, activities, and calendars.</CardDescription>
            </div>
            <Button size="sm" className="gap-1 w-full sm:w-auto" onClick={openNewDialog}>
              <PlusCircle className="h-4 w-4" />
              <span>Create Event</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] hidden sm:table-cell">Image</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Date & Venue</TableHead>
                  <TableHead className="w-12 text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      <p className="text-xs mt-2 text-muted-foreground">Loading events...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      No events found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents.map((event) => (
                    <TableRow key={event.event_id}>
                      <TableCell className="hidden sm:table-cell">
                        <Avatar className="h-10 w-10 rounded-md bg-muted">
                          <AvatarFallback className="rounded-md">
                            {event.event_name?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{event.event_name}</div>
                        <div className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {event.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(event.event_status_name)}>
                          {event.event_status_name}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {event.event_date ? format(new Date(event.event_date), "PPP") : "No date"}
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground mt-0.5">
                          <MapPin className="h-3.5 w-3.5" />
                          {event.venue || "No venue"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openEditDialog(event)}>
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openCertificateDialog(event)}>
                              <Award className="mr-2 h-4 w-4" />
                              Generate Certificate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteTarget(event)}
                            >
                              Delete Event
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{selectedEvent ? "Edit Event" : "Create New Event"}</DialogTitle>
            <DialogDescription>
              {selectedEvent ? "Update the details of the event." : "Fill in the details to create a new school event."}
            </DialogDescription>
          </DialogHeader>
          <EventForm
            onSubmit={handleFormSubmit}
            event={selectedEvent}
            loading={formLoading}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isCertificateOpen} onOpenChange={setIsCertificateOpen}>
        {selectedEvent && <EventCertificateDialog event={selectedEvent} />}
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
