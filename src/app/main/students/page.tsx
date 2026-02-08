"use client";

import * as React from "react";
import axios from "@/lib/axios";
import { MoreHorizontal, PlusCircle, Pencil, Trash } from "lucide-react";

import { useRoleGuard } from "@/hooks/useRoleGuard";
import { useSearch } from "@/components/campus-connect/search-provider";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StudentDetails } from "@/components/campus-connect/student-details";
import {
  StudentForm,
  type Student,
} from "@/components/campus-connect/student-form";

/* =========================
   CONSTANTS
========================= */

const bloodGroupMap: Record<string, number> = {
  "A+": 1,
  "A-": 2,
  "B+": 3,
  "B-": 4,
  "AB+": 5,
  "AB-": 6,
  "O+": 7,
  "O-": 8,
};

const ALLOWED_ROLES = [1, 2, 3, 4];

type StudentListItem = {
  id: number;
  name: string;
  email?: string;
  status: "Active" | "Suspended" | "Withdrawn";
  class: string;
  joined: string;
  initials: string;
};

const statusVariant = (status: string) => {
  if (status === "Suspended") return "destructive";
  if (status === "Withdrawn") return "secondary";
  return "default";
};

/* =========================
   COMPONENT
========================= */

export default function StudentsPage() {
  useRoleGuard(ALLOWED_ROLES);

  const { toast } = useToast();
  const { searchQuery } = useSearch();

  const [students, setStudents] = React.useState<StudentListItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [selectedStudent, setSelectedStudent] = React.useState<any>(null);

  const [addOpen, setAddOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [addLoading, setAddLoading] = React.useState(false);

  const [editingStudent, setEditingStudent] = React.useState<any>(null);

  /* =========================
     FETCH
  ========================= */

  const fetchStudents = async () => {
    try {
      const res = await axios.get("/api/students");

      const mapped = res.data.data.map((s: any) => ({
        id: s.student_id,
        name: `${s.stu_first_name} ${s.stu_last_name}`,
        email: s.email,
        status:
          s.user_status_id === 1
            ? "Active"
            : s.user_status_id === 2
            ? "Suspended"
            : "Withdrawn",
        class: s.class_name
          ? `${s.class_name}${
              s.section_name ? " - " + s.section_name : ""
            }`
          : "-",
        joined: s.joined_date
          ? new Date(s.joined_date).toLocaleDateString()
          : "-",
        initials:
          s.stu_first_name.charAt(0) + s.stu_last_name.charAt(0),
      }));

      setStudents(mapped);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStudents();
  }, []);

  /* =========================
     ADD STUDENT
  ========================= */

  const handleAddStudent = async (form?: Student) => {
    if (!form) return;

    const parts = form.name.trim().split(/\s+/);
    const firstName = parts[0];
    const lastName = parts.slice(1).join(" ") || "-";

    try {
      setAddLoading(true);

      await axios.post("/api/students", {
        stu_first_name: firstName,
        stu_last_name: lastName,
        email: form.email,
        address: form.address,
        date_of_birth: form.dob,

        bg_id: bloodGroupMap[form.bloodGroup] || null,
        user_status_id: form.status === "Active" ? 1 : 2,
        joined_date: new Date().toISOString(),

        class_id: form.class_id,        

        fatherName: form.fatherName,
        motherName: form.motherName,
        primaryContact: form.primaryContact,
        parentEmail: form.parentEmail || null,
      });


      toast({
        title: "Success",
        description: "Student added successfully",
      });

      setAddOpen(false);
      fetchStudents();
    } catch (err: any) {
      toast({
        title: "Error",
        description:
          err?.response?.data?.message || "Failed to add student",
        variant: "destructive",
      });
    } finally {
      setAddLoading(false);
    }
  };

  /* =========================
     EDIT STUDENT (NEW)
  ========================= */

  const handleEditClick = async (id: number) => {
    const res = await axios.get(`/api/students/${id}`);
    const s = res.data.data;

    setEditingStudent({
      id: String(s.student_id),
      name: `${s.stu_first_name} ${s.stu_last_name}`,
      email: s.email || "",

      // ✅ MUST MATCH StudentForm schema
      class_id: s.class_id ? String(s.class_id) : "",

      status: s.user_status_id === 1 ? "Active" : "Suspended",
      address: s.address || "",

      dob: s.date_of_birth
        ? s.date_of_birth.split("T")[0]
        : "",

      bloodGroup: s.blood_group || "",
      fatherName: s.father_name || "",
      motherName: s.mother_name || "",
      primaryContact: s.primary_contact || "",
      parentEmail: s.parent_email || "",
    });



    setEditOpen(true);
  };

  const handleUpdateStudent = async (form: Student) => {
    const parts = form.name.trim().split(/\s+/);

    await axios.put(`/api/students/${form.id}`, {
      stu_first_name: parts[0],
      stu_last_name: parts.slice(1).join(" ") || "-",
      address: form.address,
      date_of_birth: form.dob,
      bg_id: bloodGroupMap[form.bloodGroup],
      user_status_id: form.status === "Active" ? 1 : 2,
      fatherName: form.fatherName,
      motherName: form.motherName,
      primaryContact: form.primaryContact,
      parentEmail: form.parentEmail || null,
    });

    toast({
      title: "Updated",
      description: "Student updated successfully",
    });

    setEditOpen(false);
    fetchStudents();
  };

  /* =========================
     DELETE
  ========================= */

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this student?")) return;
    await axios.delete(`/api/students/${id}`);
    fetchStudents();
  };

  /* =========================
     VIEW DETAILS
  ========================= */

  const handleViewDetails = async (id: number) => {
    const res = await axios.get(`/api/students/${id}`);
    const s = res.data.data;

    setSelectedStudent({
      id: String(s.student_id),
      name: `${s.stu_first_name} ${s.stu_last_name}`,
      email: s.email,
      status: s.user_status_id === 1 ? "Active" : "Suspended",
      class: s.section_name
        ? `${s.class_name} - ${s.section_name}`
        : s.class_name || "-",
      date: s.joined_date,
      address: s.address,
      dob: s.date_of_birth,
      bloodGroup: s.blood_group || "-",
      fatherName: s.father_name || "-",
      motherName: s.mother_name || "-",
      primaryContact: s.primary_contact || "-",
      secondaryContact: null,
      parentEmail: s.parent_email || "N/A",
      fallback:
        s.stu_first_name.charAt(0) + s.stu_last_name.charAt(0),
    });

    setDetailsOpen(true);
  };

  const filtered = React.useMemo(() => {
    if (!searchQuery) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);

  /* =========================
     UI
  ========================= */

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row justify-between">
          <div>
            <CardTitle>Students</CardTitle>
            <CardDescription>Manage your students</CardDescription>
          </div>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Student
          </Button>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.map((s) => (
                <TableRow key={`${s.id}-${s.class}`}>
                  <TableCell className="flex gap-3">
                    <Avatar>
                      <AvatarFallback>{s.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {s.email}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant={statusVariant(s.status)}>
                      {s.status}
                    </Badge>
                  </TableCell>

                  <TableCell>{s.class}</TableCell>
                  <TableCell>{s.joined}</TableCell>

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
                          onClick={() => handleViewDetails(s.id)}
                        >
                          View Details
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => handleEditClick(s.id)}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(s.id)}
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {loading && <p className="py-6 text-center">Loading...</p>}
        </CardContent>
      </Card>

      {/* ADD */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Student</DialogTitle>
          </DialogHeader>
          <StudentForm onSubmit={handleAddStudent} />
          {addLoading && <p>Saving...</p>}
        </DialogContent>
      </Dialog>

      {/* EDIT */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
          </DialogHeader>

          {editingStudent && (
          <StudentForm
            key={editingStudent.id}   
            student={editingStudent}
            onSubmit={handleUpdateStudent}
          />
        )}

        </DialogContent>
      </Dialog>

      {/* DETAILS */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
          </DialogHeader>

          {selectedStudent && (
            <StudentDetails
              student={selectedStudent}
              onGenerateIdCard={() => {}}
              onGenerateBonafide={() => {}}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
