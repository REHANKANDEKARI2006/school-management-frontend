"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Users, 
  Clock, 
  Calendar, 
  BookOpen,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import axios from "@/lib/axios";

export default function SubstituteDutiesPage() {
  const [duties, setDuties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(true);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [respondingId, setRespondingId] = useState<number | null>(null);

  const showToast = useCallback((msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  }, []);

  // ── Step 1: Resolve identity (staff_id) ─────────────────────────
  useEffect(() => {
    const resolveIdentity = async () => {
      setResolving(true);
      try {
        let resolvedStaffId = localStorage.getItem("staff_id");
        if (!resolvedStaffId) {
          try {
            const profileRes = await axios.get("/api/auth/profile");
            if (profileRes.data?.data?.staff_id) {
              resolvedStaffId = String(profileRes.data.data.staff_id);
              localStorage.setItem("staff_id", resolvedStaffId);
            }
          } catch (err) {
            console.error("Profile fetch failed:", err);
          }
        }
        setStaffId(resolvedStaffId);
      } finally {
        setResolving(false);
      }
    };
    resolveIdentity();
  }, []);

  // ── Step 2: Fetch and normalize duties ──────────────────────────
  const fetchDuties = useCallback(async () => {
    if (!staffId) return;
    try {
      const res = await axios.get(`/api/leaves/my-duties?staff_id=${staffId}`);
      const data = res.data?.data || [];
      const normalized = data.map((d: any) => ({
        id: d.id,
        sub_id: d.id,
        original_first_name: d.original_first_name,
        original_last_name: d.original_last_name,
        sub_date: d.assignment_date ? d.assignment_date.slice(0, 10) : d.sub_date,
        period_number: d.period_number,
        start_time: d.period_start_time ? d.period_start_time.slice(0, 5) : d.start_time,
        class_name: d.class_name || `Class ${d.class_id}`,
        subject_name: d.subject || d.subject_name || 'Subject',
        status: d.status === 'accepted' ? 2 : (d.status === 'declined' ? 3 : 1),
        leave_application_id: d.leave_application_id
      }));
      setDuties(normalized);
    } catch (err) {
      console.error(err);
      showToast("Could not load substitute duties.", "err");
    } finally {
      setLoading(false);
    }
  }, [staffId, showToast]);

  // ── Step 3: SSE stream subscription ─────────────────────────────
  useEffect(() => {
    if (!staffId || resolving) return;
    fetchDuties();

    const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || `http://${hostname}:5000`;
    let eventSource: EventSource | null = null;

    function connectSSE() {
      try {
        eventSource = new EventSource(`${baseUrl}/api/leaves/stream`, { withCredentials: true });
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "update") {
              fetchDuties();
            }
          } catch (e) {
            console.error("Error parsing SSE message:", e);
          }
        };
        eventSource.onerror = (err) => {
          console.warn("EventSource connection lost, browser is retrying automatically...");
        };
      } catch (err) {
        console.error("SSE connection error:", err);
        // Retry connection after 5 seconds
        setTimeout(connectSSE, 5000);
      }
    }

    connectSSE();

    // Fallback interval
    const iv = setInterval(fetchDuties, 30000);

    return () => {
      eventSource?.close();
      clearInterval(iv);
    };
  }, [staffId, resolving, fetchDuties]);

  // ── Step 4: Handle response submission ──────────────────────────
  const handleDutyRespond = async (duty: any, action: "accept" | "decline") => {
    if (!staffId) return;
    setRespondingId(duty.id);
    try {
      await axios.patch("/api/leaves/duties/respond", {
        leave_application_id: duty.leave_application_id,
        substitute_staff_id: parseInt(staffId),
        action,
        assignment_id: duty.id,
      });
      showToast(action === "accept" ? "Duty accepted successfully!" : "Duty declined successfully.", "ok");
      fetchDuties();
    } catch (err: any) {
      console.error(err);
      showToast(err?.response?.data?.error || "Failed to submit response.", "err");
    } finally {
      setRespondingId(null);
    }
  };

  if (resolving) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Resolving user identity…</span>
        </div>
      </div>
    );
  }

  if (!staffId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertTriangle className="w-12 h-12 text-amber-500" />
        <div className="text-center">
          <p className="font-semibold text-lg">No staff record found for your account</p>
          <p className="text-sm text-muted-foreground mt-1">
            Please make sure you are logged in with a teacher account linked to a staff record.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium flex items-center gap-3 transition-all
          ${toast.type === "ok" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`}>
          {toast.type === "ok" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Substitute Duties</h1>
          <Badge className="bg-primary/10 text-primary border-primary/20">{duties.filter(d => d.status === 1).length} Pending</Badge>
        </div>
        <p className="text-muted-foreground">Manage the classroom sessions assigned to you for absent colleagues.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="animate-pulse bg-secondary/10 h-[240px] border-none" />
          ))
        ) : duties.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <h3 className="text-lg font-medium">Clear Schedule!</h3>
            <p className="text-muted-foreground">No substitute duties assigned to you at the moment.</p>
          </div>
        ) : (
          duties.map((duty) => (
            <Card key={duty.sub_id} className="border-none bg-background/50 hover:bg-background/80 shadow-sm transition-all overflow-hidden group">
              <div className="h-1.5 w-full bg-primary/20 group-hover:bg-primary transition-colors" />
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Absent Teacher</p>
                    <h3 className="font-bold flex items-center gap-2">
                       {duty.original_first_name} {duty.original_last_name}
                    </h3>
                  </div>
                  <Badge variant="secondary" className="bg-secondary/50">Period {duty.period_number}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>{duty.start_time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-right justify-end">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>{duty.sub_date}</span>
                  </div>
                </div>

                <div className="p-3 bg-secondary/30 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    {duty.class_name}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    {duty.subject_name}
                  </div>
                </div>

                {duty.status === 1 ? (
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline-danger" 
                      className="flex-1 gap-2"
                      disabled={respondingId === duty.id}
                      onClick={() => handleDutyRespond(duty, "decline")}
                    >
                      <XCircle className="w-4 h-4" /> Decline
                    </Button>
                    <Button 
                      variant="success" 
                      className="flex-1 gap-2"
                      disabled={respondingId === duty.id}
                      onClick={() => handleDutyRespond(duty, "accept")}
                    >
                      <CheckCircle className="w-4 h-4" /> Accept
                    </Button>
                  </div>
                ) : (
                  <div className="pt-2">
                    <Badge variant={duty.status === 2 ? 'active' : 'rejected'}>
                      {duty.status === 2 ? 'Accepted' : 'Declined'}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-4">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold text-amber-700 uppercase tracking-tight">Substitution Protocol</p>
          <p className="text-muted-foreground leading-relaxed">
            Please accept or decline duties at least 2 hours before the session. If you decline, the system will automatically 
            re-assign the duty to the next best suggested candidate.
          </p>
        </div>
      </div>
    </div>
  );
}
