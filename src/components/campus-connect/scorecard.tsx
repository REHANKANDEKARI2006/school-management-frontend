
"use client";

import * as React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useIdCardSettings } from "@/components/campus-connect/id-card-settings-provider";
import type { Exam } from "./exam-form";
import type { Student } from "@/types";

interface ScorecardDialogProps {
  exam: Exam;
  student: Student;
}

const getGrade = (score: number, maxScore: number): string => {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  if (percentage >= 33) return "E";
  return "F";
};


export function ScorecardDialog({ exam, student }: ScorecardDialogProps) {
  const { settings } = useIdCardSettings();
  const [grades, setGrades] = React.useState<{ [studentId: string]: string }>({});

  React.useEffect(() => {
    if (exam.id) {
        const gradesStorageKey = `grades-${exam.id}`;
        const savedGrades = localStorage.getItem(gradesStorageKey);
        if (savedGrades) {
            setGrades(JSON.parse(savedGrades));
        }
    }
  }, [exam.id]);
  
  const obtainedMarks = Number(grades[student.id] || 0);
  const totalMarks = exam.totalScore || 100;
  const grade = getGrade(obtainedMarks, totalMarks);
  const percentage = ((obtainedMarks / totalMarks) * 100).toFixed(2);
  const result = obtainedMarks / totalMarks >= 0.33 ? "PASS" : "FAIL";

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const reportTitle = `${exam.name.toUpperCase()} REPORT`;
  

  return (
    <div className="bg-gray-100 p-4 @container max-h-[90vh] overflow-y-auto">
      <div id="scorecard-content" className="bg-white w-[210mm] min-h-[297mm] mx-auto p-4 border-4 border-blue-800 relative font-serif flex flex-col">
        <div className="absolute inset-0 border-2 border-yellow-400 m-1.5 pointer-events-none"></div>
        <div className="relative z-10 flex-grow flex flex-col">
          <header className="text-center mb-4">
            <div className="flex justify-center items-center gap-4">
              {settings.logoUrl && <Image src={settings.logoUrl} alt="School Logo" width={60} height={60} className="rounded-full bg-white p-0.5" />}
              <div>
                <p className="text-sm">DISE CODE: {settings.recognition || '23320403269'} (Recognised By M.p. Government) SCHOOL CODE: {settings.slogan || '632360'}</p>
                <h1 className="text-3xl font-bold text-blue-800 tracking-wider">{settings.schoolName}</h1>
                <p className="font-semibold">{settings.schoolAddress}</p>
              </div>
            </div>
            <div className="bg-red-600 text-white font-bold py-1 px-4 inline-block mt-2 text-lg">
              MARK SHEET CUM - CERTIFICATE {new Date().getFullYear() - 1}-{new Date().getFullYear().toString().slice(-2)}
            </div>
          </header>

          <section className="text-sm">
             <div className="grid grid-cols-[1fr_2fr] gap-x-4 gap-y-1 mb-2">
                <p><span className="font-bold">CLASS:</span> {student.class}</p>
                <p><span className="font-bold">ROLL NO.:</span> {student.rollNumber}</p>
                <p><span className="font-bold">SCHOLAR NO.:</span> S-{student.id?.padStart(4, '0')}</p>
                <p><span className="font-bold">AADHAR NO.:</span> XXXX XXXX XXXX</p>
             </div>

            <p className="font-bold mb-2">CERTIFIED THAT</p>
            <div className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 mb-2">
              <p className="font-bold">STUDENT'S NAME</p><p>: {student.name}</p>
              <p className="font-bold">FATHER'S NAME</p><p>: {student.fatherName}</p>
              <p className="font-bold">MOTHER'S NAME</p><p>: {student.motherName}</p>
              <p className="font-bold">DATE OF BIRTH</p><p>: {student.dob}</p>
            </div>
            <p className="mb-2">
              APPEARED IN {exam.name.toUpperCase()} IN THE YEAR {new Date(exam.date).getFullYear()} AND SUBJECT WISE
              MARKS OBTAINED ARE AS UNDER :-
            </p>
          </section>

          <section className="my-4">
            <table className="w-full border-collapse border border-black text-sm">
              <thead>
                <tr className="bg-gray-200">
                  <th colSpan={4} className="border border-black p-1.5">{reportTitle}</th>
                </tr>
                <tr>
                  <th className="border border-black p-1.5 w-1/2">SUBJECT</th>
                  <th className="border border-black p-1.5">MAX MARKS</th>
                  <th className="border border-black p-1.5">OBT. MARKS</th>
                  <th className="border border-black p-1.5">GRADE</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black p-1.5 font-bold">{exam.subject}</td>
                  <td className="border border-black p-1.5 text-center">{totalMarks}</td>
                  <td className="border border-black p-1.5 text-center">{obtainedMarks}</td>
                  <td className="border border-black p-1.5 text-center">{grade}</td>
                </tr>
                 {/* Dummy rows for layout */}
                {Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="border border-black p-1.5 h-6"></td>
                    <td className="border border-black p-1.5"></td>
                    <td className="border border-black p-1.5"></td>
                    <td className="border border-black p-1.5"></td>
                  </tr>
                ))}
                <tr className="font-bold">
                  <td className="border border-black p-1.5 text-right">TOTAL</td>
                  <td className="border border-black p-1.5 text-center">{totalMarks}</td>
                  <td className="border border-black p-1.5 text-center">{obtainedMarks}</td>
                  <td className="border border-black p-1.5 text-center">{grade}</td>
                </tr>
              </tbody>
            </table>
          </section>
          
           <section className="my-4">
            <table className="w-full border-collapse border border-black text-sm">
               <tbody>
                  <tr className="font-bold">
                    <td className="border border-black p-1.5 w-1/4">PERCENTAGE</td>
                    <td className="border border-black p-1.5 w-1/4 text-center">{percentage}%</td>
                    <td className="border border-black p-1.5 w-1/4">RANK</td>
                    <td className="border border-black p-1.5 w-1/4 text-center">-</td>
                  </tr>
                   <tr className="font-bold">
                    <td className="border border-black p-1.5">DIVISION</td>
                    <td className="border border-black p-1.5 text-center">{result === "PASS" ? "FIRST" : "-"}</td>
                    <td className="border border-black p-1.5">RESULT</td>
                    <td className="border border-black p-1.5 text-center">{result}</td>
                  </tr>
               </tbody>
            </table>
          </section>

          <div className="flex-grow"></div>

          <footer className="mt-auto text-xs pt-4">
            <div className="flex justify-between items-end">
              <div>
                <p>School Re-open On: 15 June, {new Date().getFullYear()}</p>
              </div>
              <p>Class Teacher's Signature</p>
              <p>Seal And Signature Of The Principal</p>
            </div>
          </footer>
        </div>
      </div>
      <div className="w-[210mm] mx-auto mt-4 text-center @print:hidden">
        <Button onClick={handlePrint}>Print Scorecard</Button>
      </div>
    </div>
  );
}
