"use client";

import * as React from "react";
import axios from "@/lib/axios";
import RouteGuard from "@/components/auth/RouteGuard";
import { MoreHorizontal, PlusCircle, Pencil, Eye } from "lucide-react";
import { PageSkeleton } from "@/components/ui/skeletons";

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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

export default function FacultyPage() {
  const { searchQuery } = useSearch();

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
      case "On Leave":
      case "Probation":
      case "Pending Approval":
      case "Transferred":
        return "outline";
      default: return "outline";
    }
  };

  const roleId =
    typeof window !== "undefined"
      ? Number(localStorage.getItem("role_id"))
      : null;

  const canManage = roleId ? ([ROLE.MASTER_ADMIN, ROLE.INSTITUTE_ADMIN] as RoleId[]).includes(roleId as RoleId) : false;

  const [faculty, setFaculty] = React.useState<any[]>([]);
  const [departments, setDepartments] = React.useState<any[]>([]);
  const [subjects, setSubjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [addLoading, setAddLoading] = React.useState(false);

  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"add" | "edit">("add");
  const [selectedFaculty, setSelectedFaculty] = React.useState<any>(null);

  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [detailsFaculty, setDetailsFaculty] = React.useState<any>(null);

  const [scheduleOpen, setScheduleOpen] = React.useState(false);

  /* =========================
     FETCH FACULTY
  ========================= */
  const fetchFaculty = async () => {
    const res = await axios.get("/api/faculty");
    const mapped = res.data.data.map((f: any) => ({
      ...f,
      name: `${f.staff_first_name} ${f.staff_last_name}`,
      fallback:
        (f.staff_first_name?.[0] || "") +
        (f.staff_last_name?.[0] || ""),
      status: f.status_name || (f.user_status_id === 1 ? "Active" : "Inactive"),
      avatar: f.profile_url || "",
    }));
    setFaculty(mapped);
    setLoading(false);
  };

  /* =========================
     FETCH META
  ========================= */
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
  }, []);

  /* =========================
     ADD FACULTY
  ========================= */
  const handleAdd = async (data: FacultyFormData) => {
    const [first, ...rest] = data.name.split(" ");

    try {
      setAddLoading(true);
      await axios.post("/api/faculty", {
        staff_first_name: first,
        staff_last_name: rest.join(" ") || "-",
        email: data.email,
        contact: data.contact,
        qualification: data.qualification,
        dept_id: Number(data.dept_id),
        subject_id: Number(data.subject_id),
        bg_id: Number(data.bg_id),
        gender_id: Number(data.gender_id),
        joining_date: data.joining_date,
        role_id: 3,
        user_status_id: Number(data.user_status_id),
        profile_url: data.avatar || null,
      });

      setOpen(false);
      fetchFaculty();
    } finally {
      setAddLoading(false);
    }
  };

  /* =========================
     EDIT FACULTY
  ========================= */
  const handleEdit = async (data: FacultyFormData) => {
    const [first, ...rest] = data.name.split(" ");

    try {
      setAddLoading(true);
      await axios.patch(`/api/faculty/${selectedFaculty.staff_id}`, {
        staff_first_name: first,
        staff_last_name: rest.join(" ") || "-",
        email: data.email,
        contact: data.contact,
        qualification: data.qualification,
        dept_id: Number(data.dept_id),
        subject_id: Number(data.subject_id),
        bg_id: Number(data.bg_id),
        gender_id: Number(data.gender_id),
        joining_date: data.joining_date,
        user_status_id: Number(data.user_status_id),
        profile_url: data.avatar || null,
      });

      setOpen(false);
      fetchFaculty();
    } finally {
      setAddLoading(false);
    }
  };

  /* =========================
     VIEW DETAILS
  ========================= */
  const handleViewDetails = async (id: number) => {
    const res = await axios.get(`/api/faculty/${id}`);
    setDetailsFaculty(res.data.data);
    setDetailsOpen(true);
  };

  const filtered = faculty.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <RouteGuard allowedRoles={ADMIN_GROUP}>
      <>
        <Card>
          <CardHeader className="flex justify-between flex-row">
            <div>
              <CardTitle>Faculty</CardTitle>
              <CardDescription>Manage faculty members</CardDescription>
            </div>
            {canManage && (
              <Button
                size="sm"
                loading={addLoading}
                onClick={() => {
                  setMode("add");
                  setSelectedFaculty(null);
                  setOpen(true);
                }}
              >
                Add Faculty
              </Button>
            )}
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="p-0">
                      <PageSkeleton rows={4} />
                    </TableCell>
                  </TableRow>
                ) : filtered.map((f) => (
                  <TableRow key={f.staff_id}>
                    <TableCell className="flex gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={f.avatar} className="object-cover" />
                        <AvatarFallback className="bg-primary/10 text-primary">{f.fallback}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{f.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {f.email}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant={statusVariant(f.status)}>{f.status}</Badge>
                    </TableCell>

                    <TableCell>{f.dept_name || "-"}</TableCell>
                    <TableCell>{f.subject_name || "-"}</TableCell>

                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>

                          <DropdownMenuItem
                            onClick={() => handleViewDetails(f.staff_id)}
                          >
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

                              {/* ✅ SOFT DELETE */}
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
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* ADD / EDIT */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {mode === "add" ? "Add Faculty" : "Edit Faculty"}
              </DialogTitle>
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

        {/* DETAILS */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900 border-b pb-4 mb-2">Faculty Details</DialogTitle>
            </DialogHeader>

            {detailsFaculty && (
              <FacultyDetails faculty={detailsFaculty} />
            )}
          </DialogContent>
        </Dialog>

        {/* SCHEDULE */}
        <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Weekly Schedule</DialogTitle>
              <DialogDescription>
                Class schedule for {selectedFaculty?.staff_first_name} {selectedFaculty?.staff_last_name}.
              </DialogDescription>
            </DialogHeader>

            {selectedFaculty && (
              <FacultySchedule faculty={selectedFaculty} />
            )}
          </DialogContent>
        </Dialog>
      </>
    </RouteGuard>
  );
}
