"use client";

import * as React from "react";
import axios from "@/lib/axios";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";

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

const STANDARD_OPTIONS = [
  "Nursery", "LKG", "UKG", "1", "2", "3", "4", 
  "5", "6", "7", "8", "9", "10", "11", "12"
];

const classSchema = z.object({
  class_name: z.string().min(1, "Class name is required"),
  section_id: z.string().min(1, "Section is required"),
  staff_id: z.string().optional(),
  room_number: z.string().min(1, "Room number is required"),
});

export type ClassFormData = z.infer<typeof classSchema>;

interface ClassFormProps {
  onSubmit?: (data: ClassFormData) => void;
  classData?: any;
  readOnly?: boolean;
}

export function ClassForm({ onSubmit, classData, readOnly = false }: ClassFormProps) {
  const [sections, setSections] = React.useState<any[]>([]);
  const [teachers, setTeachers] = React.useState<any[]>([]);
  const [classesList, setClassesList] = React.useState<any[]>([]);

  const form = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      class_name: classData?.class_name || classData?.name || "",
      section_id: classData?.section_id
        ? String(classData.section_id)
        : "",
      staff_id: classData?.staff_id
        ? String(classData.staff_id)
        : "",
      room_number: classData?.room_number || classData?.roomNumber || "",
    },
  });

  React.useEffect(() => {
    if (classData) {
      form.reset({
        class_name: classData.class_name || classData.name || "",
        section_id: classData.section_id ? String(classData.section_id) : "",
        staff_id: classData.staff_id ? String(classData.staff_id) : "",
        room_number: classData.room_number || classData.roomNumber || "",
      });
    } else {
      form.reset({
        class_name: "",
        section_id: "",
        staff_id: "",
        room_number: "",
      });
    }
  }, [classData, form]);

  /* =========================
     LOAD TEACHERS
  ========================= */
  React.useEffect(() => {
    axios.get("/api/faculty").then((res) => {
      setTeachers(res.data.data || []);
    });
  }, []);

  /* =========================
     LOAD ALL SECTIONS
  ========================= */
  React.useEffect(() => {
    axios.get("/api/sections").then((res) => {
      setSections(res.data.data || []);
    });
  }, []);

  /* =========================
     LOAD ALL CLASSES (TO CHECK ASSIGNED TEACHERS)
  ========================= */
  React.useEffect(() => {
    axios.get("/api/classes/admin/list").then((res) => {
      setClassesList(res.data.data || []);
    });
  }, []);

  const assignedTeacherIds = React.useMemo(() => {
    return classesList
      .map((c: any) => String(c.staff_id))
      .filter((id) => id && id !== "null" && id !== "undefined");
  }, [classesList]);

  const availableTeachers = React.useMemo(() => {
    return teachers.filter((t) => {
      const idStr = String(t.staff_id);
      const isCurrentlyAssignedHere = classData?.staff_id && String(classData.staff_id) === idStr;
      const isAssignedElsewhere = assignedTeacherIds.includes(idStr);
      return !isAssignedElsewhere || isCurrentlyAssignedHere;
    });
  }, [teachers, assignedTeacherIds, classData]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (data) => {
          try {
            if (classData?.id) {
              // UPDATE CLASS
              await axios.patch(`/api/classes/${classData.id}`, data);
            } else {
              // CREATE CLASS
              await axios.post("/api/classes", data);
            }

            if (onSubmit) onSubmit(data); // existing success flow (toast + refresh)
          } catch (err: any) {
            const errorMessage = err.response?.data?.message || "Failed to save class";
            console.warn("⚠️ Validation error during class save:", errorMessage);
            
            const lowerMsg = errorMessage.toLowerCase();
            if (lowerMsg.includes("class name")) {
              form.setError("class_name", { type: "server", message: errorMessage });
            } else if (lowerMsg.includes("teacher")) {
              form.setError("staff_id", { type: "server", message: errorMessage });
            } else {
              alert(errorMessage);
            }
          }
        })}
        className="space-y-4"
      >
        <div className="grid grid-cols-10 gap-3.5">
          {/* CLASS NAME */}
          <FormField
            control={form.control}
            name="class_name"
            render={({ field }) => (
              <FormItem className="col-span-5 space-y-1.5">
                <FormLabel className="text-xs font-bold text-slate-700 dark:text-slate-300">Class/Standard</FormLabel>
                <Select disabled={readOnly} value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className={cn("h-11 rounded-xl border-slate-200 bg-slate-50/50 disabled:opacity-80 disabled:cursor-not-allowed", readOnly && "[&>svg]:hidden flex items-center justify-between")}>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {STANDARD_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* SECTION */}
          <FormField
            control={form.control}
            name="section_id"
            render={({ field }) => (
              <FormItem className="col-span-5 space-y-1.5">
                <FormLabel className="text-xs font-bold text-slate-700 dark:text-slate-300">Section</FormLabel>
                <Select disabled={readOnly} value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className={cn("h-11 rounded-xl border-slate-200 bg-slate-50/50 disabled:opacity-80 disabled:cursor-not-allowed", readOnly && "[&>svg]:hidden flex items-center justify-between")}>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((s) => (
                      <SelectItem key={s.section_id} value={String(s.section_id)}>
                        {s.section_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* CLASS TEACHER */}
          <FormField
            control={form.control}
            name="staff_id"
            render={({ field }) => (
              <FormItem className="col-span-6 space-y-1.5">
                <FormLabel className="text-xs font-bold text-slate-700 dark:text-slate-300">Class Teacher</FormLabel>
                <Select disabled={readOnly} value={field.value || ""} onValueChange={field.onChange}>
                  <SelectTrigger className={cn("h-11 rounded-xl border-slate-200 bg-slate-50/50 disabled:opacity-80 disabled:cursor-not-allowed", readOnly && "[&>svg]:hidden flex items-center justify-between")}>
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTeachers.map((t) => (
                      <SelectItem
                        key={t.staff_id}
                        value={String(t.staff_id)}
                      >
                        {t.staff_first_name} {t.staff_last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ROOM NUMBER */}
          <FormField
            control={form.control}
            name="room_number"
            render={({ field }) => (
              <FormItem className="col-span-4 space-y-1.5">
                <FormLabel className="text-xs font-bold text-slate-700 dark:text-slate-300">Room Number</FormLabel>
                <FormControl>
                  <Input disabled={readOnly} placeholder="301" className="h-11 rounded-xl border-slate-200 bg-slate-50/50 font-semibold text-slate-900 disabled:opacity-80 disabled:cursor-not-allowed" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {!readOnly && (
          <Button type="submit" className="w-full mt-4 h-11 text-sm font-bold rounded-xl shadow-sm" loading={form.formState.isSubmitting}>
            {classData ? "Update Class" : "Create Class"}
          </Button>
        )}
      </form>
    </Form>
  );
}
