"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { 
  ClipboardCheck, 
  Calendar, 
  BookOpen, 
  FileText, 
  Megaphone, 
  User, 
  CreditCard, 
  Library 
} from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  { label: "Attendance", icon: ClipboardCheck, href: "/main/attendance", color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: "Timetable", icon: Calendar, href: "/main/schedule", color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Assignments", icon: BookOpen, href: "/main/materials", color: "text-orange-600", bg: "bg-orange-50" },
  { label: "Exam Results", icon: FileText, href: "/main/exams", color: "text-purple-600", bg: "bg-purple-50" },
  { label: "Notices", icon: Megaphone, href: "/main/notices", color: "text-amber-600", bg: "bg-amber-50" },
  { label: "My Profile", icon: User, href: "/main/profile", color: "text-indigo-600", bg: "bg-indigo-50" },
  { label: "Fees Detail", icon: CreditCard, href: "/main/fees", color: "text-rose-600", bg: "bg-rose-50" },
  { label: "Library", icon: Library, href: "/main/library", color: "text-cyan-600", bg: "bg-cyan-50" },
];

export const StudentQuickActions = () => {
  return (
    <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-blue-50 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-6 px-2">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          Quick Shortcuts
        </h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        {actions.map((action, i) => (
          <Link key={i} href={action.href} className="w-full">
            <motion.div
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex flex-col items-center justify-center gap-3 p-4 rounded-3xl bg-slate-50/50 border border-slate-100/50 hover:bg-white hover:border-indigo-100 hover:shadow-md transition-all duration-300 w-full aspect-square sm:aspect-auto sm:h-28"
            >
              <div className={cn("p-2.5 rounded-xl shadow-sm", action.bg)}>
                <action.icon className={cn("h-5 w-5", action.color)} />
              </div>
              <span className="text-[10px] font-bold text-slate-600 text-center uppercase tracking-tight leading-none px-0.5">
                {action.label}
              </span>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
};
