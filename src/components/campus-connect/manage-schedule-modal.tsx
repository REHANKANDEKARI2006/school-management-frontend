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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import axios from "@/lib/axios";

const scheduleSchema = z.object({
    class_id: z.string().min(1, "Class is required"),
    subject_id: z.string().min(1, "Subject is required"),
    staff_id: z.string().min(1, "Teacher is required"),
    day_of_week: z.string().min(1, "Day is required"),
    period_number: z.string().min(1, "Period is required"),
    start_time: z.string().min(1, "Start time is required"),
    end_time: z.string().min(1, "End time is required"),
});

export type ScheduleFormValues = z.infer<typeof scheduleSchema>;

interface ManageScheduleModalProps {
    onSubmit: (data: ScheduleFormValues) => void;
}

export function ManageScheduleModal({ onSubmit }: ManageScheduleModalProps) {
    const [classes, setClasses] = React.useState<any[]>([]);
    const [subjects, setSubjects] = React.useState<any[]>([]);
    const [staffList, setStaffList] = React.useState<any[]>([]);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const [clsRes, subRes, staffRes] = await Promise.all([
                    axios.get("/api/classes"),
                    axios.get("/api/subjects"),
                    axios.get("/api/faculty")
                ]);

                setClasses(clsRes.data.data || clsRes.data || []);
                setSubjects(subRes.data.data || subRes.data || []);

                const facultyData = staffRes.data.data || staffRes.data || [];
                // Handle object map returned by some faculty routes vs array
                setStaffList(Array.isArray(facultyData) ? facultyData : Object.values(facultyData).flat() || []);
            } catch (e) {
                console.error("Failed to load dropdown data", e);
            }
        };
        fetchData();
    }, []);

    const form = useForm<ScheduleFormValues>({
        resolver: zodResolver(scheduleSchema),
        defaultValues: {
            class_id: "",
            subject_id: "",
            staff_id: "",
            day_of_week: "1",
            period_number: "1",
            start_time: "09:00",
            end_time: "09:45",
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="class_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Class</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Class" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {classes.map((c) => (
                                        <SelectItem key={c.class_id} value={c.class_id.toString()}>
                                            {c.class_name} {c.section_name ? `(${c.section_name})` : ''}
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
                    name="subject_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Subject</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Subject" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {subjects.map((s) => (
                                        <SelectItem key={s.subject_id} value={s.subject_id.toString()}>
                                            {s.subject_name}
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
                    name="staff_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Teacher</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Teacher" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {staffList.map((s) => (
                                        <SelectItem key={s.staff_id} value={s.staff_id.toString()}>
                                            {s.staff_first_name} {s.staff_last_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="day_of_week"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Day of Week</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Day" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="1">Monday</SelectItem>
                                        <SelectItem value="2">Tuesday</SelectItem>
                                        <SelectItem value="3">Wednesday</SelectItem>
                                        <SelectItem value="4">Thursday</SelectItem>
                                        <SelectItem value="5">Friday</SelectItem>
                                        <SelectItem value="6">Saturday</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="period_number"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Period Number</FormLabel>
                                <FormControl>
                                    <Input type="number" min="1" max="10" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="start_time"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Start Time</FormLabel>
                                <FormControl>
                                    <Input type="time" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="end_time"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>End Time</FormLabel>
                                <FormControl>
                                    <Input type="time" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Button type="submit" className="w-full">Create Schedule</Button>
            </form>
        </Form>
    );
}
