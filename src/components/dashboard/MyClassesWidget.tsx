"use client";

import { Users, ChevronRight, GraduationCap } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <Card className="border-none shadow-sm bg-white overflow-hidden rounded-xl">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
          Academic Classes
          <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            {classes.length} Active
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <div className="space-y-2">
          {classes.length > 0 ? (
              classes.map((cls, idx) => (
                <Link key={`${cls.class_id}-${idx}`} href={`/main/classes/${cls.class_id}`}>
                <motion.div
                  whileHover={{ x: 2 }}
                  className="group flex items-center justify-between p-3 rounded-lg border border-slate-50 hover:border-blue-100 hover:bg-blue-50/30 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-white transition-colors">
                      <GraduationCap className="h-4 w-4 text-slate-400 group-hover:text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[13px] font-bold text-slate-700 group-hover:text-slate-900 truncate">
                        {cls.class_name}-{cls.section_name}
                      </h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                        {cls.subject_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1 text-[10px] font-black text-slate-600">
                        <Users size={10} className="text-blue-400" />
                        {cls.student_count}
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
                  </div>
                </motion.div>
              </Link>
            ))
          ) : (
            <div className="py-8 text-center border border-dashed border-slate-100 rounded-xl">
              <p className="text-slate-400 text-sm font-medium">
                No classes assigned. <br/>Contact admin to assign classes.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
