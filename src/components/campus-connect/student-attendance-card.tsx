
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import type { Student, AttendanceStatus } from "@/types";

interface StudentAttendanceCardProps {
  student: Student;
  onMarkPresent: () => void;
  onMarkAbsent: () => void;
  currentStatus?: AttendanceStatus;
}

export function StudentAttendanceCard({ student, onMarkPresent, onMarkAbsent, currentStatus }: StudentAttendanceCardProps) {
  return (
    <Card className="w-full max-w-sm rounded-2xl shadow-xl overflow-hidden text-center">
      <CardContent className="p-8">
        <Avatar className="h-32 w-32 border-4 border-white shadow-lg mx-auto mb-6">
          <AvatarImage src={student.avatar} alt={student.name} />
          <AvatarFallback className="text-4xl">{student.fallback}</AvatarFallback>
        </Avatar>
        <h3 className="text-2xl font-bold font-headline">{student.name}</h3>
        <p className="text-muted-foreground">Roll No: {student.rollNumber}</p>
        <p className="text-muted-foreground mb-6">Class: {student.class}</p>
        
        <div className="grid grid-cols-2 gap-4">
          <Button 
            variant={currentStatus === 'absent' ? 'destructive' : 'outline'}
            onClick={onMarkAbsent} 
            size="lg" 
            className="py-6 text-lg"
          >
            <X className="mr-2 h-5 w-5" /> Absent
          </Button>
          <Button 
            variant={currentStatus === 'present' ? 'default' : 'outline'}
            onClick={onMarkPresent} 
            size="lg" 
            className="py-6 text-lg bg-green-600 hover:bg-green-700 text-white"
          >
            <Check className="mr-2 h-5 w-5" /> Present
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
