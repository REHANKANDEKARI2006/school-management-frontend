
"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

const feeCategorySchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.string().min(1, "Category name is required"),
  description: z.string().min(1, "Description is required"),
  allowInstallments: z.boolean().default(false),
});

export type FeeCategory = z.infer<typeof feeCategorySchema>;

interface FeeCategoryFormProps {
  onSubmit: (data: FeeCategory) => void;
  category?: FeeCategory;
}

export function FeeCategoryForm({ onSubmit, category }: FeeCategoryFormProps) {
  const form = useForm<FeeCategory>({
    resolver: zodResolver(feeCategorySchema),
    defaultValues: category || {
      name: "",
      description: "",
      allowInstallments: false,
    },
  });

  const handleSubmit = (values: FeeCategory) => {
    onSubmit({ ...values, id: category?.id });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Tuition Fee" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="A short description of the fee category." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="allowInstallments"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Allow Installments</FormLabel>
                <FormDescription>
                  Can this fee be paid in installments?
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">{category ? "Update Category" : "Create Category"}</Button>
      </form>
    </Form>
  );
}
