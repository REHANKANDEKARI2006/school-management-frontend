"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, Building2, Calendar, Mail, Phone, GraduationCap, 
  Info, KeyRound, LayoutDashboard 
} from "lucide-react";
import { FacultySchedule } from "./faculty-schedule";

interface Props {
  faculty: any;
}

const getStatusVariant = (status?: string) => {
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

export function FacultyDetails({ faculty }: Props) {
  const name = `${faculty.staff_first_name || ""} ${faculty.staff_last_name || ""}`.trim();
  const fallback = (faculty.staff_first_name?.[0] || "") + (faculty.staff_last_name?.[0] || "");
  const status = faculty.status_name || (faculty.user_status_id === 1 ? "Active" : "Inactive");
  
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toISOString().split('T')[0];
    } catch {
      return dateStr.split('T')[0];
    }
  };

  return (
    <div className="space-y-8 pb-8 bg-slate-50/20 dark:bg-slate-900/10 rounded-lg min-h-[400px]">
      {/* HEADER INFO (Always Visible) */}
      <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-8 pt-4 px-4 sm:px-8 pb-4">
        <div className="relative">
          <Avatar className="h-32 w-32 ring-4 ring-white dark:ring-slate-800 shadow-xl bg-background shrink-0">
            <AvatarImage src={faculty.profile_url} alt={name} className="object-cover h-full w-full" />
            <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-indigo-500 to-purple-500 text-white leading-none">
              {fallback}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1">
             <Badge variant={getStatusVariant(status)} className="h-4 w-4 rounded-full p-0 flex items-center justify-center border-2 border-white dark:border-slate-800" title={status}>
                <span className="sr-only">{status}</span>
             </Badge>
          </div>
        </div>
        
        <div className="flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {name}
            </h2>
            <Badge variant={getStatusVariant(status)} className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm rounded-full bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800">
              {status}
            </Badge>
          </div>
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-1.5 text-sm text-slate-500 dark:text-slate-400 font-medium">
            <div className="flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5 opacity-60" />
              <span className="tracking-tight">{faculty.staff_id ? `#FAC-${String(faculty.staff_id).padStart(4, "0")}` : "No ID Assigned"}</span>
            </div>
            {faculty.email && (
              <div className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors">
                <Mail className="h-3.5 w-3.5 opacity-60" />
                <a href={`mailto:${faculty.email}`} className="hover:underline hover:text-indigo-600 transition-colors">
                  {faculty.email}
                </a>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <LayoutDashboard className="h-3.5 w-3.5 opacity-60" />
              <span className="text-indigo-600/80 dark:text-indigo-400 font-semibold">{faculty.dept_name || "General"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 pb-4">
        <Tabs defaultValue="overview" className="w-full space-y-6">
          <TabsList className="bg-slate-200/50 dark:bg-slate-800/50 p-1.5 h-12 w-full justify-start md:w-auto rounded-xl backdrop-blur-sm shadow-inner">
            <TabsTrigger value="overview" className="rounded-md px-3 sm:px-5 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all h-9 gap-2">
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">Profile Overview</span>
              <span className="sm:hidden text-[11px]">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="rounded-md px-3 sm:px-5 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all h-9 gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Weekly Schedule</span>
              <span className="sm:hidden text-[11px]">Schedule</span>
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW CONTENT */}
          <TabsContent value="overview" className="mt-0 space-y-6 animate-in fade-in-50 duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ROLE & DEPARTMENT */}
              <Card className="shadow-sm border-slate-200 overflow-hidden group">
                <CardHeader className="pb-4 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 transition-colors group-hover:bg-indigo-50/30 dark:group-hover:bg-indigo-900/10">
                  <CardTitle className="text-sm font-bold flex items-center gap-2.5 text-slate-800 dark:text-slate-200 uppercase tracking-widest text-[11px]">
                    <Building2 className="h-4 w-4 text-indigo-500" />
                    Role & Department Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-6 p-4 sm:p-6 text-sm">
                  <div className="space-y-1.5">
                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                      Department
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">{faculty.dept_name || "Not Assigned"}</span>
                  </div>
                  
                  <div className="space-y-1.5">
                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                      Subject Specialization
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
                      {faculty.subject_name || "General"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* PERSONAL & BACKGROUND */}
              <Card className="shadow-sm border-slate-200 overflow-hidden group">
                <CardHeader className="pb-4 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 transition-colors group-hover:bg-emerald-50/30 dark:group-hover:bg-emerald-900/10">
                  <CardTitle className="text-sm font-bold flex items-center gap-2.5 text-slate-800 dark:text-slate-200 uppercase tracking-widest text-[11px]">
                    <GraduationCap className="h-4 w-4 text-emerald-500" />
                    Personal & Background Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-6 p-4 sm:p-6 text-sm">
                  <div className="space-y-1.5">
                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                      Contact Number
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-indigo-400" />
                      {faculty.contact ? (
                        <a href={`tel:${faculty.contact}`} className="hover:underline hover:text-indigo-600 transition-colors">
                          {faculty.contact}
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                      Qualification
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">{faculty.qualification || "N/A"}</span>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2 pt-4 border-t border-slate-50 dark:border-slate-800">
                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                      Joining Date
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                      {formatDate(faculty.joining_date)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* WEEKLY SCHEDULE CONTENT */}
          <TabsContent value="schedule" className="mt-0 animate-in slide-in-from-right-5 fade-in duration-300">
            <FacultySchedule faculty={faculty} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
