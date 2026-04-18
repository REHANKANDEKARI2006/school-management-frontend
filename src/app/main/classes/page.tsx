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
        <Card>
          <CardHeader>
            <div className="flex justify-between">
              <div>
                <CardTitle>Classes</CardTitle>
                <CardDescription>Manage classes</CardDescription>
              </div>
              {isAdmin && (
                <Button
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
            <div className="mt-4 flex items-center gap-4">
              <div className="flex-1 max-w-xs">
                <Select value={selectedStandardFilter} onValueChange={setSelectedStandardFilter}>
                  <SelectTrigger>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Class Teacher</TableHead>
                  <TableHead>Room No.</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                  <TableRow key={cls.id}>
                    <TableCell>
                      <div className="font-medium text-slate-900 dark:text-slate-100">Class {cls.name}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Section {cls.section}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
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
                    <TableCell>{cls.roomNumber}</TableCell>
                    <TableCell>{cls.studentCount}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>

                          <DropdownMenuItem
                            onClick={() => router.push(`/main/classes/${cls.id}`)}
                          >
                            Manage Class
                          </DropdownMenuItem>
                          
                          {isAdmin && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedClass(cls);
                                setIsFormOpen(true);
                              }}
                            >
                              Edit Details
                            </DropdownMenuItem>
                          )}

                          {isAdmin && (
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={async () => {
                                if (!confirm("Delete this class?")) return;
                                await axios.delete(`/api/classes/${cls.id}`);
                                fetchData();
                              }}
                            >
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedClass ? "Edit Class" : "Create Class"}
              </DialogTitle>
            </DialogHeader>

            <ClassForm
              classData={selectedClass}
              onSubmit={handleFormSubmit}
            />
          </DialogContent>
        </Dialog>
      </>
    </RouteGuard>
  );
}
