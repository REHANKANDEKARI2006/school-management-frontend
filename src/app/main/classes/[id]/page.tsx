"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "@/lib/axios";
import RouteGuard from "@/components/auth/RouteGuard";
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
  Edit3
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
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
import { PageSkeleton } from "@/components/ui/skeletons";
import { ADMIN_GROUP, TEACHING_STAFF_GROUP } from "@/config/roles";
import { useToast } from "@/hooks/use-toast";

export default function ClassDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const roleId = typeof window !== "undefined" ? Number(localStorage.getItem("role_id")) : null;
  const isAdmin = roleId ? ADMIN_GROUP.includes(roleId) : false;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classRes, studentsRes] = await Promise.all([
        axios.get(`/api/classes/${id}`),
        axios.get(`/api/students?class_id=${id}`)
      ]);
      
      setClassInfo(classRes.data.data);
      setStudents(studentsRes.data.data);
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
    if (id) fetchData();
  }, [id]);

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

  if (loading) return <PageSkeleton rows={15} />;
  if (!classInfo) return <div className="p-8 text-center text-slate-500 font-bold">Class not found</div>;

  return (
    <RouteGuard allowedRoles={[...ADMIN_GROUP, ...TEACHING_STAFF_GROUP]}>
      <div className="space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-10">
        
        {/* TOP COMPACT HEADER */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button 
               variant="ghost" 
               size="icon"
               className="h-9 w-9 bg-white border border-slate-100 rounded-lg shadow-sm hover:shadow-md transition-all active:scale-95"
               onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 text-slate-600" />
            </Button>
            <div>
               <div className="flex items-center gap-2 mb-0.5">
                  <h1 className="text-xl font-black text-slate-800 tracking-tight">Class {classInfo.class_name} - {classInfo.section_name}</h1>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none font-black uppercase text-[8px] py-0 h-4 tracking-widest px-2">Manage Class</Badge>
               </div>
               <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1"><Users size={10} className="text-blue-400" /> {students.length} Students</span>
                  <span className="flex items-center gap-1 text-slate-200">|</span>
                  <span className="flex items-center gap-1"><ShieldCheck size={10} className="text-emerald-400" /> Room {classInfo.room_number || "A-102"}</span>
               </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             <Button 
                variant="ghost" 
                size="sm" 
                className="bg-white border border-slate-100 shadow-sm text-[10px] uppercase font-bold text-slate-600 h-9 rounded-lg px-4"
                onClick={() => handleDownload(`/api/documents/timetable/${id}`, `Timetable_${classInfo.class_name}.pdf`)}
              >
                <Calendar className="mr-2 h-3.5 w-3.5" /> Timetable
             </Button>
             {isAdmin && (
               <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-[10px] uppercase font-bold h-9 rounded-lg shadow-sm px-4">
                  <Settings className="mr-2 h-3.5 w-3.5" /> Class Config
               </Button>
             )}
          </div>
        </div>

        {/* COMPACT STATS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
           {[
             { label: "Overall Attendance", value: "94.2%", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
             { label: "Pending Marks", value: "2", icon: Edit3, color: "text-amber-600", bg: "bg-amber-50" },
             { label: "Class Strength", value: students.length.toString(), icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
             { label: "Class Performance", value: "B+", icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
           ].map((stat, i) => (
             <Card key={i} className="rounded-[12px] border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] bg-white overflow-hidden">
                <div className="p-3.5 flex items-center justify-between">
                   <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
                      <h3 className="text-lg font-black text-slate-800 leading-none">{stat.value}</h3>
                   </div>
                   <div className={`${stat.bg} p-2 rounded-lg`}>
                      <stat.icon className={`${stat.color} h-4 w-4`} />
                   </div>
                </div>
             </Card>
           ))}
        </div>

        {/* MAIN DATA SECTION */}
        <Card className="rounded-[12px] border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white overflow-hidden">
          <div className="border-b border-slate-50 bg-slate-50/30 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-[0.1em]">Student Enrollment Records</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Manage academic particulars and documents</p>
            </div>
            
            <div className="flex items-center gap-2">
               <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input 
                    placeholder="Search by name or ID..." 
                    className="h-9 pl-9 rounded-lg border-slate-100 bg-white text-[11px] font-medium shadow-inner placeholder:text-slate-300"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>
               <Button variant="ghost" size="icon" className="h-9 w-9 bg-white border border-slate-100 rounded-lg shadow-sm">
                  <Filter className="h-4 w-4 text-slate-400" />
               </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-slate-50 bg-slate-50/20">
                  <TableHead className="w-[80px] font-black text-slate-400 uppercase text-[9px] tracking-widest pl-6 py-2">Rank/ID</TableHead>
                  <TableHead className="min-w-[200px] font-black text-slate-400 uppercase text-[9px] tracking-widest py-2">Student Particulars</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase text-[9px] tracking-widest py-2">Guardian Context</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase text-[9px] tracking-widest py-2">Contact Details</TableHead>
                  <TableHead className="text-right pr-6 font-black text-slate-400 uppercase text-[9px] tracking-widest py-2">Management</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((s, index) => (
                    <TableRow key={s.student_id} className="group hover:bg-slate-50/40 transition-all border-slate-50 ring-inset hover:ring-1 hover:ring-blue-100/50">
                      <TableCell className="pl-6 py-2.5">
                        <div className="font-black text-slate-300 text-[10px] mb-0.5">#{index + 1}</div>
                        <Badge variant="secondary" className="bg-slate-100/80 text-slate-500 font-black border-none text-[8px] h-4 tracking-tighter shadow-sm">
                           {s.admission_number || "ADM000"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 rounded-lg shadow-sm border border-slate-100">
                            <AvatarImage src={s.profile_url} className="object-cover" />
                            <AvatarFallback className="bg-slate-100 text-slate-400 font-black text-[10px] uppercase">
                              {s.stu_first_name?.[0]}{s.stu_last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-black text-slate-800 text-[11px] leading-tight uppercase tracking-tight">{s.stu_first_name} {s.stu_last_name}</div>
                            <div className="text-[8px] font-black text-blue-400 uppercase tracking-widest mt-0.5">Enrolled • {s.joined_date ? new Date(s.joined_date).toLocaleDateString() : "Pending"}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div className="text-[10px] font-bold text-slate-600">{s.guardian_name || "-"}</div>
                        <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Primary Guardian</div>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold">
                            <Mail size={10} className="text-slate-300" />
                            {s.email || "N/A"}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold">
                            <Phone size={10} className="text-slate-300" />
                            {s.contact_number || "N/A"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6 py-2.5">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md hover:bg-white hover:shadow-sm transition-all">
                              <MoreHorizontal className="h-4 w-4 text-slate-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-lg border-slate-100 shadow-xl p-1 w-48">
                             <DropdownMenuLabel className="text-[8px] font-black uppercase text-slate-400 px-3 py-1.5 tracking-[0.2em]">Records</DropdownMenuLabel>
                             <DropdownMenuItem onClick={() => router.push(`/main/students/${s.student_id}`)} className="rounded-md flex items-center gap-2 text-[10px] font-bold py-2 cursor-pointer hover:bg-slate-50">
                               <Users size={12} className="text-slate-400" /> View Profile
                             </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => router.push(`/main/students/edit/${s.student_id}`)} className="rounded-md flex items-center gap-2 text-[10px] font-bold py-2 cursor-pointer hover:bg-slate-50">
                               <Edit3 size={12} className="text-slate-400" /> Edit Basic Details
                             </DropdownMenuItem>
                             
                             <DropdownMenuSeparator className="bg-slate-50" />
                             <DropdownMenuLabel className="text-[8px] font-black uppercase text-slate-400 px-3 py-1.5 tracking-[0.2em]">Issuance</DropdownMenuLabel>
                             <DropdownMenuItem 
                                onClick={() => handleDownload(`/api/documents/id-card/${s.student_id}`, `ID_Card_${s.student_id}.pdf`)}
                                className="rounded-md flex items-center gap-2 text-[10px] font-bold py-2 cursor-pointer hover:bg-slate-50"
                             >
                               <CreditCard size={12} className="text-blue-500" /> Generate ID Card
                             </DropdownMenuItem>
                             <DropdownMenuItem 
                                onClick={() => handleDownload(`/api/documents/bonafide/${s.student_id}`, `Bonafide_${s.student_id}.pdf`)}
                                className="rounded-md flex items-center gap-2 text-[10px] font-bold py-2 cursor-pointer hover:bg-slate-50"
                             >
                               <FileText size={12} className="text-emerald-500" /> Bonafide Certificate
                             </DropdownMenuItem>
                             <DropdownMenuItem 
                                onClick={() => handleDownload(`/api/documents/mark-sheet/${s.student_id}`, `Marksheet_${s.student_id}.pdf`)}
                                className="rounded-md flex items-center gap-2 text-[10px] font-bold py-2 cursor-pointer hover:bg-slate-50"
                             >
                               <FileText size={12} className="text-amber-500" /> Academic Marksheet
                             </DropdownMenuItem>

                             <DropdownMenuSeparator className="bg-slate-50" />
                             <DropdownMenuItem 
                                onClick={() => handleDelete(s.student_id)}
                                className="rounded-md flex items-center gap-2 text-[10px] font-black py-2 cursor-pointer text-red-600 hover:bg-red-50/50"
                             >
                               <Trash2 size={12} className="text-red-400" /> Remove Student
                             </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-16 text-center">
                       <div className="max-w-xs mx-auto space-y-2">
                          <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                             <Users className="h-6 w-6 text-slate-200" />
                          </div>
                          <p className="text-[11px] font-black text-slate-800 uppercase tracking-widest">No matching records found</p>
                          <p className="text-[10px] font-bold text-slate-400 leading-relaxed px-4 text-pretty">We couldn't find any students matching your criteria.</p>
                       </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </RouteGuard>
  );
}
