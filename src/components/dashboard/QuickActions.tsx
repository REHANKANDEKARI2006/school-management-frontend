"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { 
  UserPlus, 
  ClipboardCheck, 
  IndianRupee, 
  Megaphone, 
  FileText, 
  FileQuestion, 
  BarChart3, 
  CalendarPlus 
} from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  { label: "Add Student", icon: UserPlus, href: "/main/students", color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Mark Attendance", icon: ClipboardCheck, href: "/main/attendance", color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: "Collect Fee", icon: IndianRupee, href: "/main/fees", color: "text-rose-600", bg: "bg-rose-50" },
  { label: "Post Notice", icon: Megaphone, href: "/main/notices", color: "text-amber-600", bg: "bg-amber-50" },
  { label: "Generate TC", icon: FileText, href: "/main/students", color: "text-indigo-600", bg: "bg-indigo-50" },
  { label: "Paper Generator", icon: FileQuestion, href: "/main/paper-generator", color: "text-violet-600", bg: "bg-violet-50" },
  { label: "Generate Report", icon: BarChart3, href: "/main/exams", color: "text-cyan-600", bg: "bg-cyan-50" },
  { label: "Add Event", icon: CalendarPlus, href: "/main/events", color: "text-pink-600", bg: "bg-pink-50" },
];

export const QuickActions = () => {
  return (
    <div className="bg-white rounded-[12px] p-2.5 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-2.5 px-2">
        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
          Quick Actions
        </h3>
      </div>
      <div className="grid grid-cols-8 gap-2">
        {actions.map((action, i) => (
          <Link key={i} href={action.href} className="w-full">
            <motion.div
              whileHover={{ y: -1, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex flex-col items-center justify-center gap-1.5 px-1 py-2 rounded-lg bg-slate-50/50 border border-slate-100/50 hover:bg-white hover:border-indigo-100 hover:shadow-sm transition-all duration-300 w-full h-[64px]"
            >
              <div className={cn("p-1.5 rounded-md", action.bg)}>
                <action.icon className={cn("h-4 w-4", action.color)} />
              </div>
              <span className="text-[8px] font-bold text-slate-500 text-center uppercase tracking-tight leading-none px-0.5">
                {action.label}
              </span>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
};
