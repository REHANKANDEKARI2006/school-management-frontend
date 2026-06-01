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
  CalendarPlus,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const actions = [
  { label: "Add Student", icon: UserPlus, href: "/main/students", color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Mark Attendance", icon: ClipboardCheck, href: "/main/attendance", color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: "Collect Fee", icon: IndianRupee, href: "/main/fees", color: "text-rose-600", bg: "bg-rose-50" },
  { label: "Post Notice", icon: Megaphone, href: "/main/notices", color: "text-amber-600", bg: "bg-amber-50" },
  { label: "Paper Generator", icon: FileQuestion, href: "/main/paper-generator", color: "text-violet-600", bg: "bg-violet-50" },
  { label: "Add Event", icon: CalendarPlus, href: "/main/events", color: "text-pink-600", bg: "bg-pink-50" },
];

export const QuickActions = () => {
  return (
    <Card className="border-none shadow-sm bg-white overflow-hidden rounded-xl">
      <CardHeader className="p-6 pb-2">
        <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-3">
          <Zap className="h-6 w-6 text-amber-500" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {actions.map((action, i) => (
          <Link key={i} href={action.href} className="w-full">
            <motion.div
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl bg-slate-50/50 border border-slate-100 hover:bg-white transition-all group"
            >
              <div className={cn("p-2.5 rounded-xl", action.bg)}>
                <action.icon className={cn("h-5 w-5", action.color)} />
              </div>
              <span className="text-xs font-bold text-slate-600 text-center leading-none">
                {action.label}
              </span>
            </motion.div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
};
