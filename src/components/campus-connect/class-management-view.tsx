"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn, formatDate } from "@/lib/utils";
import axios from "@/lib/axios";
import { 
  Users, 
  ArrowLeft, 
  Settings, 
  Search,
  MoreHorizontal,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Filter,
  Download,
  CreditCard,
  FileText,
  Trash2,
  Edit3,
  PlusCircle,
  Loader2,
  TrendingUp,
  MinusCircle

} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription,
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StudentForm } from "@/components/campus-connect/student-form";
import { PageSkeleton } from "@/components/ui/skeletons";
import { ADMIN_GROUP, TEACHING_STAFF_GROUP } from "@/config/roles";
import { useToast } from "@/hooks/use-toast";
import { getMySchedule } from "@/lib/api/schedule";
import { 
  Table as ShadcnTable, 
  TableBody as ShadcnTableBody, 
  TableCell as ShadcnTableCell, 
  TableHead as ShadcnTableHead, 
  TableHeader as ShadcnTableHeader, 
  TableRow as ShadcnTableRow 
} from "@/components/ui/table";

const DAYS = [
  { id: 1, name: "Monday" },
  { id: 2, name: "Tuesday" },
  { id: 3, name: "Wednesday" },
  { id: 4, name: "Thursday" },
  { id: 5, name: "Friday" },
  { id: 6, name: "Saturday" },
];

const to12h = (time: string) => {
  if (!time) return "";
  const [hStr, mStr] = time.split(":");
  const h = parseInt(hStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${period}`;
};

interface ClassManagementViewProps {
  classId: string | number;
  hideBackButton?: boolean;
}

export function ClassManagementView({ classId, hideBackButton = false }: ClassManagementViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [isEnrollLoading, setIsEnrollLoading] = useState(false);
  const [isTimetableOpen, setIsTimetableOpen] = useState(false);
  const [timetableData, setTimetableData] = useState<any[]>([]);
  const [isTimetableLoading, setIsTimetableLoading] = useState(false);

  // ─── Promotion State ───
  const [isPromoteOpen, setIsPromoteOpen] = useState(false);
  const [promoClasses, setPromoClasses] = useState<any[]>([]);
  const [promoDecisions, setPromoDecisions] = useState<Map<number, { decision: "promote" | "retain" | null; targetClassId: number | null }>>(new Map());
  const [promoSubmitting, setPromoSubmitting] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);

  const roleId = typeof window !== "undefined" ? Number(localStorage.getItem("role_id")) : null;
  const isAdmin = roleId ? ADMIN_GROUP.includes(roleId) : false;
  const isStaff = roleId ? [...ADMIN_GROUP, ...TEACHING_STAFF_GROUP].includes(roleId) : false;
  const isTeacher = roleId ? TEACHING_STAFF_GROUP.includes(roleId) : false;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classRes, studentsRes, profileRes] = await Promise.all([
        axios.get(`/api/classes/${classId}`),
        axios.get(`/api/students?class_id=${classId}`),
        axios.get("/api/auth/profile")
      ]);
      
      setClassInfo(classRes.data.data);
      setStudents(studentsRes.data.data);
      setProfile(profileRes.data.data);
    } catch (error) {
      console.error("Failed to fetch class details:", error);
      toast({
        title: "Error",
        description: "Failed to load class information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (classId) fetchData();
  }, [classId]);

  const handleDownload = async (endpoint: string, filename: string) => {
    try {
      toast({ title: "Generating Document", description: "Your PDF is being prepared..." });
      const response = await axios.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate document", variant: "destructive" });
    }
  };

  const handleEnrollStudent = async (form: any) => {
    try {
      setIsEnrollLoading(true);
      const parts = form.name.trim().split(/\s+/);
      const firstName = parts[0];
      const lastName = parts.slice(1).join(" ") || "-";

      await axios.post("/api/students", {
        stu_first_name: firstName,
        stu_last_name: lastName,
        email: form.email,
        address: form.address,
        date_of_birth: form.dob,
        bg_id: 1, 
        user_status_id: Number(form.user_status_id),
        joined_date: new Date().toISOString(),
        class_id: Number(classId),
        motherName: form.motherName,
        primaryContact: form.primaryContact,
        parentEmail: form.parentEmail || null,
        profile_url: form.avatar || null,
      });

      toast({ title: "Success", description: "Student enrolled successfully" });
      setIsEnrollOpen(false);
      fetchData();
    } catch (err: any) {
      toast({
        title: "Enrollment Failed",
        description: err?.response?.data?.message || "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsEnrollLoading(false);
    }
  };

  const handleDelete = async (studentId: string) => {
    if (!confirm("Are you sure you want to remove this student? This action is reversible by Admin.")) return;
    try {
      await axios.delete(`/api/students/${studentId}`);
      toast({ title: "Success", description: "Student removed successfully" });
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove student", variant: "destructive" });
    }
  };

  const filteredStudents = students.filter(s => 
    `${s.stu_first_name} ${s.stu_last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.admission_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* ─── Promotion Helpers ─── */
  const openPromotionDialog = async () => {
    setIsPromoteOpen(true);
    setPromoLoading(true);
    try {
      const res = await axios.get("/api/promotion/classes");
      setPromoClasses(res.data.data);

      // Init decisions for all students in current class
      const map = new Map<number, { decision: "promote" | "retain" | null; targetClassId: number | null }>();
      students.forEach((s) => {
        const currentNum = parseInt(classInfo?.class_name);
        let suggestedId: number | null = null;
        if (!isNaN(currentNum)) {
          const nextNum = currentNum + 1;
          const match = res.data.data.find(
            (c: any) => parseInt(c.class_name) === nextNum && c.section_name === classInfo?.section_name
          ) || res.data.data.find((c: any) => parseInt(c.class_name) === nextNum);
          suggestedId = match?.class_id || null;
        }
        map.set(s.student_id, { decision: null, targetClassId: suggestedId });
      });
      setPromoDecisions(map);
    } catch {
      toast({ title: "Error", description: "Failed to load classes", variant: "destructive" });
    } finally {
      setPromoLoading(false);
    }
  };

  const setPromoDecision = (studentId: number, decision: "promote" | "retain" | null) => {
    setPromoDecisions((prev) => {
      const next = new Map(prev);
      const entry = next.get(studentId);
      if (entry) next.set(studentId, { ...entry, decision });
      return next;
    });
  };

  const setPromoTarget = (studentId: number, classId: number) => {
    setPromoDecisions((prev) => {
      const next = new Map(prev);
      const entry = next.get(studentId);
      if (entry) next.set(studentId, { ...entry, targetClassId: classId });
      return next;
    });
  };

  const promoStats = (() => {
    let promote = 0, retain = 0;
    promoDecisions.forEach((e) => {
      if (e.decision === "promote") promote++;
      else if (e.decision === "retain") retain++;
    });
    return { promote, retain, total: promoDecisions.size };
  })();

  const handlePromoteSubmit = async () => {
    const promotions: { studentId: number; targetClassId: number }[] = [];
    promoDecisions.forEach((entry, studentId) => {
      if (entry.decision === "promote" && entry.targetClassId) {
        promotions.push({ studentId, targetClassId: entry.targetClassId });
      }
    });

    if (promotions.length === 0) {
      toast({ title: "No Promotions", description: "Mark at least one student for promotion.", variant: "destructive" });
      return;
    }

    setPromoSubmitting(true);
    try {
      const res = await axios.post("/api/promotion/promote", { promotions });
      toast({ title: "Success", description: res.data.message });
      setIsPromoteOpen(false);
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.message || "Failed to promote", variant: "destructive" });
    } finally {
      setPromoSubmitting(false);
    }
  };

  if (loading) return <PageSkeleton rows={15} />;
  if (!classInfo) return <div className="p-8 text-center text-slate-500 font-bold">Class not found</div>;

  const isOwner = Number(profile?.assigned_class_id) === Number(classId);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-10">
      
      <Card className="border-none shadow-sm overflow-hidden">
        {/* STANDARD CARD HEADER */}
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3 sm:gap-4">
            {!hideBackButton && (
              <Button 
                variant="ghost" 
                size="icon"
                className="h-9 w-9 shrink-0 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-all active:scale-95"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4 text-slate-600" />
              </Button>
            )}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight">
                  Class {classInfo.class_name} - {classInfo.section_name}
                </CardTitle>
                <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none font-bold uppercase text-[9px] py-0.5 px-2 tracking-widest shrink-0">
                  {isOwner ? "Your Assigned Class" : "View Class"}
                </Badge>
              </div>
              <CardDescription className="text-sm">
                Room {classInfo.room_number || "—"} • {students.length} Students
              </CardDescription>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 font-semibold"
              onClick={async () => {
                try {
                  setIsTimetableOpen(true);
                  setIsTimetableLoading(true);
                  const data = await getMySchedule({ class_id: Number(classId) });
                  setTimetableData(data || []);
                } catch (err) {
                  toast({ title: "Error", description: "Failed to load timetable", variant: "destructive" });
                } finally {
                  setIsTimetableLoading(false);
                }
              }}
            >
              <Calendar className="mr-2 h-4 w-4 text-slate-500" /> Timetable
            </Button>
            {(isAdmin || isOwner) && (
              <>
                {isOwner && students.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-9 font-semibold"
                    onClick={openPromotionDialog}
                  >
                    <TrendingUp className="mr-2 h-4 w-4" /> Promote
                  </Button>
                )}
                <Button 
                  size="sm" 
                  className="h-9 font-semibold"
                  onClick={() => setIsEnrollOpen(true)}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Enroll Student
                </Button>
                {isAdmin && (
                  <Button 
                    size="sm" 
                    variant="secondary"
                    className="h-9 font-semibold"
                  >
                    <Settings className="mr-2 h-4 w-4" /> Class Config
                  </Button>
                )}
              </>
            )}
          </div>
        </CardHeader>

        {/* STANDARDIZED STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 sm:p-6 bg-slate-50/10 border-b border-slate-100">
          <StatsCard
            title="Attendance"
            value={`${classInfo.attendance_rate || "0"}%`}
            icon={CheckCircle2}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
          />
          <StatsCard
            title="Pending Marks"
            value={classInfo.pending_marks || 0}
            icon={Edit3}
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
          />
          <StatsCard
            title="Class Strength"
            value={students.length}
            icon={Users}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-50"
          />
        </div>

        <CardContent className="p-0">
          {/* SEARCH CONTROLS */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b border-slate-100 bg-slate-50/20">
            <div className="space-y-0.5">
              <h3 className="font-semibold text-slate-800 text-sm">Student Enrollment Records</h3>
              <p className="text-xs text-slate-500">Manage academic particulars and documents</p>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search students..." 
                  className="h-9 pl-9 text-sm rounded-lg border-slate-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="ghost" size="icon" className="h-9 w-9 bg-white border border-slate-200 rounded-lg shadow-sm shrink-0">
                <Filter className="h-4 w-4 text-slate-400" />
              </Button>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-slate-100 bg-slate-50/10">
                  <TableHead className="w-[100px] font-semibold pl-6">Roll No.</TableHead>
                  <TableHead className="min-w-[200px] font-semibold">Student Particulars</TableHead>
                  <TableHead className="hidden md:table-cell font-semibold">Guardian Context</TableHead>
                  <TableHead className="hidden lg:table-cell font-semibold">Contact Details</TableHead>
                  {(isAdmin || isOwner) && <TableHead className="text-right pr-6 font-semibold">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((s, index) => (
                    <TableRow key={s.student_id} className="hover:bg-slate-50/50">
                      <TableCell className="pl-6 py-3">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-bold border-none text-xs">
                          {index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarImage src={s.profile_url} className="object-cover" />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                              {s.stu_first_name?.[0]}{s.stu_last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-slate-900 truncate">{s.stu_first_name} {s.stu_last_name}</span>
                            <span className="text-xs text-slate-500 truncate">Enrolled • {s.joined_date ? formatDate(s.joined_date) : "Pending"}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-700 text-xs truncate max-w-[150px]">{s.father_name || "-"}</span>
                          <span className="text-[10px] text-slate-400">Primary Guardian</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell py-3">
                        <div className="flex flex-col gap-0.5 text-xs text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <Mail size={12} className="text-slate-400 shrink-0" />
                            {(s.email || s.student_email) ? (
                              <a href={`mailto:${s.email || s.student_email}`} className="hover:underline hover:text-blue-600 truncate max-w-[150px]">
                                {s.email || s.student_email}
                              </a>
                            ) : (
                              "N/A"
                            )}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Phone size={12} className="text-slate-400 shrink-0" />
                            {(s.primary_contact || s.contact_number) ? (
                              <a href={`tel:${s.primary_contact || s.contact_number}`} className="hover:underline hover:text-blue-600 truncate">
                                {s.primary_contact || s.contact_number}
                              </a>
                            ) : (
                              "N/A"
                            )}
                          </span>
                        </div>
                      </TableCell>
                      {(isAdmin || isOwner) && (
                        <TableCell className="text-right pr-6 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => router.push(`/main/students/${s.student_id}`)}>
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/main/students/edit/${s.student_id}`)}>
                                Edit Basic Details
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Documents</DropdownMenuLabel>
                              <DropdownMenuItem 
                                  onClick={() => handleDownload(`/api/documents/id-card/${s.student_id}`, `ID_Card_${s.student_id}.pdf`)}
                              >
                                <CreditCard className="h-4 w-4 mr-2" /> Generate ID Card
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                  onClick={() => handleDownload(`/api/documents/bonafide/${s.student_id}`, `Bonafide_${s.student_id}.pdf`)}
                              >
                                <FileText className="h-4 w-4 mr-2" /> Bonafide Certificate
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                  onClick={() => handleDownload(`/api/documents/mark-sheet/${s.student_id}`, `Marksheet_${s.student_id}.pdf`)}
                              >
                                <FileText className="h-4 w-4 mr-2" /> Academic Marksheet
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                  onClick={() => handleDelete(s.student_id)}
                                  className="text-red-600 focus:bg-red-50 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Remove Student
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-16 text-center">
                       <div className="max-w-xs mx-auto space-y-2">
                          <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                             <Users className="h-6 w-6 text-slate-300" />
                          </div>
                          <p className="text-sm font-semibold text-slate-800">No matching records found</p>
                          <p className="text-xs text-slate-500 leading-relaxed px-4 text-pretty">We couldn't find any students matching your criteria.</p>
                       </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEnrollOpen} onOpenChange={setIsEnrollOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Enroll New Student</DialogTitle>
          </DialogHeader>
          <StudentForm
            onSubmit={handleEnrollStudent}
            loading={isEnrollLoading}
            onCancel={() => setIsEnrollOpen(false)}
            initialData={{ class_id: Number(classId) } as any}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={isTimetableOpen} onOpenChange={setIsTimetableOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between gap-4 pr-8">
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight">Class Timetable</DialogTitle>
              <p className="text-xs text-slate-500 mt-1">
                Weekly Schedule for {classInfo.class_name} - {classInfo.section_name}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="font-semibold h-8"
              onClick={() => handleDownload(`/api/documents/timetable/${classId}`, `Timetable_${classInfo.class_name}.pdf`)}
            >
              <Download className="mr-2 h-3.5 w-3.5" /> Download PDF
            </Button>
          </DialogHeader>
          
          <div className="mt-6 border rounded-xl overflow-hidden bg-slate-50/30">
            {isTimetableLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500/50" />
                <p className="text-xs text-slate-400 font-semibold">Fetching Timetable...</p>
              </div>
            ) : timetableData.length === 0 ? (
              <div className="py-20 text-center">
                <Calendar className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                <p className="text-sm font-semibold text-slate-800">No Schedule Found</p>
                <p className="text-xs text-slate-500 mt-1">A timetable has not been set for this class yet.</p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <ShadcnTable className="w-full min-w-[800px] border-collapse">
                  <ShadcnTableHeader>
                    <ShadcnTableRow className="hover:bg-transparent bg-white border-b border-slate-100">
                      <ShadcnTableHead className="w-[110px] font-semibold py-3 pl-4 text-xs">Time</ShadcnTableHead>
                      {DAYS.map(day => (
                        <ShadcnTableHead key={day.id} className="font-semibold py-3 text-xs">{day.name}</ShadcnTableHead>
                      ))}
                    </ShadcnTableRow>
                  </ShadcnTableHeader>
                  <ShadcnTableBody>
                    {Array.from(new Set(timetableData.map(s => s.period_number))).sort((a, b) => a - b).map((periodNum, pIdx) => {
                      const periodSchedules = timetableData.filter(s => s.period_number === periodNum);
                      const sample = periodSchedules[0];
                      const timeRange = `${to12h(sample?.start_time.substring(0, 5))} – ${to12h(sample?.end_time.substring(0, 5))}`;
                      const isLunchBreak = periodSchedules.every(s => s.is_break);

                      if (isLunchBreak) {
                        return (
                           <ShadcnTableRow key={periodNum} className="border-b border-slate-50 hover:bg-transparent">
                             <ShadcnTableCell className="py-3 pl-4">
                               <div className="text-xs font-semibold text-slate-800 leading-tight">{timeRange}</div>
                             </ShadcnTableCell>
                             <ShadcnTableCell colSpan={6} className="py-2 pr-4">
                               <div className="w-full bg-orange-50/50 rounded-lg py-1.5 border border-orange-100/50 flex items-center justify-center">
                                 <span className="text-orange-500 font-bold tracking-wider text-[10px] uppercase">Lunch Break</span>
                               </div>
                             </ShadcnTableCell>
                           </ShadcnTableRow>
                        );
                      }

                      return (
                        <ShadcnTableRow key={periodNum} className="border-b border-slate-50 hover:bg-transparent">
                          <ShadcnTableCell className="py-3 pl-4 align-top">
                            <div className="text-xs font-semibold text-slate-800 leading-tight">{timeRange}</div>
                            <div className="text-[10px] text-slate-400 uppercase mt-1">Period {pIdx + 1}</div>
                          </ShadcnTableCell>
                          {DAYS.map(day => {
                            const cell = timetableData.find(s => s.period_number === periodNum && s.day_of_week === day.id);
                            return (
                              <ShadcnTableCell key={day.id} className="p-1 min-w-[120px] h-[70px] align-top">
                                {cell ? (
                                  <div className="bg-white border border-slate-100 rounded-lg p-2 h-full shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-center">
                                    <div className="text-xs font-bold text-slate-800 uppercase leading-tight truncate" title={cell.subject_name}>
                                      {cell.subject_name}
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-1 truncate">
                                      {cell.staff_first_name} {cell.staff_last_name}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="h-full border border-dashed border-slate-100 rounded-lg flex items-center justify-center">
                                    <span className="text-slate-200 text-[10px]">-</span>
                                  </div>
                                )}
                              </ShadcnTableCell>
                            );
                          })}
                        </ShadcnTableRow>
                      );
                    })}
                  </ShadcnTableBody>
                </ShadcnTable>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* ─── Promotion Dialog ─── */}
      <Dialog open={isPromoteOpen} onOpenChange={setIsPromoteOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Promote Students — {classInfo?.class_name} {classInfo?.section_name}
            </DialogTitle>
            <p className="text-xs text-slate-500 mt-1">
              Select which students to promote or retain in the current class
            </p>
          </DialogHeader>

          {promoLoading ? (
            <div className="py-20 flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
              <p className="text-xs font-semibold text-slate-400">Loading classes…</p>
            </div>
          ) : (
            <>
              {/* Stats summary */}
              <div className="flex items-center gap-4 px-1 py-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-xs font-semibold text-emerald-700">{promoStats.promote} Promote</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <span className="text-xs font-semibold text-amber-700">{promoStats.retain} Retain</span>
                </div>
                <div className="flex-1" />
                <span className="text-xs text-slate-500">{promoStats.total} students</span>
              </div>

              {/* Bulk actions */}
              <div className="flex items-center gap-2 py-2">
                <button
                  onClick={() => { promoDecisions.forEach((_, id) => setPromoDecision(id, "promote")); }}
                  className="text-xs font-semibold text-emerald-600 hover:underline"
                >
                  Promote All
                </button>
                <span className="text-slate-200">·</span>
                <button
                  onClick={() => { promoDecisions.forEach((_, id) => setPromoDecision(id, "retain")); }}
                  className="text-xs font-semibold text-amber-600 hover:underline"
                >
                  Retain All
                </button>
                <span className="text-slate-200">·</span>
                <button
                  onClick={() => { promoDecisions.forEach((_, id) => setPromoDecision(id, null)); }}
                  className="text-xs font-semibold text-slate-400 hover:underline"
                >
                  Reset
                </button>
              </div>

              {/* Student list */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-50 -mx-6 px-6">
                {students.map((s) => {
                  const entry = promoDecisions.get(s.student_id);
                  const decision = entry?.decision || null;
                  const targetId = entry?.targetClassId || null;
                  const initials = (s.stu_first_name?.[0] || "") + (s.stu_last_name?.[0] || "");

                  return (
                    <div
                      key={s.student_id}
                      className={cn(
                        "flex items-center gap-3 py-3 transition-colors",
                        decision === "promote" && "bg-emerald-50/40",
                        decision === "retain" && "bg-amber-50/40"
                      )}
                    >
                      {/* Avatar + name */}
                      <Avatar className="h-8 w-8 rounded-lg shrink-0">
                        <AvatarImage src={s.profile_url} className="object-cover" />
                        <AvatarFallback className="bg-slate-100 text-slate-400 font-bold text-[10px]">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {s.stu_first_name} {s.stu_last_name}
                        </p>
                        <p className="text-[10px] text-slate-400">ID: {s.student_id}</p>
                      </div>

                      {/* Toggle */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => setPromoDecision(s.student_id, "promote")}
                          className={cn(
                            "px-2.5 py-1 rounded-l-md text-xs font-semibold border transition-all",
                            decision === "promote"
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "bg-white text-slate-400 border-slate-200 hover:border-emerald-300"
                          )}
                        >
                          Promote
                        </button>
                        <button
                          onClick={() => setPromoDecision(s.student_id, "retain")}
                          className={cn(
                            "px-2.5 py-1 rounded-r-md text-xs font-semibold border transition-all",
                            decision === "retain"
                              ? "bg-amber-500 text-white border-amber-500"
                              : "bg-white text-slate-400 border-slate-200 hover:border-amber-300"
                          )}
                        >
                          Retain
                        </button>
                      </div>

                      {/* Target class */}
                      <div className="w-[130px] shrink-0">
                        {decision === "promote" ? (
                          <Select
                            value={targetId ? String(targetId) : ""}
                            onValueChange={(v) => setPromoTarget(s.student_id, Number(v))}
                          >
                            <SelectTrigger className="h-8 text-xs font-medium">
                              <SelectValue placeholder="Next class" />
                            </SelectTrigger>
                            <SelectContent>
                              {promoClasses.map((c: any) => (
                                <SelectItem key={c.class_id} value={String(c.class_id)}>
                                  {c.class_name}{c.section_name ? ` - ${c.section_name}` : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : decision === "retain" ? (
                          <span className="text-xs font-medium text-amber-600 flex items-center gap-1">
                            <MinusCircle className="h-3 w-3" /> Same class
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsPromoteOpen(false)} className="text-xs font-semibold">
                  Cancel
                </Button>
                <Button
                  onClick={handlePromoteSubmit}
                  disabled={promoStats.promote === 0 || promoSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold gap-2"
                >
                  {promoSubmitting ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing…</>
                  ) : (
                    <><CheckCircle2 className="h-3.5 w-3.5" /> Apply Promotions ({promoStats.promote})</>
                  )}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
