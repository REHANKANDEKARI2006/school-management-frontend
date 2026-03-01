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

import * as React from "react";
import axios from "@/lib/axios";
import { getFeeCategories, createFeeStructure } from "@/lib/api/fees";

const schema = z.object({
  class_id: z.string().min(1, "Class is required"),
  fee_cat_id: z.string().min(1, "Category is required"),
  amount: z.coerce.number().min(1),
});

export function FeeStructureForm({ onSubmit }: any) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      class_id: "",
      fee_cat_id: "",
      amount: 0,
    },
  });

  const [categories, setCategories] = React.useState<any[]>([]);
  const [classes, setClasses] = React.useState<any[]>([]);

  React.useEffect(() => {
    getFeeCategories().then(setCategories);

    // ✅ INLINE CLASSES API (no extra file required)
    axios.get("/api/classes").then((res) => {
      setClasses(res.data.data || []);
    });
  }, []);

  const submit = async (data: any) => {
    try {
      await createFeeStructure(data);
      if (onSubmit) {
        onSubmit(data);
      }
      form.reset();
    } catch (e: any) {
      console.error(e);
      // Let the parent or a toast handle the error via an alert or toast if configured globally
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fee_cat_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fee Category</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem
                      key={c.fee_category_id}
                      value={String(c.fee_category_id)}
                    >
                      {c.category_name}
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
          name="class_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem
                      key={c.class_id}
                      value={String(c.class_id)}
                    >
                      {c.class_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <Input type="number" {...field} />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Create Structure
        </Button>
      </form>
    </Form>
  );
}
