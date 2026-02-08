"use client";

import * as React from "react";
import axios from "@/lib/axios";
import RouteGuard from "@/components/auth/RouteGuard";
import { MoreHorizontal, PlusCircle, Pencil, Eye } from "lucide-react";

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

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSearch } from "@/components/campus-connect/search-provider";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  FacultyForm,
  type FacultyFormData,
} from "@/components/campus-connect/faculty-form";

import { FacultyDetails } from "@/components/campus-connect/faculty-details";

export default function FacultyPage() {
  const { searchQuery } = useSearch();

  const [faculty, setFaculty] = React.useState<any[]>([]);
  const [departments, setDepartments] = React.useState<any[]>([]);
  const [subjects, setSubjects] = React.useState<any[]>([]);

  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"add" | "edit">("add");
  const [selectedFaculty, setSelectedFaculty] = React.useState<any>(null);

  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [detailsFaculty, setDetailsFaculty] = React.useState<any>(null);

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
      status: f.user_status_id === 1 ? "Active" : "Inactive",
    }));
    setFaculty(mapped);
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
    });

    setOpen(false);
    fetchFaculty();
  };

  /* =========================
     EDIT FACULTY
  ========================= */
  const handleEdit = async (data: FacultyFormData) => {
    const [first, ...rest] = data.name.split(" ");

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
    });

    setOpen(false);
    fetchFaculty();
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
    <RouteGuard allowedRoles={[1, 2]}>
      <>
        <Card>
          <CardHeader className="flex justify-between flex-row">
            <div>
              <CardTitle>Faculty</CardTitle>
              <CardDescription>Manage faculty members</CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setMode("add");
                setSelectedFaculty(null);
                setOpen(true);
              }}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Faculty
            </Button>
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
                {filtered.map((f) => (
                  <TableRow key={f.staff_id}>
                    <TableCell className="flex gap-3">
                      <Avatar>
                        <AvatarFallback>{f.fallback}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{f.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {f.email}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge>{f.status}</Badge>
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

                          {/* ✅ View Schedule (future ready) */}
                          <DropdownMenuItem disabled>
                            📅 View Schedule
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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Faculty Details</DialogTitle>
            </DialogHeader>

            {detailsFaculty && (
              <FacultyDetails faculty={detailsFaculty} />
            )}
          </DialogContent>
        </Dialog>
      </>
    </RouteGuard>
  );
}
