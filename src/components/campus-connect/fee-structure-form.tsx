
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
import type { FeeStructure } from "@/types";
import { getFeeCategories, getClasses } from "@/lib/mock-data";
import * as React from "react";

const structureSchema = z.object({
  id: z.string().optional(),
  classId: z.string().min(1, "Class is required"),
  feeCategoryId: z.string().min(1, "Fee category is required"),
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
});

export type FeeStructureFormValues = z.infer<typeof structureSchema>;

interface FeeStructureFormProps {
  onSubmit: (data: FeeStructure) => void;
  structure?: FeeStructure;
}

export function FeeStructureForm({ onSubmit, structure }: FeeStructureFormProps) {
  const [feeCategories] = React.useState(getFeeCategories());
  const [classes] = React.useState(getClasses());

  const form = useForm<FeeStructureFormValues>({
    resolver: zodResolver(structureSchema),
    defaultValues: structure || {
      classId: "",
      feeCategoryId: "",
      amount: 0,
    },
  });

  const handleSubmit = (values: FeeStructureFormValues) => {
    onSubmit({ ...values, id: structure?.id || "" });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="feeCategoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fee Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a fee category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {feeCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="classId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g. 5000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">{structure ? "Update Structure" : "Create Structure"}</Button>
      </form>
    </Form>
  );
}
