
"use client";

import { type Student } from "@/types";
import { type IdCardSettings } from "./id-card-settings-provider";
import { Button } from "../ui/button";
import { format } from "date-fns";

interface BonafideCertificateProps {
  student: Student;
  settings: IdCardSettings;
}

// Custom inline SVG for the seal icon
const SealIcon = ({ size = 72, className }: { size?: number, className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <circle cx="12" cy="12" r="10" />
        <path d="m4.93 4.93 1.77 1.77" />
        <path d="m17.3 17.3 1.77 1.77" />
        <path d="m17.3 6.7-1.77 1.77" />
        <path d="m6.7 17.3 1.77-1.77" />
        <path d="M12 5v14" />
        <path d="M5 12h14" />
    </svg>
);


export function BonafideCertificate({ student, settings }: BonafideCertificateProps) {
    const handlePrint = () => {
        window.print();
    };
    
    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;

    return (
        <div className="bg-gray-50 p-4 @container">
            <div id="bonafide-content" className="bg-white w-full max-w-2xl mx-auto p-8 border-4 border-gray-800 relative font-serif">
                {/* Ornate corners */}
                <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-gray-800"></div>
                <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-gray-800"></div>
                <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-gray-800"></div>
                <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-gray-800"></div>

                <div className="relative z-10 flex flex-col h-full text-center">
                    <header className="mb-8">
                        <h1 className="text-4xl font-bold tracking-widest text-gray-800">BONAFIDE CERTIFICATE</h1>
                        <div className="w-32 h-0.5 bg-gray-400 mx-auto mt-2"></div>
                    </header>

                    <section className="text-lg leading-relaxed text-left space-y-4 mb-16 flex-grow">
                        <p>This is to certify that Mr./Ms. <span className="font-semibold underline">{student.name}</span>, S/O or D/O of Mr./Ms. <span className="font-semibold underline">{student.fatherName}</span>, bearing roll number <span className="font-semibold underline">{student.rollNumber}</span> is a student of <span className="font-semibold underline">{student.class}</span> (Grade) for the academic year <span className="font-semibold underline">{academicYear}</span>.
                        </p>
                        <p>
                        He/She is a bonafide student of <span className="font-semibold underline">{settings.schoolName}</span>.
                        </p>
                    </section>
                    
                    <div className="absolute bottom-32 left-1/2 -translate-x-1/2 text-gray-400">
                        <SealIcon size={72} />
                    </div>

                    <footer className="mt-auto pt-16 text-sm">
                        <div className="flex justify-between items-end border-t-2 border-gray-300 pt-2">
                            <div className="text-left">
                                <p className="font-bold">SIGNATURE REGISTRAR/</p>
                                <p className="font-bold">PRINCIPAL/DEAN</p>
                            </div>
                            <div className="text-center">
                                <p className="font-bold">{settings.schoolName.toUpperCase()}</p>
                                <p className="text-xs">{settings.schoolAddress}</p>
                                <p className="text-xs font-semibold">(OFFICIAL SEAL)</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold">DATE</p>
                                <p>{format(new Date(), "dd-MM-yyyy")}</p>
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
             <div className="w-full max-w-2xl mx-auto mt-4 text-center @print:hidden">
                <Button onClick={handlePrint}>Print Certificate</Button>
            </div>
        </div>
    );
}
