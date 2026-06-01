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
  Library,
  Zap 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const actions = [
  { label: "Attendance", icon: ClipboardCheck, href: "/main/attendance", color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: "Timetable", icon: Calendar, href: "/main/schedule", color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Notices", icon: Megaphone, href: "/main/notices", color: "text-amber-600", bg: "bg-amber-50" },
  { label: "My Profile", icon: User, href: "/main/profile", color: "text-indigo-600", bg: "bg-indigo-50" },
  { label: "Fees Detail", icon: CreditCard, href: "/main/fees", color: "text-rose-600", bg: "bg-rose-50" },
];

export const StudentQuickActions = () => {
  return (
    <Card className="border border-slate-100/80 shadow-sm bg-white overflow-hidden rounded-2xl">
      <CardHeader className="p-6 pb-2">
        <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500 fill-amber-500" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {actions.map((action, i) => (
          <Link key={i} href={action.href} className="w-full">
            <motion.div
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="flex flex-col items-center justify-center gap-3.5 p-5 rounded-2xl bg-white border border-slate-100/80 hover:bg-slate-50/20 hover:border-slate-200 transition-all duration-300 group cursor-pointer"
            >
              <div className={cn("p-2.5 rounded-xl border", action.bg, action.bg.replace("bg-", "border-").replace("50", "100"))}>
                <action.icon className={cn("h-5 w-5", action.color)} />
              </div>
              <span className="text-[11px] font-extrabold text-slate-600 text-center leading-none group-hover:text-primary transition-colors">
                {action.label}
              </span>
            </motion.div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
};
