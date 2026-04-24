"use client";

import * as React from "react";
import axios from "@/lib/axios";
import { MoreHorizontal, PlusCircle, Pencil, Eye, Mail, UserPlus, Trash2, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface UserTableProps {
  role_code: string;
  title: string;
  description: string;
}

export function UserManagementTable({ role_code, title, description }: UserTableProps) {
  const [users, setUsers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({ name: "", email: "", phone: "", designation: "" });
  const [submitting, setSubmitting] = React.useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/auth/users?role_code=${role_code}`);
      setUsers(res.data.data);
    } catch (err) {
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
    try {
      setSubmitting(true);
      await axios.post("/api/auth/invite-user", {
        ...formData,
        role_code
      });
      toast.success("Invitation sent successfully");
      setInviteOpen(false);
      setFormData({ name: "", email: "", phone: "", designation: "" });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send invitation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async (email: string) => {
    try {
      await axios.post("/api/auth/resend-invitation", { email });
      toast.success("Invitation resent");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to resend");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to deactivate/delete this user?")) return;
    try {
      await axios.delete(`/api/auth/users/${id}`);
      toast.success("User deactivated");
      fetchUsers();
    } catch (err) {
      toast.error("Failed to deactivate user");
    }
  };

  const statusVariant = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "pending": return "outline";
      case "deactivated": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite {role_code === "INSTITUTE_ADMIN" ? "Admin" : "Staff"}
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Invitation</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10">Loading users...</TableCell></TableRow>
            ) : users.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No users found</TableCell></TableRow>
            ) : users.map((user) => (
              <TableRow key={user.user_id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src="" />
                      <AvatarFallback>{user.user_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.user_name}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="capitalize">{user.role_name}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(user.status)}>{user.status}</Badge>
                </TableCell>
                <TableCell>
                  {user.status === "pending" ? (
                    <div className="flex flex-col text-[10px] text-muted-foreground">
                      <span>Expires: {new Date(user.invite_token_expiry).toLocaleDateString()}</span>
                      <Button variant="link" className="h-auto p-0 text-[10px] justify-start" onClick={() => handleResend(user.email)}>Resend</Button>
                    </div>
                  ) : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleResend(user.email)} disabled={user.status !== "pending"}>
                        <Mail className="mr-2 h-4 w-4" /> Resend Invite
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(user.user_id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Deactivate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New {role_code === "INSTITUTE_ADMIN" ? "Admin" : "Staff"}</DialogTitle>
            <DialogDescription>
              An invitation email will be sent to help them set their password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4 pt-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="designation">Designation</Label>
              <Input id="designation" placeholder="e.g. Senior Admin or Teacher" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Sending..." : "Send Invitation"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
