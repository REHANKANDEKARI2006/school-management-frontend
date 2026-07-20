
"use client";

import { type Student } from "@/types";
import { type IdCardSettings } from "./id-card-settings-provider";
import { Button } from "../ui/button";
import { format } from "date-fns";
import Image from "next/image";

interface BonafideCertificateProps {
  student: Student;
  settings: IdCardSettings;
}

export function BonafideCertificate({ student, settings }: BonafideCertificateProps) {
    const handlePrint = () => {
        window.print();
    };
    
    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
    
    const primaryColor = settings.primaryColor || '#437ef1';
    const s = student as any;

    return (
        <div className="bg-gray-50 p-4 @container min-h-screen">
            <div 
                id="bonafide-content" 
                className="bg-white w-full max-w-4xl mx-auto p-3 relative font-sans aspect-[1/1.4] flex flex-col shadow-xl"
                style={{ border: `2px solid ${primaryColor}` }}
            >
                <div 
                    className="w-full flex-grow relative flex flex-col p-10 bg-white"
                    style={{ border: `4px solid ${primaryColor}` }}
                >
                    {/* Watermark Logo */}
                    {settings.logoUrl && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none z-0 overflow-hidden">
                            <Image src={settings.logoUrl} alt="Watermark" width={600} height={600} className="object-contain -rotate-12 scale-150" />
                        </div>
                    )}

                    <div className="relative z-10 flex flex-col h-full text-center px-8">
                        {/* Header */}
                        <header className="mb-10 text-center flex flex-col items-center">
                            {settings.logoUrl && (
                                <Image src={settings.logoUrl} alt="Logo" width={80} height={80} className="mb-4 object-contain" />
                            )}
                            <h1 className="text-3xl font-black uppercase tracking-wider font-['Outfit']" style={{ color: primaryColor }}>
                                {settings.schoolName || "SCHOOL NAME"}
                            </h1>
                            <p className="text-sm mt-2 text-slate-600">
                                {settings.schoolAddress} {settings.schoolPhone ? `| Phone: ${settings.schoolPhone}` : ''}
                            </p>
                        </header>

                        {/* Title */}
                        <div className="text-center mb-12 mt-6">
                            <h2 className="inline-block text-2xl font-extrabold uppercase tracking-widest text-slate-800 bg-slate-50 px-8 py-3 rounded-full border shadow-sm font-['Outfit']">
                                Bonafide Certificate
                            </h2>
                        </div>

                        {/* Body content */}
                        <section className="text-[17px] leading-[2.2] text-justify space-y-5 mb-16 flex-grow text-slate-800 px-6">
                            <p>
                                This is to certify that Mr./Ms. <span className="font-bold border-b border-dashed px-2 font-['Outfit']" style={{ color: primaryColor, borderColor: primaryColor }}>{s.name || s.stu_first_name}</span>, 
                                S/O or D/O of Mr./Ms. <span className="font-bold border-b border-dashed px-2 font-['Outfit']" style={{ color: primaryColor, borderColor: primaryColor }}>{s.fatherName || '______________'}</span> 
                                and Mrs. <span className="font-bold border-b border-dashed px-2 font-['Outfit']" style={{ color: primaryColor, borderColor: primaryColor }}>{s.motherName || '______________'}</span>, 
                                bearing ID / Roll Number <span className="font-bold border-b border-dashed px-2 font-['Outfit']" style={{ color: primaryColor, borderColor: primaryColor }}>{s.rollNumber || s.student_id || '_____'}</span>, 
                                is a bonafide student of this institution.
                            </p>
                            <p>
                                He/She is currently studying in class <span className="font-bold border-b border-dashed px-2 font-['Outfit']" style={{ color: primaryColor, borderColor: primaryColor }}>{s.class || s.class_id || '_____'}</span> 
                                for the academic year <span className="font-bold border-b border-dashed px-2 font-['Outfit']" style={{ color: primaryColor, borderColor: primaryColor }}>{academicYear}</span>. 
                                His/Her date of birth according to the school records is <span className="font-bold border-b border-dashed px-2 font-['Outfit']" style={{ color: primaryColor, borderColor: primaryColor }}>{s.dob || '_____'}</span>.
                            </p>
                            <p>
                                To the best of our knowledge, he/she possesses a good moral character.
                            </p>
                        </section>
                        
                        {/* Footer Signatures */}
                        <footer className="mt-auto pt-16 pb-8 flex justify-between items-end px-10">
                            <div className="text-left font-semibold text-lg text-slate-800">
                                Date: {format(new Date(), "dd-MM-yyyy")}
                            </div>
                            
                            <div className="text-center">
                                {/* Seal placeholder/image */}
                                <div className="w-[100px] h-[100px] border-2 border-dashed border-slate-300 rounded-full flex items-center justify-center text-[10px] text-slate-400 font-semibold mb-2 ml-4">
                                    SEAL
                                </div>
                            </div>
                            
                            <div className="text-center w-[200px] flex flex-col items-center">
                                {settings.signatureUrl ? (
                                    <div className="h-[60px] relative w-full mb-1">
                                        <Image src={settings.signatureUrl} alt="Sign" fill className="object-contain" />
                                    </div>
                                ) : (
                                    <div className="h-[60px] w-full mb-1" />
                                )}
                                <div className="w-full border-t border-slate-800 mb-1" />
                                <p className="font-bold text-slate-800 uppercase text-sm tracking-wider">PRINCIPAL</p>
                                <p className="text-xs text-slate-600 mt-1">Authorized Signatory</p>
                            </div>
                        </footer>
                    </div>
                </div>
            </div>
             <div className="w-full max-w-4xl mx-auto mt-6 text-center @print:hidden">
                <Button onClick={handlePrint} size="lg" className="px-8 font-bold text-lg h-12 shadow-md">Print Bonafide Certificate</Button>
            </div>
        </div>
    );
}
