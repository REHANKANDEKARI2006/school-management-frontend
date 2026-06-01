"use client";

import * as React from "react";
import axios from "@/lib/axios";
import RouteGuard from "@/components/auth/RouteGuard";
import {
  MoreHorizontal,
  Pencil,
  Eye,
  UserPlus,
  Mail,
  RefreshCw,
  Clock,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { PageSkeleton } from "@/components/ui/skeletons";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSearch } from "@/components/campus-connect/search-provider";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  FacultyForm,
  type FacultyFormData,
} from "@/components/campus-connect/faculty-form";

import { FacultyDetails } from "@/components/campus-connect/faculty-details";
import { FacultySchedule } from "@/components/campus-connect/faculty-schedule";
import { ADMIN_GROUP, ROLE, RoleId } from "@/config/roles";

// ── Helpers ────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-rose-500",
  "bg-amber-500", "bg-cyan-500", "bg-fuchsia-500", "bg-teal-500",
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatExpiry(dateStr: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime()) || d.getFullYear() < 2000) return null;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  }).format(d);
}


// ── Component ──────────────────────────────────────────────────────────────

export default function FacultyPage() {
  const { searchQuery } = useSearch();

  const roleId =
    typeof window !== "undefined"
      ? Number(localStorage.getItem("role_id"))
      : null;

  const canManage = roleId
    ? ([ROLE.MASTER_ADMIN, ROLE.INSTITUTE_ADMIN] as RoleId[]).includes(roleId as RoleId)
    : false;

  // ── State ──────────────────────────────────────────────────────────────

  const [faculty, setFaculty] = React.useState<any[]>([]);
  const [inviteStatuses, setInviteStatuses] = React.useState<Record<string, any>>({});
  const [departments, setDepartments] = React.useState<any[]>([]);
  const [subjects, setSubjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [addLoading, setAddLoading] = React.useState(false);

  // Faculty form (add/edit)
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"add" | "edit">("add");
  const [selectedFaculty, setSelectedFaculty] = React.useState<any>(null);
  
  const [selectedStatus, setSelectedStatus] = React.useState<string>("all");

  // Details dialog
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [detailsFaculty, setDetailsFaculty] = React.useState<any>(null);

  // Schedule dialog
  const [scheduleOpen, setScheduleOpen] = React.useState(false);

  // Invite dialog — REMOVED (invitation is now automatic on Add Faculty)

  // ── Data fetching ──────────────────────────────────────────────────────

  const fetchFaculty = async () => {
    const res = await axios.get("/api/faculty");
    const mapped = res.data.data.map((f: any) => ({
      ...f,
      name: `${f.staff_first_name} ${f.staff_last_name}`,
      fallback:
        (f.staff_first_name?.[0] || "") + (f.staff_last_name?.[0] || ""),
      status: f.status_name || (f.user_status_id === 1 ? "Active" : "Inactive"),
      avatar: f.profile_url || "",
    }));
    setFaculty(mapped);
    setLoading(false);
  };

  const fetchInviteStatuses = async () => {
    try {
      // Fetch both TEACHER and OFFICE_STAFF pending users
      const [teacherRes, staffRes] = await Promise.all([
        axios.get("/api/auth/users?role_code=TEACHER"),
        axios.get("/api/auth/users?role_code=OFFICE_STAFF"),
      ]);
      const allUsers = [...(teacherRes.data.data || []), ...(staffRes.data.data || [])];
      const map: Record<string, any> = {};
      allUsers.forEach((u: any) => {
        map[u.email?.toLowerCase()] = u;
      });
      setInviteStatuses(map);
    } catch {
      // Non-critical — invitation status is optional overlay
    }
  };

  const fetchMeta = async () => {
    const [deptRes, subjRes] = await Promise.all([
      axios.get("/api/departments"),
      axios.get("/api/subjects"),
    ]);
    setDepartments(deptRes.data.data);
    setSubjects(subjRes.data.data);
  };

  React.useEffect(() => {
    fetchFaculty();
    fetchMeta();
    if (canManage) fetchInviteStatuses();
  }, []);

  // ── Faculty add/edit ───────────────────────────────────────────────────

  const handleAdd = async (data: FacultyFormData) => {
    const [first, ...rest] = data.name.split(" ");
    try {
      setAddLoading(true);
      const res = await axios.post("/api/faculty", {
        staff_first_name: first,
        staff_last_name: rest.join(" ") || "-",
        email: data.email,
        contact: data.contact || null,
        qualification: data.qualification || null,
        dept_id: Number(data.dept_id),
        subject_id: data.subject_id ? Number(data.subject_id) : null,
        bg_id: data.bg_id ? Number(data.bg_id) : null,
        gender_id: data.gender_id ? Number(data.gender_id) : null,
        joining_date: data.joining_date || null,
        role_id: 3,
        user_status_id: data.user_status_id ? Number(data.user_status_id) : null,
        profile_url: data.avatar || null,
      });

      // Show result-specific toast
      if (res.data.email_sent === true) {
        toast.success("Faculty added! Invitation email sent to " + data.email);
      } else if (res.data.email_sent === false) {
        toast.warning("Faculty added, but invitation email could not be delivered. Check email settings.");
      } else {
        toast.success("Faculty created successfully.");
      }

      setOpen(false);
      fetchFaculty();
      if (canManage) fetchInviteStatuses();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add faculty");
    } finally {
      setAddLoading(false);
    }
  };

  const handleEdit = async (data: FacultyFormData) => {
    const [first, ...rest] = data.name.split(" ");
    try {
      setAddLoading(true);
      await axios.patch(`/api/faculty/${selectedFaculty?.staff_id}`, {
        staff_first_name: first,
        staff_last_name: rest.join(" ") || "-",
        email: data.email,
        contact: data.contact || null,
        qualification: data.qualification || null,
        dept_id: Number(data.dept_id),
        subject_id: data.subject_id ? Number(data.subject_id) : null,
        bg_id: data.bg_id ? Number(data.bg_id) : null,
        gender_id: data.gender_id ? Number(data.gender_id) : null,
        joining_date: data.joining_date || null,
        user_status_id: data.user_status_id ? Number(data.user_status_id) : null,
        profile_url: data.avatar || null,
      });
      toast.success("Faculty details updated successfully");
      setOpen(false);
      fetchFaculty();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update faculty details");
    } finally {
      setAddLoading(false);
    }
  };



  const handleResend = async (email: string) => {
    try {
      await axios.post("/api/auth/resend-invitation", { email });
      toast.success("Invitation resent successfully");
      fetchInviteStatuses();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to resend invitation");
    }
  };

  const handleDeactivate = async (userId: number) => {
    if (!confirm("Are you sure you want to deactivate this faculty member?")) return;
    try {
      await axios.patch(`/api/auth/users/${userId}`, { is_active: false, status: 'deactivated' });
      toast.success("Faculty member deactivated successfully");
      fetchFaculty();
      if (canManage) fetchInviteStatuses();
    } catch {
      toast.error("Failed to deactivate faculty member");
    }
  };

  const handleReactivate = async (userId: number) => {
    if (!confirm("Are you sure you want to reactivate this faculty member?")) return;
    try {
      await axios.patch(`/api/auth/users/${userId}`, { is_active: true, status: 'active' });
      toast.success("Faculty member reactivated successfully");
      fetchFaculty();
      if (canManage) fetchInviteStatuses();
    } catch {
      toast.error("Failed to reactivate faculty member");
    }
  };

  const handleViewDetails = async (id: number) => {
    const res = await axios.get(`/api/faculty/${id}`);
    setDetailsFaculty(res.data.data);
    setDetailsOpen(true);
  };

  // ── Filtered + enriched faculty ────────────────────────────────────────

  const filtered = React.useMemo(() => {
    let result = faculty;
    if (selectedStatus !== "all") {
      result = result.filter((f) => {
        const inviteInfo = inviteStatuses[f.email?.toLowerCase()];
        const isDeactivated = inviteInfo?.status === "deactivated" || f.user_status_id === 2;
        if (selectedStatus === "Deactivated") return isDeactivated;
        return f.status === selectedStatus;
      });
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.email?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [faculty, searchQuery, selectedStatus, inviteStatuses]);

  const uniqueStatuses = React.useMemo(() => {
    const statuses = new Set<string>();
    faculty.forEach((f) => {
      const inviteInfo = inviteStatuses[f.email?.toLowerCase()];
      const isDeactivated = inviteInfo?.status === "deactivated" || f.user_status_id === 2;
      if (isDeactivated) {
        statuses.add("Deactivated");
      } else if (f.status) {
        statuses.add(f.status);
      }
    });
    return Array.from(statuses).sort();
  }, [faculty, inviteStatuses]);

  const statusVariant = (status: string) => {
    switch (status) {
      case "Active": return "default";
      case "Suspended":
      case "Rusticated":
      case "Terminated":
      case "Banned":
        return "destructive";
      case "Inactive":
      case "Alumni":
      case "Retired":
      case "Resigned":
        return "secondary";
      default: return "outline";
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <RouteGuard allowedRoles={ADMIN_GROUP}>
      <>
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6 border-b">
            <div className="space-y-1">
              <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight">Faculty</CardTitle>
              <CardDescription className="text-sm">Manage faculty members and their system access</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-[140px] h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {uniqueStatuses.map((st) => (
                    <SelectItem key={st} value={st}>
                      {st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {canManage && (
                <Button
                  size="sm"
                  loading={addLoading}
                  className="w-full sm:w-auto h-9 font-semibold"
                  onClick={() => {
                    setMode("add");
                    setSelectedFaculty(null);
                    setOpen(true);
                  }}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Faculty
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4 sm:pl-6 min-w-[200px]">Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Department</TableHead>
                    <TableHead className="hidden md:table-cell">Subject</TableHead>
                    {canManage && <TableHead className="hidden lg:table-cell">Account</TableHead>}
                    <TableHead className="text-right pr-4 sm:pr-6" />
                  </TableRow>
                </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={canManage ? 6 : 5} className="p-0">
                      <PageSkeleton rows={4} />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canManage ? 6 : 5} className="text-center py-12 text-muted-foreground">
                      No faculty members found
                    </TableCell>
                  </TableRow>
                ) : filtered.map((f) => {
                  const inviteInfo = inviteStatuses[f.email?.toLowerCase()];
                  const isPending = inviteInfo?.status === "pending";
                  const isExpired = isPending && inviteInfo?.invite_token_expiry && new Date(inviteInfo.invite_token_expiry) < new Date();
                  const isDeactivated = inviteInfo?.status === "deactivated" || f.user_status_id === 2;

                  return (
                    <TableRow key={f.staff_id}>
                      {/* Name + Avatar */}
                      <TableCell className="flex gap-3 items-center pl-4 sm:pl-6">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={f.avatar} className="object-cover" />
                          <AvatarFallback className={`${avatarColor(f.name)} text-white font-semibold text-sm`}>
                            {f.fallback}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{f.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {f.email ? (
                              <a href={`mailto:${f.email}`} className="hover:underline hover:text-blue-600 transition-colors">
                                {f.email}
                              </a>
                            ) : (
                              "No email"
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Staff status */}
                      <TableCell>
                        <Badge variant={isDeactivated ? "destructive" : statusVariant(f.status)}>
                          {isDeactivated ? "Deactivated" : f.status}
                        </Badge>
                      </TableCell>

                      <TableCell className="hidden md:table-cell">{f.dept_name || "—"}</TableCell>
                      <TableCell className="hidden md:table-cell">{f.subject_name || "—"}</TableCell>

                      {/* Account / Invitation status column */}
                      {canManage && (
                        <TableCell className="hidden lg:table-cell">
                          {isPending ? (
                            <div className="flex flex-col gap-1">
                              {isExpired ? (
                                <>
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-full px-2.5 py-0.5 w-fit">
                                    <ShieldAlert className="h-3 w-3" />
                                    Invitation Expired
                                  </span>
                                  {formatExpiry(inviteInfo.invite_token_expiry) && (
                                    <span className="text-[10px] text-muted-foreground pl-0.5">
                                      Expired on {formatExpiry(inviteInfo.invite_token_expiry)}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <>
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5 w-fit">
                                    <Clock className="h-3 w-3" />
                                    Invitation Pending
                                  </span>
                                  {formatExpiry(inviteInfo.invite_token_expiry) && (
                                    <span className="text-[10px] text-muted-foreground pl-0.5">
                                      Expires {formatExpiry(inviteInfo.invite_token_expiry)}
                                    </span>
                                  )}
                                </>
                              )}
                              <button
                                onClick={() => handleResend(f.email)}
                                className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-medium w-fit pl-0.5 hover:underline"
                              >
                                <RefreshCw className="h-3 w-3" />
                                Resend invite
                              </button>
                            </div>
                          ) : inviteInfo?.status === "deactivated" ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-full px-2.5 py-0.5">
                              <ShieldAlert className="h-3 w-3" />
                              Deactivated
                            </span>
                          ) : inviteInfo?.status === "active" ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
                              <CheckCircle2 className="h-3 w-3" />
                              Active
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      )}

                      {/* Actions */}
                      <TableCell className="text-right pr-4 sm:pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>

                            <DropdownMenuItem onClick={() => handleViewDetails(f.staff_id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>

                            {canManage && (
                              <>
                                <DropdownMenuItem
                                  onClick={async () => {
                                    const res = await axios.get(`/api/faculty/${f.staff_id}`);
                                    setSelectedFaculty(res.data.data);
                                    setMode("edit");
                                    setOpen(true);
                                  }}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>

                                {isPending && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleResend(f.email)}>
                                      <RefreshCw className="mr-2 h-4 w-4" />
                                      Resend Invitation
                                    </DropdownMenuItem>
                                  </>
                                )}

                                {f.user_id && (
                                  <>
                                    <DropdownMenuSeparator />
                                    {isDeactivated ? (
                                      <DropdownMenuItem 
                                        className="text-emerald-600 font-bold" 
                                        onClick={() => handleReactivate(f.user_id)}
                                      >
                                        Reactivate
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem 
                                        onClick={() => handleDeactivate(f.user_id)}
                                      >
                                        Deactivate
                                      </DropdownMenuItem>
                                    )}
                                  </>
                                )}

                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={async () => {
                                    if (!confirm("Are you sure you want to delete this faculty?")) return;
                                    await axios.delete(`/api/faculty/${f.staff_id}`);
                                    fetchFaculty();
                                  }}
                                >
                                  🗑️ Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

        {/* ── ADD / EDIT FACULTY ───────────────────────────────────────── */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>{mode === "add" ? "Add Faculty" : "Edit Faculty"}</DialogTitle>
            </DialogHeader>
            <FacultyForm
              mode={mode}
              initialData={selectedFaculty}
              departments={departments}
              subjects={subjects}
              onSubmit={mode === "add" ? handleAdd : handleEdit}
            />
          </DialogContent>
        </Dialog>

        {/* ── VIEW DETAILS ─────────────────────────────────────────────── */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="w-[95vw] sm:max-w-5xl max-h-[95vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900 border-b pb-4 mb-2">
                Faculty Details
              </DialogTitle>
            </DialogHeader>
            {detailsFaculty && <FacultyDetails faculty={detailsFaculty} />}
          </DialogContent>
        </Dialog>

        {/* ── SCHEDULE ─────────────────────────────────────────────────── */}
        <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
          <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>Weekly Schedule</DialogTitle>
              <DialogDescription>
                Class schedule for {selectedFaculty?.staff_first_name} {selectedFaculty?.staff_last_name}.
              </DialogDescription>
            </DialogHeader>
            {selectedFaculty && <FacultySchedule faculty={selectedFaculty} />}
          </DialogContent>
        </Dialog>
      </>
    </RouteGuard>
  );
}
