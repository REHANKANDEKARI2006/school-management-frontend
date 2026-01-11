
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

const classSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Class name is required"),
  section: z.string().min(1, "Section is required"),
  classTeacher: z.string().min(1, "Class teacher is required"),
  roomNumber: z.string().min(1, "Room number is required"),
  studentCount: z.number().optional(),
});

export type Class = z.infer<typeof classSchema>;

interface ClassFormProps {
  onSubmit: (data: Class) => void;
  classData?: Class;
}

export function ClassForm({ onSubmit, classData }: ClassFormProps) {
  const form = useForm<Class>({
    resolver: zodResolver(classSchema),
    defaultValues: classData || {
      name: "",
      section: "",
      classTeacher: "",
      roomNumber: "",
    },
  });

  const handleSubmit = (values: Class) => {
    onSubmit({ ...values, id: classData?.id });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Class 10" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="section"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Section</FormLabel>
              <FormControl>
                <Input placeholder="e.g. A" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="classTeacher"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class Teacher</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Dr. Evelyn Reed" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="roomNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Room Number</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 301" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">{classData ? "Update Class" : "Create Class"}</Button>
      </form>
    </Form>
  );
}
