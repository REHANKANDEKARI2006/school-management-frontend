"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@/lib/axios";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

/* ===================================================================
   SCHEMA
=================================================================== */
const examSchema = z.object({
  exam_id: z.number().optional(),
  exam_name: z.string().min(1, "Exam name is required"),
  class_id: z.string().min(1, "Class is required"),
  subject_id: z.string().min(1, "Subject is required"),
  exam_type_id: z.string().min(1, "Exam type is required"),
  date: z.date({ required_error: "Date is required" }),
  time: z.string().min(1, "Time is required"),
  duration_mins: z.coerce.number().min(1, "Duration must be > 0"),
  total_score: z.coerce.number().min(1, "Total score must be > 0"),
  min_marks: z.coerce.number().optional(),
  max_marks: z.coerce.number().optional(),
  exam_status_id: z.string().optional(),
});

export type ExamFormValues = z.infer<typeof examSchema>;

interface ExamFormProps {
  onSubmit: (data: ExamFormValues) => Promise<void>;
  exam?: any; // existing exam row from DB (for edit)
  loading?: boolean;
}

/* ===================================================================
   COMPONENT
=================================================================== */
export function ExamForm({ onSubmit, exam, loading }: ExamFormProps) {
  const { toast } = useToast();
  const [classes, setClasses] = React.useState<{ class_id: number; label: string }[]>([]);
  const [uniqueStandards, setUniqueStandards] = React.useState<string[]>([]);
  const [subjects, setSubjects] = React.useState<{ subject_id: number; subject_name: string }[]>([]);
  const [examTypes, setExamTypes] = React.useState<{ exam_type_id: number; exam_type_name: string }[]>([]);
  const [statuses, setStatuses] = React.useState<{ exam_status_id: number; exam_status_name: string }[]>([]);
  const [dropdownLoading, setDropdownLoading] = React.useState(true);

  /* ---- Load dropdown data ---- */
  React.useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [classRes, subjectRes, typeRes, statusRes] = await Promise.all([
          axios.get("/api/classes/class-enrollments/list"),
          axios.get("/api/subjects"),
          axios.get("/api/exams/types"),
          axios.get("/api/exams/statuses"),
        ]);
        const clsData = classRes.data.data || [];
        setClasses(clsData);

        // Extract unique standards
        const stands = Array.from(new Set(clsData.map((c: any) => c.class_name || c.label.split(" - ")[0]))) as string[];
        setUniqueStandards(stands.sort((a, b) => {
          const numA = parseInt(a);
          const numB = parseInt(b);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          return a.localeCompare(b);
        }));

        setSubjects(subjectRes.data.data || []);
        setExamTypes(typeRes.data.data || []);
        setStatuses(statusRes.data.data || []);
      } catch {
        toast({ title: "Error", description: "Failed to load dropdown data", variant: "destructive" });
      } finally {
        setDropdownLoading(false);
      }
    };
    loadDropdowns();
  }, []);

  /* ---- Form default values ---- */
  const getDefaultTime = (dateTimeStr: string) => {
    if (!dateTimeStr) return "10:00";
    const d = new Date(dateTimeStr);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const form = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: exam
      ? {
        exam_id: exam.exam_id,
        exam_name: exam.exam_name || "",
        class_id: String(exam.class_id || ""),
        subject_id: String(exam.subject_id || ""),
        exam_type_id: String(exam.exam_type_id || ""),
        date: exam.date_time ? new Date(exam.date_time) : new Date(),
        time: exam.date_time ? getDefaultTime(exam.date_time) : "10:00",
        duration_mins: exam.duration_mins || 180,
        total_score: exam.total_score || 100,
        min_marks: exam.min_marks || undefined,
        max_marks: exam.max_marks || undefined,
        exam_status_id: String(exam.exam_status_id || ""),
      }
      : {
        exam_name: "",
        class_id: "",
        subject_id: "",
        exam_type_id: "",
        date: new Date(),
        time: "10:00",
        duration_mins: 180,
        total_score: 100,
        min_marks: undefined,
        max_marks: undefined,
        exam_status_id: "1",
      },
  });

  const handleSubmit = async (values: ExamFormValues) => {
    await onSubmit(values);
  };

  if (dropdownLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">

        {/* Exam Name */}
        <FormField control={form.control} name="exam_name" render={({ field }) => (
          <FormItem>
            <FormLabel>Exam Name</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Mid-Term Examination" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* Class */}
        <FormField control={form.control} name="class_id" render={({ field }) => (
          <FormItem>
            <FormLabel>Standard</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select standard" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {uniqueStandards.map((std) => (
                  <SelectItem key={std} value={std}>
                    Standard {std}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        {/* Subject */}
        <FormField control={form.control} name="subject_id" render={({ field }) => (
          <FormItem>
            <FormLabel>Subject</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.subject_id} value={String(s.subject_id)}>
                    {s.subject_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        {/* Exam Type */}
        <FormField control={form.control} name="exam_type_id" render={({ field }) => (
          <FormItem>
            <FormLabel>Exam Type</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select exam type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {examTypes.map((t) => (
                  <SelectItem key={t.exam_type_id} value={String(t.exam_type_id)}>
                    {t.exam_type_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        {/* Date + Time */}
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="date" render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                    >
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
          )} />

          <FormField control={form.control} name="time" render={({ field }) => (
            <FormItem>
              <FormLabel>Time</FormLabel>
              <FormControl>
                <Input type="time" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* Duration + Total Score */}
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="duration_mins" render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (mins)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="180" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="total_score" render={({ field }) => (
            <FormItem>
              <FormLabel>Total Score</FormLabel>
              <FormControl>
                <Input type="number" placeholder="100" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* Min Marks + Max Marks */}
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="min_marks" render={({ field }) => (
            <FormItem>
              <FormLabel>Min Marks (Pass)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g. 35" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="max_marks" render={({ field }) => (
            <FormItem>
              <FormLabel>Max Marks</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g. 100" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>



        <Button type="submit" className="w-full" loading={loading}>
          {exam ? "Update Exam" : "Schedule Exam"}
        </Button>
      </form>
    </Form>
  );
}

/* ===================================================================
   LEGACY TYPE EXPORT (keeps other existing imports compatible)
=================================================================== */
export type Exam = {
  id?: string;
  name: string;
  class: string;
  subject: string;
  date: Date | string;
  time: string;
  duration: number;
  totalScore: number;
  status: "Upcoming" | "Scheduled" | "Completed";
};
