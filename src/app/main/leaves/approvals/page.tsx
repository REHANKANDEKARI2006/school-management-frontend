"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import axios from "@/lib/axios";
import {
  CheckCircle2, XCircle, Clock, UserMinus, FileCheck, AlertCircle,
  User, Eye, ChevronLeft, ChevronRight, RefreshCw, Search, Filter,
  X, Check, AlertTriangle, Calendar, ArrowRight, ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

// ─── Types & Utilities ────────────────────────────────────────────────────────

const fmtDate = (d: any) => formatDate(d);
const fmtDateLong = (d: any) => formatDate(d);
function fmtTime(t: string) { return t ? t.slice(0, 5) : ""; }

const TEACHER_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-rose-500",
  "bg-amber-500", "bg-cyan-500", "bg-pink-500", "bg-orange-500",
  "bg-teal-500", "bg-indigo-500",
];
function teacherColor(id: number) { return TEACHER_COLORS[id % TEACHER_COLORS.length]; }

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending:   { label: "Pending",   cls: "status-pending" },
  approved:  { label: "Approved",  cls: "status-approved" },
  rejected:  { label: "Rejected",  cls: "status-rejected" },
  cancelled: { label: "Cancelled", cls: "status-cancelled" },
};

const MATCH_BADGE: Record<string, string> = {
  "Same Subject":    "status-approved",
  "Same Department": "status-draft",
  "Available":       "status-inactive",
};

// ─── Stats Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <Card className="border-none bg-background/60 shadow-sm hover:shadow-md transition-all overflow-hidden relative">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className={`text-3xl font-extrabold mt-1 ${color}`}>{value ?? "—"}</p>
          </div>
          <div className={`p-3 rounded-xl bg-background shadow-sm ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Leave Calendar ────────────────────────────────────────────────────────────
function LeaveCalendar() {
  const today       = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<{ day: number; x: number; y: number; items: any[] } | null>(null);

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/leaves/calendar?year=${year}&month=${month}`)
      .then(r => setLeaves(r.data?.data || []))
      .catch(() => setLeaves([]))
      .finally(() => setLoading(false));
  }, [year, month]);

  const monthName   = new Date(year, month - 1).toLocaleString("default", { month: "long" });
  const firstDay    = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();

  // Build Mon-first calendar grid
  const cells: (number | null)[] = [];
  const offset = firstDay === 0 ? 6 : firstDay - 1; // Mon=0 offset
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function leavesOnDay(day: number) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return leaves.filter(l => {
      const from = l.from_date?.slice(0, 10);
      const to   = l.to_date?.slice(0, 10);
      return dateStr >= from && dateStr <= to;
    });
  }

  function prevMonth() { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); }
  function nextMonth() { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); }
  function goToday() { setYear(today.getFullYear()); setMonth(today.getMonth() + 1); }

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;

  return (
    <div className="space-y-5" onClick={() => setTooltip(null)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-slate-800">{monthName} {year}</h3>
          {!isCurrentMonth && (
            <button onClick={goToday}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-0.5 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors">
              Today
            </button>
          )}
        </div>
        <div className="flex gap-1.5">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-7 gap-1">
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
            <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
          ))}
          {Array(35).fill(0).map((_, i) => (
            <div key={i} className="h-[72px] rounded-lg animate-pulse bg-secondary/30" />
          ))}
        </div>
      ) : (
        <>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1">
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
              <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground py-1.5 tracking-wide">{d}</div>
            ))}

            {cells.map((day, i) => {
              if (!day) return <div key={`b-${i}`} className="h-[72px]" />;
              const dayLeaves = leavesOnDay(day);
              const isToday   = isCurrentMonth && day === today.getDate();
              const isSun     = new Date(year, month - 1, day).getDay() === 0;

              return (
                <div
                  key={day}
                  className={`h-[72px] rounded-xl p-1.5 border transition-all cursor-default relative
                    ${isToday
                      ? "border-blue-400/60 bg-blue-50/70 shadow-sm shadow-blue-100"
                      : dayLeaves.length > 0
                        ? "border-border/60 bg-background/80 hover:border-border hover:shadow-sm"
                        : "border-transparent hover:border-border/40 hover:bg-secondary/20"}
                    ${isSun ? "opacity-50" : ""}`}
                  onClick={e => {
                    if (dayLeaves.length === 0) return;
                    e.stopPropagation();
                    setTooltip(t => t?.day === day ? null : { day, x: 0, y: 0, items: dayLeaves });
                  }}
                >
                  {/* Day number */}
                  <div className={`text-[11px] font-bold mb-1 w-5 h-5 flex items-center justify-center rounded-full
                    ${isToday ? "bg-blue-600 text-white" : "text-muted-foreground"}`}>
                    {day}
                  </div>

                  {/* Avatar pills */}
                  <div className="flex flex-wrap gap-0.5">
                    {dayLeaves.slice(0, 3).map((l, li) => (
                      <div
                        key={li}
                        title={`${l.staff_first_name} ${l.staff_last_name} — ${l.leave_type_name}`}
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0
                          ${teacherColor(l.teacher_id)}`}
                      >
                        {l.staff_first_name?.[0]}{l.staff_last_name?.[0]}
                      </div>
                    ))}
                    {dayLeaves.length > 3 && (
                      <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                        +{dayLeaves.length - 3}
                      </div>
                    )}
                  </div>

                  {/* Inline tooltip */}
                  {tooltip?.day === day && (
                    <div
                      onClick={e => e.stopPropagation()}
                      className="absolute z-30 left-0 top-full mt-1 min-w-[200px] bg-popover border border-border shadow-xl rounded-xl p-3 space-y-2 text-xs"
                      style={{ maxWidth: "220px" }}
                    >
                      {tooltip.items.map((l, li) => (
                        <div key={li} className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0 ${teacherColor(l.teacher_id)}`}>
                            {l.staff_first_name?.[0]}{l.staff_last_name?.[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate text-foreground">{l.staff_first_name} {l.staff_last_name}</p>
                            <p className="text-muted-foreground truncate">{l.leave_type_name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Leave list */}
          {leaves.length > 0 ? (
            <div className="border-t border-border/40 pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Approved Leaves This Month</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {leaves.map(l => (
                  <div key={l.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30 border border-border/30 hover:bg-secondary/50 transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 ${teacherColor(l.teacher_id)}`}>
                      {l.staff_first_name?.[0]}{l.staff_last_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{l.staff_first_name} {l.staff_last_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{l.leave_type_name} · {l.total_days}d</p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground shrink-0">
                      <p>{fmtDate(l.from_date)}</p>
                      <p>{fmtDate(l.to_date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="border-t border-border/40 pt-4 flex items-center justify-center py-6 text-muted-foreground">
              <div className="text-center">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No approved leaves this month.</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Approval Modal ────────────────────────────────────────────────────────────
function ApprovalModal({
  open, onClose, application, onApproved
}: {
  open: boolean;
  onClose: () => void;
  application: any;
  onApproved: () => void;
}) {
  const [suggestions,    setSuggestions]    = useState<any[]>([]);
  const [selectedSubs,   setSelectedSubs]   = useState<Record<string, string>>({});
  const [remarks,        setRemarks]        = useState("");
  const [loadingSugg,    setLoadingSugg]    = useState(false);
  const [submitting,     setSubmitting]     = useState(false);
  const [toast,          setToast]          = useState<string | null>(null);
  // Manual teacher selection state: key → list of available teachers
  const [manualTeachers, setManualTeachers] = useState<Record<string, any[]>>({});
  const [loadingManual,  setLoadingManual]  = useState<Record<string, boolean>>({});

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // Check if leave dates have already passed
  const isExpired = application
    ? new Date(application.to_date) < new Date(new Date().toDateString())
    : false;

  useEffect(() => {
    if (!open || !application) return;
    setRemarks("");
    setSelectedSubs({});
    setSuggestions([]);
    setManualTeachers({});
    setLoadingManual({});
    setLoadingSugg(true);
    axios.get(`/api/leaves/suggestions/${application.id}`)
      .then(r => {
        const data: any[] = r.data?.data || [];
        setSuggestions(data);
        // Pre-select best suggestion for each slot
        const init: Record<string, string> = {};
        data.forEach(s => {
          const key = `${s.date}_${s.period_number}`;
          if (s.ranked_subs?.length > 0) init[key] = String(s.ranked_subs[0].staff_id);
        });
        setSelectedSubs(init);
      })
      .catch(() => showToast("Failed to load substitution suggestions."))
      .finally(() => setLoadingSugg(false));
  }, [open, application]);

  // Lazy-load available teachers for a specific no-suggestion slot
  const loadManualTeachers = async (s: any) => {
    const key = `${s.date}_${s.period_number}`;
    if (manualTeachers[key] || loadingManual[key]) return; // already loaded/loading
    setLoadingManual(p => ({ ...p, [key]: true }));
    try {
      const res = await axios.get(
        `/api/leaves/available-teachers?date=${s.date}&period_number=${s.period_number}&leave_application_id=${application.id}`
      );
      setManualTeachers(p => ({ ...p, [key]: res.data?.data || [] }));
    } catch {
      setManualTeachers(p => ({ ...p, [key]: [] }));
      showToast("Could not load available teachers.");
    } finally {
      setLoadingManual(p => ({ ...p, [key]: false }));
    }
  };

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      const assignments = suggestions.map(s => {
        const key = `${s.date}_${s.period_number}`;
        const subId = selectedSubs[key];
        return {
          substitute_teacher_id: subId ? parseInt(subId) : null,
          date:              s.date,
          period_number:     s.period_number,
          period_start_time: s.period_start_time,
          period_end_time:   s.period_end_time,
          class_id:          s.class_id,
          subject:           s.subject,
          room:              s.room,
        };
      }).filter(a => a.substitute_teacher_id !== null);

      await axios.post(`/api/leaves/approve/${application.id}`, { assignments, remarks });
      onApproved();
      onClose();
    } catch (err: any) {
      showToast(err?.response?.data?.error || "Approval failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!remarks.trim()) { showToast("Please add rejection remarks."); return; }
    setSubmitting(true);
    try {
      await axios.post(`/api/leaves/reject/${application.id}`, { remarks });
      onApproved();
      onClose();
    } catch (err: any) {
      showToast(err?.response?.data?.error || "Rejection failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!application) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-0">
        <DialogTitle className="sr-only">Leave Approval</DialogTitle>
        <DialogDescription className="sr-only">Review request and assign substitutes</DialogDescription>
        {toast && (
          <div className="fixed top-4 right-4 z-50 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm shadow-xl">{toast}</div>
        )}

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="sticky top-0 z-10 bg-background border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Leave Approval</h2>
            <p className="text-sm text-muted-foreground">Review request and assign substitutes</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>

        {/* ── Expiry Warning Banner ─────────────────────────────── */}
        {isExpired && (
          <div className="mx-6 mt-4 flex items-center gap-3 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
            <span>
              <strong>Leave dates have passed.</strong> This request covers{" "}
              {fmtDateLong(application.from_date)} to {fmtDateLong(application.to_date)},
              which is in the past. Approval is disabled.
            </span>
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* ── Two-column layout ────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* Left Panel — Request Details */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="border-none bg-secondary/20">
                <CardContent className="p-5 space-y-4">
                  {/* Teacher Avatar + Name */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {application.teacher_photo ? (
                        <img src={application.teacher_photo} alt="Photo"
                          className="w-14 h-14 rounded-full object-cover ring-2 ring-border" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xl font-bold">
                          {application.staff_first_name?.[0]}{application.staff_last_name?.[0]}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-base">{application.staff_first_name} {application.staff_last_name}</p>
                      <p className="text-xs text-muted-foreground">{application.dept_name || "Teacher"}</p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      ["Leave Type",  application.leave_type_name],
                      ["From",        fmtDateLong(application.from_date)],
                      ["To",          fmtDateLong(application.to_date)],
                      ["Total Days",  `${application.total_days} day(s)`],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-start justify-between text-sm">
                        <span className="text-muted-foreground font-medium">{k}</span>
                        <span className="font-semibold text-right max-w-[55%]">{v as string}</span>
                      </div>
                    ))}
                    {application.reason && (
                      <div className="pt-2 border-t border-border/40">
                        <p className="text-xs text-muted-foreground font-medium mb-1">Reason</p>
                        <p className="text-sm">{application.reason}</p>
                      </div>
                    )}
                    {application.document_url && (
                      <a href={application.document_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-600 hover:underline pt-1">
                        <ExternalLink className="w-3 h-3" /> View Document
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick tip */}
              {!isExpired && (
                <div className="rounded-xl bg-blue-500/8 border border-blue-500/20 p-3 text-xs text-blue-700 space-y-1">
                  <p className="font-semibold">💡 How to approve</p>
                  <p>Review the period-wise table on the right. The system has pre-selected the best available substitute for each period. You can change any selection using the dropdown. Then click <strong>Approve &amp; Notify</strong>.</p>
                </div>
              )}
            </div>

            {/* Right Panel — Period-wise Substitute Table */}
            <div className="lg:col-span-3 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Period-wise Substitute Assignment</h3>
                {loadingSugg && <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />}
              </div>

              {loadingSugg ? (
                <div className="space-y-2">
                  {Array(4).fill(0).map((_, i) => (
                    <div key={i} className="h-16 rounded-lg animate-pulse bg-secondary/30" />
                  ))}
                </div>
              ) : suggestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground rounded-xl border-2 border-dashed border-border">
                  <Calendar className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-sm">No class periods found for this teacher during the leave period.</p>
                  <p className="text-xs mt-1">The teacher may not have any scheduled classes.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {suggestions.map((s, idx) => {
                    const key      = `${s.date}_${s.period_number}`;
                    const selSubId = selectedSubs[key];
                    const selSub   = s.ranked_subs?.find((r: any) => String(r.staff_id) === selSubId)
                      ?? manualTeachers[key]?.find((t: any) => String(t.staff_id) === selSubId);

                    return (
                      <div key={idx} className={`rounded-xl border p-3.5 space-y-2.5 transition-all
                        ${s.has_suggestion ? "bg-background/70 border-border/60" : "bg-rose-500/5 border-rose-300/40"}`}>
                        {/* Row header */}
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-0.5">Date</p>
                            <p className="font-semibold">{fmtDate(s.date, { weekday: "short", day: "numeric", month: "short" })}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-0.5">Period &amp; Time</p>
                            <p className="font-semibold">P{s.period_number} · {fmtTime(s.period_start_time)}–{fmtTime(s.period_end_time)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-0.5">Class &amp; Subject</p>
                            <p className="font-semibold truncate">{s.class_name} · {s.subject}</p>
                          </div>
                        </div>

                        {/* Substitute dropdown */}
                        {s.has_suggestion ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <Select
                                value={selSubId || ""}
                                onValueChange={v => setSelectedSubs(p => ({ ...p, [key]: v }))}
                              >
                                <SelectTrigger className="h-9 text-xs bg-background">
                                  <SelectValue placeholder="Select substitute..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {s.ranked_subs.map((sub: any) => (
                                    <SelectItem key={sub.staff_id} value={String(sub.staff_id)} className="text-xs">
                                      <span className="font-medium">{sub.staff_first_name} {sub.staff_last_name}</span>
                                      <span className="text-muted-foreground ml-1">({sub.match_reason})</span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            {selSub && (
                              <Badge className={`text-[10px] border shrink-0 ${MATCH_BADGE[selSub.match_reason] || MATCH_BADGE["Available"]}`}>
                                {selSub.match_reason}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          /* No auto-suggestion: show warning + manual selection */
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-rose-600 text-xs font-medium bg-rose-500/10 border border-rose-300/40 rounded-lg px-3 py-2">
                              <AlertTriangle className="w-4 h-4 shrink-0" />
                              No available substitute found automatically.
                            </div>
                            {/* Manual teacher dropdown */}
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                {manualTeachers[key] === undefined ? (
                                  <Button
                                    variant="outline" size="sm"
                                    className="w-full h-9 text-xs gap-1.5 border-dashed"
                                    onClick={() => loadManualTeachers(s)}
                                    disabled={loadingManual[key]}
                                  >
                                    {loadingManual[key]
                                      ? <><RefreshCw className="w-3 h-3 animate-spin" /> Loading teachers…</>
                                      : <><User className="w-3 h-3" /> Select Teacher Manually</>}
                                  </Button>
                                ) : manualTeachers[key].length === 0 ? (
                                  <div className="h-9 flex items-center px-3 rounded-lg bg-secondary/40 text-xs text-muted-foreground">
                                    No free teachers found for this slot.
                                  </div>
                                ) : (
                                  <Select
                                    value={selSubId || ""}
                                    onValueChange={v => setSelectedSubs(p => ({ ...p, [key]: v }))}
                                  >
                                    <SelectTrigger className="h-9 text-xs bg-background border-dashed">
                                      <SelectValue placeholder="Choose available teacher..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {manualTeachers[key].map((t: any) => (
                                        <SelectItem key={t.staff_id} value={String(t.staff_id)} className="text-xs">
                                          <span className="font-medium">{t.staff_first_name} {t.staff_last_name}</span>
                                          {t.dept_name && <span className="text-muted-foreground ml-1">({t.dept_name})</span>}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>
                              {selSubId && manualTeachers[key]?.length > 0 && (
                                <Badge className="text-[10px] border shrink-0 bg-slate-400/15 text-slate-600 border-slate-300/40">
                                  Manual
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Admin Remarks + Action Buttons ─────────────────────── */}
          <div className="space-y-3 border-t border-border pt-5">
            <label className="text-sm font-medium">Admin Remarks</label>
            <Textarea
              placeholder="Add remarks (required for rejection, optional for approval)..."
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              rows={2}
              className="resize-none"
            />
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="destructive"
                className="gap-2 border border-rose-200"
                onClick={handleReject}
                disabled={submitting || isExpired}
              >
                <XCircle className="w-4 h-4" /> Reject
              </Button>
              <Button
                variant="success"
                className="gap-2 text-white shadow-lg"
                onClick={handleApprove}
                disabled={submitting || loadingSugg || isExpired}
                title={isExpired ? "Cannot approve: leave dates have already passed" : undefined}
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {isExpired ? "Approval Disabled (Expired)" : "Approve & Notify"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}





// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function AdminLeavePage() {
  const [stats,        setStats]        = useState<any>(null);
  const [pending,      setPending]      = useState<any[]>([]);
  const [allApps,      setAllApps]      = useState<any[]>([]);
  const [leaveTypes,   setLeaveTypes]   = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [modalApp,     setModalApp]     = useState<any>(null);
  const [filters,      setFilters]      = useState({ teacher_name: "", leave_type_id: "", status: "", from_date: "", to_date: "" });
  const [toast,        setToast]        = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const showToast = useCallback((msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      const [statsRes, pendingRes, allRes, typesRes] = await Promise.all([
        axios.get("/api/leaves/admin-stats"),
        axios.get("/api/leaves/pending"),
        axios.get("/api/leaves/all"),
        axios.get("/api/leaves/types"),
      ]);
      setStats(statsRes.data?.data);
      setPending(pendingRes.data?.data || []);
      setAllApps(allRes.data?.data    || []);
      setLeaveTypes(typesRes.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch admin leave data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const iv = setInterval(fetchAll, 30000);
    return () => clearInterval(iv);
  }, [fetchAll]);

  const fetchFiltered = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const res = await axios.get(`/api/leaves/all?${params.toString()}`);
      setAllApps(res.data?.data || []);
    } catch {
      showToast("Filter failed.", "err");
    }
  };

  const onApproved = () => {
    showToast("Action completed. Teacher and substitute notified.", "ok");
    fetchAll();
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-10">

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium flex items-center gap-3
          ${toast.type === "ok" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`}>
          {toast.type === "ok" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Leave Management — Admin
        </h1>
        <p className="text-muted-foreground mt-1">Review applications, assign substitutes, and monitor school coverage.</p>
      </div>

      {/* ══ SECTION 1 — Stats Cards ══════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Pending"       value={stats?.pending_count}  icon={Clock}     color="text-amber-600"   />
        <StatCard label="Approved This Month" value={stats?.approved_month} icon={FileCheck} color="text-emerald-600" />
        <StatCard label="Rejected This Month" value={stats?.rejected_month} icon={XCircle}   color="text-rose-600"    />
        <StatCard label="On Leave Today"      value={stats?.on_leave_today} icon={UserMinus}  color="text-blue-600"    />
      </div>

      {/* ══ SECTION 2 — Pending Approvals ════════════════════════════════════ */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-semibold">Pending Approvals</h2>
          {pending.length > 0 && (
            <Badge className="bg-amber-500/15 text-amber-600 border border-amber-300/50 ml-1">{pending.length}</Badge>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array(2).fill(0).map((_, i) => (<div key={i} className="h-24 rounded-xl animate-pulse bg-secondary/20" />))}
          </div>
        ) : pending.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 border-2 border-dashed border-secondary rounded-2xl text-muted-foreground">
            <CheckCircle2 className="w-10 h-10 mb-3 text-emerald-500/50" />
            <p className="font-medium">All caught up!</p>
            <p className="text-sm">No pending leave requests.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {pending.map(app => {
              const isAppExpired = new Date(app.to_date) < new Date(new Date().toDateString());
              return (
                <Card key={app.id} className={`border-none bg-background/60 shadow-sm hover:shadow-md transition-all border-l-4 overflow-hidden
                  ${isAppExpired ? "border-amber-400/50 opacity-80" : "border-amber-500"}`}>
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      {/* Teacher info */}
                      <div className="flex items-center gap-4">
                        {app.teacher_photo ? (
                          <img src={app.teacher_photo} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-border shrink-0" />
                        ) : (
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 ${teacherColor(app.teacher_id)}`}>
                            {app.staff_first_name?.[0]}{app.staff_last_name?.[0]}
                          </div>
                        )}
                        <div>
                          <p className="font-bold">{app.staff_first_name} {app.staff_last_name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5 font-medium">
                            <Badge variant="secondary" className="text-xs font-normal">{app.leave_type_name}</Badge>
                            <span>·</span>
                            <span>{app.total_days} day(s)</span>
                            {isAppExpired && (
                              <Badge className="bg-rose-500/10 text-rose-600 border border-rose-200/40 text-[10px] py-0 px-1.5 ml-1 font-semibold animate-pulse">
                                Expired
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="text-sm text-muted-foreground hidden md:block">
                        {fmtDate(app.from_date)}
                        <ArrowRight className="inline w-3 h-3 mx-1" />
                        {fmtDate(app.to_date)}
                      </div>

                      {/* Reason (truncated) */}
                      {app.reason && (
                        <p className="text-sm text-muted-foreground max-w-xs truncate hidden lg:block">
                          {app.reason.length > 80 ? app.reason.slice(0, 80) + "..." : app.reason}
                        </p>
                      )}

                      {/* Action */}
                      <Button
                        variant={isAppExpired ? "outline" : "default"}
                        className={isAppExpired 
                          ? "gap-2 border-slate-300 text-slate-500 hover:bg-slate-50 shrink-0"
                          : "gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white shrink-0"
                        }
                        onClick={() => setModalApp(app)}
                      >
                        <Eye className="w-4 h-4" />
                        {isAppExpired ? "View Details (Expired)" : "View & Approve"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ══ SECTION 3 — All Applications with Filters ════════════════════════ */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-blue-500" /> All Applications
        </h2>

        {/* Filter row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Teacher name..." value={filters.teacher_name}
              onChange={e => setFilters(p => ({ ...p, teacher_name: e.target.value }))} />
          </div>
          <Select value={filters.leave_type_id} onValueChange={v => setFilters(p => ({ ...p, leave_type_id: v === "all" ? "" : v }))}>
            <SelectTrigger><SelectValue placeholder="Leave type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {leaveTypes.map(lt => <SelectItem key={lt.id} value={String(lt.id)}>{lt.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.status} onValueChange={v => setFilters(p => ({ ...p, status: v === "all" ? "" : v }))}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={filters.from_date} onChange={e => setFilters(p => ({ ...p, from_date: e.target.value }))} />
          <div className="flex gap-2">
            <Input type="date" value={filters.to_date} onChange={e => setFilters(p => ({ ...p, to_date: e.target.value }))} />
            <Button onClick={fetchFiltered} size="icon" variant="outline"><Filter className="w-4 h-4" /></Button>
          </div>
        </div>

        <Card className="border-none bg-background/60 shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-secondary/20">
              <TableRow>
                <TableHead>Teacher</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={7} className="h-12 animate-pulse bg-secondary/10" /></TableRow>
                ))
              ) : allApps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">No applications found.</TableCell>
                </TableRow>
              ) : allApps.map(app => {
                const cfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending;
                const isAppExpired = app.status === "pending" && new Date(app.to_date) < new Date(new Date().toDateString());
                return (
                  <TableRow key={app.id} className="hover:bg-secondary/10 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${teacherColor(app.teacher_id)}`}>
                          {app.staff_first_name?.[0]}{app.staff_last_name?.[0]}
                        </div>
                        <span className="font-medium text-sm">{app.staff_first_name} {app.staff_last_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{app.leave_type_name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {fmtDate(app.from_date)} → {fmtDate(app.to_date)}
                    </TableCell>
                    <TableCell><Badge variant="outline">{app.total_days}d</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmtDate(app.applied_at)}</TableCell>
                    <TableCell>
                      {isAppExpired ? (
                        <div className="flex flex-col items-start gap-0.5">
                          <Badge className={`${cfg.cls} border text-xs`}>{cfg.label}</Badge>
                          <Badge className="bg-rose-500/10 text-rose-600 border border-rose-200/40 text-[9px] py-0 px-1 font-semibold scale-90 origin-left">
                            Expired
                          </Badge>
                        </div>
                      ) : (
                        <Badge className={`${cfg.cls} border text-xs`}>{cfg.label}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {app.status === "pending" && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className={`h-7 text-xs gap-1 ${isAppExpired ? "text-slate-400 border-slate-200 hover:bg-slate-50" : ""}`}
                          onClick={() => setModalApp(app)}
                        >
                          <Eye className="w-3 h-3" />
                          {isAppExpired ? "Review (Expired)" : "Review"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </section>

      {/* ══ SECTION 4 — Leave Calendar ══════════════════════════════════════ */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-violet-500" /> Leave Calendar
        </h2>
        <Card className="border-none bg-background/60 shadow-sm">
          <CardContent className="p-6">
            <LeaveCalendar />
          </CardContent>
        </Card>
      </section>

      {/* ══ Approval Modal ══════════════════════════════════════════════════ */}
      <ApprovalModal
        open={!!modalApp}
        onClose={() => setModalApp(null)}
        application={modalApp}
        onApproved={onApproved}
      />
    </div>
  );
}
