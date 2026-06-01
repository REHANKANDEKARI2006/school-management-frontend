
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
    <Card className="w-full max-w-[400px] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden text-center border-0 bg-white">
      <CardContent className="px-8 py-10">
        <div className="relative inline-block mb-4">
          <div className="h-36 w-36 ring-4 ring-white shadow-lg mx-auto overflow-hidden rounded-full bg-slate-50 relative">
            <img 
              src={student.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${student.student_id || student.id}&backgroundColor=f3f4f6`} 
              alt={student.name} 
              className="h-full w-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes('dicebear')) {
                  target.src = `https://api.dicebear.com/7.x/notionists/svg?seed=${student.student_id || student.id}&backgroundColor=f3f4f6`;
                }
              }}
            />
          </div>
        </div>
        
        <h3 className="text-2xl font-bold font-headline text-slate-900 mb-1">{student.name}</h3>
        <p className="text-[15px] text-slate-500 font-medium">Roll No: {student.roll_number}</p>
        <p className="text-[15px] text-slate-500 font-medium mb-8">Class: {student.class}</p>

        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={onMarkAbsent}
            className={`flex-1 h-[46px] text-[15px] font-semibold rounded-[10px] transition-all border-2 ${
              currentStatus === 'absent' 
                ? 'bg-[#ef4444] text-white border-[#ef4444] shadow-sm hover:bg-[#dc2626] hover:text-white hover:border-[#dc2626]' 
                : 'bg-white text-[#ef4444] border-[#fee2e2] hover:bg-[#fef2f2] hover:text-[#ef4444] hover:border-[#ef4444]'
            }`}
          >
            <X className="mr-2 h-4 w-4" strokeWidth={3} /> Absent
          </Button>
          <Button
            variant="outline"
            onClick={onMarkPresent}
            className={`flex-1 h-[46px] text-[15px] font-semibold rounded-[10px] transition-all border-2 ${
              currentStatus === 'present' 
                ? 'bg-[#22c55e] text-white border-[#22c55e] shadow-sm hover:bg-[#16a34a] hover:text-white hover:border-[#16a34a]' 
                : 'bg-white text-[#22c55e] border-[#dcfce7] hover:bg-[#f0fdf4] hover:text-[#22c55e] hover:border-[#22c55e]'
            }`}
          >
            <Check className="mr-2 h-4 w-4" strokeWidth={3} /> Present
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
