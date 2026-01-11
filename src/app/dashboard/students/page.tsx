
"use client";

import * as React from "react";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSearch } from "@/components/campus-connect/search-provider";
import { useToast } from "@/hooks/use-toast";
import { StudentForm, type Student } from "@/components/campus-connect/student-form";
import { StudentDetails } from "@/components/campus-connect/student-details";
import { IdCard } from "@/components/campus-connect/id-card";
import { useIdCardSettings } from "@/components/campus-connect/id-card-settings-provider";
import { BonafideCertificate } from "@/components/campus-connect/bonafide-certificate";

const studentsData: Student[] = [
  {
    id: "S1",
    name: "Liam Johnson",
    email: "liam@example.com",
    class: "10-A",
    status: "Active",
    avatar: "https://picsum.photos/seed/liam/200/200",
    fallback: "LJ",
    date: "2023-06-23",
    address: "123 Maple Street, Springfield, IL",
    bloodGroup: "O+",
    fatherName: "Robert Johnson",
    motherName: "Mary Johnson",
    primaryContact: "+1-202-555-0101",
    secondaryContact: "+1-202-555-0102",
    parentEmail: "robert.j@example.com",
    dob: "2013-05-12",
    rollNumber: "10A-01",
    classId: '1',
    classNameShort: '10-A',
    subjectIds: ['101', '102', '103'],
  },
  {
    id: "S2",
    name: "Olivia Smith",
    email: "olivia@example.com",
    class: "11-B",
    status: "Active",
    avatar: "https://picsum.photos/seed/olivia/200/200",
    fallback: "OS",
    date: "2023-06-24",
    address: "456 Oak Avenue, Metropolis, NY",
    bloodGroup: "A-",
    fatherName: "James Smith",
    motherName: "Patricia Smith",
    primaryContact: "+1-202-555-0103",
    parentEmail: "patricia.s@example.com",
    dob: "2012-08-21",
    rollNumber: '11B-01',
    classId: '3',
    classNameShort: '11-B',
    subjectIds: ['201', '202', '203', '101'],
  },
  {
    id: "S3",
    name: "Noah Williams",
    email: "noah@example.com",
    class: "9-C",
    status: "Suspended",
    avatar: "https://picsum.photos/seed/noah/200/200",
    fallback: "NW",
    date: "2023-06-25",
    address: "789 Pine Lane, Gotham, NJ",
    bloodGroup: "B+",
    fatherName: "David Williams",
    motherName: "Jennifer Williams",
    primaryContact: "+1-202-555-0104",
    parentEmail: "james.w@example.com",
    dob: "2014-02-18",
    rollNumber: '9C-01',
    classId: '4',
    classNameShort: '9-C',
    subjectIds: ['101', '103', '104'],
  },
  {
    id: "S4",
    name: "Emma Brown",
    email: "emma@example.com",
    class: "12-A",
    status: "Active",
    avatar: "https://picsum.photos/seed/emma/200/200",
    fallback: "EB",
    date: "2023-06-26",
    address: "101 Elm Drive, Star City, CA",
    bloodGroup: "AB+",
    fatherName: "Michael Brown",
    motherName: "Linda Brown",
    primaryContact: "+1-202-555-0105",
    parentEmail: "linda.b@example.com",
    dob: "2011-11-30",
    rollNumber: '12A-01',
    classId: '5',
    classNameShort: '12-A',
    subjectIds: ['201', '101', '103'],
  },
  {
    id: "S5",
    name: "James Jones",
    email: "james@example.com",
    class: "10-B",
    status: "Withdrawn",
    avatar: "https://picsum.photos/seed/james/200/200",
    fallback: "JJ",
    date: "2023-06-27",
    address: "212 Birch Road, Central City, TX",
    bloodGroup: "O-",
    fatherName: "William Jones",
    motherName: "Susan Jones",
    primaryContact: "+1-202-555-0106",
    parentEmail: "susan.j@example.com",
    dob: "2013-09-05",
    rollNumber: '10B-01',
    classId: '2',
    classNameShort: '10-B',
    subjectIds: ['101', '104', '105', '103'],
  },
];

const getStatusVariant = (status: string) => {
    switch (status) {
        case "Active": return "default";
        case "Suspended": return "destructive";
        case "Withdrawn": return "secondary";
        default: return "outline";
    }
}


export default function StudentsPage() {
  const { toast } = useToast();
  const { searchQuery } = useSearch();
  const { settings } = useIdCardSettings();
  const [students, setStudents] = React.useState(studentsData);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [isIdCardOpen, setIsIdCardOpen] = React.useState(false);
  const [isBonafideOpen, setIsBonafideOpen] = React.useState(false);
  const [selectedStudent, setSelectedStudent] = React.useState<Student | undefined>(undefined);

  const filteredStudents = React.useMemo(() => {
    if (!searchQuery) {
      return students;
    }
    return students.filter(student =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.email && student.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (student.class && student.class.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery, students]);

  const handleFormSubmit = (studentData: Student) => {
    if (selectedStudent) {
      // Update existing student
      setStudents(students.map(s => s.id === studentData.id ? { ...s, ...studentData } : s));
      toast({ title: "Student Updated", description: `${studentData.name}'s details have been updated.` });
    } else {
      // Add new student
      const newStudent: Student = {
         ...studentData,
         id: `S${students.length + 1}`,
         rollNumber: `${studentData.class?.replace('Class ', '').replace(' - Section ', '')}-${(Math.random() * 100).toFixed(0).padStart(2,'0')}`,
         avatar: `https://picsum.photos/seed/${studentData.name.split(' ')[0]}/200/200`,
         fallback: studentData.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase(),
         date: new Date().toISOString().split('T')[0],
         classId: '1' // Defaulting to a classId, this should be handled better
      };
      setStudents([newStudent, ...students]);
      toast({ title: "Student Added", description: `${studentData.name} has been added to the system.` });
    }
    setIsFormOpen(false);
    setSelectedStudent(undefined);
  };

  const openEditDialog = (student: Student) => {
    setSelectedStudent(student);
    setIsFormOpen(true);
  }

  const openNewDialog = () => {
    setSelectedStudent(undefined);
    setIsFormOpen(true);
  }

  const openDetailsDialog = (student: Student) => {
    setSelectedStudent(student);
    setIsDetailsOpen(true);
  }
  
  const handleGenerateIdCard = (student: Student) => {
    setSelectedStudent(student);
    setIsDetailsOpen(false);
    setIsIdCardOpen(true);
  }

  const handleGenerateBonafide = (student: Student) => {
    setSelectedStudent(student);
    setIsDetailsOpen(false);
    setIsBonafideOpen(true);
  }

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle className="font-headline">Students</CardTitle>
                <CardDescription>Manage your students and view their details.</CardDescription>
            </div>
            <Button size="sm" className="gap-1" onClick={openNewDialog}>
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Add Student
                </span>
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden w-[100px] sm:table-cell">
                <span className="sr-only">Avatar</span>
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Class</TableHead>
              <TableHead className="hidden md:table-cell">
                Joined At
              </TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="hidden sm:table-cell">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={student.avatar} alt="Avatar" />
                    <AvatarFallback>{student.fallback}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium">
                    <div className="font-medium">{student.name}</div>
                    <div className="hidden text-sm text-muted-foreground md:inline">
                      {student.email}
                    </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(student.status || '')}>
                    {student.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {student.class}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {student.date}
                </TableCell>
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
                      <DropdownMenuItem onClick={() => openEditDialog(student)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openDetailsDialog(student)}>View Details</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setStudents(students.filter(s => s.id !== student.id));
                        toast({ title: "Student Deleted", description: `${student.name} has been removed.` });
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedStudent ? "Edit Student" : "Add New Student"}</DialogTitle>
            <DialogDescription>
              {selectedStudent ? "Update the details for this student." : "Fill in the details to add a new student."}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto pr-6">
            <StudentForm onSubmit={handleFormSubmit} student={selectedStudent} />
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Student Details</DialogTitle>
            </DialogHeader>
            {selectedStudent && <StudentDetails student={selectedStudent} onGenerateIdCard={handleGenerateIdCard} onGenerateBonafide={handleGenerateBonafide} />}
        </DialogContent>
      </Dialog>
      <Dialog open={isIdCardOpen} onOpenChange={setIsIdCardOpen}>
        <DialogContent className="sm:max-w-xs p-0 border-0">
            <DialogHeader>
                <DialogTitle className="sr-only">Student ID Card</DialogTitle>
            </DialogHeader>
            {selectedStudent && <IdCard student={selectedStudent} settings={settings} />}
        </DialogContent>
      </Dialog>
      <Dialog open={isBonafideOpen} onOpenChange={setIsBonafideOpen}>
        <DialogContent className="max-w-3xl p-0 border-0">
            <DialogHeader>
                <DialogTitle className="sr-only">Bonafide Certificate</DialogTitle>
            </DialogHeader>
            {selectedStudent && <BonafideCertificate student={selectedStudent} settings={settings} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

    

    