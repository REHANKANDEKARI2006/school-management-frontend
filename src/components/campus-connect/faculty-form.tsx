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

const facultySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Faculty name is required"),
  email: z.string().email("Invalid email address"),
  department: z.string().min(1, "Department is required"),
  subject: z.string().min(1, "Subject is required"),
  status: z.enum(["Active", "On Leave"]),
  // Not part of the form, but needed for the type
  avatar: z.string().optional(),
  fallback: z.string().optional(),
  date: z.string().optional(),
});

export type Faculty = z.infer<typeof facultySchema>;

interface FacultyFormProps {
  onSubmit: (data: Faculty) => void;
  facultyMember?: Faculty;
}

export function FacultyForm({ onSubmit, facultyMember }: FacultyFormProps) {
  const form = useForm<Faculty>({
    resolver: zodResolver(facultySchema),
    defaultValues: facultyMember || {
      name: "",
      email: "",
      department: "",
      subject: "",
      status: "Active",
    },
  });

  const handleSubmit = (values: Faculty) => {
    onSubmit({ ...values, id: facultyMember?.id });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Dr. Evelyn Reed" {...field} />
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
                <Input type="email" placeholder="e.g. evelyn.reed@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Science" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Physics" {...field} />
              </FormControl>
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select faculty status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="On Leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">{facultyMember ? "Update Faculty" : "Add Faculty"}</Button>
      </form>
    </Form>
  );
}
