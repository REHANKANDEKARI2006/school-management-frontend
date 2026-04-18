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
      ...event,
      event_start_date: new Date(event.event_start_date || event.event_date),
      event_end_date: new Date(event.event_end_date || event.event_date),
      event_status_id: (event.event_status_id || "2").toString(),
      displaced_period_action: event.displaced_period_action || "cancel",
      class_assignments: event.class_assignments?.map((ca: any) => ({
        class_id: ca.class_id,
        coordinator_teacher_id: ca.coordinator_teacher_id?.toString() || ""
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
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 p-1">
        
        {/* Basic Info Group */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
          <div className="md:col-span-2 space-y-4">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Basic Information</h3>
             <FormField
               control={form.control}
               name="event_name"
               render={({ field }) => (
                 <FormItem>
                   <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">Event Name</FormLabel>
                   <FormControl>
                     <Input placeholder="e.g. Annual Sports Day 2026" {...field} className="h-12 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500 shadow-sm transition-all" />
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
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">Event Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 rounded-xl border-slate-200 shadow-sm focus:ring-blue-500">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-xl">
                    {EVENT_TYPES.map(type => (
                      <SelectItem key={type} value={type} className="rounded-lg">{type}</SelectItem>
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
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">Venue / Location</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Main Playground" {...field} className="h-12 rounded-xl border-slate-200 shadow-sm focus:ring-blue-500" />
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
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Details about specific activities, requirements, etc." {...field} className="min-h-[100px] rounded-2xl border-slate-200 shadow-sm focus:ring-blue-500 resize-none" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Date & Time Group */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50/30 p-6 rounded-[2rem] border border-blue-100">
          <div className="md:col-span-2">
            <h3 className="text-[10px] font-black text-blue-500/70 uppercase tracking-[0.2em] px-1">Schedule & Timing</h3>
          </div>
          
          <FormField
            control={form.control}
            name="event_start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">From Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" className={cn("h-12 rounded-xl border-slate-200 pl-3 text-left font-medium shadow-sm transition-all hover:bg-white hover:border-blue-500", !field.value && "text-muted-foreground")}>
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 text-blue-500" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-2xl border-blue-100" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus className="rounded-2xl" />
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
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">To Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" className={cn("h-12 rounded-xl border-slate-200 pl-3 text-left font-medium shadow-sm transition-all hover:bg-white hover:border-blue-500", !field.value && "text-muted-foreground")}>
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 text-blue-500" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-2xl border-blue-100" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus className="rounded-2xl" />
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
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">Start Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} className="h-12 rounded-xl border-slate-200 shadow-sm focus:ring-blue-500 cursor-pointer" />
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
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">End Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} className="h-12 rounded-xl border-slate-200 shadow-sm focus:ring-blue-500 cursor-pointer" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Classes Selection Group */}
        <div className="space-y-6 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Target Classes</h3>
              <p className="text-xs text-slate-400 font-medium">Select classes participating in this event</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search classes..." 
                className="pl-9 h-10 rounded-full bg-slate-50 border-none focus:ring-blue-500" 
                value={classSearch}
                onChange={(e) => setClassSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
             {filteredClasses.map((c) => {
               const isSelected = selectedClassIds.includes(c.class_id);
               return (
                 <div 
                   key={c.class_id}
                   onClick={() => toggleClass(c.class_id)}
                   className={cn(
                     "cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 group relative overflow-hidden",
                     isSelected 
                       ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200" 
                       : "bg-white border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 text-slate-600"
                   )}
                 >
                   {isSelected && <Check className="absolute top-1 right-1 h-3 w-3" />}
                   <span className={cn("text-xs font-black tracking-tighter", isSelected ? "text-blue-100" : "text-slate-400 uppercase tracking-widest")}>CLASS</span>
                   <span className="text-lg font-black leading-none">{c.class_name}</span>
                   <span className={cn("text-[10px] font-bold opacity-70 truncate mw-full", isSelected ? "text-white" : "text-slate-500")}>
                     {c.section_name || "General"}
                   </span>
                 </div>
               );
             })}
          </div>

          {fields.length > 0 && (
            <div className="pt-8 space-y-6">
              <div className="flex items-center gap-3">
                 <div className="h-px bg-slate-100 flex-1" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">Event Coordinators & Management</span>
                 <div className="h-px bg-slate-100 flex-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map((field, index) => {
                  const classInfo = classes.find(c => c.class_id === field.class_id);
                  return (
                    <div key={field.id} className="p-5 rounded-[2rem] border border-slate-100 bg-slate-50/30 flex items-center justify-between gap-4 group">
                      <div className="shrink-0 space-y-1">
                        <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 font-bold px-3">
                          {classInfo?.class_name} {classInfo?.section_name}
                        </Badge>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Assign Coordinator</p>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name={`class_assignments.${index}.coordinator_teacher_id`}
                        render={({ field: subField }) => (
                          <FormItem className="flex-1 max-w-[200px] mb-0 space-y-0">
                            <Select onValueChange={subField.onChange} value={subField.value || undefined}>
                              <FormControl>
                                <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white shadow-sm ring-0 focus:ring-blue-500">
                                  <SelectValue placeholder="Select teacher" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-xl">
                                {teachers.map(t => (
                                  <SelectItem key={t.staff_id} value={t.staff_id.toString()} className="rounded-lg">
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

              <div className="bg-amber-50/50 p-6 rounded-[2rem] border border-amber-100/50 space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
                       <CalendarIcon className="h-5 w-5" />
                    </div>
                    <div>
                       <h4 className="text-sm font-bold text-amber-900">Period Exchange Management</h4>
                       <p className="text-[11px] text-amber-700/70 font-medium">How should we handle regular classes occurring during this time?</p>
                    </div>
                 </div>

                 <FormField
                    control={form.control}
                    name="displaced_period_action"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col sm:flex-row gap-4"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0 bg-white px-5 py-4 rounded-2xl border border-amber-100/50 flex-1 cursor-pointer hover:border-amber-300 transition-colors">
                              <FormControl>
                                <RadioGroupItem value="cancel" className="text-amber-600 border-amber-300" />
                              </FormControl>
                              <FormLabel className="font-bold text-amber-900 cursor-pointer">
                                Mark as Displaced (Cancel)
                                <span className="block text-[10px] font-medium text-amber-600/70 mt-0.5">Affected periods will be replaced by this event in the timetable. No action required later.</span>
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0 bg-white px-5 py-4 rounded-2xl border border-amber-100/50 flex-1 cursor-pointer hover:border-amber-300 transition-colors">
                              <FormControl>
                                <RadioGroupItem value="reschedule" className="text-amber-600 border-amber-300" />
                              </FormControl>
                              <FormLabel className="font-bold text-amber-900 cursor-pointer">
                                Mark for Rescheduling
                                <span className="block text-[10px] font-medium text-amber-600/70 mt-0.5">Periods will be marked as 'pending reschedule'. Use for educational labs or tests needing makeup.</span>
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                 />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-4 pt-4 sticky bottom-0 bg-white/80 backdrop-blur-md p-4 border-t border-slate-100 -mx-1 z-20">
          <Button type="submit" className="h-14 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-70" disabled={loading}>
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : null}
            {event ? "Update Configuration" : "Finalize & Launch Event"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
