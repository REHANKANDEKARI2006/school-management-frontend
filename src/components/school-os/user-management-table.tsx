"use client";

import * as React from "react";
import axios from "@/lib/axios";
import {
  MoreHorizontal,
  UserPlus,
  Mail,
  Trash2,
  RefreshCw,
  Clock,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// ── Helpers ──────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-rose-500",
  "bg-amber-500", "bg-cyan-500", "bg-fuchsia-500", "bg-teal-500",
];

// ── Helpers ──────────────────────────────────────────────────────────────

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatExpiry(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  // Guard against the 1970-epoch bug (invalid / unset dates stored as 0 or null-ish)
  if (isNaN(d.getTime()) || d.getFullYear() < 2000) return null;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

const DESIGNATION_OPTIONS = [
  { label: "Institute Administrator", code: "INSTITUTE_ADMIN" },
  { label: "Principal", code: "PRINCIPAL" },
  { label: "Vice Principal", code: "VICE_PRINCIPAL" },
  { label: "Office Staff", code: "OFFICE_STAFF" },
  { label: "Cashier", code: "CASHIER" },
  { label: "Accountant", code: "ACCOUNTANT" },
  { label: "Admission Officer", code: "ADMISSION_OFFICER" },
  { label: "Management Committee Member", code: "MANAGEMENT_MEMBER" },
  { label: "HR Manager", code: "HR_MANAGER" },
  { label: "IT Support", code: "IT_SUPPORT" },
  { label: "Librarian", code: "LIBRARIAN" },
  { label: "Lab Assistant", code: "LAB_ASSISTANT" },
  { label: "Sports Manager", code: "SPORTS_MANAGER" },
  { label: "School Counsellor", code: "COUNSELLOR" },
  { label: "Library Assistant", code: "LIBRARY_ASSISTANT" },
];

// ── Props ─────────────────────────────────────────────────────────────────

interface UserTableProps {
  role_code: string;
  title: string;
  description: string;
}

// ── Component ─────────────────────────────────────────────────────────────

export function UserManagementTable({ role_code, title, description }: UserTableProps) {
  const [users, setUsers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "", email: "", phone: "", designation: "Institute Administrator",
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [resending, setResending] = React.useState<number | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/auth/users?role_code=${role_code}`);
      setUsers(res.data.data || []);
    } catch {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchUsers();
  }, [role_code]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic Email Syntax Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setSubmitting(true);
      
      // Determine actual role_code based on designation if it's an admin-type invite
      let activeRoleCode = role_code;
      if (role_code === "INSTITUTE_ADMIN") {
        // Force INSTITUTE_ADMIN for this specific table view
        activeRoleCode = "INSTITUTE_ADMIN";
      }

      const res = await axios.post("/api/auth/invite-user", { ...formData, role_code: activeRoleCode });
      if (res.data.email_sent === false) {
        toast.warning(res.data.message);
      } else {
        toast.success("Invitation sent successfully!");
      }
      setInviteOpen(false);
      setFormData({ name: "", email: "", phone: "", designation: "" });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send invitation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async (userId: number, email: string) => {
    try {
      setResending(userId);
      await axios.post("/api/auth/resend-invitation", { email });
      toast.success("Invitation resent successfully");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to resend invitation");
    } finally {
      setResending(null);
    }
  };

  const handleDeactivate = async (id: number) => {
    if (!confirm("Are you sure you want to deactivate this user?")) return;
    try {
      await axios.patch(`/api/auth/users/${id}`, { is_active: false, status: 'deactivated' });
      toast.success("User deactivated");
      fetchUsers();
    } catch {
      toast.error("Failed to deactivate user");
    }
  };

  const handleReactivate = async (id: number) => {
    if (!confirm("Are you sure you want to reactivate this user?")) return;
    try {
      await axios.patch(`/api/auth/users/${id}`, { is_active: true, status: 'active' });
      toast.success("User reactivated successfully");
      fetchUsers();
    } catch {
      toast.error("Failed to reactivate user");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("CRITICAL: Are you sure you want to PERMANENTLY DELETE this account? This action cannot be undone.")) return;
    try {
      await axios.delete(`/api/auth/users/${id}`);
      toast.success("Account permanently deleted");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete account");
    }
  };

  // ── Filtered Users ──────────────────────────────────────────────────────

  const filteredUsers = users.filter((user) => {
    if (statusFilter === "ALL") return true;

    const expiryStr = formatExpiry(user.invite_token_expiry);
    const isPending = user.status === "pending";
    const isActive = user.status === "active";
    const isExpired = isPending && user.invite_token_expiry && new Date(user.invite_token_expiry) < new Date();
    const isDeactivated = user.status === "deactivated";

    if (statusFilter === "ACTIVE") return isActive;
    if (statusFilter === "PENDING") return isPending && !isExpired;
    if (statusFilter === "EXPIRED") return isExpired;
    if (statusFilter === "DEACTIVATED") return isDeactivated;

    return true;
  });

  // ── Render ──────────────────────────────────────────────────────────────

  const isAdmin = role_code === "INSTITUTE_ADMIN";
  const inviteLabel = isAdmin ? "Admin" : "Staff";

  return (
    <Card className="border shadow-sm overflow-hidden">
      {/* Header */}
      <CardHeader className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b bg-muted/10">
        <div>
          <CardTitle className="text-xl font-bold text-slate-900">{title}</CardTitle>
          <CardDescription className="text-sm text-slate-500 mt-1">{description}</CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44 h-9 text-xs font-semibold bg-white border border-slate-200 rounded-lg">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-lg">
              <SelectItem value="ALL" className="text-xs font-medium">All Statuses</SelectItem>
              <SelectItem value="ACTIVE" className="text-xs font-medium">Active</SelectItem>
              <SelectItem value="PENDING" className="text-xs font-medium">Pending</SelectItem>
              <SelectItem value="EXPIRED" className="text-xs font-medium">Expired</SelectItem>
              <SelectItem value="DEACTIVATED" className="text-xs font-medium">Deactivated</SelectItem>
            </SelectContent>
          </Select>

          <Button
            size="sm"
            className="gap-2 shrink-0 w-full sm:w-auto font-semibold h-9"
            onClick={() => setInviteOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
            Invite {inviteLabel}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* DESKTOP TABLE VIEW */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="pl-6 font-semibold">User</TableHead>
                <TableHead className="font-semibold">Role</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Invitation</TableHead>
                <TableHead className="text-right pr-6 font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5} className="pl-6 py-4">
                      <div className="flex items-center gap-3 animate-pulse">
                        <div className="h-10 w-10 rounded-full bg-slate-200" />
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-32 rounded bg-slate-200" />
                          <div className="h-3 w-48 rounded bg-slate-100" />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 text-slate-400">
                    <ShieldAlert className="h-10 w-10 mx-auto mb-4 opacity-30" />
                    <p className="text-sm font-medium">No {title.toLowerCase()} found matching the filter</p>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.map((user) => {
                const expiryStr = formatExpiry(user.invite_token_expiry);
                const isPending = user.status === "pending";
                const isActive = user.status === "active";
                const isExpired = isPending && user.invite_token_expiry && new Date(user.invite_token_expiry) < new Date();
                const isDeactivated = user.status === "deactivated";

                return (
                  <TableRow key={user.user_id} className="table-row-hover">
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border">
                          <AvatarImage src={user.profile_url || ""} className="object-cover" />
                          <AvatarFallback
                            className={`${avatarColor(user.user_name || "?")} text-white text-sm font-black`}
                          >
                            {(user.user_name?.[0] || "?").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{user.user_name}</p>
                          <p className="text-xs font-medium">
                            <a href={`mailto:${user.email}`} className="text-blue-600 hover:underline">{user.email}</a>
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className="capitalize font-medium">
                        {user.role_name?.replace(/_/g, " ").toLowerCase()}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {isActive && (
                        <Badge variant="active" className="gap-1.5 uppercase text-[10px] font-bold">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </Badge>
                      )}
                      {isDeactivated ? (
                        <Badge variant="deactivated" className="gap-1.5 uppercase text-[10px] font-bold">
                          <ShieldAlert className="h-3 w-3" />
                          Deactivated
                        </Badge>
                      ) : isExpired ? (
                        <Badge variant="expired" className="gap-1.5 uppercase text-[10px] font-bold">
                          <ShieldAlert className="h-3 w-3" />
                          Expired
                        </Badge>
                      ) : isPending ? (
                        <Badge variant="pending" className="gap-1.5 uppercase text-[10px] font-bold">
                          <Clock className="h-3 w-3" />
                          Pending
                        </Badge>
                      ) : null}
                    </TableCell>

                    <TableCell>
                      {isPending ? (
                        <div className="space-y-1">
                          {isExpired ? (
                            <p className="text-[10px] text-rose-600 font-bold uppercase tracking-tighter">Expired</p>
                          ) : expiryStr ? (
                            <p className="text-xs text-slate-500 font-medium">Expires: <span className="font-bold text-slate-700">{expiryStr}</span></p>
                          ) : (
                            <p className="text-[10px] text-amber-600 font-bold uppercase tracking-tighter">Expired</p>
                          )}
                          <button
                            onClick={() => handleResend(user.user_id, user.email)}
                            disabled={resending === user.user_id}
                            className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                          >
                            <RefreshCw className={`h-2.5 w-2.5 ${resending === user.user_id ? "animate-spin" : ""}`} />
                            {resending === user.user_id ? "RESENDING…" : "RESEND"}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-xl">
                          <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</DropdownMenuLabel>
                          {isPending && (
                            <DropdownMenuItem
                              onClick={() => handleResend(user.user_id, user.email)}
                              disabled={resending === user.user_id}
                              className="rounded-lg m-1"
                            >
                              <Mail className="mr-2 h-4 w-4 text-indigo-500" />
                              Resend Invite
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {isDeactivated ? (
                            <DropdownMenuItem
                              className="text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50 rounded-lg m-1 font-bold"
                              onClick={() => handleReactivate(user.user_id)}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
                              Reactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600 focus:bg-red-50 rounded-lg m-1"
                              onClick={() => handleDeactivate(user.user_id)}
                            >
                              <ShieldAlert className="mr-2 h-4 w-4 text-slate-500" />
                              Deactivate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 font-bold focus:text-white focus:bg-red-600 rounded-lg m-1"
                            onClick={() => handleDelete(user.user_id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* MOBILE CARD VIEW */}
        <div className="md:hidden flex flex-col divide-y divide-border">
          {loading ? (
            <div className="p-4 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="h-12 w-12 rounded-full bg-slate-100" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-1/2 bg-slate-100 rounded" />
                    <div className="h-3 w-3/4 bg-slate-50 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-20 text-center">
              <ShieldAlert className="h-10 w-10 mx-auto mb-4 opacity-30 text-slate-400" />
              <p className="text-sm font-bold text-slate-500">No {title.toLowerCase()} found matching the filter</p>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isPending = user.status === "pending";
              const isActive = user.status === "active";
              const isExpired = isPending && user.invite_token_expiry && new Date(user.invite_token_expiry) < new Date();
              const isDeactivated = user.status === "deactivated";

              return (
                <div key={user.user_id} className="p-4 bg-background hover:bg-muted/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border shadow-sm">
                      <AvatarImage src={user.profile_url || ""} className="object-cover" />
                      <AvatarFallback
                        className={`${avatarColor(user.user_name || "?")} text-white text-base font-black`}
                      >
                        {(user.user_name?.[0] || "?").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-bold text-slate-900 truncate text-base">{user.user_name}</p>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full -mr-2">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl shadow-xl">
                            {isPending && (
                              <DropdownMenuItem onClick={() => handleResend(user.user_id, user.email)}>Resend Invite</DropdownMenuItem>
                            )}
                            {isDeactivated ? (
                              <DropdownMenuItem className="text-emerald-600 font-bold" onClick={() => handleReactivate(user.user_id)}>Reactivate</DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleDeactivate(user.user_id)}>Deactivate</DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-destructive font-bold" onClick={() => handleDelete(user.user_id)}>Delete Account</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="text-xs font-medium truncate mb-2">
                        <a href={`mailto:${user.email}`} className="text-blue-600 hover:underline">{user.email}</a>
                      </p>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] px-2 py-0 h-5 font-bold uppercase tracking-tighter">
                          {user.role_name?.replace(/_/g, " ").toLowerCase()}
                        </Badge>
                        {isActive && (
                          <Badge variant="active" className="gap-1 uppercase text-[9px] font-bold py-0 h-5">
                            Active
                          </Badge>
                        )}
                        {isDeactivated ? (
                          <Badge variant="deactivated" className="gap-1 uppercase text-[9px] font-bold py-0 h-5">
                            Deactivated
                          </Badge>
                        ) : isExpired ? (
                          <Badge variant="expired" className="gap-1 uppercase text-[9px] font-bold py-0 h-5">
                            Expired
                          </Badge>
                        ) : isPending ? (
                          <Badge variant="pending" className="gap-1 uppercase text-[9px] font-bold py-0 h-5">
                            Pending
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="w-[94vw] sm:max-w-md rounded-2xl left-[50%] top-[50%] -translate-x-[50%] -translate-y-[50%]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <UserPlus className="h-5 w-5 text-indigo-600" />
              Invite New {inviteLabel}
            </DialogTitle>
            <DialogDescription className="font-medium">
              An invitation email will be sent with a secure link to set their password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-6 pt-4">
            <div className="grid gap-2">
              <Label htmlFor={`${role_code}-name`} className="text-sm font-semibold text-slate-700">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id={`${role_code}-name`}
                required
                placeholder="e.g. Priya Sharma"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-11 rounded-lg"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${role_code}-email`} className="text-sm font-semibold text-slate-700">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id={`${role_code}-email`}
                type="email"
                required
                placeholder="e.g. admin@school.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-11 rounded-lg"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${role_code}-phone`} className="text-sm font-semibold text-slate-700">Phone Number</Label>
              <Input
                id={`${role_code}-phone`}
                type="tel"
                pattern="[0-9]{10}"
                maxLength={10}
                minLength={10}
                title="Phone number must be exactly 10 digits"
                placeholder="Optional"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                className="h-11 rounded-lg"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${role_code}-designation`} className="text-sm font-semibold text-slate-700">Designation</Label>
              <Input
                id={`${role_code}-designation`}
                value="Institute Administrator"
                disabled
                className="h-11 rounded-lg bg-slate-50 cursor-not-allowed opacity-100 text-slate-600 font-medium"
              />
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)} className="order-2 sm:order-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 order-1 sm:order-2 font-bold" disabled={submitting}>
                {submitting ? (
                  <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Sending…</>
                ) : (
                  <><Mail className="mr-2 h-4 w-4" /> Send Invitation</>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
