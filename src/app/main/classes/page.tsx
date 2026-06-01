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
import { ClassForm } from "@/components/campus-connect/class-form";
import { useSearch } from "@/components/campus-connect/search-provider";
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

  const [classes, setClasses] = React.useState<Class[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [profile, setProfile] = React.useState<any>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedClass, setSelectedClass] = React.useState<Class | undefined>();
  const [selectedStandardFilter, setSelectedStandardFilter] = React.useState<string>("all");

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

    if (searchQuery) {
      result = result.filter(cls =>
        cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.classTeacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.roomNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return result;
  }, [searchQuery, classes, selectedStandardFilter]);

  // Derive unique standards for the dropdown filter
  const uniqueStandards = React.useMemo(() => {
    const stands = Array.from(new Set(classes.map(c => c.name)));
    return stands.sort((a, b) => {
      // Try numeric sort first, fallback to string sort
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [classes]);

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
          <CardHeader className="flex flex-col gap-6 p-4 sm:p-6 border-b">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight">Classes</CardTitle>
                <CardDescription className="text-sm">Manage class levels and teacher assignments</CardDescription>
              </div>
              {isAdmin && (
                <Button
                  className="w-full sm:w-auto h-9 font-semibold"
                  onClick={() => {
                    setSelectedClass(undefined);
                    setIsFormOpen(true);
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Create Class
                </Button>
              )}
            </div>

            {/* FILTER BAR */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-full sm:max-w-[240px]">
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
            </div>
          </CardHeader>

          <CardContent className="p-0">
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
                            <Button size="icon" variant="ghost" className="h-8 w-8">
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
                              className="text-red-600"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (!confirm("Delete this class?")) return;
                                await axios.delete(`/api/classes/${cls.id}`);
                                fetchData();
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
        </CardContent>
      </Card>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="w-[95vw] sm:max-w-[550px] p-0 overflow-hidden">
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
