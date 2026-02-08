"use client";

import * as React from "react";
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

/* =========================
   VALIDATION SCHEMA
========================= */
const facultySchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),

  contact: z.string().optional(),
  qualification: z.string().optional(),

  dept_id: z.string().min(1, "Department is required"),
  subject_id: z.string().optional(),

  bg_id: z.string().optional(),
  gender_id: z.string().optional(),

  user_status_id: z.string(),
  joining_date: z.string().optional(),
});

export type FacultyFormData = z.infer<typeof facultySchema>;

interface Props {
  mode: "add" | "edit";
  initialData?: any;
  departments: any[];
  subjects: any[];
  onSubmit: (data: FacultyFormData) => void;
}

/* =========================
   STATIC DROPDOWNS
========================= */
const bloodGroups = [
  { id: 1, label: "A+" },
  { id: 2, label: "A-" },
  { id: 3, label: "B+" },
  { id: 4, label: "B-" },
  { id: 5, label: "AB+" },
  { id: 6, label: "AB-" },
  { id: 7, label: "O+" },
  { id: 8, label: "O-" },
];

const genders = [
  { id: 1, label: "Male" },
  { id: 2, label: "Female" },
];

export function FacultyForm({
  mode,
  initialData,
  departments,
  subjects,
  onSubmit,
}: Props) {
  const form = useForm<FacultyFormData>({
    resolver: zodResolver(facultySchema),
    defaultValues: {
      name: initialData
        ? `${initialData.staff_first_name ?? ""} ${initialData.staff_last_name ?? ""}`.trim()
        : "",
      email: initialData?.email ?? "",
      contact: initialData?.contact ?? "",
      qualification: initialData?.qualification ?? "",
      dept_id: initialData?.dept_id ? String(initialData.dept_id) : "",
      subject_id: initialData?.subject_id ? String(initialData.subject_id) : "",
      bg_id: initialData?.bg_id ? String(initialData.bg_id) : "",
      gender_id: initialData?.gender_id ? String(initialData.gender_id) : "",
      user_status_id: initialData?.user_status_id
        ? String(initialData.user_status_id)
        : "1",
      joining_date: initialData?.joining_date
        ? initialData.joining_date.split("T")[0]
        : "",
    },
  });


  /* =========================
     PREFILL (EDIT MODE)
  ========================= */
  // React.useEffect(() => {
  //   if (initialData) {
  //     form.reset({
  //       name: `${initialData.staff_first_name} ${initialData.staff_last_name}`,
  //       email: initialData.email || "",
  //       contact: initialData.contact || "",
  //       qualification: initialData.qualification || "",
  //       dept_id: initialData.dept_id ? String(initialData.dept_id) : "",
  //       subject_id: initialData.subject_id
  //         ? String(initialData.subject_id)
  //         : "",
  //       bg_id: initialData.bg_id ? String(initialData.bg_id) : "",
  //       gender_id: initialData.gender_id
  //         ? String(initialData.gender_id)
  //         : "",
  //       user_status_id: String(initialData.user_status_id || "1"),
  //       joining_date: initialData.joining_date
  //         ? initialData.joining_date.split("T")[0]
  //         : "",
  //     });
  //   }
  // }, [initialData, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="qualification"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Qualification</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="joining_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Joining Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Department */}
        <FormField
          control={form.control}
          name="dept_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.dept_id} value={String(d.dept_id)}>
                      {d.dept_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Subject */}
        <FormField
          control={form.control}
          name="subject_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject</FormLabel>
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem
                      key={s.subject_id}
                      value={String(s.subject_id)}
                    >
                      {s.subject_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        {/* Blood Group */}
        <FormField
          control={form.control}
          name="bg_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Blood Group</FormLabel>
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select blood group" />
                </SelectTrigger>
                <SelectContent>
                  {bloodGroups.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        {/* Gender */}
        <FormField
          control={form.control}
          name="gender_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {genders.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        {/* Status */}
        <FormField
          control={form.control}
          name="user_status_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Active</SelectItem>
                  <SelectItem value="2">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          {mode === "add" ? "Add Faculty" : "Update Faculty"}
        </Button>
      </form>
    </Form>
  );
}
