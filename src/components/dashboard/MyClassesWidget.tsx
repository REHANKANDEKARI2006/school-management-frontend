"use client";

import { Users, ChevronRight, GraduationCap } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface MyClassesWidgetProps {
  classes?: {
    class_id: number;
    class_name: string;
    section_name: string;
    subject_name: string;
    student_count: number;
  }[];
}

export const MyClassesWidget = ({ classes = [] }: MyClassesWidgetProps) => {
  return (
    <div className="bg-white p-6 rounded-[12px] border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          My Classes
        </h3>
        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
          {classes.length} Total
        </span>
      </div>

      <div className="space-y-3">
        {classes.length > 0 ? (
          classes.map((cls, idx) => (
            <Link key={cls.class_id} href={`/main/classes/${cls.class_id}`}>
              <motion.div
                whileHover={{ x: 4 }}
                className="group flex items-center justify-between p-4 rounded-xl border border-slate-50 hover:border-blue-100 hover:bg-blue-50/30 transition-all cursor-pointer mb-2 last:mb-0"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-white transition-colors">
                    <GraduationCap className="h-5 w-5 text-slate-400 group-hover:text-blue-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 group-hover:text-slate-900 truncate">
                      {cls.class_name} - {cls.section_name}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {cls.subject_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div className="hidden sm:flex flex-col items-end">
                    <div className="flex items-center gap-1 text-[11px] font-black text-slate-600">
                      <Users size={12} className="text-blue-400" />
                      {cls.student_count}
                    </div>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Students</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
                </div>
              </motion.div>
            </Link>
          ))
        ) : (
          <div className="py-8 text-center border-2 border-dashed border-slate-50 rounded-2xl">
            <p className="text-slate-400 text-sm font-medium">
              No classes assigned. <br/>Contact admin to assign classes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
