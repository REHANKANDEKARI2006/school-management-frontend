"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Trash2, PlusCircle, Clock, Pencil, Check, X, CalendarDays, ChevronDown } from "lucide-react";
import axios from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ManageScheduleGridProps {
    onSave: (classId: number, scheduleArray: any[]) => Promise<void>;
    existingSchedules?: any[];
}

interface PeriodTime {
    period: number;
    start: string;
    end: string;
}

const DAYS = [
    { id: 1, name: "Monday" },
    { id: 2, name: "Tuesday" },
    { id: 3, name: "Wednesday" },
    { id: 4, name: "Thursday" },
    { id: 5, name: "Friday" },
    { id: 6, name: "Saturday" },
];

const DEFAULT_PERIOD_TIMES: PeriodTime[] = [
    { period: 1, start: "09:00", end: "09:45" },
    { period: 2, start: "09:50", end: "10:35" },
    { period: 3, start: "10:40", end: "11:25" },
    { period: 4, start: "11:30", end: "12:15" },
    { period: 5, start: "13:00", end: "13:45" },
    { period: 6, start: "13:50", end: "14:35" },
    { period: 7, start: "14:40", end: "15:25" },
];

// Convert "HH:MM" (24h) → "H:MM AM/PM"
const to12h = (time: string) => {
    const [hStr, mStr] = time.split(":");
    const h = parseInt(hStr, 10);
    const m = mStr;
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${m} ${period}`;
};

export function ManageScheduleGrid({ onSave, existingSchedules = [] }: ManageScheduleGridProps) {
    const { toast } = useToast();
    const [classes, setClasses] = React.useState<any[]>([]);
    const [subjects, setSubjects] = React.useState<any[]>([]);
    const [staffList, setStaffList] = React.useState<any[]>([]);

    const [selectedClass, setSelectedClass] = React.useState<string>("");
    const [selectedDayTab, setSelectedDayTab] = React.useState<number>(1);
    const [expandedPeriod, setExpandedPeriod] = React.useState<number | null>(null);
    const [gridData, setGridData] = React.useState<Record<string, any>>({});
    const [isSaving, setIsSaving] = React.useState(false);

    // Dynamic periods — start with defaults, users can add/edit/remove
    const [periodTimes, setPeriodTimes] = React.useState<PeriodTime[]>(DEFAULT_PERIOD_TIMES);

    // Which period is currently being time-edited (by period number)
    const [editingTimePeriod, setEditingTimePeriod] = React.useState<number | null>(null);
    const [editingTargetDay, setEditingTargetDay] = React.useState<number | "all">("all");
    const [editStart, setEditStart] = React.useState("");
    const [editEnd, setEditEnd] = React.useState("");

    // New period form state
    const [showAddPeriod, setShowAddPeriod] = React.useState(false);
    const [newPeriodStart, setNewPeriodStart] = React.useState("16:00");
    const [newPeriodEnd, setNewPeriodEnd] = React.useState("16:45");

    React.useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const [clsRes, staffRes] = await Promise.all([
                    axios.get("/api/classes"),
                    axios.get("/api/faculty")
                ]);

                setClasses(clsRes.data.data || clsRes.data || []);

                const facultyData = staffRes.data.data || staffRes.data || [];
                setStaffList(Array.isArray(facultyData) ? facultyData : Object.values(facultyData).flat() || []);
            } catch (e) {
                toast({ title: "Failed to load specific data", variant: "destructive" });
            }
        };
        fetchMetadata();
    }, [toast]);

    // Fetch subjects dynamically based on selected class
    React.useEffect(() => {
        if (!selectedClass) {
            setSubjects([]);
            return;
        }

        const fetchClassSubjects = async () => {
            try {
                const res = await axios.get("/api/subjects", {
                    params: { class_id: selectedClass }
                });
                setSubjects(res.data.data || []);
            } catch (e) {
                console.error("Failed to load subjects for class", e);
                setSubjects([]);
            }
        };

        fetchClassSubjects();
    }, [selectedClass]);

    // When selectedClass or existingSchedules change, populate grid + restore periods
    React.useEffect(() => {
        if (!selectedClass) {
            setGridData({});
            return;
        }

        const filtered = existingSchedules.filter(s => s.class_id.toString() === selectedClass);
        const newGrid: Record<string, any> = {};

        // Rebuild period list from existing data
        const existingPeriodNums = Array.from(new Set(filtered.map(s => s.period_number))).sort((a, b) => a - b);
        const mergedPeriods: PeriodTime[] = [...DEFAULT_PERIOD_TIMES];

        existingPeriodNums.forEach(pNum => {
            const sample = filtered.find(s => s.period_number === pNum);
            if (sample) {
                const existingIdx = mergedPeriods.findIndex(p => p.period === pNum);
                const periodEntry: PeriodTime = {
                    period: pNum,
                    start: sample.start_time?.substring(0, 5) || "09:00",
                    end: sample.end_time?.substring(0, 5) || "09:45",
                };
                if (existingIdx >= 0) {
                    mergedPeriods[existingIdx] = periodEntry;
                } else {
                    mergedPeriods.push(periodEntry);
                }
            }
        });

        mergedPeriods.sort((a, b) => a.period - b.period);
        setPeriodTimes(mergedPeriods);

        filtered.forEach(slot => {
            const key = `${slot.day_of_week}-${slot.period_number}`;
            newGrid[key] = {
                subject_id: slot.subject_id?.toString() || "",
                staff_id: slot.staff_id?.toString() || "",
                is_break: slot.is_break || false,
                start_time: slot.start_time?.substring(0, 5) || "",
                end_time: slot.end_time?.substring(0, 5) || "",
            };
        });

        setGridData(newGrid);
    }, [selectedClass, existingSchedules]);

    // ── Time editing helpers ──────────────────────────────────────────────────
    const startEditTime = (pt: PeriodTime, day: number | "all" = "all") => {
        setEditingTimePeriod(pt.period);
        setEditingTargetDay(day);
        
        if (day !== "all") {
            const key = `${day}-${pt.period}`;
            const cell = gridData[key];
            setEditStart(cell?.start_time || pt.start);
            setEditEnd(cell?.end_time || pt.end);
        } else {
            setEditStart(pt.start);
            setEditEnd(pt.end);
        }
    };

    const confirmEditTime = (periodNum: number) => {
        if (!editStart || !editEnd) {
            toast({ title: "Please enter both start and end times", variant: "destructive" });
            return;
        }
        if (editStart >= editEnd) {
            toast({ title: "Start time must be before end time", variant: "destructive" });
            return;
        }

        if (editingTargetDay === "all") {
            // Update base period time
            setPeriodTimes(prev =>
                prev.map(p => p.period === periodNum ? { ...p, start: editStart, end: editEnd } : p)
            );
            // Apply to all cells in grid for this period
            setGridData(prev => {
                const next = { ...prev };
                DAYS.forEach(d => {
                    const key = `${d.id}-${periodNum}`;
                    const cell = next[key] || { subject_id: "", staff_id: "", is_break: false };
                    next[key] = { ...cell, start_time: editStart, end_time: editEnd };
                });
                return next;
            });
        } else {
            // Update specific day cell
            const key = `${editingTargetDay}-${periodNum}`;
            setGridData(prev => {
                const cell = prev[key] || { subject_id: "", staff_id: "", is_break: false };
                return {
                    ...prev,
                    [key]: { ...cell, start_time: editStart, end_time: editEnd }
                };
            });
        }

        setEditingTimePeriod(null);
    };

    const cancelEditTime = () => setEditingTimePeriod(null);

    // ── Add period ────────────────────────────────────────────────────────────
    const handleAddPeriod = () => {
        if (!newPeriodStart || !newPeriodEnd) {
            toast({ title: "Please enter both start and end times", variant: "destructive" });
            return;
        }
        if (newPeriodStart >= newPeriodEnd) {
            toast({ title: "Start time must be before end time", variant: "destructive" });
            return;
        }

        const nextPeriodNumber = periodTimes.length > 0
            ? Math.max(...periodTimes.map(p => p.period)) + 1
            : 1;

        setPeriodTimes(prev => [
            ...prev,
            { period: nextPeriodNumber, start: newPeriodStart, end: newPeriodEnd }
        ]);

        // Auto-suggest next slot
        const [h, m] = newPeriodEnd.split(":").map(Number);
        const nextStartMin = h * 60 + m + 5;
        const nextEndMin = nextStartMin + 45;
        const fmt = (mins: number) => {
            const hh = Math.floor(mins / 60) % 24;
            const mm = mins % 60;
            return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
        };
        setNewPeriodStart(fmt(nextStartMin));
        setNewPeriodEnd(fmt(nextEndMin));

        toast({ title: `Period ${nextPeriodNumber} added!` });
        setShowAddPeriod(false);
    };

    const handleRemovePeriod = (periodNum: number) => {
        if (periodNum <= DEFAULT_PERIOD_TIMES.length) {
            toast({ title: "Cannot remove default periods", variant: "destructive" });
            return;
        }
        setPeriodTimes(prev => prev.filter(p => p.period !== periodNum));
        setGridData(prev => {
            const next = { ...prev };
            DAYS.forEach(d => { delete next[`${d.id}-${periodNum}`]; });
            return next;
        });
    };

    // ── Cell helpers ──────────────────────────────────────────────────────────
    const handleCellChange = (day: number, period: number, field: string, value: any) => {
        setGridData(prev => {
            const key = `${day}-${period}`;
            const cell = prev[key] || { subject_id: "", staff_id: "", is_break: false };
            return { ...prev, [key]: { ...cell, [field]: value } };
        });
    };

    const handleClearCell = (day: number, period: number) => {
        setGridData(prev => {
            const next = { ...prev };
            delete next[`${day}-${period}`];
            return next;
        });
    };

    const markRowAsBreak = (period: number, isBreak: boolean) => {
        setGridData(prev => {
            const next = { ...prev };
            DAYS.forEach(d => {
                const key = `${d.id}-${period}`;
                const cell = next[key] || { subject_id: "", staff_id: "" };
                next[key] = {
                    ...cell,
                    is_break: isBreak,
                    ...(isBreak ? { subject_id: "", staff_id: "" } : {})
                };
            });
            return next;
        });
    };

    // ── Save ──────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!selectedClass) return;
        setIsSaving(true);
        try {
            const scheduleArray: any[] = [];
            Object.keys(gridData).forEach(key => {
                const [dayStr, periodStr] = key.split("-");
                const cell = gridData[key];
                if (!cell.is_break && (!cell.subject_id || !cell.staff_id)) return;

                const periodMeta = periodTimes.find(p => p.period.toString() === periodStr);
                if (!periodMeta) return;

                scheduleArray.push({
                    day_of_week: parseInt(dayStr),
                    period_number: parseInt(periodStr),
                    start_time: periodMeta.start,
                    end_time: periodMeta.end,
                    subject_id: cell.subject_id || null,
                    staff_id: cell.staff_id || null,
                    is_break: cell.is_break || false,
                });
            });

            await onSave(parseInt(selectedClass), scheduleArray);
            toast({ title: "Weekly schedule saved successfully!" });
        } catch (e: any) {
            toast({ title: "Failed to save schedule", description: e.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const isCustomPeriod = (periodNum: number) => periodNum > DEFAULT_PERIOD_TIMES.length;

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <Card className="border-none shadow-sm overflow-hidden bg-white dark:bg-slate-900 rounded-2xl">
            <CardHeader className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5">
                    <div className="space-y-0.5">
                        <CardTitle className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Weekly Schedule Builder</CardTitle>
                        <CardDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Select a class to design their timetable. Click the ✏️ icon on any period to adjust its time.</CardDescription>
                    </div>

                    {/* Mobile View Controls (< sm: side-by-side 2-column grid) */}
                    <div className="grid sm:hidden grid-cols-2 gap-2.5 w-full mt-1">
                        <Select value={selectedClass} onValueChange={setSelectedClass}>
                            <SelectTrigger className="w-full h-11 text-xs font-semibold rounded-xl bg-white border-slate-200 shadow-sm">
                                <SelectValue placeholder="Select a Class" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map(c => (
                                    <SelectItem key={c.class_id} value={c.class_id.toString()}>
                                        {c.class_name}{c.section_name ? ` - ${c.section_name}` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button 
                            className="w-full h-11 font-bold rounded-xl shadow-sm text-xs"
                            onClick={handleSave} 
                            disabled={!selectedClass || isSaving}
                        >
                            {isSaving ? "Saving..." : "Save Schedule"}
                        </Button>
                    </div>

                    {/* Desktop View Controls (>= sm: side-by-side flex row) */}
                    <div className="hidden sm:flex flex-row items-center gap-3 w-auto">
                        <Select value={selectedClass} onValueChange={setSelectedClass}>
                            <SelectTrigger className="w-[250px] bg-background">
                                <SelectValue placeholder="Select a Class" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map(c => (
                                    <SelectItem key={c.class_id} value={c.class_id.toString()}>
                                        {c.class_name}{c.section_name ? ` - ${c.section_name}` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={handleSave} disabled={!selectedClass || isSaving}>
                            {isSaving ? "Saving..." : "Save Schedule"}
                        </Button>
                    </div>
                </div>
            </CardHeader>

            {selectedClass ? (
                <CardContent className="p-0 overflow-x-auto sm:overflow-visible">
                    {/* Desktop View Table (>= sm: 100% untouched) */}
                    <div className="hidden sm:block min-w-[1000px] border-t">

                        {/* Header Row */}
                        <div className="flex bg-muted/20 border-b font-medium text-sm text-muted-foreground p-3">
                            <div className="w-44 shrink-0">Period / Time</div>
                            {DAYS.map(day => (
                                <div key={day.id} className="flex-1 text-center border-l px-2">{day.name}</div>
                            ))}
                        </div>

                        {/* Grid Body */}
                        <div className="divide-y">
                            {periodTimes.map(pt => {
                                const isEditing = editingTimePeriod === pt.period;

                                return (
                                    <div key={pt.period} className="flex hover:bg-muted/5 transition-colors">

                                        {/* Period Info Column */}
                                        <div className="w-44 shrink-0 p-3 border-r flex flex-col justify-center gap-1.5">
                                            {/* Period label + remove button */}
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-sm">Period {pt.period}</span>
                                                {isCustomPeriod(pt.period) && (
                                                    <button
                                                        onClick={() => handleRemovePeriod(pt.period)}
                                                        className="text-red-400 hover:text-red-600 transition-colors"
                                                        title="Remove period"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Time display / edit */}
                                            {editingTimePeriod === pt.period && editingTargetDay === "all" ? (
                                                <div className="space-y-1.5 bg-background p-2 rounded border border-primary/20 shadow-sm">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[10px] text-muted-foreground w-10 shrink-0">From</span>
                                                        <Input
                                                            type="time"
                                                            value={editStart}
                                                            onChange={e => setEditStart(e.target.value)}
                                                            className="h-6 text-[11px] px-1.5 py-0"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[10px] text-muted-foreground w-10 shrink-0">To</span>
                                                        <Input
                                                            type="time"
                                                            value={editEnd}
                                                            onChange={e => setEditEnd(e.target.value)}
                                                            className="h-6 text-[11px] px-1.5 py-0"
                                                        />
                                                    </div>
                                                    <div className="flex gap-1 pt-0.5 justify-end">
                                                        <button
                                                            onClick={() => confirmEditTime(pt.period)}
                                                            className="flex items-center gap-0.5 text-[10px] bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-emerald-700 hover:bg-emerald-100 font-medium"
                                                        >
                                                            <Check className="w-3 h-3" /> Save
                                                        </button>
                                                        <button
                                                            onClick={cancelEditTime}
                                                            className="flex items-center gap-0.5 text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground hover:text-foreground"
                                                        >
                                                            <X className="w-3 h-3" /> Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 group/time">
                                                    <Clock className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                                                    <span className="text-xs text-muted-foreground">{to12h(pt.start)} – {to12h(pt.end)}</span>
                                                    <button
                                                        onClick={() => startEditTime(pt, "all")}
                                                        className="ml-auto text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-0.5"
                                                        title="Adjust period time for all days"
                                                    >
                                                        <Pencil className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}

                                            {/* Break toggle */}
                                            <div className="flex items-center space-x-2 pt-1.5 border-t mt-0.5">
                                                <Switch
                                                    id={`break-${pt.period}`}
                                                    onCheckedChange={(c) => markRowAsBreak(pt.period, c)}
                                                />
                                                <Label htmlFor={`break-${pt.period}`} className="text-[10px] leading-snug cursor-pointer">
                                                    Set row as Break
                                                </Label>
                                            </div>
                                        </div>

                                        {/* Days Columns */}
                                        {DAYS.map(day => {
                                            const key = `${day.id}-${pt.period}`;
                                            const cell = gridData[key] || { subject_id: "", staff_id: "", is_break: false };
                                            const activeStart = cell.start_time || pt.start;
                                            const activeEnd = cell.end_time || pt.end;
                                            const isCustomDayTime = cell.start_time && cell.end_time && (cell.start_time !== pt.start || cell.end_time !== pt.end);
                                            const isEditingCell = editingTimePeriod === pt.period && editingTargetDay === day.id;
                                            const isEmpty = !cell.is_break && !cell.subject_id && !cell.staff_id;

                                            return (
                                                <div key={key} className="flex-1 p-2 border-l relative group">
                                                    {isEditingCell ? (
                                                        <div className="space-y-1.5 bg-background p-2 rounded-md border border-primary/30 shadow-md">
                                                            <div className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 border-b pb-1 flex items-center justify-between">
                                                                <span>{day.name} Time</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-[10px] text-muted-foreground w-8 shrink-0">From</span>
                                                                <Input
                                                                    type="time"
                                                                    value={editStart}
                                                                    onChange={e => setEditStart(e.target.value)}
                                                                    className="h-6 text-[11px] px-1 py-0 bg-background"
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-[10px] text-muted-foreground w-8 shrink-0">To</span>
                                                                <Input
                                                                    type="time"
                                                                    value={editEnd}
                                                                    onChange={e => setEditEnd(e.target.value)}
                                                                    className="h-6 text-[11px] px-1 py-0 bg-background"
                                                                />
                                                            </div>
                                                            <div className="flex gap-1 pt-1 justify-end">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => confirmEditTime(pt.period)}
                                                                    className="flex items-center gap-0.5 text-[10px] bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-emerald-700 hover:bg-emerald-100 font-medium"
                                                                >
                                                                    <Check className="w-3 h-3" /> Save
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={cancelEditTime}
                                                                    className="flex items-center gap-0.5 text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground hover:text-foreground"
                                                                >
                                                                    <X className="w-3 h-3" /> Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {/* Day-specific time bar */}
                                                            <div className="flex items-center justify-between text-[9px] text-muted-foreground mb-1.5 bg-muted/40 px-1.5 py-0.5 rounded border border-muted/50 group/timechip">
                                                                <span className={isCustomDayTime ? "font-bold text-amber-700 dark:text-amber-400" : ""}>
                                                                    {to12h(activeStart)} – {to12h(activeEnd)}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => startEditTime(pt, day.id)}
                                                                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-0.5"
                                                                    title={`Set custom time for ${day.name}`}
                                                                >
                                                                    <Pencil className="w-2.5 h-2.5" />
                                                                </button>
                                                            </div>

                                                            {cell.is_break ? (
                                                                <div className="w-full h-[70px] flex items-center justify-center bg-orange-50/50 rounded-md border border-orange-200/50 relative">
                                                                    <Badge variant="outline" className="bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200">
                                                                        LUNCH / BREAK
                                                                    </Badge>
                                                                    <button
                                                                        onClick={() => handleClearCell(day.id, pt.period)}
                                                                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 hover:bg-orange-200 rounded text-orange-700 transition-opacity"
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                        <div className="space-y-2 relative">
                                                            <Select
                                                                value={cell.subject_id}
                                                                onValueChange={(val) => handleCellChange(day.id, pt.period, "subject_id", val)}
                                                            >
                                                                <SelectTrigger className="h-8 text-xs bg-white">
                                                                    <SelectValue placeholder="Subject..." />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {subjects.map(s => (
                                                                        <SelectItem key={s.subject_id} value={s.subject_id.toString()} className="text-xs">
                                                                            {s.subject_name}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>

                                                            <Select
                                                                value={cell.staff_id}
                                                                onValueChange={(val) => handleCellChange(day.id, pt.period, "staff_id", val)}
                                                            >
                                                                <SelectTrigger className="h-8 text-xs bg-white">
                                                                    <SelectValue placeholder="Teacher..." />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {staffList.map(s => (
                                                                        <SelectItem key={s.staff_id} value={s.staff_id.toString()} className="text-xs">
                                                                            {s.staff_first_name} {s.staff_last_name}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>

                                                            {!isEmpty && (
                                                                <button
                                                                    onClick={() => handleClearCell(day.id, pt.period)}
                                                                    className="absolute -top-1 -right-1 bg-red-100 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10 hover:bg-red-200"
                                                                    title="Clear Slot"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Add Period Section */}
                        <div className="border-t bg-muted/10 p-3">
                            {showAddPeriod ? (
                                <div className="flex items-center gap-3 flex-wrap">
                                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                        <Clock className="w-4 h-4" /> New Period:
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <Label className="text-xs text-muted-foreground">Start</Label>
                                        <Input
                                            type="time"
                                            value={newPeriodStart}
                                            onChange={e => setNewPeriodStart(e.target.value)}
                                            className="h-8 w-32 text-xs"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Label className="text-xs text-muted-foreground">End</Label>
                                        <Input
                                            type="time"
                                            value={newPeriodEnd}
                                            onChange={e => setNewPeriodEnd(e.target.value)}
                                            className="h-8 w-32 text-xs"
                                        />
                                    </div>
                                    <Button size="sm" onClick={handleAddPeriod} className="h-8 text-xs">
                                        Add Period
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setShowAddPeriod(false)} className="h-8 text-xs">
                                        Cancel
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs gap-1 border-dashed"
                                    onClick={() => setShowAddPeriod(true)}
                                >
                                    <PlusCircle className="w-3.5 h-3.5" />
                                    Add Period / Extra Lecture
                                </Button>
                            )}
                        </div>

                    </div>

                    {/* Mobile View Day-Tab Selector & Single-Day Period List (< sm) */}
                    <div className="flex sm:hidden flex-col border-t border-slate-100">
                        {/* Day Selector Strip */}
                        <div className="grid grid-cols-6 gap-1 p-2 bg-slate-50/50 border-b border-slate-100 select-none">
                            {DAYS.map((day) => {
                                const isActive = selectedDayTab === day.id;
                                return (
                                    <button
                                        key={day.id}
                                        type="button"
                                        onClick={() => setSelectedDayTab(day.id)}
                                        className={cn(
                                            "w-full h-8 px-1 rounded-lg text-xs font-semibold transition-all flex items-center justify-center",
                                            isActive
                                                ? "bg-white text-slate-900 shadow-sm font-bold border border-slate-200/80"
                                                : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                                        )}
                                    >
                                        {day.name.substring(0, 3)}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Period List Cards for Selected Day (Collapsible Accordion) */}
                        <div className="flex flex-col gap-2.5 p-3 bg-slate-50/20">
                            {periodTimes.map((pt) => {
                                const isExpanded = expandedPeriod === pt.period;
                                const key = `${selectedDayTab}-${pt.period}`;
                                const cell = gridData[key] || { subject_id: "", staff_id: "", is_break: false };
                                const activeStart = cell.start_time || pt.start;
                                const activeEnd = cell.end_time || pt.end;
                                const isEditingCell = editingTimePeriod === pt.period && editingTargetDay === selectedDayTab;
                                const isEditingAll = editingTimePeriod === pt.period && editingTargetDay === "all";

                                const subjectObj = subjects.find(s => s.subject_id?.toString() === cell.subject_id?.toString());
                                const staffObj = staffList.find(s => s.staff_id?.toString() === cell.staff_id?.toString());

                                const subjectName = subjectObj ? subjectObj.subject_name : "";
                                const staffName = staffObj ? `${staffObj.staff_first_name || ""} ${staffObj.staff_last_name || ""}`.trim() : "";

                                let summaryText = "Not set";
                                if (cell.is_break) {
                                    summaryText = "Break";
                                } else if (subjectName && staffName) {
                                    summaryText = `${subjectName} · ${staffName}`;
                                } else if (subjectName) {
                                    summaryText = subjectName;
                                } else if (staffName) {
                                    summaryText = staffName;
                                }

                                return (
                                    <div
                                        key={pt.period}
                                        className={cn(
                                            "bg-white rounded-2xl border transition-all overflow-hidden select-none",
                                            isExpanded
                                                ? "border-primary/40 shadow-md ring-1 ring-primary/20"
                                                : "border-slate-100 shadow-sm hover:border-slate-200"
                                        )}
                                    >
                                        {/* Collapsed Header Bar (Clickable) */}
                                        <div
                                            onClick={() => setExpandedPeriod(isExpanded ? null : pt.period)}
                                            className="p-3.5 flex items-center justify-between gap-3 cursor-pointer"
                                        >
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-900 text-sm">Period {pt.period}</span>
                                                    <span className="text-[11px] text-slate-400 font-semibold">• {to12h(activeStart)} – {to12h(activeEnd)}</span>
                                                </div>
                                                <div className="mt-0.5 truncate">
                                                    {cell.is_break ? (
                                                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 font-bold text-[9px] py-0 px-2">
                                                            Break
                                                        </Badge>
                                                    ) : (
                                                        <span className={cn("text-xs truncate block", (subjectName || staffName) ? "text-slate-600 font-medium" : "text-slate-400")}>
                                                            {summaryText}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 shrink-0">
                                                {isCustomPeriod(pt.period) && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemovePeriod(pt.period);
                                                        }}
                                                        className="text-red-400 hover:text-red-600 transition-colors p-1"
                                                        title="Remove period"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", isExpanded && "rotate-180")} />
                                            </div>
                                        </div>

                                        {/* Expanded Body Content */}
                                        {isExpanded && (
                                            <div className="p-3.5 pt-0 border-t border-slate-100 space-y-3 mt-1">
                                                {/* Time Adjust Row */}
                                                <div className="flex items-center justify-between gap-2 pt-2">
                                                    <span className="text-xs font-semibold text-slate-500">Period Timing</span>
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                                                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                        <span>{to12h(activeStart)} – {to12h(activeEnd)}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => startEditTime(pt, selectedDayTab)}
                                                            className="ml-1 text-slate-400 hover:text-slate-700 transition-colors"
                                                            title="Adjust period time"
                                                        >
                                                            <Pencil className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Time Editing Box */}
                                                {(isEditingCell || isEditingAll) && (
                                                    <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-primary/20 shadow-sm">
                                                        <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                                                            <span>Edit Time ({isEditingAll ? "All Days" : DAYS.find(d => d.id === selectedDayTab)?.name})</span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <Label className="text-[10px] text-slate-500 font-bold">Start Time</Label>
                                                                <Input
                                                                    type="time"
                                                                    value={editStart}
                                                                    onChange={e => setEditStart(e.target.value)}
                                                                    className="h-9 text-xs rounded-lg bg-white"
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label className="text-[10px] text-slate-500 font-bold">End Time</Label>
                                                                <Input
                                                                    type="time"
                                                                    value={editEnd}
                                                                    onChange={e => setEditEnd(e.target.value)}
                                                                    className="h-9 text-xs rounded-lg bg-white"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 pt-1 justify-end">
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                onClick={() => confirmEditTime(pt.period)}
                                                                className="h-8 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                                                            >
                                                                <Check className="w-3.5 h-3.5 mr-1" /> Save Time
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={cancelEditTime}
                                                                className="h-8 text-xs font-semibold rounded-lg"
                                                            >
                                                                <X className="w-3.5 h-3.5 mr-1" /> Cancel
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Break Toggle */}
                                                <div className="flex items-center justify-between py-1 border-t border-slate-100 pt-2">
                                                    <Label htmlFor={`mobile-break-${selectedDayTab}-${pt.period}`} className="text-xs font-semibold text-slate-700 cursor-pointer">
                                                        Set row as Break
                                                    </Label>
                                                    <Switch
                                                        id={`mobile-break-${selectedDayTab}-${pt.period}`}
                                                        checked={cell.is_break}
                                                        onCheckedChange={(c) => markRowAsBreak(pt.period, c)}
                                                    />
                                                </div>

                                                {/* Dropdowns or Break Badge */}
                                                {cell.is_break ? (
                                                    <div className="w-full py-3 flex items-center justify-center bg-orange-50/50 rounded-xl border border-orange-100">
                                                        <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200 font-bold text-xs py-0.5 px-2.5">
                                                            LUNCH / BREAK
                                                        </Badge>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2.5 pt-1">
                                                        <Select
                                                            value={cell.subject_id}
                                                            onValueChange={(val) => handleCellChange(selectedDayTab, pt.period, "subject_id", val)}
                                                        >
                                                            <SelectTrigger className="w-full h-11 text-xs font-semibold rounded-xl bg-white border-slate-200 shadow-sm">
                                                                <SelectValue placeholder="Select Subject..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {subjects.map(s => (
                                                                    <SelectItem key={s.subject_id} value={s.subject_id.toString()} className="text-xs">
                                                                        {s.subject_name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>

                                                        <Select
                                                            value={cell.staff_id}
                                                            onValueChange={(val) => handleCellChange(selectedDayTab, pt.period, "staff_id", val)}
                                                        >
                                                            <SelectTrigger className="w-full h-11 text-xs font-semibold rounded-xl bg-white border-slate-200 shadow-sm">
                                                                <SelectValue placeholder="Select Teacher..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {staffList.map(s => (
                                                                    <SelectItem key={s.staff_id} value={s.staff_id.toString()} className="text-xs">
                                                                        {s.staff_first_name} {s.staff_last_name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Add Period Button */}
                            <div className="pt-2 pb-4">
                                {showAddPeriod ? (
                                    <div className="space-y-2.5 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                            <Clock className="w-4 h-4 text-primary" /> New Period / Extra Lecture
                                        </span>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <Label className="text-[10px] text-slate-500 font-bold">Start Time</Label>
                                                <Input
                                                    type="time"
                                                    value={newPeriodStart}
                                                    onChange={e => setNewPeriodStart(e.target.value)}
                                                    className="h-10 text-xs rounded-xl bg-white"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-[10px] text-slate-500 font-bold">End Time</Label>
                                                <Input
                                                    type="time"
                                                    value={newPeriodEnd}
                                                    onChange={e => setNewPeriodEnd(e.target.value)}
                                                    className="h-10 text-xs rounded-xl bg-white"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 pt-1">
                                            <Button size="sm" onClick={handleAddPeriod} className="flex-1 h-10 font-bold rounded-xl text-xs">
                                                Add Period
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => setShowAddPeriod(false)} className="h-10 text-xs font-semibold rounded-xl">
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        variant="outline"
                                        className="w-full h-11 text-xs font-bold rounded-xl border-dashed border-slate-300 shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
                                        onClick={() => setShowAddPeriod(true)}
                                    >
                                        <PlusCircle className="w-4 h-4 mr-2 text-slate-600" /> Add Period / Extra Lecture
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            ) : (
                <CardContent className="py-12 px-4 flex flex-col items-center justify-center text-center select-none">
                    <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100 shadow-sm">
                        <CalendarDays className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">No class selected</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                        Please select a class from the dropdown above to create or edit its weekly schedule.
                    </p>
                </CardContent>
            )}
        </Card>
    );
}
