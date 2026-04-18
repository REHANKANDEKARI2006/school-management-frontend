"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { 
  ClipboardCheck, 
  FileEdit, 
  Upload, 
  BookOpen, 
  Megaphone, 
  FileQuestion 
} from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  { label: "Mark Attendance", icon: ClipboardCheck, href: "/main/attendance", color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: "Enter Marks", icon: FileEdit, href: "/main/exams", color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Upload Material", icon: Upload, href: "/main/materials", color: "text-indigo-600", bg: "bg-indigo-50" },
  { label: "Give Homework", icon: BookOpen, href: "/main/materials", color: "text-violet-600", bg: "bg-violet-50" },
  { label: "Post Notice", icon: Megaphone, href: "/main/notices", color: "text-amber-600", bg: "bg-amber-50" },
  { label: "Generate Paper", icon: FileQuestion, href: "/main/paper-generator", color: "text-cyan-600", bg: "bg-cyan-50" },
];

export const TeacherQuickActions = () => {
  return (
    <div className="bg-white rounded-[12px] p-2.5 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-2.5 px-2">
        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
          Teacher Quick Actions
        </h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((action, i) => (
          <Link key={i} href={action.href} className="w-full">
            <motion.div
              whileHover={{ y: -1, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex flex-col items-center justify-center gap-1.5 px-1 py-3 rounded-lg bg-slate-50/50 border border-slate-100/50 hover:bg-white hover:border-indigo-100 hover:shadow-sm transition-all duration-300 w-full"
            >
              <div className={cn("p-2 rounded-md", action.bg)}>
                <action.icon className={cn("h-5 w-5", action.color)} />
              </div>
              <span className="text-[9px] font-bold text-slate-600 text-center uppercase tracking-tight leading-none px-0.5">
                {action.label}
              </span>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
};
