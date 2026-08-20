
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
import { Loader2 } from "lucide-react";

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

  const handleSubmit = async (values: FeeCategory) => {
    await onSubmit({ ...values, id: category?.id });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3.5 pt-1">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-xs font-bold text-slate-700">Category Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Tuition Fee" className="h-11 text-xs font-bold text-slate-900 border-slate-200 focus:border-indigo-500 rounded-xl bg-white" {...field} />
              </FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-xs font-bold text-slate-700">Description</FormLabel>
              <FormControl>
                <Textarea placeholder="A short description of the fee category." className="text-xs font-medium text-slate-900 border-slate-200 focus:border-indigo-500 rounded-xl bg-white min-h-[80px]" {...field} />
              </FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="allowInstallments"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-xl border border-slate-200/90 p-3 shadow-2xs bg-slate-50/50 space-y-0">
              <div className="space-y-0.5">
                <FormLabel className="text-xs font-bold text-slate-800">Allow Installments</FormLabel>
                <FormDescription className="text-[11px] font-medium text-slate-400">
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
        <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 mt-2" loading={form.formState.isSubmitting}>
          {category ? "Update Category" : "Create Category"}
        </Button>
      </form>
    </Form>
  );
}
