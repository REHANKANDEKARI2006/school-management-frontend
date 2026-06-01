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
import { Trash2, PlusCircle, Clock, Pencil, Check, X } from "lucide-react";
import axios from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";

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
    const [gridData, setGridData] = React.useState<Record<string, any>>({});
    const [isSaving, setIsSaving] = React.useState(false);

    // Dynamic periods — start with defaults, users can add/edit/remove
    const [periodTimes, setPeriodTimes] = React.useState<PeriodTime[]>(DEFAULT_PERIOD_TIMES);

    // Which period is currently being time-edited (by period number)
    const [editingTimePeriod, setEditingTimePeriod] = React.useState<number | null>(null);
    const [editStart, setEditStart] = React.useState("");
    const [editEnd, setEditEnd] = React.useState("");

    // New period form state
    const [showAddPeriod, setShowAddPeriod] = React.useState(false);
    const [newPeriodStart, setNewPeriodStart] = React.useState("16:00");
    const [newPeriodEnd, setNewPeriodEnd] = React.useState("16:45");

    React.useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const [clsRes, subRes, staffRes] = await Promise.all([
                    axios.get("/api/classes"),
                    axios.get("/api/subjects"),
                    axios.get("/api/faculty")
                ]);

                setClasses(clsRes.data.data || clsRes.data || []);
                setSubjects(subRes.data.data || subRes.data || []);

                const facultyData = staffRes.data.data || staffRes.data || [];
                setStaffList(Array.isArray(facultyData) ? facultyData : Object.values(facultyData).flat() || []);
            } catch (e) {
                toast({ title: "Failed to load specific data", variant: "destructive" });
            }
        };
        fetchMetadata();
    }, [toast]);

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
                    start: sample.start_time?.substring(0, 5) || "00:00",
                    end: sample.end_time?.substring(0, 5) || "00:00",
                };
                if (existingIdx >= 0) {
                    // Update times from DB (school may have customised them)
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
            };
        });

        setGridData(newGrid);
    }, [selectedClass, existingSchedules]);

    // ── Time editing helpers ──────────────────────────────────────────────────
    const startEditTime = (pt: PeriodTime) => {
        setEditingTimePeriod(pt.period);
        setEditStart(pt.start);
        setEditEnd(pt.end);
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
        setPeriodTimes(prev =>
            prev.map(p => p.period === periodNum ? { ...p, start: editStart, end: editEnd } : p)
        );
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
        <Card className="border shadow-none">
            <CardHeader className="bg-muted/30">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle className="text-xl">Weekly Schedule Builder</CardTitle>
                        <CardDescription>Select a class to design their timetable. Click the ✏️ icon on any period to adjust its time.</CardDescription>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Select value={selectedClass} onValueChange={setSelectedClass}>
                            <SelectTrigger className="w-full sm:w-[250px] bg-background">
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
                <CardContent className="p-0 overflow-x-auto">
                    <div className="min-w-[1000px] border-t">

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
                                            {isEditing ? (
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[10px] text-muted-foreground w-7">From</span>
                                                        <Input
                                                            type="time"
                                                            value={editStart}
                                                            onChange={e => setEditStart(e.target.value)}
                                                            className="h-6 text-[11px] px-1.5 py-0"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[10px] text-muted-foreground w-7">To</span>
                                                        <Input
                                                            type="time"
                                                            value={editEnd}
                                                            onChange={e => setEditEnd(e.target.value)}
                                                            className="h-6 text-[11px] px-1.5 py-0"
                                                        />
                                                    </div>
                                                    <div className="flex gap-1 pt-0.5">
                                                        <button
                                                            onClick={() => confirmEditTime(pt.period)}
                                                            className="flex items-center gap-0.5 text-[10px] text-emerald-600 hover:text-emerald-700 font-medium"
                                                        >
                                                            <Check className="w-3 h-3" /> Save
                                                        </button>
                                                        <span className="text-muted-foreground/40">·</span>
                                                        <button
                                                            onClick={cancelEditTime}
                                                            className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground"
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
                                                        onClick={() => startEditTime(pt)}
                                                        className="opacity-0 group-hover/time:opacity-100 transition-opacity ml-auto text-muted-foreground hover:text-foreground"
                                                        title="Adjust time"
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
                                            const isEmpty = !cell.is_break && !cell.subject_id && !cell.staff_id;

                                            return (
                                                <div key={key} className="flex-1 p-2 border-l relative group">
                                                    {cell.is_break ? (
                                                        <div className="w-full h-full min-h-[100px] flex items-center justify-center bg-orange-50/50 rounded-md border border-orange-200/50 relative">
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
                </CardContent>
            ) : (
                <CardContent className="h-40 flex items-center justify-center text-muted-foreground">
                    Please select a class from the dropdown above to create or edit its weekly schedule.
                </CardContent>
            )}
        </Card>
    );
}
