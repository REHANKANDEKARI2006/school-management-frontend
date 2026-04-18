"use client";

import * as React from "react";
import axios from "@/lib/axios";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { type Student } from "@/types";
import { Button } from "../ui/button";
import { 
  CreditCard, Mail, Phone, User, MapPin, Cake, Award, Fingerprint, CalendarDays, KeyRound,
  LayoutDashboard, ClipboardCheck, FileText, Info, ChevronLeft, ChevronRight
} from "lucide-react";
import { Separator } from "../ui/separator";
import { StudentAttendanceHistory } from "./student-attendance-history";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface StudentDetailsProps {
  student: Student;
  onGenerateIdCard: (student: Student) => void;
  onGenerateBonafide: (student: Student) => void;
  canGenerateBonafide?: boolean;
}

const getStatusVariant = (status?: string) => {
  switch (status) {
    case "Active":
      return "default";
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
    default:
      return "outline";
  }
};

export function StudentDetails({
  student,
  onGenerateIdCard,
  onGenerateBonafide,
  canGenerateBonafide = true,
}: StudentDetailsProps) {
  
  // Format Date helpers
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toISOString().split('T')[0];
    } catch {
      return dateStr.split('T')[0];
    }
  };

  return (
    <div className="space-y-8 pb-8 bg-slate-50/20 dark:bg-slate-900/10 min-h-screen">
      {/* HEADER INFO (Always Visible) */}
      <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-8 pt-8 px-8 pb-4">
        <div className="relative">
          <Avatar className="h-32 w-32 ring-4 ring-white dark:ring-slate-800 shadow-xl bg-background">
            <AvatarImage src={student.avatar} alt={student.name} className="object-cover" />
            <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-indigo-500 to-purple-500 text-white leading-none">
              {student.fallback}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1">
             <Badge variant={getStatusVariant(student.status)} className="h-4 w-4 rounded-full p-0 flex items-center justify-center border-2 border-white dark:border-slate-800" title={student.status}>
                <span className="sr-only">{student.status}</span>
             </Badge>
          </div>
        </div>
        
        <div className="flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {student.name}
            </h2>
            <Badge variant={getStatusVariant(student.status)} className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm rounded-full bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800">
              {student.status || "Active"}
            </Badge>
          </div>
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-1.5 text-sm text-slate-500 dark:text-slate-400 font-medium">
            <div className="flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5 opacity-60" />
              <span className="tracking-tight">{student.id ? `#STU-${student.id.padStart(4, "0")}` : "No ID Assigned"}</span>
            </div>
            {student.email && (
              <div className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors">
                <Mail className="h-3.5 w-3.5 opacity-60" />
                <span>{student.email}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <LayoutDashboard className="h-3.5 w-3.5 opacity-60" />
              <span className="text-indigo-600/80 dark:text-indigo-400 font-semibold">{student.class || "Not Enrolled"}</span>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS ROW */}
        <div className="flex flex-wrap justify-center gap-2.5">
          <Button variant="outline" size="sm" onClick={() => onGenerateIdCard(student)} className="h-9 px-3.5 border-slate-200 shadow-sm hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all">
            <CreditCard className="mr-2 h-4 w-4" />
            ID Card
          </Button>
          {canGenerateBonafide && (
            <Button variant="outline" size="sm" onClick={() => onGenerateBonafide(student)} className="h-9 px-3.5 border-slate-200 shadow-sm hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50/50 transition-all">
               <Award className="mr-2 h-4 w-4" />
              Bonafide
            </Button>
          )}
        </div>
      </div>

      <div className="px-8 pb-8">
        <Tabs defaultValue="overview" className="w-full space-y-8">
          <TabsList className="bg-slate-200/50 dark:bg-slate-800/50 p-1.5 h-12 w-full justify-start md:w-auto rounded-xl backdrop-blur-sm shadow-inner">
            <TabsTrigger value="overview" className="rounded-md px-5 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all h-9 gap-2">
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">Profile Overview</span>
              <span className="sm:hidden text-[11px]">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="attendance" className="rounded-md px-5 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all h-9 gap-2">
              <ClipboardCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Attendance & Schedule</span>
              <span className="sm:hidden text-[11px]">Schedule</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="rounded-md px-5 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all h-9 gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Document History</span>
              <span className="sm:hidden text-[11px]">History</span>
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW CONTENT */}
          <TabsContent value="overview" className="mt-0 space-y-6 animate-in fade-in-50 duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ACADEMIC & PERSONAL */}
              <Card className="shadow-sm border-slate-200 overflow-hidden group">
                <CardHeader className="pb-4 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 transition-colors group-hover:bg-indigo-50/30 dark:group-hover:bg-indigo-900/10">
                  <CardTitle className="text-sm font-bold flex items-center gap-2.5 text-slate-800 dark:text-slate-200 uppercase tracking-widest text-[11px]">
                    <Fingerprint className="h-4 w-4 text-indigo-500" />
                    Academic & Personal Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-y-6 gap-x-6 p-6 text-sm">
                  <div className="space-y-1.5">
                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                       Standard
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">{student.class || "N/A"}</span>
                  </div>
                  
                  <div className="space-y-1.5">
                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                      Admission Date
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <CalendarDays className="h-3.5 w-3.5 text-indigo-400" />
                      {formatDate(student.date)}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                      Blood Group
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-black bg-rose-50 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400 border border-rose-100 dark:border-rose-800 uppercase tracking-tighter">
                      {student.bloodGroup || "O+"}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                      Date of Birth
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Cake className="h-3.5 w-3.5 text-indigo-400" />
                      {formatDate(student.dob)}
                    </span>
                  </div>
                  
                  <div className="space-y-2 col-span-2 pt-4 border-t border-slate-50 dark:border-slate-800">
                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-rose-400" /> Current Residential Address
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      {student.address || "No address provided."}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* GUARDIAN INFO */}
              <Card className="shadow-sm border-slate-200 overflow-hidden group">
                <CardHeader className="pb-4 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 transition-colors group-hover:bg-emerald-50/30 dark:group-hover:bg-emerald-900/10">
                  <CardTitle className="text-sm font-bold flex items-center gap-2.5 text-slate-800 dark:text-slate-200 uppercase tracking-widest text-[11px]">
                    <User className="h-4 w-4 text-emerald-500" />
                    Parent / Guardian Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 text-sm space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-1.5">
                        <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block">Father's Name</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-base">{student.fatherName || "John Doe"}</span>
                     </div>
                     <div className="space-y-1.5">
                        <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block">Mother's Name</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-base">{student.motherName || "Jane Doe"}</span>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-50 dark:border-slate-800">
                    <div className="space-y-2">
                      <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block flex items-center gap-1.5"><Phone className="h-3 w-3 text-emerald-500" /> Primary Contact</span>
                      <span className="font-bold text-slate-900 dark:text-slate-200 text-lg tabular-nums">{student.primaryContact || "N/A"}</span>
                    </div>
                    {student.secondaryContact && (
                      <div className="space-y-2">
                        <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block flex items-center gap-1.5"><Phone className="h-3 w-3 text-emerald-400" /> WhatsApp / Alt</span>
                        <span className="font-bold text-slate-900 dark:text-secondary-foreground text-lg tabular-nums">{student.secondaryContact}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-4 border-t border-slate-50 dark:border-slate-800">
                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block flex items-center gap-1.5"><Mail className="h-3 w-3 text-emerald-500" /> Guardian Email</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{student.parentEmail || "N/A"}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ATTENDANCE CONTENT */}
          <TabsContent value="attendance" className="mt-0 animate-in slide-in-from-right-5 fade-in duration-300">
            <StudentAttendanceHistory student={student} />
          </TabsContent>

          {/* DOCUMENTS CONTENT */}
          <TabsContent value="documents" className="mt-0 animate-in slide-in-from-right-5 fade-in duration-300">
             {student.id && <DocumentHistoryList studentId={student.id} />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function DocumentHistoryList({ studentId }: { studentId: string }) {
  const [history, setHistory] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);
  const ITEMS_PER_PAGE = 5;

  React.useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`/api/documents/history/${studentId}`);
        setHistory(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch document history:", err, studentId);
      } finally {
        setLoading(false);
      }
    };
    if (studentId) fetchHistory();
  }, [studentId]);

  if (loading) return null;

  // Pagination Logic
  const totalPages = Math.ceil(history.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedHistory = history.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <Card className="shadow-none border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50 overflow-hidden flex flex-col h-full min-h-[460px]">
      <CardHeader className="pb-4 border-b border-slate-50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-800/20 py-4 px-6 shrink-0">
        <CardTitle className="text-xs font-bold flex items-center gap-2 text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">
          <Award className="h-3.5 w-3.5" />
          Document Generation History
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 overflow-hidden">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
             <div className="h-12 w-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                <FileText className="h-6 w-6 text-slate-300" />
             </div>
             <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No History Available</p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-800/20">
                <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                  <TableHead className="px-6 text-xs font-bold uppercase tracking-wider text-slate-400">Document Type</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Generated By</TableHead>
                  <TableHead className="text-right px-6 text-xs font-bold uppercase tracking-wider text-slate-400">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedHistory.map((h, i) => (
                  <TableRow key={i} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/30 dark:hover:bg-slate-800/10 h-16 transition-colors">
                    <TableCell className="px-6">
                      <div className="flex items-center gap-3">
                         <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                           {h.doc_type === 'ID_CARD' ? 'ID Card' : 'Bonafide Certificate'}
                         </span>
                         <Badge variant="outline" className="text-[9px] h-4 py-0 px-1 font-black uppercase tracking-wider bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700">
                           {h.template_id}
                         </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-600 dark:text-slate-400">
                          <User className="h-3.5 w-3.5 opacity-50" />
                          {h.generated_by_name || 'System'}
                       </div>
                    </TableCell>
                    <TableCell className="text-right px-6 text-xs font-medium text-slate-500 tabular-nums">
                      {new Date(h.timestamp).toLocaleString('en-US', { 
                          month: 'short', day: 'numeric', year: 'numeric', 
                          hour: 'numeric', minute: '2-digit' 
                      })}
                    </TableCell>
                  </TableRow>
                ))}
                
                {/* Pad empty rows if not enough on last page to maintain stable height */}
                {paginatedHistory.length < ITEMS_PER_PAGE && Array.from({ length: ITEMS_PER_PAGE - paginatedHistory.length }).map((_, i) => (
                  <TableRow key={`empty-${i}`} className="border-slate-100 dark:border-slate-800 h-16 pointer-events-none opacity-0">
                    <TableCell colSpan={3}>-</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {history.length > ITEMS_PER_PAGE && (
        <CardFooter className="py-3 px-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/10 shrink-0">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Page <span className="text-indigo-600 dark:text-indigo-400">{currentPage}</span> of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-md border-slate-100 dark:border-slate-800"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-md border-slate-100 dark:border-slate-800"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
