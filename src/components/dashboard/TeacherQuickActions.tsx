"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { 
  ClipboardCheck, 
  FileEdit, 
  Upload, 
  BookOpen, 
  Megaphone, 
  FileQuestion,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <Card className="border-none shadow-sm bg-white overflow-hidden rounded-xl">
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((action, i) => (
          <Link key={i} href={action.href} className="w-full">
            <motion.div
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg bg-slate-50/50 border border-slate-100 hover:bg-white hover:border-blue-100 transition-all group"
            >
              <div className={cn("p-2 rounded-lg", action.bg)}>
                <action.icon className={cn("h-4 w-4", action.color)} />
              </div>
              <span className="text-[10px] font-black text-slate-500 text-center leading-none uppercase tracking-tight">
                {action.label}
              </span>
            </motion.div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
};
