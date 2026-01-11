
"use client";

import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type Student } from "./student-form";
import { type IdCardSettings } from "./id-card-settings-provider";
import { Button } from "../ui/button";

interface IdCardProps {
  student: Student;
  settings: IdCardSettings;
}

const DetailRow = ({ label, value }: { label: string; value?: string }) => (
    <div className="flex text-xs">
        <p className="w-2/5 font-semibold text-gray-700">{label}</p>
        <p className="w-3/5 text-gray-800 break-words">{value || 'N/A'}</p>
    </div>
)

export function IdCard({ student, settings }: IdCardProps) {
  const handlePrint = () => {
    window.print();
  }
  return (
    <div className="space-y-4">
      <div className="font-sans bg-white rounded-xl shadow-lg w-[280px] h-[450px] mx-auto overflow-hidden relative @print:shadow-none @print:border-none flex flex-col">
        {/* Blue Header Section */}
        <div className="bg-[#007bff] p-3 pb-14 text-white">
            <div className="flex items-center space-x-2 justify-center text-center">
                {settings.logoUrl && <Image src={settings.logoUrl} alt="School Logo" width={30} height={30} className="rounded-full bg-white p-0.5" />}
                <div>
                    <h1 className="font-bold text-sm leading-tight">{settings.schoolName}</h1>
                    {settings.recognition && <p className="text-[9px]">{settings.recognition}</p>}
                </div>
            </div>
            <div className="text-[9px] mt-2 space-y-0.5 text-center">
                <p>{settings.schoolAddress}</p>
                {settings.schoolPhone && <p className="font-semibold">Phone: {settings.schoolPhone}</p>}
            </div>
        </div>
        
        {/* Student Info Section */}
        <div className="bg-white flex-grow pt-14 pb-2 px-4 relative">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                <Avatar className="h-24 w-24 border-4 border-white rounded-md shadow-md">
                    <AvatarImage src={student.avatar} alt={student.name} />
                    <AvatarFallback className="text-4xl rounded-md">{student.fallback}</AvatarFallback>
                </Avatar>
            </div>

             <h2 className="text-xl font-bold text-center mt-2">{student.name}</h2>

             <div className="mt-3 space-y-1.5 border-t border-gray-200 pt-2">
                <DetailRow label="Father's Name" value={student.fatherName} />
                <DetailRow label="Mother's Name" value={student.motherName} />
                <DetailRow label="D.O.B." value={student.dob} />
                <DetailRow label="Contact No." value={student.primaryContact} />
                <DetailRow label="Add." value={student.address} />
             </div>
        </div>

        {/* Footer */}
        <div className="bg-white px-4 pb-2 text-xs">
            <div className="flex justify-between items-end border-t border-gray-200 pt-1">
                <div>
                    <p className="font-bold">Class : <span className="font-normal">{student.class}</span></p>
                </div>
                 <div className="text-center">
                    <p className="font-serif italic text-lg -mb-2">Signature</p>
                    <p className="text-gray-600">Principal Sign.</p>
                </div>
            </div>
        </div>

      </div>
      <Button className="w-full @print:hidden" onClick={handlePrint}>Print ID Card</Button>
    </div>
  );
}
