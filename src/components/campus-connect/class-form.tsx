"use client";

import * as React from "react";
import axios from "@/lib/axios";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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

const classSchema = z.object({
  class_name: z.string().min(1, "Class name is required"),
  section_id: z.string().min(1, "Section is required"),
  staff_id: z.string().optional(),
  room_number: z.string().min(1, "Room number is required"),
});

export type ClassFormData = z.infer<typeof classSchema>;

interface ClassFormProps {
  onSubmit: (data: ClassFormData) => void;
  classData?: any;
}

export function ClassForm({ onSubmit, classData }: ClassFormProps) {
  const [sections, setSections] = React.useState<any[]>([]);
  const [teachers, setTeachers] = React.useState<any[]>([]);

  const form = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      class_name: classData?.name || "",
      section_id: classData?.section_id
        ? String(classData.section_id)
        : "",
      staff_id: classData?.staff_id
        ? String(classData.staff_id)
        : "",
      room_number: classData?.roomNumber || "",
    },
  });

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

            onSubmit(data); // existing success flow (toast + refresh)
          } catch (err) {
            console.error("❌ Failed to save class", err);
            alert("Failed to save class");
          }
        })}
        className="space-y-4"
      >
        {/* CLASS NAME */}
        <FormField
          control={form.control}
          name="class_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class Name</FormLabel>
              <FormControl>
                <Input placeholder="Class 10" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* SECTION */}
        <FormField
          control={form.control}
          name="section_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Section</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((s) => (
                    <SelectItem
                      key={s.section_id}
                      value={String(s.section_id)}
                    >
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
            <FormItem>
              <FormLabel>Class Teacher</FormLabel>
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem
                      key={t.staff_id}
                      value={String(t.staff_id)}
                    >
                      {t.staff_first_name} {t.staff_last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        {/* ROOM NUMBER */}
        <FormField
          control={form.control}
          name="room_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Room Number</FormLabel>
              <FormControl>
                <Input placeholder="301" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          {classData ? "Update Class" : "Create Class"}
        </Button>
      </form>
    </Form>
  );
}
