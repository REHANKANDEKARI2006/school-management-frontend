"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Building2, Calendar, Mail, Phone, GraduationCap } from "lucide-react";

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
    <div className="space-y-6 pb-4">
      {/* HEADER INFO */}
      <div className="flex flex-col items-center text-center gap-4 pt-4 px-4">
        <Avatar className="h-28 w-28 ring-4 ring-background shadow-lg bg-background">
          <AvatarImage src={faculty.profile_url} alt={name} className="object-cover h-full w-full" />
          <AvatarFallback className="text-3xl font-semibold text-primary">{fallback}</AvatarFallback>
        </Avatar>
        
        <div className="flex flex-col items-center gap-1.5">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-3">
            {name}
            <Badge variant={getStatusVariant(status)} className="px-2 py-0.5 text-xs shadow-sm capitalize rounded-full">
              {status}
            </Badge>
          </h2>
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            <Mail className="h-3.5 w-3.5" />
            {faculty.email || "No Email"}
          </p>
        </div>
      </div>

      <div className="px-2">
        <div className="grid gap-4 md:grid-cols-2">
          {/* ACADEMIC & ROLE */}
          <Card className="border shadow-sm overflow-hidden">
            <div className="bg-slate-50/50 dark:bg-slate-900/50 border-b px-4 py-3 text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Building2 className="h-4 w-4 text-primary" />
              Role & Department
            </div>
            <CardContent className="p-4 grid gap-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center shrink-0">
                  <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Department</p>
                  <p className="text-sm font-medium">{faculty.dept_name || "-"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center shrink-0">
                  <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Subject</p>
                  <p className="text-sm font-medium">{faculty.subject_name || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PERSONAL & BACKGROUND */}
          <Card className="border shadow-sm overflow-hidden">
            <div className="bg-slate-50/50 dark:bg-slate-900/50 border-b px-4 py-3 text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <GraduationCap className="h-4 w-4 text-primary" />
              Personal & Background
            </div>
            <CardContent className="p-4 grid gap-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center shrink-0">
                  <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contact</p>
                  <p className="text-sm font-medium">{faculty.contact || "-"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-amber-50 dark:bg-amber-950 flex items-center justify-center shrink-0">
                  <GraduationCap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Qualification</p>
                  <p className="text-sm font-medium">{faculty.qualification || "-"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-purple-50 dark:bg-purple-950 flex items-center justify-center shrink-0">
                  <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Joining Date</p>
                  <p className="text-sm font-medium">{formatDate(faculty.joining_date)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
