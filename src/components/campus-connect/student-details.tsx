
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Student } from "@/types";
import { Button } from "../ui/button";
import { CreditCard, Mail, Phone, User, MapPin, Cake, Award } from "lucide-react";
import { Separator } from "../ui/separator";
import { StudentAttendanceHistory } from "./student-attendance-history";

interface StudentDetailsProps {
    student: Student;
    onGenerateIdCard: (student: Student) => void;
    onGenerateBonafide: (student: Student) => void;
}

const getStatusVariant = (status?: string) => {
    switch (status) {
        case "Active": return "default";
        case "Suspended": return "destructive";
        case "Withdrawn": return "secondary";
        default: return "outline";
    }
}

export function StudentDetails({ student, onGenerateIdCard, onGenerateBonafide }: StudentDetailsProps) {

  return (
    <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-6">
        <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
                <AvatarImage src={student.avatar} alt={student.name} />
                <AvatarFallback>{student.fallback}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
                <h2 className="text-2xl font-bold">{student.name}</h2>
                <p className="text-muted-foreground">{student.email}</p>
                <Badge variant={getStatusVariant(student.status)}>{student.status}</Badge>
            </div>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Student Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p className="font-semibold">Class</p>
                    <p className="text-muted-foreground">{student.class}</p>
                </div>
                <div>
                    <p className="font-semibold">Joined Date</p>
                    <p className="text-muted-foreground">{student.date}</p>
                </div>
                <div>
                    <p className="font-semibold">Student ID</p>
                    <p className="text-muted-foreground">#STU-{student.id?.padStart(4, '0')}</p>
                </div>
                <div>
                    <p className="font-semibold">Blood Group</p>
                    <p className="text-muted-foreground">{student.bloodGroup}</p>
                </div>
                <div className="col-span-2">
                    <p className="font-semibold flex items-center gap-2"><Cake className="h-4 w-4" /> Date of Birth</p>
                    <p className="text-muted-foreground ml-6">{student.dob}</p>
                </div>
                <div className="col-span-2">
                    <p className="font-semibold flex items-center gap-2"><MapPin className="h-4 w-4" /> Address</p>
                    <p className="text-muted-foreground ml-6">{student.address}</p>
                </div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Guardian Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                <div className="flex items-center gap-4">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div className="w-full">
                        <p className="font-semibold">Father's Name</p>
                        <p className="text-muted-foreground">{student.fatherName}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-4">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div className="w-full">
                        <p className="font-semibold">Mother's Name</p>
                        <p className="text-muted-foreground">{student.motherName}</p>
                    </div>
                </div>
                <Separator />
                <div className="flex items-center gap-4">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                        <p className="font-semibold">Primary Contact</p>
                        <p className="text-muted-foreground">{student.primaryContact}</p>
                    </div>
                </div>
                {student.secondaryContact && (
                    <div className="flex items-center gap-4">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="font-semibold">Secondary Contact</p>
                            <p className="text-muted-foreground">{student.secondaryContact}</p>
                        </div>
                    </div>
                )}
                <div className="flex items-center gap-4">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                        <p className="font-semibold">Email Address</p>
                        <p className="text-muted-foreground">{student.parentEmail || 'N/A'}</p>
                    </div>
                </div>
            </CardContent>
        </Card>

        <StudentAttendanceHistory student={student} />

        <div className="grid grid-cols-2 gap-4">
            <Button className="w-full" onClick={() => onGenerateIdCard(student)}>
                <CreditCard className="mr-2 h-4 w-4" />
                Generate ID Card
            </Button>
            <Button className="w-full" variant="secondary" onClick={() => onGenerateBonafide(student)}>
                <Award className="mr-2 h-4 w-4" />
                Generate Bonafide
            </Button>
        </div>
    </div>
  );
}

    

    