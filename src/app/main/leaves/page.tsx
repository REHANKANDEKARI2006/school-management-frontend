"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "@/lib/axios";
import {
  Calendar, Clock, CheckCircle2, XCircle, AlertCircle, Plus,
  FileCheck, RefreshCw, Upload, Eye, X, ArrowRight, Briefcase,
  Shield, Loader2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
import { ROLE, ADMIN_GROUP } from "@/config/roles";

// ─── Role helpers ─────────────────────────────────────────────────────────────
const ADMIN_ROLE_IDS: number[] = ADMIN_GROUP as unknown as number[];

function isAdminRole(roleId: number | null): boolean {
  if (!roleId) return false;
  return ADMIN_ROLE_IDS.includes(roleId);
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function fmtDate(d: string | Date) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}
function fmtTime(t: string) {
  return t ? t.slice(0, 5) : "";
}
function calcDays(from: string, to: string): number {
  if (!from || !to) return 0;
  const start = new Date(from);
  const end   = new Date(to);
  if (end < start) return 0;
  let count = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (d.getDay() !== 0) count++; // skip Sundays
  }
  return count;
}

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  pending:   { label: "Pending",   class: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  approved:  { label: "Approved",  class: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  rejected:  { label: "Rejected",  class: "bg-rose-500/15 text-rose-600 border-rose-500/30" },
  cancelled: { label: "Cancelled", class: "bg-slate-400/15 text-slate-500 border-slate-400/30" },
};

const DUTY_STATUS: Record<string, { label: string; class: string }> = {
  pending_acceptance: { label: "Awaiting Response", class: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  accepted:           { label: "Accepted",          class: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  declined:           { label: "Declined",          class: "bg-rose-500/15 text-rose-600 border-rose-500/30" },
};

const BALANCE_COLORS = [
  "from-blue-500 to-blue-600",
  "from-emerald-500 to-emerald-600",
  "from-violet-500 to-violet-600",
  "from-rose-500 to-rose-600",
  "from-amber-500 to-amber-600",
  "from-slate-500 to-slate-600",
];

// ─── Main Component ────────────────────────────────────────────────────────────
export default function TeacherLeavePage() {
  const router = useRouter();

  // Identity — resolved from localStorage + API profile
  const [staffId,   setStaffId]   = useState<string | null>(null);
  const [roleId,    setRoleId]    = useState<number | null>(null);
  const [resolving, setResolving] = useState(true); // true while we figure out who is logged in

  // Data
  const [balances,     setBalances]     = useState<any[]>([]);
  const [duties,       setDuties]       = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [leaveTypes,   setLeaveTypes]   = useState<any[]>([]);

  // UI state
  const [loading,       setLoading]       = useState(true);
  const [applyOpen,     setApplyOpen]     = useState(false);
  const [viewOpen,      setViewOpen]      = useState(false);
  const [cancelOpen,    setCancelOpen]    = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [toast,         setToast]         = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [submitting,    setSubmitting]    = useState(false);
  const [respondingId,  setRespondingId]  = useState<number | null>(null);

  // Apply form
  const [form, setForm] = useState({
    leave_type_id: "",
    from_date: "",
    to_date: "",
    reason: "",
    document_url: "",
    is_half_day: false,
  });

  const showToast = useCallback((msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  }, []);

  // ── Step 1: Resolve identity (role_id + staff_id) ─────────────────────────
  useEffect(() => {
    const resolveIdentity = async () => {
      setResolving(true);
      try {
        const storedRoleId = Number(localStorage.getItem("role_id") || "0");
        let   resolvedStaffId = localStorage.getItem("staff_id");

        // If admin, redirect immediately to admin approvals page
        if (isAdminRole(storedRoleId)) {
          router.replace("/main/leaves/approvals");
          return;
        }

        // For teacher/staff: if staff_id not in localStorage, fetch from profile API
        if (!resolvedStaffId) {
          try {
            const profileRes = await axios.get("/api/auth/profile");
            if (profileRes.data?.data?.staff_id) {
              resolvedStaffId = String(profileRes.data.data.staff_id);
              localStorage.setItem("staff_id", resolvedStaffId);
            }
          } catch {
            // Profile fetch failed — proceed with null, will show error state
          }
        }

        setRoleId(storedRoleId);
        setStaffId(resolvedStaffId);
      } finally {
        setResolving(false);
      }
    };
    resolveIdentity();
  }, [router]);

  // ── Step 2: Fetch all data once staff_id is known ─────────────────────────
  const fetchAll = useCallback(async () => {
    if (!staffId) return;
    try {
      const [balRes, dutyRes, appRes, typeRes] = await Promise.all([
        axios.get(`/api/leaves/balance/${staffId}`),
        axios.get(`/api/leaves/my-duties?staff_id=${staffId}`),
        axios.get(`/api/leaves/my-applications?teacher_id=${staffId}`),
        axios.get("/api/leaves/types"),
      ]);
      setBalances(balRes.data?.data    || []);
      setDuties(dutyRes.data?.data     || []);
      setApplications(appRes.data?.data || []);
      setLeaveTypes(typeRes.data?.data  || []);
    } catch (err) {
      console.error("Failed to fetch leave data:", err);
      showToast("Could not load leave data. Please refresh.", "err");
    } finally {
      setLoading(false);
    }
  }, [staffId, showToast]);

  useEffect(() => {
    if (!staffId || resolving) return;
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [staffId, resolving, fetchAll]);

  // ── Computed ──────────────────────────────────────────────────────────────
  const totalDays = form.is_half_day
    ? 0.5
    : calcDays(form.from_date, form.to_date);

  const selectedTypeBal = balances.find(b => String(b.leave_type_id) === form.leave_type_id);

  // ── Apply for Leave ────────────────────────────────────────────────────────
  const handleApply = async () => {
    if (!staffId || !form.leave_type_id || !form.from_date || !form.reason.trim()) {
      showToast("Please fill all required fields.", "err"); return;
    }
    if (!form.is_half_day && !form.to_date) {
      showToast("Please select a To Date.", "err"); return;
    }
    setSubmitting(true);
    try {
      await axios.post("/api/leaves/apply", {
        teacher_id:    parseInt(staffId),
        leave_type_id: parseInt(form.leave_type_id),
        from_date:     form.from_date,
        to_date:       form.is_half_day ? form.from_date : form.to_date,
        total_days:    totalDays,
        reason:        form.reason,
        document_url:  form.document_url || null,
        academic_year: "2025-2026",
      });
      showToast("Leave application submitted successfully. Status: Pending.", "ok");
      setApplyOpen(false);
      setForm({ leave_type_id: "", from_date: "", to_date: "", reason: "", document_url: "", is_half_day: false });
      fetchAll();
    } catch (err: any) {
      showToast(err?.response?.data?.error || "Failed to submit application.", "err");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Cancel Leave ──────────────────────────────────────────────────────────
  const handleCancel = async () => {
    if (!selectedLeave || !staffId) return;
    setSubmitting(true);
    try {
      await axios.patch(`/api/leaves/cancel/${selectedLeave.id}?teacher_id=${staffId}`);
      showToast("Leave request cancelled.", "ok");
      setCancelOpen(false);
      setSelectedLeave(null);
      fetchAll();
    } catch (err: any) {
      showToast(err?.response?.data?.error || "Could not cancel request.", "err");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Substitute Respond ────────────────────────────────────────────────────
  const handleDutyRespond = async (duty: any, action: "accept" | "decline") => {
    setRespondingId(duty.id);
    try {
      await axios.patch("/api/leaves/duties/respond", {
        leave_application_id: duty.leave_application_id,
        substitute_staff_id:  parseInt(staffId!),
        action,
        assignment_id: duty.id,
      });
      showToast(action === "accept" ? "Duty accepted!" : "Duty declined.", "ok");
      fetchAll();
    } catch (err: any) {
      showToast(err?.response?.data?.error || "Action failed.", "err");
    } finally {
      setRespondingId(null);
    }
  };

  // ── Loading / redirecting state ───────────────────────────────────────────
  if (resolving) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading your profile…</span>
        </div>
      </div>
    );
  }

  if (!staffId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-12 h-12 text-amber-500" />
        <div className="text-center">
          <p className="font-semibold text-lg">No staff record found for your account</p>
          <p className="text-sm text-muted-foreground mt-1">
            Please ensure your user account is linked to a staff profile.
            Contact your administrator if this is unexpected.
          </p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-10">

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium flex items-center gap-3 transition-all
          ${toast.type === "ok" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`}>
          {toast.type === "ok" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Leave Management
          </h1>
          <p className="text-muted-foreground mt-1">Manage your leaves, substitute duties, and leave balance.</p>
        </div>
        <Button
          onClick={() => setApplyOpen(true)}
          className="gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white shadow-lg"
        >
          <Plus className="w-4 h-4" /> Apply for Leave
        </Button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1 — Leave Balance Cards
      ═══════════════════════════════════════════════════════════════ */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-blue-500" /> Leave Balance
        </h2>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-36 rounded-2xl animate-pulse bg-secondary/40" />
            ))}
          </div>
        ) : balances.length === 0 ? (
          <Card className="border-none bg-secondary/20 py-10 text-center">
            <p className="text-muted-foreground text-sm">
              No leave balance found. Contact admin to initialize your balance.
            </p>
            <Button
              size="sm" variant="outline" className="mt-3 gap-2"
              onClick={fetchAll}
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {balances.map((b, i) => {
              const pct   = b.total_days > 0 ? Math.round((b.remaining_days / b.total_days) * 100) : 0;
              const color = BALANCE_COLORS[i % BALANCE_COLORS.length];
              return (
                <Card key={b.id} className="border-none bg-background/60 shadow-sm hover:shadow-md transition-all overflow-hidden relative">
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${color}`} />
                  <CardContent className="p-4 space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">{b.leave_type_name}</p>
                    <div className="space-y-1">
                      <div className="flex items-end justify-between">
                        <span className={`text-2xl font-extrabold bg-gradient-to-br ${color} bg-clip-text text-transparent`}>
                          {b.remaining_days ?? 0}
                        </span>
                        <span className="text-xs text-muted-foreground">/ {b.total_days}</span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">{b.used_days ?? 0} used</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2 — My Substitute Duties
      ═══════════════════════════════════════════════════════════════ */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-violet-500" /> My Substitute Duties
          {duties.filter(d => d.status === "pending_acceptance").length > 0 && (
            <Badge className="bg-amber-500/15 text-amber-600 border border-amber-300/50 ml-1">
              {duties.filter(d => d.status === "pending_acceptance").length} pending
            </Badge>
          )}
        </h2>

        {loading ? (
          <div className="h-32 rounded-2xl animate-pulse bg-secondary/30" />
        ) : duties.length === 0 ? (
          <Card className="border-none bg-secondary/10 py-10 text-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="w-8 h-8 opacity-40" />
              <p className="text-sm">No upcoming substitute duties assigned.</p>
            </div>
          </Card>
        ) : (
          <Card className="border-none bg-background/60 shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-secondary/20">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Covering For</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {duties.map((duty) => {
                  const cfg = DUTY_STATUS[duty.status] ?? DUTY_STATUS.pending_acceptance;
                  const isResponding = respondingId === duty.id;
                  return (
                    <TableRow key={duty.id} className="hover:bg-secondary/10 transition-colors">
                      <TableCell className="font-medium text-sm">{fmtDate(duty.assignment_date)}</TableCell>
                      <TableCell><Badge variant="outline">P{duty.period_number}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {fmtTime(duty.period_start_time)} – {fmtTime(duty.period_end_time)}
                      </TableCell>
                      <TableCell className="text-sm">{duty.class_name || `Class ${duty.class_id}`}</TableCell>
                      <TableCell className="text-sm">{duty.subject || "—"}</TableCell>
                      <TableCell className="text-sm font-medium">
                        {duty.original_first_name} {duty.original_last_name}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${cfg.class} border text-xs`}>{cfg.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {duty.status === "pending_acceptance" && (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              className="h-7 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                              onClick={() => handleDutyRespond(duty, "accept")}
                              disabled={isResponding}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              {isResponding ? "…" : "Accept"}
                            </Button>
                            <Button
                              size="sm" variant="outline"
                              className="h-7 gap-1 border-rose-300 text-rose-600 hover:bg-rose-50 text-xs"
                              onClick={() => handleDutyRespond(duty, "decline")}
                              disabled={isResponding}
                            >
                              <X className="w-3 h-3" /> Decline
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 3 — My Leave Applications
      ═══════════════════════════════════════════════════════════════ */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-emerald-500" /> My Leave Applications
        </h2>

        {loading ? (
          <div className="h-40 rounded-2xl animate-pulse bg-secondary/30" />
        ) : applications.length === 0 ? (
          <Card className="border-none bg-secondary/10 py-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-secondary/50 flex items-center justify-center">
                <Calendar className="w-7 h-7 text-muted-foreground/60" />
              </div>
              <div>
                <p className="font-medium">No Leave Applications Yet</p>
                <p className="text-sm text-muted-foreground mt-1">Your submitted applications will appear here.</p>
              </div>
              <Button onClick={() => setApplyOpen(true)} variant="outline" size="sm" className="gap-2 mt-2">
                <Plus className="w-4 h-4" /> Apply for Leave
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="border-none bg-background/60 shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-secondary/20">
                <TableRow>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Applied On</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => {
                  const cfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending;
                  return (
                    <TableRow key={app.id} className="hover:bg-secondary/10 transition-colors">
                      <TableCell className="font-medium">{app.leave_type_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {fmtDate(app.from_date)}
                        <ArrowRight className="inline w-3 h-3 mx-1.5" />
                        {fmtDate(app.to_date)}
                      </TableCell>
                      <TableCell><Badge variant="outline">{app.total_days}d</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{fmtDate(app.applied_at)}</TableCell>
                      <TableCell>
                        <Badge className={`${cfg.class} border text-xs`}>{cfg.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost" size="sm" className="h-7 gap-1 text-xs"
                            onClick={() => { setSelectedLeave(app); setViewOpen(true); }}
                          >
                            <Eye className="w-3 h-3" /> View
                          </Button>
                          {app.status === "pending" && (
                            <Button
                              variant="ghost" size="sm"
                              className="h-7 gap-1 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                              onClick={() => { setSelectedLeave(app); setCancelOpen(true); }}
                            >
                              <X className="w-3 h-3" /> Cancel
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          MODAL — Apply for Leave
      ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
            <DialogDescription>Your request will be sent to admin for approval.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Leave Type */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Leave Type <span className="text-rose-500">*</span></label>
              <Select value={form.leave_type_id} onValueChange={v => setForm(p => ({ ...p, leave_type_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type..." />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((lt) => {
                    const bal = balances.find(b => b.leave_type_id === lt.id);
                    return (
                      <SelectItem key={lt.id} value={String(lt.id)}>
                        {lt.name}
                        {bal ? ` — ${bal.remaining_days} days remaining` : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Half Day */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
              <input
                type="checkbox"
                id="half_day"
                checked={form.is_half_day}
                onChange={e => setForm(p => ({ ...p, is_half_day: e.target.checked }))}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
              <label htmlFor="half_day" className="text-sm font-medium cursor-pointer select-none">
                Half Day <span className="text-muted-foreground font-normal">(0.5 days deducted)</span>
              </label>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  {form.is_half_day ? "Date" : "From Date"} <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="date"
                  value={form.from_date}
                  onChange={e => setForm(p => ({ ...p, from_date: e.target.value }))}
                />
              </div>
              {!form.is_half_day && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">To Date <span className="text-rose-500">*</span></label>
                  <Input
                    type="date"
                    value={form.to_date}
                    min={form.from_date}
                    onChange={e => setForm(p => ({ ...p, to_date: e.target.value }))}
                  />
                </div>
              )}
            </div>

            {/* Total Days (computed, read-only) */}
            {(form.from_date || form.is_half_day) && (
              <div className="flex items-center gap-2 px-3 h-10 rounded-md bg-secondary/30 border border-input text-sm">
                <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="font-semibold text-blue-600">{form.is_half_day ? "0.5" : (totalDays || "—")} day(s) will be deducted</span>
                {selectedTypeBal && totalDays > 0 && totalDays > parseFloat(selectedTypeBal.remaining_days) && (
                  <span className="ml-auto text-xs text-rose-500 font-medium">⚠ Exceeds balance</span>
                )}
              </div>
            )}

            {/* Reason */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Reason <span className="text-rose-500">*</span></label>
              <Textarea
                placeholder="Describe the reason for leave..."
                value={form.reason}
                onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Document URL */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                Document URL <span className="text-xs">(optional)</span>
              </label>
              <div className="relative">
                <Upload className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="https://drive.google.com/..."
                  value={form.document_url}
                  onChange={e => setForm(p => ({ ...p, document_url: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setApplyOpen(false)}>Cancel</Button>
            <Button
              onClick={handleApply}
              disabled={submitting}
              className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white"
            >
              {submitting && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}
              Submit Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════
          MODAL — View Details
      ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Leave Application Details</DialogTitle>
          </DialogHeader>
          {selectedLeave && (
            <div className="space-y-1 py-2">
              {([
                ["Leave Type",  selectedLeave.leave_type_name],
                ["From Date",   fmtDate(selectedLeave.from_date)],
                ["To Date",     fmtDate(selectedLeave.to_date)],
                ["Total Days",  `${selectedLeave.total_days} day(s)`],
                ["Reason",      selectedLeave.reason || "—"],
                ["Applied On",  fmtDate(selectedLeave.applied_at)],
              ] as [string, string][]).map(([label, val]) => (
                <div key={label} className="flex justify-between items-start py-2 border-b border-border/50 last:border-0">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-sm font-semibold text-right max-w-[60%]">{val}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge className={`${STATUS_CONFIG[selectedLeave.status]?.class} border text-xs`}>
                  {STATUS_CONFIG[selectedLeave.status]?.label}
                </Badge>
              </div>
              {selectedLeave.actioned_at && (
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Actioned By</span>
                  <span className="text-sm font-semibold">
                    {selectedLeave.approver_first_name
                      ? `${selectedLeave.approver_first_name} ${selectedLeave.approver_last_name}`
                      : "Admin"}
                    {selectedLeave.approver_role ? ` (${selectedLeave.approver_role})` : ""}
                  </span>
                </div>
              )}
              {selectedLeave.admin_remarks && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-sm text-amber-700 mt-2">
                  <strong>Admin Remarks:</strong> {selectedLeave.admin_remarks}
                </div>
              )}
              {selectedLeave.document_url && (
                <a href={selectedLeave.document_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline mt-2">
                  <Upload className="w-4 h-4" /> View Attached Document
                </a>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════
          MODAL — Confirm Cancel
      ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel Leave Request?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your{" "}
              <strong>{selectedLeave?.leave_type_name}</strong> from{" "}
              {fmtDate(selectedLeave?.from_date)} to {fmtDate(selectedLeave?.to_date)}?
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelOpen(false)}>Keep It</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={submitting}>
              {submitting && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
