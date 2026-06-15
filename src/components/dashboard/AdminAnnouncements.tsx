"use client";

import { motion } from "framer-motion";
import { Megaphone, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AnnouncementsProps {
  announcements?: {
    id: number | string;
    title: string;
    date: string;
    description: string;
    audience_id?: number;
  }[];
}

const defaultAnnouncements = [
  {
    id: 1,
    title: "Class 10 - Pre-Board Schedule",
    date: "2026-11-15",
    description: "Pre-Board examination schedule for Class 10 is published on the school website.",
  },
  {
    id: 2,
    title: "Class 7B - History Assignment",
    date: "2026-08-10",
    description: "Complete History Chapter 2 assignment and submit it by next Thursday.",
  },
  {
    id: 3,
    title: "Class 6C - Science Project",
    date: "2026-08-02",
    description: "Students of Class 6C must bring materials for the group science project on renewable energy.",
  },
];

export const AdminAnnouncements = ({ announcements = defaultAnnouncements }: AnnouncementsProps) => {
  const displayedAnnouncements = announcements.slice(0, 3);

  return (
    <Card className="border border-slate-100/80 shadow-sm bg-white overflow-hidden rounded-2xl w-full flex flex-col">
      <CardHeader className="p-4 sm:p-6 pb-3 shrink-0 flex flex-row items-center justify-between border-b border-slate-50">
        <CardTitle className="text-[13px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Megaphone className="h-4.5 w-4.5 text-blue-500" />
          Recent Notices
        </CardTitle>
        <Link 
          href="/main/notices" 
          className="text-[11px] font-black text-indigo-650 hover:text-indigo-800 uppercase tracking-widest transition-colors select-none"
        >
          View All Announcements
        </Link>
      </CardHeader>
      
      <CardContent className="p-4 sm:p-6 space-y-3.5">
        {displayedAnnouncements.map((announcement, idx) => (
          <motion.div
            key={announcement.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.08 }}
            className="p-4 rounded-2xl bg-white border border-slate-100/80 hover:bg-slate-50/20 hover:border-slate-200 transition-all duration-300 group"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-slate-805 text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">
                  {announcement.title}
                </h3>
                <p className="text-slate-400 text-xs leading-normal font-medium mt-1.5 line-clamp-1">
                  {announcement.description}
                </p>
              </div>
              <div className="flex items-center gap-1 text-[9px] font-bold text-blue-600 bg-blue-50/50 border border-blue-100 px-2.5 py-0.5 rounded-full shrink-0 select-none">
                <Clock size={10} className="stroke-[2.5]" />
                {formatDate(announcement.date)}
              </div>
            </div>
          </motion.div>
        ))}
        
        {announcements.length === 0 && (
          <div className="text-center py-12 flex flex-col items-center justify-center">
            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
              <Megaphone className="h-6 w-6 text-slate-300" />
            </div>
            <p className="text-slate-400 text-sm font-bold">No recent announcements</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
