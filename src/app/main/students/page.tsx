"use client";

import * as React from "react";
import axios from "@/lib/axios";
import { MoreHorizontal, PlusCircle, Pencil, Trash } from "lucide-react";

import { useRoleGuard } from "@/hooks/useRoleGuard";
import { useSearch } from "@/components/campus-connect/search-provider";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useIdCardSettings } from "@/components/campus-connect/id-card-settings-provider";
import { Progress } from "@/components/ui/progress";
import { PageSkeleton } from "@/components/ui/skeletons";
import { FileText, Award, CreditCard, FileCheck, CheckCircle2 } from "lucide-react";

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
import { StudentDetails } from "@/components/campus-connect/student-details";
import {
  StudentForm,
  type Student,
} from "@/components/campus-connect/student-form";

import { ROLE, ADMIN_GROUP, RoleId } from "@/config/roles";

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

const ALLOWED_ROLES = [...ADMIN_GROUP, ROLE.TEACHER, ROLE.CLASS_TEACHER, ROLE.ADMISSION_OFFICER];

type StudentListItem = {
  id: number;
  name: string;
  email?: string;
  status: string;
  class: string;
  standard: string;
  section: string;
  joined: string;
  initials: string;
  avatar?: string;
};

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

/* =========================
   COMPONENT
========================= */

export default function StudentsPage() {
  useRoleGuard(ALLOWED_ROLES as number[]);

  const { toast } = useToast();
  const { searchQuery } = useSearch();

  const roleId =
    typeof window !== "undefined"
      ? Number(localStorage.getItem("role_id"))
      : null;

  const canManage = roleId ? ([...ADMIN_GROUP, ROLE.ADMISSION_OFFICER] as RoleId[]).includes(roleId as RoleId) : false;
  const canDelete = roleId === ROLE.MASTER_ADMIN || roleId === ROLE.INSTITUTE_ADMIN;

  const [students, setStudents] = React.useState<StudentListItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [selectedStudent, setSelectedStudent] = React.useState<any>(null);

  const [addOpen, setAddOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [addLoading, setAddLoading] = React.useState(false);

  const [editingStudent, setEditingStudent] = React.useState<any>(null);

  const [selectedStandard, setSelectedStandard] = React.useState<string>("all");
  const [selectedSection, setSelectedSection] = React.useState<string>("all");

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
        status: s.status_name || (s.user_status_id === 1 ? "Active" : "Inactive"),
        class: s.class_name
          ? `${s.class_name}${
              s.section_name ? " - " + s.section_name : ""
            }`
          : "-",
        standard: s.class_name || "-",
        section: s.section_name || "-",
        joined: s.joined_date
          ? new Date(s.joined_date).toISOString().split('T')[0]
          : "-",
        initials:
          (s.stu_first_name?.charAt(0) || "") + (s.stu_last_name?.charAt(0) || ""),
        avatar: s.profile_url || "",
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
        user_status_id: Number(form.user_status_id),
        joined_date: new Date().toISOString(),

        class_id: form.class_id,        

        fatherName: form.fatherName,
        motherName: form.motherName,
        primaryContact: form.primaryContact,
        parentEmail: form.parentEmail || null,
        profile_url: form.avatar || null,
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

      user_status_id: String(s.user_status_id),
      address: s.address || "",

      dob: s.date_of_birth
        ? s.date_of_birth.split("T")[0]
        : "",

      bloodGroup: s.blood_group || "",
      fatherName: s.father_name || "",
      motherName: s.mother_name || "",
      primaryContact: s.primary_contact || "",
      parentEmail: s.parent_email || "",
      avatar: s.profile_url || "",
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
      user_status_id: Number(form.user_status_id),
      fatherName: form.fatherName,
      motherName: form.motherName,
      primaryContact: form.primaryContact,
      parentEmail: form.parentEmail || null,
      class_id: form.class_id,
      profile_url: form.avatar || null,
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
      status: s.status_name || (s.user_status_id === 1 ? "Active" : "Inactive"),
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
      avatar: s.profile_url || "",
      fallback:
        (s.stu_first_name?.charAt(0) || "") + (s.stu_last_name?.charAt(0) || ""),
    });

    setDetailsOpen(true);
  };

  const { settings } = useIdCardSettings();

  const generateIdCard = async (student: any) => {
    try {
      if (!student.id) {
        toast({ title: "Error", description: "Student ID missing.", variant: "destructive" });
        return;
      }
      
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Authentication missing");

      // Open in new tab or trigger download blob
      // Using fetch to pass Auth Headers and handle the PDF stream
      const res = await fetch(`http://localhost:5000/api/documents/id-card/${student.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        toast({ title: "Error", description: "Failed to generate ID Card", variant: "destructive" });
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ID_Card_${student.name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ title: "Success", description: "ID Card generated successfully." });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "An error occurred.", variant: "destructive" });
    }
  };

  const generateBonafide = async (student: any) => {
    try {
      if (!student.id) {
        toast({ title: "Error", description: "Student ID missing.", variant: "destructive" });
        return;
      }
      
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Authentication missing");

      // Open in new tab or trigger download blob
      // Using fetch to pass Auth Headers and handle the PDF stream
      const res = await fetch(`http://localhost:5000/api/documents/bonafide/${student.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        toast({ title: "Error", description: "Failed to generate Bonafide Certificate", variant: "destructive" });
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Bonafide_Certificate_${student.name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ title: "Success", description: "Bonafide Certificate generated successfully." });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "An error occurred.", variant: "destructive" });
    }
  };

  const generateMarkSheet = async (student: any) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`http://localhost:5000/api/documents/mark-sheet/${student.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `MarkSheet_${student.name.replace(/\s+/g, '_')}.pdf`;
      a.click();
      toast({ title: "Success", description: "Mark Sheet generated." });
    } catch (err) {
      toast({ title: "Error", description: "Failed to generate mark sheet", variant: "destructive" });
    }
  };

  const generateGeneralCertificate = async (student: any) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`http://localhost:5000/api/documents/general-certificate/${student.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Certificate_${student.name.replace(/\s+/g, '_')}.pdf`;
      a.click();
      toast({ title: "Success", description: "Certificate generated." });
    } catch (err) {
      toast({ title: "Error", description: "Failed to generate certificate", variant: "destructive" });
    }
  };

  const [bulkLoading, setBulkLoading] = React.useState(false);
  const [bulkProgress, setBulkProgress] = React.useState(0);

  const generateBulkDocuments = async (type: 'id-card' | 'bonafide') => {
    try {
      if (filtered.length === 0) {
        toast({ title: "Warning", description: "No students to generate documents for.", variant: "default" });
        return;
      }
      
      setBulkLoading(true);
      setBulkProgress(10);
      const studentIds = filtered.map(s => s.id);
      
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Authentication missing");

      setBulkProgress(30);
      const res = await fetch(`http://localhost:5000/api/documents/${type}/bulk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ studentIds })
      });

      setBulkProgress(70);
      if (!res.ok) {
        toast({ title: "Error", description: `Failed to generate bulk ${type}`, variant: "destructive" });
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      setBulkProgress(90);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Bulk_${type === 'id-card' ? 'ID_Cards' : 'Bonafide'}_${new Date().getTime()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setBulkProgress(100);

      toast({ title: "Success", description: `Bulk ${type === 'id-card' ? 'ID Cards' : 'Bonafide Certificates'} generated successfully.` });
      setTimeout(() => setBulkProgress(0), 3000);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "An error occurred.", variant: "destructive" });
      setBulkProgress(0);
    } finally {
      setBulkLoading(false);
    }
  };

  const filtered = React.useMemo(() => {
    let result = students;

    if (selectedStandard !== "all") {
      result = result.filter((s) => s.standard === selectedStandard);
    }
    if (selectedSection !== "all") {
      result = result.filter((s) => s.section === selectedSection);
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [students, searchQuery, selectedStandard, selectedSection]);

  const uniqueStandards = React.useMemo(() => {
    const stands = Array.from(new Set(students.map((s) => s.standard).filter((s) => s !== "-")));
    return stands.sort((a, b) => {
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [students]);

  const uniqueSectionsForStandard = React.useMemo(() => {
    if (selectedStandard === "all") return [];
    const secs = students
      .filter((s) => s.standard === selectedStandard && s.section !== "-")
      .map((s) => s.section);
    return Array.from(new Set(secs)).sort();
  }, [students, selectedStandard]);

  // Reset section when standard changes
  React.useEffect(() => {
    setSelectedSection("all");
  }, [selectedStandard]);

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
          <div className="flex items-center gap-4">
            <Select value={selectedStandard} onValueChange={setSelectedStandard}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Standard" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Standards</SelectItem>
                {uniqueStandards.map((std) => (
                  <SelectItem key={std} value={std}>
                    Standard {std}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedSection}
              onValueChange={setSelectedSection}
              disabled={selectedStandard === "all"}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {uniqueSectionsForStandard.map((sec) => (
                  <SelectItem key={sec} value={sec}>
                    Section {sec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {canManage && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" loading={bulkLoading}>
                      Bulk Generate
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>For {filtered.length} Students</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => generateBulkDocuments('id-card')}>
                      ID Cards
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => generateBulkDocuments('bonafide')}>
                      Bonafide Certificates
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button size="sm" onClick={() => setAddOpen(true)} loading={addLoading}>
                  Add Student
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        {bulkLoading && (
          <div className="px-6 pb-4">
            <div className="flex items-center justify-between text-xs mb-2 text-primary font-medium">
              <span>Generating Documents...</span>
              <span>{bulkProgress}%</span>
            </div>
            <Progress value={bulkProgress} className="h-1.5" />
          </div>
        )}

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Joined At</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.map((s) => (
                <TableRow key={`${s.id}-${s.class}`}>
                  <TableCell className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={s.avatar} className="object-cover" />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {s.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900 dark:text-slate-100">{s.name}</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {s.email || "No email"}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant={statusVariant(s.status)}>
                      {s.status}
                    </Badge>
                  </TableCell>

                  <TableCell>{s.class}</TableCell>
                  <TableCell>{s.joined}</TableCell>

                  <TableCell className="text-right">
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

                          {canManage && (
                            <DropdownMenuItem
                              onClick={() => handleEditClick(s.id)}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}

                          {canDelete && (
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDelete(s.id)}
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuLabel className="border-t mt-1 pt-2">Documents</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => generateIdCard(s)}>
                            <CreditCard className="h-4 w-4 mr-2" />
                            ID Card
                          </DropdownMenuItem>
                          {canManage && (
                            <>
                              <DropdownMenuItem onClick={() => generateBonafide(s)}>
                                <FileCheck className="h-4 w-4 mr-2" />
                                Bonafide
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => generateMarkSheet(s)}>
                                <FileText className="h-4 w-4 mr-2" />
                                Mark Sheet
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => generateGeneralCertificate(s)}>
                                <Award className="h-4 w-4 mr-2" />
                                General Certificate
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

          {loading && (
            <div className="px-2 pb-4">
              <PageSkeleton rows={5} />
            </div>
          )}
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

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 border-b pb-4 mb-2">Student Details</DialogTitle>
          </DialogHeader>

          {selectedStudent && (
            <StudentDetails
              student={selectedStudent}
              onGenerateIdCard={generateIdCard}
              onGenerateBonafide={generateBonafide}
              canGenerateBonafide={canManage}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
