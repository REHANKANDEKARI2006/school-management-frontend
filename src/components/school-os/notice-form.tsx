
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

const noticeSchema = z.object({
  notice_id: z.number().optional(),
  title: z.string().min(1, "Notice title is required"),
  content: z.string().min(1, "Notice content is required"),
  author_name: z.string().min(1, "Author is required"),
  audience_id: z.string().min(1, "Audience is required"),
  class_ids: z.array(z.string()).optional(),
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

// Map role_id to a human-readable role label
function getRoleLabel(roleId: number | null): string {
  const roleMap: Record<number, string> = {
    1: "Master Administrator",
    2: "Institute Administrator",
    3: "Teacher",
    4: "Class Teacher",
    5: "Mentor",
    6: "Librarian",
    7: "Lab Assistant",
    8: "Sports Manager",
    9: "School Counsellor",
    10: "Principal",
    11: "Vice Principal",
    12: "Office Staff",
    13: "Cashier",
    14: "Accountant",
    15: "Admission Officer",
    16: "Management Committee Member",
    17: "HR Manager",
    18: "Student",
    19: "Class Representative",
    20: "Guardian",
    21: "IT Support",
    22: "Library Assistant",
    23: "Demo Guest User",
  };
  return roleId ? (roleMap[roleId] ?? "Staff") : "Staff";
}

export function NoticeForm({ onSubmit, onCancel, notice, loading }: NoticeFormProps) {
  const [audiences, setAudiences] = React.useState<any[]>([]);
  const [fetchingAudiences, setFetchingAudiences] = React.useState(true);
  const [classes, setClasses] = React.useState<any[]>([]);

  // Derive logged-in user info from localStorage
  const loggedInName = React.useMemo(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("user_name") || "";
  }, []);

  const loggedInRoleId = React.useMemo(() => {
    if (typeof window === "undefined") return null;
    const id = localStorage.getItem("role_id");
    return id ? Number(id) : null;
  }, []);

  const loggedInRoleLabel = React.useMemo(() => getRoleLabel(loggedInRoleId), [loggedInRoleId]);

  const form = useForm<Notice>({
    resolver: zodResolver(noticeSchema),
    defaultValues: notice ? {
      ...notice,
      post_date: new Date(notice.post_date || notice.created_at || new Date()),
      audience_id: notice.audience_id?.toString() || "",
      class_ids: notice.class_ids ? notice.class_ids.map((id: any) => id.toString()) : (notice.class_id ? [notice.class_id.toString()] : []),
      author_name: notice.author_name || notice.author || "",
    } : {
      title: "",
      content: "",
      author_name: loggedInName,
      audience_id: "",
      class_ids: [],
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
    // Determine author_type from role_id
    const authorTypeMap: Record<number, string> = {
      1: "Master Admin",
      2: "Institute Admin",
      18: "Student",
      20: "Guardian",
    };
    const authorType = loggedInRoleId ? (authorTypeMap[loggedInRoleId] ?? "Staff") : "Staff";

    const dataToSend = {
      ...values,
      author_name: loggedInName || values.author_name,
      post_date: format(values.post_date, 'yyyy-MM-dd'),
      audience_id: parseInt(values.audience_id),
      class_ids: values.class_ids ? values.class_ids.map(id => parseInt(id)) : [],
      class_id: values.class_ids && values.class_ids.length === 1 ? parseInt(values.class_ids[0]) : null,
      author_type: authorType,
    };
    onSubmit(dataToSend);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 sm:space-y-5">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-semibold text-slate-700">Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Mid-term Exam Schedule" {...field} className="h-11 text-xs font-semibold rounded-xl bg-white border-slate-200 shadow-sm" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-semibold text-slate-700">Content</FormLabel>
                <FormControl>
                  <Textarea placeholder="The full content of the notice." {...field} className="min-h-[100px] text-xs font-medium rounded-xl bg-white border-slate-200 shadow-sm resize-none" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <FormField
              control={form.control}
              name="author_name"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-semibold text-slate-700">Author</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={loggedInName || field.value}
                      readOnly
                      className="h-11 text-xs font-semibold rounded-xl bg-slate-100/80 border-slate-200 text-slate-700 cursor-not-allowed"
                    />
                  </FormControl>
                  {loggedInRoleLabel && (
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pt-0.5">
                      {loggedInRoleLabel}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="post_date"
              render={({ field }) => (
                <FormItem className="flex flex-col space-y-1.5">
                  <FormLabel className="text-xs font-semibold text-slate-700">Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "h-11 px-3 text-xs font-semibold rounded-xl bg-white border-slate-200 shadow-sm justify-between text-left",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <span className="truncate">
                            {field.value ? format(field.value, "MMM d, yyyy") : <span>Pick date</span>}
                          </span>
                          <CalendarIcon className="h-4 w-4 opacity-50 shrink-0 ml-1" />
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

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <FormField
              control={form.control}
              name="audience_id"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-semibold text-slate-700">Audience</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={fetchingAudiences}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11 text-xs font-semibold rounded-xl bg-white border-slate-200 shadow-sm truncate">
                        <SelectValue placeholder="Select" />
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
              name="class_ids"
              render={({ field }) => {
                const selectedIds = field.value || [];
                const isAllSelected = selectedIds.length === 0;

                const handleAllChange = (checked: boolean) => {
                  if (checked) {
                    field.onChange([]);
                  }
                };

                const handleClassChange = (classId: string, checked: boolean) => {
                  if (checked) {
                    field.onChange([...selectedIds, classId]);
                  } else {
                    field.onChange(selectedIds.filter((id) => id !== classId));
                  }
                };

                let triggerLabel = "All Classes";
                if (selectedIds.length > 0) {
                  if (selectedIds.length === classes.length) {
                    triggerLabel = "All Classes";
                  } else if (selectedIds.length <= 2) {
                    triggerLabel = classes
                      .filter((c) => selectedIds.includes(c.class_id.toString()))
                      .map((c) => `${c.class_name}${c.section_name ? `-${c.section_name}` : ""}`)
                      .join(", ");
                  } else {
                    triggerLabel = `${selectedIds.length} Classes Selected`;
                  }
                }

                return (
                  <FormItem className="space-y-1.5 flex flex-col">
                    <FormLabel className="text-xs font-semibold text-slate-700">Class</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="h-11 px-3 w-full justify-between text-xs font-semibold rounded-xl bg-white border-slate-200 shadow-sm text-left truncate flex items-center gap-1"
                            disabled={fetchingAudiences}
                          >
                            <span className="truncate flex-1 text-left">{triggerLabel}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-bold shrink-0 ml-1">
                              {selectedIds.length === 0 ? "All" : selectedIds.length}
                            </span>
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[280px] p-2" align="start">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center space-x-2 px-2 py-1.5 hover:bg-slate-100/50 rounded-sm cursor-pointer">
                            <Checkbox
                              id="class-all"
                              checked={isAllSelected}
                              onCheckedChange={handleAllChange}
                            />
                            <label
                              htmlFor="class-all"
                              className="text-xs font-medium text-slate-700 leading-none cursor-pointer flex-1"
                            >
                              All Classes
                            </label>
                          </div>
                          <div className="h-px bg-slate-100 my-1" />
                          <ScrollArea className="h-60 pr-2">
                            <div className="flex flex-col space-y-1">
                              {classes.map((c) => {
                                const classIdStr = c.class_id.toString();
                                const isChecked = selectedIds.includes(classIdStr);
                                return (
                                  <div
                                    key={c.class_id}
                                    className="flex items-center space-x-2 px-2 py-1.5 hover:bg-slate-100/50 rounded-sm cursor-pointer"
                                    onClick={(e) => {
                                      if ((e.target as HTMLElement).tagName !== "BUTTON" && (e.target as HTMLElement).tagName !== "INPUT" && (e.target as HTMLElement).tagName !== "label") {
                                        handleClassChange(classIdStr, !isChecked);
                                      }
                                    }}
                                  >
                                    <Checkbox
                                      id={`class-${c.class_id}`}
                                      checked={isChecked}
                                      onCheckedChange={(checked) => handleClassChange(classIdStr, !!checked)}
                                    />
                                    <label
                                      htmlFor={`class-${c.class_id}`}
                                      className="text-xs text-slate-600 leading-none cursor-pointer flex-1"
                                    >
                                      {c.class_name}{c.section_name ? ` - ${c.section_name}` : ""}
                                    </label>
                                  </div>
                                );
                              })}
                            </div>
                          </ScrollArea>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>
        </div>

        <div className="p-4 sm:p-6 pt-3 bg-slate-50/50 border-t flex flex-col-reverse sm:flex-row gap-2 shrink-0">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto h-11 rounded-xl text-xs font-bold border-slate-200">
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={loading} className="w-full sm:w-auto h-11 rounded-xl text-xs font-bold shadow-sm">
            {notice ? "Update Notice" : "Post Notice"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
