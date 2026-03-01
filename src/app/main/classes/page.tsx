"use client";

import * as React from "react";
import axios from "@/lib/axios";
import RouteGuard from "@/components/auth/RouteGuard";

import { MoreHorizontal, PlusCircle } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ClassForm, type Class } from "@/components/campus-connect/class-form";
import { useSearch } from "@/components/campus-connect/search-provider";

export default function ClassesPage() {
  const { toast } = useToast();
  const { searchQuery } = useSearch();

  const [classes, setClasses] = React.useState<Class[]>([]);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedClass, setSelectedClass] = React.useState<Class | undefined>();

  /* =========================
     FETCH CLASSES (ADMIN)
  ========================= */
  const fetchClasses = async () => {
    const res = await axios.get("/api/classes/admin/list");

    const mapped: Class[] = res.data.data.map((c: any) => ({
      id: String(c.class_id),
      name: c.class_name,
      section: c.section_name || "-",
      classTeacher: c.staff_first_name
        ? `${c.staff_first_name} ${c.staff_last_name || ""}`.trim()
        : "-",
      roomNumber: c.room_number || "-",
      studentCount: Number(c.students_count || 0),
    }));

    setClasses(mapped);
  };

  React.useEffect(() => {
    fetchClasses();
  }, []);

  const filteredClasses = React.useMemo(() => {
    if (!searchQuery) return classes;
    return classes.filter(cls =>
      cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.classTeacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.roomNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, classes]);

  const handleFormSubmit = async () => {
    setIsFormOpen(false);
    setSelectedClass(undefined);
    await fetchClasses();
    toast({ title: "Class saved successfully" });
  };

  return (
    <RouteGuard allowedRoles={[1, 2]}>
      <>
        <Card>
          <CardHeader>
            <div className="flex justify-between">
              <div>
                <CardTitle>Classes</CardTitle>
                <CardDescription>Manage classes</CardDescription>
              </div>
              <Button
                onClick={() => {
                  setSelectedClass(undefined);
                  setIsFormOpen(true);
                }}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Create Class
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredClasses.map(cls => (
                  <TableRow key={cls.id}>
                    <TableCell>
                      {cls.name} - {cls.section}
                    </TableCell>
                    <TableCell>{cls.classTeacher}</TableCell>
                    <TableCell>{cls.roomNumber}</TableCell>
                    <TableCell>{cls.studentCount}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>

                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedClass(cls);
                              setIsFormOpen(true);
                            }}
                          >
                            Edit
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={async () => {
                              if (!confirm("Delete this class?")) return;
                              await axios.delete(`/api/classes/${cls.id}`);
                              fetchClasses();
                            }}
                          >
                            Delete
                          </DropdownMenuItem>
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
