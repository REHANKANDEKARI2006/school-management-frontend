
"use client";

import * as React from "react";
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
  const [selectedClass, setSelectedClass] = React.useState<Class | undefined>(undefined);

  const filteredClasses = React.useMemo(() => {
    if (!searchQuery) {
      return classes;
    }
    return classes.filter(cls =>
      cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.classTeacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.roomNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, classes]);

  const handleFormSubmit = (classData: Class) => {
    if (selectedClass) {
      // Update existing class
      setClasses(classes.map(c => c.id === classData.id ? { ...c, ...classData } : c));
      toast({ title: "Class Updated", description: `${classData.name} - Section ${classData.section} has been updated.` });
    } else {
      // Add new class
      const newClass = {
         ...classData,
         id: (classes.length + 1).toString(),
         studentCount: Math.floor(Math.random() * 10) + 25, // Random student count
      };
      setClasses([...classes, newClass]);
      toast({ title: "Class Created", description: `${classData.name} - Section ${classData.section} has been added.` });
    }
    setIsFormOpen(false);
    setSelectedClass(undefined);
  };
  
  const getFallback = (name?: string) => {
    if (!name) return "??";
    return name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
  }

  const openEditDialog = (cls: Class) => {
    setSelectedClass(cls);
    setIsFormOpen(true);
  }

  const openNewDialog = () => {
    setSelectedClass(undefined);
    setIsFormOpen(true);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                  <CardTitle className="font-headline">Classes</CardTitle>
                  <CardDescription>Manage classes, sections, and student assignments.</CardDescription>
              </div>
              <Button size="sm" className="gap-1 w-full sm:w-auto" onClick={openNewDialog}>
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Create Class
                  </span>
              </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Class Teacher</TableHead>
                <TableHead className="hidden md:table-cell">Room No.</TableHead>
                <TableHead className="hidden sm:table-cell">Students</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClasses.map((cls) => (
                <TableRow key={cls.id}>
                  <TableCell>
                    <div className="font-medium">{cls.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Section {cls.section}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8 hidden sm:flex">
                            <AvatarImage src={`https://picsum.photos/seed/${cls.classTeacher?.split(' ')[1]}/100/100`} alt={cls.classTeacher} />
                            <AvatarFallback>{getFallback(cls.classTeacher)}</AvatarFallback>
                        </Avatar>
                        <span>{cls.classTeacher}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{cls.roomNumber}</TableCell>
                  <TableCell className="hidden sm:table-cell">{cls.studentCount}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => openEditDialog(cls)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setClasses(classes.filter(c => c.id !== cls.id));
                          toast({ title: "Class Deleted", description: `${cls.name} - Section ${cls.section} has been removed.` });
                        }}>Delete</DropdownMenuItem>
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedClass ? "Edit Class" : "Create New Class"}</DialogTitle>
            <DialogDescription>
              {selectedClass ? "Update the details of the class." : "Fill in the details to create a new class."}
            </DialogDescription>
          </DialogHeader>
          <ClassForm onSubmit={handleFormSubmit} classData={selectedClass} />
        </DialogContent>
      </Dialog>
    </>
  );
}
