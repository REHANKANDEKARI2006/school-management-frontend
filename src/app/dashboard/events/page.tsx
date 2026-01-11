
"use client";

import * as React from "react";
import { MoreHorizontal, PlusCircle, Award } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { EventForm, type Event } from "@/components/campus-connect/event-form";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useSearch } from "@/components/campus-connect/search-provider";
import { EventCertificateDialog } from "@/components/campus-connect/event-certificate";

const initialEvents: (Event & { imageId: string, fallback: string })[] = [
  {
    id: "1",
    name: "Annual Science Fair",
    description: "Showcasing innovative projects from budding scientists.",
    date: "2024-10-22",
    status: "Upcoming",
    imageId: "event-science-fair",
    fallback: "SF"
  },
  {
    id: "2",
    name: "Sports Day 2024",
    description: "A day of thrilling athletic competition and teamwork.",
    date: "2024-09-05",
    status: "Completed",
    imageId: "event-sports-day",
    fallback: "SD"
  },
  {
    id: "3",
    name: "Art & Culture Fest",
    description: "Celebrating creativity with exhibitions and performances.",
    date: "2024-11-15",
    status: "Upcoming",
    imageId: "event-art-exhibition",
    fallback: "AC"
  },
  {
    id: "4",
    name: "Parent-Teacher Conference",
    description: "Discussing student progress and collaboration.",
    date: "2024-08-30",
    status: "Completed",
    imageId: "login-background",
    fallback: "PT"
  },
  {
    id: "5",
    name: "Charity Bake Sale",
    description: "Raising funds for a local community shelter.",
    date: "2024-12-01",
    status: "Cancelled",
    imageId: "event-art-exhibition",
    fallback: "BS"
  },
];


const getStatusVariant = (status: string) => {
    switch (status) {
      case "Completed":
        return "secondary";
      case "Upcoming":
        return "default";
      case "Cancelled":
        return "destructive";
      default:
        return "outline";
    }
}

export default function EventsPage() {
  const { toast } = useToast();
  const { searchQuery } = useSearch();
  const [events, setEvents] = React.useState(initialEvents);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedEvent, setSelectedEvent] = React.useState<Event | undefined>(undefined);
  const [isCertificateOpen, setIsCertificateOpen] = React.useState(false);


  const filteredEvents = React.useMemo(() => {
    if (!searchQuery) {
      return events;
    }
    return events.filter(event =>
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, events]);

  const handleFormSubmit = (eventData: Event) => {
    if (selectedEvent) {
      // Update existing event
      setEvents(events.map(e => e.id === eventData.id ? { ...e, ...eventData } : e));
      toast({ title: "Event Updated", description: `${eventData.name} has been updated.` });
    } else {
      // Add new event
      const newEvent = {
         ...eventData,
         id: (events.length + 1).toString(),
         imageId: "event-art-exhibition",
         fallback: eventData.name.substring(0, 2).toUpperCase()
      };
      setEvents([...events, newEvent]);
      toast({ title: "Event Created", description: `${eventData.name} has been added.` });
    }
    setIsFormOpen(false);
    setSelectedEvent(undefined);
  };

  const openEditDialog = (event: Event) => {
    setSelectedEvent(event);
    setIsFormOpen(true);
  }

  const openNewDialog = () => {
    setSelectedEvent(undefined);
    setIsFormOpen(true);
  }
  
  const openCertificateDialog = (event: Event) => {
    setSelectedEvent(event);
    setIsCertificateOpen(true);
  }


  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                  <CardTitle className="font-headline">Events</CardTitle>
                  <CardDescription>Manage school events, activities, and calendars.</CardDescription>
              </div>
              <Button size="sm" className="gap-1 w-full sm:w-auto" onClick={openNewDialog}>
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Create Event
                  </span>
              </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                    <span className="sr-only">Image</span>
                </TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => {
                const image = PlaceHolderImages.find(img => img.id === event.imageId);
                return (
                <TableRow key={event.id}>
                    <TableCell className="hidden sm:table-cell">
                        <Avatar className="h-12 w-12 rounded-md">
                            {image && <AvatarImage src={image.imageUrl} alt={event.name} />}
                            <AvatarFallback className="rounded-md">{event.fallback}</AvatarFallback>
                        </Avatar>
                    </TableCell>
                  <TableCell className="font-medium">
                    <div className="font-medium">{event.name}</div>
                    <div className="hidden text-sm text-muted-foreground md:inline-block md:max-w-xs truncate">
                        {event.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(event.status)}>
                      {event.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{event.date}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => openEditDialog(event)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openCertificateDialog(event)}>
                            <Award className="mr-2 h-4 w-4" />
                            Generate Certificate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setEvents(events.filter(e => e.id !== event.id));
                          toast({ title: "Event Deleted", description: `${event.name} has been removed.` });
                        }}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedEvent ? "Edit Event" : "Create New Event"}</DialogTitle>
            <DialogDescription>
              {selectedEvent ? "Update the details of the event." : "Fill in the details to create a new event."}
            </DialogDescription>
          </DialogHeader>
          <EventForm onSubmit={handleFormSubmit} event={selectedEvent} />
        </DialogContent>
      </Dialog>
      <Dialog open={isCertificateOpen} onOpenChange={setIsCertificateOpen}>
        {selectedEvent && <EventCertificateDialog event={selectedEvent} />}
      </Dialog>
    </>
  );
}
