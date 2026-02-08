"use client";

import * as React from "react";
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
  DialogDescription,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const initialClasses: Class[] = [
  {
    id: "1",
    name: "Class 10",
    section: "A",
    classTeacher: "Dr. Evelyn Reed",
    roomNumber: "301",
    studentCount: 35,
  },
  {
    id: "2",
    name: "Class 12",
    section: "B",
    classTeacher: "Mr. Benjamin Carter",
    roomNumber: "402",
    studentCount: 32,
  },
  {
    id: "3",
    name: "Class 9",
    section: "C",
    classTeacher: "Ms. Sophia Loren",
    roomNumber: "205",
    studentCount: 38,
  },
  {
    id: "4",
    name: "Class 11",
    section: "A",
    classTeacher: "Mr. David Chen",
    roomNumber: "401",
    studentCount: 30,
  },
];

export default function ClassesPage() {
  const { toast } = useToast();
  const { searchQuery } = useSearch();
  const [classes, setClasses] = React.useState(initialClasses);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedClass, setSelectedClass] = React.useState<Class | undefined>();

  const filteredClasses = React.useMemo(() => {
    if (!searchQuery) return classes;
    return classes.filter(cls =>
      cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.classTeacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.roomNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, classes]);

  const handleFormSubmit = (classData: Class) => {
    if (selectedClass) {
      setClasses(classes.map(c => c.id === classData.id ? { ...c, ...classData } : c));
      toast({ title: "Class Updated" });
    } else {
      setClasses([...classes, { ...classData, id: (classes.length + 1).toString() }]);
      toast({ title: "Class Created" });
    }
    setIsFormOpen(false);
    setSelectedClass(undefined);
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
              <Button onClick={() => setIsFormOpen(true)}>
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
                    <TableCell>{cls.name} - {cls.section}</TableCell>
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
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => { setSelectedClass(cls); setIsFormOpen(true); }}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setClasses(classes.filter(c => c.id !== cls.id))}>
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
              <DialogTitle>{selectedClass ? "Edit Class" : "Create Class"}</DialogTitle>
            </DialogHeader>
            <ClassForm onSubmit={handleFormSubmit} classData={selectedClass} />
          </DialogContent>
        </Dialog>
      </>
    </RouteGuard>
  );
}
