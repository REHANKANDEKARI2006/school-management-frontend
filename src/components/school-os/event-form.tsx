"use client";

import * as React from "react";
import axios from "@/lib/axios";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2, Minus, Plus, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { getEventStatuses } from "@/lib/api/events";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const EVENT_TYPES = [
  "School Event",
  "Educational Trip",
  "Guest Lecture",
  "Exam or Test",
  "Holiday Activity",
  "Inter-school Competition",
  "Other"
];

const eventSchema = z.object({
  event_id: z.number().optional(),
  event_name: z.string().min(1, "Event name is required"),
  event_type: z.string().min(1, "Event type is required"),
  description: z.string().min(1, "Description is required"),
  event_start_date: z.date({ required_error: "A start date is required." }),
  event_end_date: z.date({ required_error: "An end date is required." }),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  venue: z.string().min(1, "Venue is required"),
  event_status_id: z.string().optional(),
  displaced_period_action: z.enum(["cancel", "reschedule"]),
  class_assignments: z.array(z.object({
    class_id: z.number(),
    coordinator_teacher_id: z.string().optional().nullable(),
  })).optional().default([]),
});

export type EventFormData = z.infer<typeof eventSchema>;

interface EventFormProps {
  onSubmit: (data: any) => void;
  event?: any;
  loading?: boolean;
}

export function EventForm({ onSubmit, event, loading }: EventFormProps) {
  const { toast } = useToast();
  const [statuses, setStatuses] = React.useState<any[]>([]);
  const [classes, setClasses] = React.useState<any[]>([]);
  const [teachers, setTeachers] = React.useState<any[]>([]);
  const [dropdownLoading, setDropdownLoading] = React.useState(true);
  const [classSearch, setClassSearch] = React.useState("");

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [statRes, clsRes, teaRes] = await Promise.all([
          getEventStatuses(),
          axios.get("/api/classes"),
          axios.get("/api/faculty")
        ]);
        setStatuses(statRes || []);
        setClasses(clsRes.data.data || []);
        setTeachers(teaRes.data.data || []);
      } catch (err) {
        console.error("Failed to load form data:", err);
        toast({ title: "Error", description: "Failed to load form data", variant: "destructive" });
      } finally {
        setDropdownLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: event ? {
      event_id: event.event_id,
      event_name: event.event_name ?? "",
      event_type: event.event_type ?? "School Event",
      description: event.description ?? "",
      event_start_date: new Date(event.event_start_date || event.event_date || new Date()),
      event_end_date: new Date(event.event_end_date || event.event_date || new Date()),
      start_time: event.start_time?.substring(0, 5) ?? "09:00",
      end_time: event.end_time?.substring(0, 5) ?? "15:00",
      venue: event.venue ?? "",
      event_status_id: (event.event_status_id || "2").toString(),
      displaced_period_action: event.displaced_period_action || "cancel",
      class_assignments: event.class_assignments?.map((ca: any) => ({
        class_id: ca.class_id,
        coordinator_teacher_id: ca.coordinator_teacher_id?.toString() ?? ""
      })) || [],
    } : {
      event_name: "",
      event_type: "School Event",
      description: "",
      event_start_date: new Date(),
      event_end_date: new Date(),
      start_time: "09:00",
      end_time: "15:00",
      venue: "",
      event_status_id: "2", // Scheduled
      displaced_period_action: "cancel",
      class_assignments: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "class_assignments",
    keyName: "id",
  });

  const selectedClassIds = fields.map(f => f.class_id);

  const toggleClass = (classId: number) => {
    const index = selectedClassIds.indexOf(classId);
    if (index > -1) {
      remove(index);
    } else {
      append({ class_id: classId, coordinator_teacher_id: "" });
    }
  };

  const filteredClasses = classes.filter(c => 
    c.class_name.toLowerCase().includes(classSearch.toLowerCase()) ||
    (c.section_name && c.section_name.toLowerCase().includes(classSearch.toLowerCase()))
  );

  const handleSubmit = (values: EventFormData) => {
    const dataToSend = {
      ...values,
      // Sanitization: Ensure class_id and teacher_id are clean
      class_assignments: (values.class_assignments || [])
        .filter(ca => ca.class_id) // Only send if class is selected
        .map(ca => ({
          class_id: parseInt(ca.class_id.toString()),
          coordinator_teacher_id: ca.coordinator_teacher_id ? parseInt(ca.coordinator_teacher_id.toString()) : null
        }))
    };
    onSubmit(dataToSend);
  };

  if (dropdownLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
               <FormField
                 control={form.control}
                 name="event_name"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Event Name</FormLabel>
                     <FormControl>
                       <Input placeholder="e.g. Annual Sports Day" {...field} />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
            </div>

            <FormField
              control={form.control}
              name="event_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EVENT_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="venue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. School Hall" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Details about the event..." {...field} className="min-h-[100px] resize-none" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Schedule & Timing</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="event_start_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="event_end_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="start_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="end_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Classes Selection */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-sm font-semibold text-slate-900">Participating Classes</h3>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search classes..." 
                className="pl-9 h-9 text-xs" 
                value={classSearch}
                onChange={(e) => setClassSearch(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="h-[200px] sm:h-[250px] pr-4 border rounded-lg p-2 bg-slate-50/30">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
               {filteredClasses.map((c) => {
                 const isSelected = selectedClassIds.includes(c.class_id);
                 return (
                   <div 
                     key={c.class_id}
                     onClick={() => toggleClass(c.class_id)}
                     className={cn(
                       "cursor-pointer p-2 sm:p-3 rounded-lg border text-center transition-all",
                       isSelected 
                         ? "bg-primary border-primary text-primary-foreground shadow-sm" 
                         : "bg-background border-input hover:border-primary/50 text-muted-foreground shadow-sm"
                     )}
                   >
                     <div className="text-xs sm:text-sm font-medium">{c.class_name}</div>
                     <div className={cn("text-[9px] sm:text-[10px] truncate", isSelected ? "text-primary-foreground/80" : "text-slate-400")}>
                       {c.section_name || "General"}
                     </div>
                   </div>
                 );
               })}
            </div>
          </ScrollArea>

          {fields.length > 0 && (
            <div className="pt-4 space-y-6">
              <div className="space-y-4">
                 <h3 className="text-sm font-semibold text-slate-900">Staff Coordinators</h3>
                 <ScrollArea className="h-[150px] pr-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {fields.map((field, index) => {
                        const classInfo = classes.find(c => c.class_id === field.class_id);
                        return (
                          <div key={field.id} className="p-2 sm:p-3 rounded-lg border bg-muted/30 flex items-center justify-between gap-4">
                             <div className="text-xs font-medium text-slate-700 truncate">
                                {classInfo?.class_name}{classInfo?.section_name ? ` - ${classInfo?.section_name}` : ""}
                             </div>
                            
                             <FormField
                               control={form.control}
                               name={`class_assignments.${index}.coordinator_teacher_id`}
                               render={({ field: subField }) => (
                                 <FormItem className="flex-1 max-w-[140px] sm:max-w-[180px] mb-0 space-y-0">
                                   <Select onValueChange={subField.onChange} value={subField.value || undefined}>
                                     <FormControl>
                                       <SelectTrigger className="h-7 sm:h-8 text-[10px] sm:text-xs bg-background">
                                         <SelectValue placeholder="Assign" />
                                       </SelectTrigger>
                                     </FormControl>
                                     <SelectContent>
                                       {teachers.map(t => (
                                         <SelectItem key={t.staff_id} value={t.staff_id.toString()} className="text-xs">
                                           {t.staff_first_name} {t.staff_last_name}
                                         </SelectItem>
                                       ))}
                                     </SelectContent>
                                   </Select>
                                 </FormItem>
                               )}
                             />
                          </div>
                        );
                      })}
                    </div>
                 </ScrollArea>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-6 border-t">
          <Button 
            type="submit" 
            className="w-full sm:w-auto" 
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {event ? "Update Event" : "Create Event"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
