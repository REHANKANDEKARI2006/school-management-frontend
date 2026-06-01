
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
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getNoticeAudiences } from "@/lib/api/notices";

const noticeSchema = z.object({
  notice_id: z.number().optional(),
  title: z.string().min(1, "Notice title is required"),
  content: z.string().min(1, "Notice content is required"),
  author_name: z.string().min(1, "Author is required"),
  audience_id: z.string().min(1, "Audience is required"),
  class_id: z.string().optional(),
  post_date: z.date({ required_error: "A date is required." }),
});

export type Notice = z.infer<typeof noticeSchema>;

interface NoticeFormProps {
  onSubmit: (data: any) => void;
  onCancel?: () => void;
  notice?: any;
  loading?: boolean;
}

export function NoticeForm({ onSubmit, onCancel, notice, loading }: NoticeFormProps) {
  const [audiences, setAudiences] = React.useState<any[]>([]);
  const [fetchingAudiences, setFetchingAudiences] = React.useState(true);
  const [classes, setClasses] = React.useState<any[]>([]);

  const form = useForm<Notice>({
    resolver: zodResolver(noticeSchema),
    defaultValues: notice ? {
      ...notice,
      post_date: new Date(notice.post_date || notice.created_at || new Date()),
      audience_id: notice.audience_id?.toString() || "",
      class_id: notice.class_id?.toString() || "all",
      author_name: notice.author_name || notice.author || "",
    } : {
      title: "",
      content: "",
      author_name: "",
      audience_id: "",
      class_id: "all",
      post_date: new Date(),
    },
  });

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [audRes, clsRes] = await Promise.all([
          getNoticeAudiences(),
          axios.get("/api/classes")
        ]);
        setAudiences(audRes);
        setClasses(clsRes.data.data || clsRes.data || []);
      } catch (error) {
        console.error("Failed to fetch form data:", error);
      } finally {
        setFetchingAudiences(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = (values: Notice) => {
    const dataToSend = {
      ...values,
      post_date: format(values.post_date, 'yyyy-MM-dd'),
      audience_id: parseInt(values.audience_id),
      class_id: values.class_id && values.class_id !== "all" ? parseInt(values.class_id) : null,
      author_type: 'admin',
      author_id: 1
    };
    onSubmit(dataToSend);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pt-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="text-sm font-semibold text-slate-700">Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Mid-term Exam Schedule" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="text-sm font-semibold text-slate-700">Content</FormLabel>
              <FormControl>
                <Textarea placeholder="The full content of the notice." {...field} className="min-h-[100px] resize-none" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="author_name"
            render={({ field }) => (
                <FormItem className="space-y-2">
                <FormLabel className="text-sm font-semibold text-slate-700">Author</FormLabel>
                <FormControl>
                    <Input placeholder="e.g. Admin" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />

            <FormField
            control={form.control}
            name="post_date"
            render={({ field }) => (
                <FormItem className="flex flex-col space-y-2">
                <FormLabel className="text-sm font-semibold text-slate-700">Date</FormLabel>
                <Popover>
                    <PopoverTrigger asChild>
                    <FormControl>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                        )}
                        >
                        {field.value ? (
                            format(field.value, "MMM d, yyyy")
                        ) : (
                            <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="audience_id"
            render={({ field }) => (
                <FormItem className="space-y-2">
                <FormLabel className="text-sm font-semibold text-slate-700">Audience</FormLabel>
                <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={fetchingAudiences}
                >
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder={fetchingAudiences ? "Loading..." : "Select"} />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {audiences.map((audience) => (
                        <SelectItem key={audience.audience_id} value={audience.audience_id.toString()}>
                        {audience.audience_name}
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
                <FormItem className="space-y-2">
                <FormLabel className="text-sm font-semibold text-slate-700">Class</FormLabel>
                <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={fetchingAudiences}
                >
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="All" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {classes.map((c) => (
                        <SelectItem key={c.class_id} value={c.class_id.toString()}>
                        {c.class_name}{c.section_name ? ` - ${c.section_name}` : ""}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2">
            {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} className="order-2 sm:order-1">
                    Cancel
                </Button>
            )}
            <Button type="submit" className="flex-1 order-1 sm:order-2" loading={loading}>
                {notice ? "Update Notice" : "Post Notice"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
