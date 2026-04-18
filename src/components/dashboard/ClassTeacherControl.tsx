"use client";

import { ShieldCheck, ArrowRight, ClipboardList } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface ClassTeacherControlProps {
  classTeacherOf: {
    className: string;
    sectionName: string;
    class_id: number;
  };
}

export const ClassTeacherControl = ({ classTeacherOf }: ClassTeacherControlProps) => {
  return (
    <div className="bg-white rounded-[12px] p-4 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="bg-blue-600/10 p-2.5 rounded-lg shrink-0">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Class Teacher Assignment</span>
              <span className="bg-blue-50 text-blue-600 text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider">Official</span>
            </div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight leading-none mb-1.5">
              Current Responsibility: <span className="text-blue-600">{classTeacherOf.className} - {classTeacherOf.sectionName}</span>
            </h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-relaxed max-w-xl">
              Manage student enrollment, track academic progress, and oversee attendance records for your designated class.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link href={`/main/classes/${classTeacherOf.class_id}`} className="w-full md:w-auto">
            <Button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-10 px-6 font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 text-[11px] uppercase tracking-wider">
              <ClipboardList className="h-4 w-4" />
              Manage Entire Class
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
