
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
import { FacultyForm, type Faculty } from "@/components/campus-connect/faculty-form";
import { FacultySchedule } from "@/components/campus-connect/faculty-schedule";

const facultyData: Faculty[] = [
  {
    id: "1",
    name: "Dr. Evelyn Reed",
    email: "evelyn.reed@example.com",
    department: "Science",
    subject: "Physics",
    status: "Active",
    avatar: "https://picsum.photos/seed/evelyn/100/100",
    fallback: "ER",
    date: "2018-08-15",
  },
  {
    id: "2",
    name: "Mr. Benjamin Carter",
    email: "benjamin.carter@example.com",
    department: "Mathematics",
    subject: "Calculus",
    status: "Active",
    avatar: "https://picsum.photos/seed/benjamin/100/100",
    fallback: "BC",
    date: "2020-01-10",
  },
  {
    id: "3",
    name: "Ms. Sophia Loren",
    email: "sophia.loren@example.com",
    department: "Humanities",
    subject: "History",
    status: "On Leave",
    avatar: "https://picsum.photos/seed/sophia/100/100",
    fallback: "SL",
    date: "2019-03-22",
  },
  {
    id: "4",
    name: "Mr. David Chen",
    email: "david.chen@example.com",
    department: "Arts",
    subject: "Music",
    status: "Active",
    avatar: "https://picsum.photos/seed/david/100/100",
    fallback: "DC",
    date: "2021-09-01",
  },
];

export default function FacultyPage() {
  const { toast } = useToast();
  const { searchQuery } = useSearch();
  const [faculty, setFaculty] = React.useState(facultyData);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = React.useState(false);
  const [selectedFaculty, setSelectedFaculty] = React.useState<Faculty | undefined>(undefined);

  const filteredFaculty = React.useMemo(() => {
    if (!searchQuery) {
      return faculty;
    }
    return faculty.filter(member =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, faculty]);

  const handleFormSubmit = (facultyData: Faculty) => {
    if (selectedFaculty) {
      // Update existing faculty
      setFaculty(faculty.map(f => f.id === facultyData.id ? { ...f, ...facultyData } : f));
      toast({ title: "Faculty Updated", description: `${facultyData.name}'s details have been updated.` });
    } else {
      // Add new faculty
      const newFaculty = {
         ...facultyData,
         id: (faculty.length + 1).toString(),
         avatar: `https://picsum.photos/seed/${facultyData.name.split(' ')[0]}/100/100`,
         fallback: facultyData.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase(),
         date: new Date().toISOString().split('T')[0]
      };
      setFaculty([newFaculty, ...faculty]);
      toast({ title: "Faculty Member Added", description: `${facultyData.name} has been added.` });
    }
    setIsFormOpen(false);
    setSelectedFaculty(undefined);
  };

  const openEditDialog = (facultyMember: Faculty) => {
    setSelectedFaculty(facultyMember);
    setIsFormOpen(true);
  }

  const openNewDialog = () => {
    setSelectedFaculty(undefined);
    setIsFormOpen(true);
  }
  
  const openScheduleDialog = (facultyMember: Faculty) => {
    setSelectedFaculty(facultyMember);
    setIsScheduleOpen(true);
  };
  
  const handleDelete = (facultyMember: Faculty) => {
    setFaculty(faculty.filter(f => f.id !== facultyMember.id));
    toast({ title: "Faculty Deleted", description: `${facultyMember.name} has been removed.` });
  };


  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
              <div>
                  <CardTitle className="font-headline">Faculty</CardTitle>
                  <CardDescription>Manage faculty members and their assignments.</CardDescription>
              </div>
              <Button size="sm" className="gap-1" onClick={openNewDialog}>
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Add Faculty
                  </span>
              </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Avatar</span>
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Department</TableHead>
                <TableHead className="hidden md:table-cell">Subject</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFaculty.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={member.avatar} alt="Avatar" />
                      <AvatarFallback>{member.fallback}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">
                      <div className="font-medium">{member.name}</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                        {member.email}
                      </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.status === "Active" ? "default" : "secondary"}>
                      {member.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {member.department}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {member.subject}
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
                        <DropdownMenuItem onClick={() => openEditDialog(member)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openScheduleDialog(member)}>View Schedule</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(member)}>Delete</DropdownMenuItem>
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
            <DialogTitle>{selectedFaculty ? "Edit Faculty" : "Add New Faculty"}</DialogTitle>
            <DialogDescription>
              {selectedFaculty ? "Update the details for this faculty member." : "Fill in the details to add a new faculty member."}
            </DialogDescription>
          </DialogHeader>
          <FacultyForm onSubmit={handleFormSubmit} facultyMember={selectedFaculty} />
        </DialogContent>
      </Dialog>
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Weekly Schedule</DialogTitle>
            <DialogDescription>
              Class schedule for {selectedFaculty?.name}.
            </DialogDescription>
          </DialogHeader>
          {selectedFaculty && <FacultySchedule faculty={selectedFaculty} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
