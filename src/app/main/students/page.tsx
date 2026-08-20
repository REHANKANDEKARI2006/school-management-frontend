// @ts-nocheck
"use client";

import * as React from "react";
import axios from "@/lib/axios";
import { useGlobalLoaderStore } from "@/store/useGlobalLoaderStore";
import { MoreHorizontal, PlusCircle, Pencil, Trash } from "lucide-react";

import { useRoleGuard } from "@/hooks/useRoleGuard";
import { useSearch } from "@/components/school-os/search-provider";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useIdCardSettings } from "@/components/school-os/id-card-settings-provider";
import { Progress } from "@/components/ui/progress";
import { TableSkeleton } from "@/components/ui/skeletons";
import { useFeedback } from "@/components/school-os/feedback-provider";
import { FileText, Award, CreditCard, FileCheck, CheckCircle2, Printer } from "lucide-react";

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
import { StudentDetails } from "@/components/school-os/student-details";
import {
  StudentForm,
  type Student,
} from "@/components/school-os/student-form";

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

const statusVariant = (status: string): "active" | "inactive" | "rejected" | "pending" | "cancelled" | "outline" => {
  switch (status) {
    case "Active": return "active";
    case "Suspended":
    case "Rusticated":
    case "Terminated":
    case "Banned":
      return "rejected";
    case "Inactive":
    case "Alumni":
    case "Retired":
    case "Resigned":
      return "inactive";
    case "On Leave":
    case "Probation":
    case "Pending Approval":
    case "Transferred":
      return "pending";
    default: return "outline";
  }
};

/* =========================
   COMPONENT
========================= */

export default function StudentsPage() {
  useRoleGuard(ALLOWED_ROLES as number[]);

  const { toast } = useToast();
  const { showSuccess, showError, showWarning } = useFeedback();
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
  const [editingStudent, setEditingStudent] = React.useState<any>(null);
  const [docLoadingId, setDocLoadingId] = React.useState<string | null>(null);

  const [addOpen, setAddOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [addLoading, setAddLoading] = React.useState(false);

  const [selectedStandard, setSelectedStandard] = React.useState<string>("all");
  const [selectedSection, setSelectedSection] = React.useState<string>("all");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("all");

  const [isMobile, setIsMobile] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedStandard, selectedSection, selectedStatus, searchQuery]);

  /* =========================
     FETCH
  ========================= */

  const fetchStudents = async () => {
    try {
      const res = await axios.get("/api/students");

      const mapped = res.data.data.map((s: any) => ({
        id: s.student_id,
        name: `${s.stu_first_name} ${s.stu_last_name}`,
        email: s.parent_email || "",
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
        gender_id: form.gender_id ? Number(form.gender_id) : null,
      });


      showSuccess("Student Added", "The student has been enrolled successfully.");

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
    useGlobalLoaderStore.getState().increment("Loading student…");
    try {
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
        gender_id: s.gender_id ? String(s.gender_id) : "",
      });

      setEditOpen(true);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to load student details",
        variant: "destructive",
      });
    } finally {
      useGlobalLoaderStore.getState().decrement();
    }
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
      gender_id: form.gender_id ? Number(form.gender_id) : null,
    });

    showSuccess("Student Updated", "Student record has been updated successfully.");

    setEditOpen(false);
    fetchStudents();
  };

  /* =========================
     DELETE
  ========================= */

  const handleDelete = (id: number) => {
    showWarning(
      "Delete Student?",
      "This will permanently remove the student record. This action cannot be undone.",
      async () => {
        await axios.delete(`/api/students/${id}`);
        fetchStudents();
        toast({ title: "Student Deleted", description: "The student has been removed.", variant: "destructive" });
      },
      "Yes, Delete"
    );
  };

  /* =========================
     VIEW DETAILS
  ========================= */

  const handleViewDetails = async (id: number) => {
    useGlobalLoaderStore.getState().increment("Loading details…");
    try {
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
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to load student details",
        variant: "destructive",
      });
    } finally {
      useGlobalLoaderStore.getState().decrement();
    }
  };

  const { settings } = useIdCardSettings();

  const generateIdCard = async (student: any) => {
    try {
      if (!student.id) {
        toast({ title: "Error", description: "Student ID missing.", variant: "destructive" });
        return;
      }
      setDocLoadingId(`${student.id}_idcard`);
      
      const res = await axios.get(`/api/documents/id-card/${student.id}`, {
        responseType: "blob"
      });

      const blob = new Blob([res.data]);
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
      toast({ title: "Error", description: "Failed to generate ID Card", variant: "destructive" });
    } finally {
      setDocLoadingId(null);
    }
  };

  const generateBonafide = async (student: any) => {
    try {
      if (!student.id) {
        toast({ title: "Error", description: "Student ID missing.", variant: "destructive" });
        return;
      }
      setDocLoadingId(`${student.id}_bonafide`);
      
      const res = await axios.get(`/api/documents/bonafide/${student.id}`, {
        responseType: "blob"
      });

      const blob = new Blob([res.data]);
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
      toast({ title: "Error", description: "Failed to generate Bonafide Certificate", variant: "destructive" });
    } finally {
      setDocLoadingId(null);
    }
  };

  const generateMarkSheet = async (student: any) => {
    try {
      setDocLoadingId(`${student.id}_marksheet`);
      const res = await axios.get(`/api/documents/mark-sheet/${student.id}`, {
        responseType: "blob"
      });
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `MarkSheet_${student.name.replace(/\s+/g, '_')}.pdf`;
      a.click();
      toast({ title: "Success", description: "Mark Sheet generated." });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to generate mark sheet", variant: "destructive" });
    } finally {
      setDocLoadingId(null);
    }
  };

  const generateGeneralCertificate = async (student: any) => {
    try {
      setDocLoadingId(`${student.id}_gc`);
      const res = await axios.get(`/api/documents/general-certificate/${student.id}`, {
        responseType: "blob"
      });
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Certificate_${student.name.replace(/\s+/g, '_')}.pdf`;
      a.click();
      toast({ title: "Success", description: "Certificate generated." });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to generate certificate", variant: "destructive" });
    } finally {
      setDocLoadingId(null);
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
    if (selectedStatus !== "all") {
      result = result.filter((s) => s.status === selectedStatus);
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
  }, [students, searchQuery, selectedStandard, selectedSection, selectedStatus]);

  const totalPages = Math.ceil(filtered.length / 10) || 1;

  const displayedStudents = React.useMemo(() => {
    if (!isMobile) return filtered;
    const start = (currentPage - 1) * 10;
    return filtered.slice(start, start + 10);
  }, [filtered, isMobile, currentPage]);

  const uniqueStatuses = React.useMemo(() => {
    const statuses = Array.from(new Set(students.map((s) => s.status).filter(Boolean)));
    return statuses.sort();
  }, [students]);

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
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 sm:p-6 border-b">
          <div className="space-y-1 hidden md:block">
            <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight">Students</CardTitle>
            <CardDescription className="text-sm">Manage and monitor student records</CardDescription>
          </div>
          {/* Mobile View Filter & Action Controls (< sm) */}
          <div className="flex sm:hidden flex-col gap-2.5 w-full mt-2">
            {/* Row 1: Standard & Section Selects in 2 Columns */}
            <div className="grid grid-cols-2 gap-2.5 w-full">
              <Select value={selectedStandard} onValueChange={setSelectedStandard}>
                <SelectTrigger className="w-full h-11 text-xs font-semibold rounded-xl bg-white border-slate-200 shadow-sm">
                  <SelectValue placeholder="Standard" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Standards</SelectItem>
                  {uniqueStandards.map((std) => (
                    <SelectItem key={std} value={std}>
                      Std {std}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedSection}
                onValueChange={setSelectedSection}
                disabled={selectedStandard === "all"}
              >
                <SelectTrigger className="w-full h-11 text-xs font-semibold rounded-xl bg-white border-slate-200 shadow-sm disabled:opacity-60">
                  <SelectValue placeholder="Section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {uniqueSectionsForStandard.map((sec) => (
                    <SelectItem key={sec} value={sec}>
                      Sec {sec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Row 2: Status Select & Bulk Generator Button in 2 Columns */}
            <div className="grid grid-cols-2 gap-2.5 w-full">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full h-11 text-xs font-semibold rounded-xl bg-white border-slate-200 shadow-sm">
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

              <Button asChild variant="outline" className="w-full h-11 border-blue-200 text-blue-700 hover:bg-blue-50 font-bold rounded-xl shadow-sm text-xs px-2">
                <a href="/main/bulk-documents">
                  <Printer className="h-3.5 w-3.5 mr-1.5 text-blue-600 shrink-0" />
                  <span className="truncate">Bulk Generator</span>
                </a>
              </Button>
            </div>

            {/* Row 3: Add Student Button (Full Width Below) */}
            {canManage && (
              <Button onClick={() => setAddOpen(true)} loading={addLoading} className="w-full h-11 font-bold rounded-xl shadow-sm">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            )}
          </div>

          {/* Desktop View Filter & Action Controls (>= sm) */}
          <div className="hidden sm:flex flex-row items-center gap-3 w-auto">
            <Select value={selectedStandard} onValueChange={setSelectedStandard}>
              <SelectTrigger className="w-[140px] h-9 text-sm font-semibold rounded-xl bg-white border-slate-200">
                <SelectValue placeholder="Standard" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Standards</SelectItem>
                {uniqueStandards.map((std) => (
                  <SelectItem key={std} value={std}>
                    Std {std}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedSection}
              onValueChange={setSelectedSection}
              disabled={selectedStandard === "all"}
            >
              <SelectTrigger className="w-[130px] h-9 text-sm font-semibold rounded-xl bg-white border-slate-200 disabled:opacity-60">
                <SelectValue placeholder="Section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {uniqueSectionsForStandard.map((sec) => (
                  <SelectItem key={sec} value={sec}>
                    Sec {sec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[130px] h-9 text-sm font-semibold rounded-xl bg-white border-slate-200">
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

            <Button asChild variant="outline" className="h-9 border-blue-200 text-blue-700 hover:bg-blue-50 font-bold rounded-xl">
              <a href="/main/bulk-documents">
                <Printer className="h-4 w-4 mr-2 text-blue-600" />
                Bulk Generator
              </a>
            </Button>

            {canManage && (
              <Button onClick={() => setAddOpen(true)} loading={addLoading} className="h-9 font-bold rounded-xl">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isMobile ? (
            <div className="p-3">
              {loading ? (
                <div className="flex flex-col gap-2.5">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-16 rounded-2xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : displayedStudents.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">No students found.</div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {displayedStudents.map((s) => (
                    <div
                      key={`${s.id}-${s.class}`}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3.5 flex items-center justify-between gap-3 hover:border-slate-200 transition-all select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Avatar className="h-11 w-11 shrink-0 border border-slate-100">
                          <AvatarImage src={s.avatar} className="object-cover" />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                            {s.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm truncate" title={s.name}>
                              {s.name}
                            </span>
                            <Badge variant={statusVariant(s.status)} className="text-[10px] px-2 py-0.5 font-bold shrink-0">
                              {s.status}
                            </Badge>
                          </div>
                          <span className="text-xs text-slate-500 truncate mt-0.5">
                            {s.email ? (
                              <a href={`mailto:${s.email}`} className="hover:underline hover:text-blue-600">
                                {s.email}
                              </a>
                            ) : (
                              "No email"
                            )}
                          </span>
                          <span className="text-[11px] font-bold text-slate-400 mt-1">
                            Class: {s.class}
                          </span>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100 shrink-0">
                            <MoreHorizontal className="h-4 w-4 text-slate-600" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl shadow-lg border-slate-100">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewDetails(s.id)}>
                            View Details
                          </DropdownMenuItem>
                          {canManage && (
                            <DropdownMenuItem onClick={() => handleEditClick(s.id)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              onClick={() => handleDelete(s.id)}
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                          {canManage && (
                            <>
                              <DropdownMenuLabel className="border-t mt-1 pt-2">Documents</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => generateIdCard(s)} disabled={docLoadingId === `${s.id}_idcard`}>
                                <CreditCard className="h-4 w-4 mr-2" />
                                {docLoadingId === `${s.id}_idcard` ? "Generating..." : "ID Card"}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => generateBonafide(s)} disabled={docLoadingId === `${s.id}_bonafide`}>
                                <FileCheck className="h-4 w-4 mr-2" />
                                {docLoadingId === `${s.id}_bonafide` ? "Generating..." : "Bonafide"}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4 sm:pl-6 min-w-[200px]">Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Class</TableHead>
                    <TableHead className="hidden md:table-cell">Joined At</TableHead>
                    <TableHead className="text-right pr-4 sm:pr-6" />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loading ? (
                    <TableSkeleton cols={5} rows={6} />
                  ) : displayedStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground text-sm">No students found.</TableCell>
                    </TableRow>
                  ) : (
                    displayedStudents.map((s) => (
                      <TableRow key={`${s.id}-${s.class}`} className="hover:bg-slate-50/60 transition-colors">
                        <TableCell className="flex items-center gap-3 py-3 pl-4 sm:pl-6">
                          <Avatar className="h-10 w-10 shrink-0 border border-slate-100">
                            <AvatarImage src={s.avatar} className="object-cover" />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                              {s.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">{s.name}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {s.email ? (
                                <a href={`mailto:${s.email}`} className="hover:underline hover:text-blue-600 transition-colors">
                                  {s.email}
                                </a>
                              ) : (
                                "No email"
                              )}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant={statusVariant(s.status)}>
                            {s.status}
                          </Badge>
                        </TableCell>

                        <TableCell className="hidden md:table-cell">{s.class}</TableCell>
                        <TableCell className="hidden md:table-cell">{s.joined}</TableCell>

                        <TableCell className="text-right pr-4 sm:pr-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100">
                                <MoreHorizontal className="h-4 w-4" />
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
                                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                  onClick={() => handleDelete(s.id)}
                                >
                                  <Trash className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              )}

                              {canManage && (
                                <>
                                  <DropdownMenuLabel className="border-t mt-1 pt-2">Documents</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => generateIdCard(s)} disabled={docLoadingId === `${s.id}_idcard`}>
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    {docLoadingId === `${s.id}_idcard` ? "Generating..." : "ID Card"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => generateBonafide(s)} disabled={docLoadingId === `${s.id}_bonafide`}>
                                    <FileCheck className="h-4 w-4 mr-2" />
                                    {docLoadingId === `${s.id}_bonafide` ? "Generating..." : "Bonafide"}
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        {/* Mobile Pagination Controls */}
        {isMobile && filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 border-t border-slate-200/80 select-none">
            <span className="text-xs font-bold text-slate-500">
              Page {currentPage} of {totalPages} ({filtered.length} students)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-9 px-3.5 text-xs font-bold rounded-xl border-slate-200 min-w-[40px]"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="h-9 px-3.5 text-xs font-bold rounded-xl border-slate-200 min-w-[40px]"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ADD */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="w-[92vw] sm:max-w-[600px] max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-3xl sm:rounded-2xl border-slate-100/80 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold text-slate-900">Add New Student</DialogTitle>
          </DialogHeader>
          <StudentForm mode="add" onSubmit={handleAddStudent} />
        </DialogContent>
      </Dialog>

      {/* EDIT */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="w-[92vw] sm:max-w-[600px] max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-3xl sm:rounded-2xl border-slate-100/80 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold text-slate-900">Edit Student</DialogTitle>
          </DialogHeader>

          {editingStudent && (
          <StudentForm
            key={editingStudent.id}   
            mode="edit"
            student={editingStudent}
            onSubmit={handleUpdateStudent}
          />
        )}

        </DialogContent>
      </Dialog>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="w-[92vw] sm:max-w-5xl max-h-[85vh] sm:max-h-[95vh] overflow-y-auto p-4 sm:p-6 rounded-3xl sm:rounded-2xl border-slate-100/80 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 border-b pb-4 mb-2">Student Details</DialogTitle>
          </DialogHeader>

          {selectedStudent && (
            <StudentDetails
              student={selectedStudent}
              onGenerateIdCard={generateIdCard}
              onGenerateBonafide={generateBonafide}
              canGenerateBonafide={canManage}
              canGenerateIdCard={canManage}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
