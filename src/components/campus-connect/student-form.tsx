"use client";

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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { Student as StudentType } from "@/types";

import * as React from "react";
import axios from "@/lib/axios";

/* =========================
   VALIDATION SCHEMA
========================= */
const studentSchema = z.object({
  id: z.string().optional(),
  rollNumber: z.string().optional(),

  class_id: z.string().min(1, "Class is required"),

  name: z.string().min(1, "Student name is required"),
  email: z.string().email("Invalid email address"),
  status: z.enum(["Active", "Suspended", "Withdrawn"]),
  address: z.string().min(1, "Address is required"),
  bloodGroup: z.string().min(1, "Blood group is required"),
  fatherName: z.string().min(1, "Father's name is required"),
  motherName: z.string().min(1, "Mother's name is required"),
  primaryContact: z.string().min(1, "Primary contact is required"),
  dob: z.string().min(1, "Date of birth is required"),
  secondaryContact: z.string().optional(),
  parentEmail: z.string().email().optional().or(z.literal("")),
});

export type Student = z.infer<typeof studentSchema>;

interface StudentFormProps {
  onSubmit: (data: Student) => void;
  student?: StudentType;
}

export function StudentForm({ onSubmit, student }: StudentFormProps) {
  const form = useForm<Student>({
    resolver: zodResolver(studentSchema),
    defaultValues: student || {
      name: "",
      email: "",
      class_id: "",
      status: "Active",
      address: "",
      bloodGroup: "",
      fatherName: "",
      motherName: "",
      primaryContact: "",
      secondaryContact: "",
      parentEmail: "",
      dob: "",
    },
  });

  /* =========================
     DROPDOWN DATA
  ========================= */
  const [classOptions, setClassOptions] = React.useState<any[]>([]);
  const [bloodGroups, setBloodGroups] = React.useState<any[]>([]);

  React.useEffect(() => {
    axios
      .get("/api/classes/class-enrollments/list")
      .then((res) => setClassOptions(res.data.data));

    axios
      .get("/api/blood-groups")
      .then((res) => setBloodGroups(res.data.data));
  }, []);

  const handleSubmit = (values: Student) => {
    onSubmit(values);
  };

  /* =========================
     PREFILL (EDIT MODE)
  ========================= */
  React.useEffect(() => {
    if (student) {
      form.reset({
        ...student,
        class_id: student.class_id ? String(student.class_id) : "",
        dob: student.dob
          ? new Date(student.dob).toISOString().split("T")[0]
          : "",
        bloodGroup: student.bloodGroup ?? "",
        status: student.status ?? "Active",
      });
    }
  }, [student, form]);

  React.useEffect(() => {
    if (student?.class_id && classOptions.length > 0) {
      form.setValue("class_id", String(student.class_id), {
        shouldValidate: true,
      });
    }
  }, [student?.class_id, classOptions, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <h3 className="text-lg font-medium">Student Information</h3>

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
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ✅ FIXED CLASS SELECT */}
        <FormField
          control={form.control}
          name="class_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class</FormLabel>
              <Select
                value={field.value || ""}
                onValueChange={(val) => {
                  field.onChange(val);
                  form.setValue("class_id", val, { shouldValidate: true });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classOptions.map((c) => (
                    <SelectItem key={c.class_id} value={String(c.class_id)}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dob"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date of Birth</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        {/* ✅ FIXED BLOOD GROUP */}
        <FormField
          control={form.control}
          name="bloodGroup"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Blood Group</FormLabel>
              <Select
                value={field.value || ""}
                onValueChange={field.onChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select blood group" />
                </SelectTrigger>
                <SelectContent>
                  {bloodGroups.map((bg) => (
                    <SelectItem key={bg.bg_id} value={bg.blood_group}>
                      {bg.blood_group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                  <SelectItem value="Withdrawn">Withdrawn</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        <h3 className="text-lg font-medium">Guardian Information</h3>

        <FormField
          control={form.control}
          name="fatherName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Father's Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="motherName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mother's Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="primaryContact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Contact</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="secondaryContact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Secondary Contact (Optional)</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="parentEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Guardian Email (Optional)</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          {student ? "Update Student" : "Add Student"}
        </Button>
      </form>
    </Form>
  );
}
