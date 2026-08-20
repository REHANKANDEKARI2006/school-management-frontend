// @ts-nocheck
"use client";
import { PageSkeleton } from "@/components/ui/skeletons";
import { useRouter } from "next/navigation";

import * as React from "react";
import axios from "@/lib/axios";
import RouteGuard from "@/components/auth/RouteGuard";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useToast } from "@/hooks/use-toast";
import { ClassForm } from "@/components/school-os/class-form";
import { useSearch } from "@/components/school-os/search-provider";
import { useFeedback } from "@/components/school-os/feedback-provider";
import { ROLE, ADMIN_GROUP, TEACHING_STAFF_GROUP } from "@/config/roles";

export type Class = {
  id: string;
  name: string;
  section: string;
  section_id?: string;
  staff_id?: string;
  classTeacher: string;
  roomNumber: string;
  studentCount: number;
  teacherAvatar?: string;
};

export default function ClassesPage() {
  const { toast } = useToast();
  const { searchQuery } = useSearch();
  const { showWarning } = useFeedback();

  const [classes, setClasses] = React.useState<Class[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [profile, setProfile] = React.useState<any>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedClass, setSelectedClass] = React.useState<Class | undefined>();
  const [selectedStandardFilter, setSelectedStandardFilter] = React.useState<string>("all");
  const [selectedSectionFilter, setSelectedSectionFilter] = React.useState<string>("all");

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
  }, [selectedStandardFilter, selectedSectionFilter, searchQuery]);

  const router = useRouter();

  const roleId =
    typeof window !== "undefined"
      ? Number(localStorage.getItem("role_id"))
      : null;

  const isAdmin = roleId ? ADMIN_GROUP.includes(roleId) : false;

  /* =========================
     FETCH DATA
  ========================= */
  const fetchData = async () => {
    setLoading(true);
    try {
      const [classesRes, profileRes] = await Promise.all([
        axios.get("/api/classes/admin/list"),
        axios.get("/api/auth/profile")
      ]);

      if (profileRes.data.success) {
        setProfile(profileRes.data.data);
      }

      const mapped: Class[] = classesRes.data.data.map((c: any) => ({
        id: String(c.class_id),
        name: c.class_name,
        section: c.section_name || "-",
        section_id: c.section_id ? String(c.section_id) : undefined,
        staff_id: c.staff_id ? String(c.staff_id) : undefined,
        classTeacher: c.staff_first_name
          ? `${c.staff_first_name} ${c.staff_last_name || ""}`.trim()
          : "-",
        teacherAvatar: c.profile_url || "",
        roomNumber: c.room_number || "-",
        studentCount: Number(c.students_count || 0),
      }));

      setClasses(mapped);
    } catch (error) {
      console.error("Failed to fetch classes:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const filteredClasses = React.useMemo(() => {
    let result = classes;

    if (selectedStandardFilter !== "all") {
      result = result.filter(cls => cls.name === selectedStandardFilter);
    }

    if (selectedSectionFilter !== "all") {
      result = result.filter(cls => cls.section === selectedSectionFilter);
    }

    if (searchQuery) {
      result = result.filter(cls =>
        cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.classTeacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.roomNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return result;
  }, [searchQuery, classes, selectedStandardFilter, selectedSectionFilter]);

  // Derive unique standards for the dropdown filter
  const uniqueStandards = React.useMemo(() => {
    const stands = Array.from(new Set(classes.map(c => c.name)));
    return stands.sort((a, b) => {
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [classes]);

  // Derive unique sections for the dropdown filter
  const uniqueSections = React.useMemo(() => {
    const secs = Array.from(new Set(classes.map(c => c.section).filter(s => s && s !== "-")));
    return secs.sort();
  }, [classes]);

  const totalPages = Math.ceil(filteredClasses.length / 10) || 1;

  const displayedClasses = React.useMemo(() => {
    if (!isMobile) return filteredClasses;
    const start = (currentPage - 1) * 10;
    return filteredClasses.slice(start, start + 10);
  }, [filteredClasses, isMobile, currentPage]);

  const handleFormSubmit = async () => {
    setIsFormOpen(false);
    setSelectedClass(undefined);
    await fetchData();
    toast({ title: "Class saved successfully" });
  };

  return (
    <RouteGuard allowedRoles={[...ADMIN_GROUP, ...TEACHING_STAFF_GROUP]}>
      <>
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6 border-b">
            <div className="space-y-1 hidden md:block">
              <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight">Classes</CardTitle>
              <CardDescription className="text-sm">Manage class levels and teacher assignments</CardDescription>
            </div>
            {/* Mobile View Filter & Action Controls (< sm) */}
            <div className="flex sm:hidden flex-col gap-2.5 w-full mt-2">
              <div className="grid grid-cols-2 gap-2.5 w-full">
                <Select value={selectedStandardFilter} onValueChange={setSelectedStandardFilter}>
                  <SelectTrigger className="w-full h-11 text-xs font-semibold rounded-xl bg-white border-slate-200 shadow-sm">
                    <SelectValue placeholder="All Standards" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Standards</SelectItem>
                    {uniqueStandards.map(std => (
                      <SelectItem key={std} value={std}>Standard {std}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedSectionFilter} onValueChange={setSelectedSectionFilter}>
                  <SelectTrigger className="w-full h-11 text-xs font-semibold rounded-xl bg-white border-slate-200 shadow-sm">
                    <SelectValue placeholder="All Sections" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sections</SelectItem>
                    {uniqueSections.map(sec => (
                      <SelectItem key={sec} value={sec}>Section {sec}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isAdmin && (
                <Button
                  className="w-full h-11 font-bold rounded-xl shadow-sm"
                  onClick={() => {
                    setSelectedClass(undefined);
                    setIsFormOpen(true);
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Create Class
                </Button>
              )}
            </div>

            {/* Desktop View Filter & Action Controls (>= sm) */}
            <div className="hidden sm:flex flex-row items-center gap-3 w-auto">
              <div className="w-[160px]">
                <Select value={selectedStandardFilter} onValueChange={setSelectedStandardFilter}>
                  <SelectTrigger className="h-9 bg-slate-50/50">
                    <SelectValue placeholder="Filter by Standard" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Standards</SelectItem>
                    {uniqueStandards.map(std => (
                      <SelectItem key={std} value={std}>Standard {std}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-[160px]">
                <Select value={selectedSectionFilter} onValueChange={setSelectedSectionFilter}>
                  <SelectTrigger className="h-9 bg-slate-50/50">
                    <SelectValue placeholder="Filter by Section" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sections</SelectItem>
                    {uniqueSections.map(sec => (
                      <SelectItem key={sec} value={sec}>Section {sec}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isAdmin && (
                <Button
                  className="h-9 font-bold rounded-xl"
                  onClick={() => {
                    setSelectedClass(undefined);
                    setIsFormOpen(true);
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Create Class
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
                ) : displayedClasses.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground text-sm">No classes found.</div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {displayedClasses.map((cls) => (
                      <div
                        key={cls.id}
                        onClick={() => router.push(`/main/classes/${cls.id}`)}
                        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3.5 flex items-center justify-between gap-3 hover:border-slate-200 transition-all select-none cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Avatar className="h-11 w-11 shrink-0 border border-slate-100">
                            <AvatarImage src={cls.teacherAvatar} className="object-cover" />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                              {cls.classTeacher !== "-"
                                ? cls.classTeacher
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .substring(0, 2)
                                    .toUpperCase()
                                : "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm truncate">
                                Class {cls.name}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0 uppercase tracking-wider">
                                Section {cls.section}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500 truncate mt-0.5">
                              Teacher: {cls.classTeacher}
                            </span>
                            <span className="text-[11px] font-bold text-slate-400 mt-1">
                              Room {cls.roomNumber} • {cls.studentCount} Students
                            </span>
                          </div>
                        </div>

                        {isAdmin && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-9 w-9 rounded-xl hover:bg-slate-100 shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4 text-slate-600" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl shadow-lg border-slate-100">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/main/classes/${cls.id}`);
                                }}
                              >
                                Manage Class
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedClass(cls);
                                  setIsFormOpen(true);
                                }}
                              >
                                Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showWarning(
                                    "Delete Class?",
                                    "Are you sure you want to delete this class?",
                                    async () => {
                                      await axios.delete(`/api/classes/${cls.id}`);
                                      fetchData();
                                    },
                                    "Yes, Delete"
                                  );
                                }}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                      <TableHead className="pl-4 sm:pl-6 min-w-[150px]">Class</TableHead>
                      <TableHead className="min-w-[180px]">Class Teacher</TableHead>
                      <TableHead className="hidden md:table-cell">Room No.</TableHead>
                      <TableHead className="hidden md:table-cell">Students</TableHead>
                      {isAdmin && <TableHead className="text-right pr-4 sm:pr-6">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="p-0">
                          <PageSkeleton rows={4} />
                        </TableCell>
                      </TableRow>
                    ) : filteredClasses.map(cls => (
                      <TableRow 
                        key={cls.id} 
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/main/classes/${cls.id}`)}
                      >
                        <TableCell className="pl-4 sm:pl-6">
                          <div className="font-bold text-slate-900 dark:text-slate-100">Class {cls.name}</div>
                          <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Section {cls.section}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarImage src={cls.teacherAvatar} className="object-cover" />
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                {cls.classTeacher !== "-"
                                  ? cls.classTeacher
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .substring(0, 2)
                                      .toUpperCase()
                                  : "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{cls.classTeacher}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell font-medium">{cls.roomNumber}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                            {cls.studentCount} Students
                          </span>
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right pr-4 sm:pr-6">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-slate-100" onClick={(e) => e.stopPropagation()}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>

                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/main/classes/${cls.id}`);
                                  }}
                                >
                                  Manage Class
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedClass(cls);
                                    setIsFormOpen(true);
                                  }}
                                >
                                  Edit Details
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    showWarning(
                                      "Delete Class?",
                                      "Are you sure you want to delete this class?",
                                      async () => {
                                        await axios.delete(`/api/classes/${cls.id}`);
                                        fetchData();
                                      },
                                      "Yes, Delete"
                                    );
                                  }}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>

          {/* Mobile Pagination Controls */}
          {isMobile && filteredClasses.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 border-t border-slate-200/80 select-none">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 shrink-0 leading-tight">
                Page {currentPage} of {totalPages} ({filteredClasses.length} classes)
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

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="w-[95vw] sm:max-w-[550px] p-0 overflow-hidden rounded-2xl sm:rounded-lg">
            <DialogHeader className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-900/50 border-b">
              <DialogTitle className="text-xl font-bold">
                {selectedClass ? "Edit Class Details" : "Create New Class"}
              </DialogTitle>
            </DialogHeader>

            <div className="p-4 sm:p-6">
              <ClassForm
                classData={selectedClass}
                onSubmit={handleFormSubmit}
              />
            </div>
          </DialogContent>
        </Dialog>
      </>
    </RouteGuard>
  );
}
