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
    title: "Final Term Examinations",
    date: "2026-04-10",
    description: "The final term examinations for academic session 2025-26 will commence from April 10th.",
  },
  {
    id: 2,
    title: "New LMS Feature Update",
    date: "2026-03-25",
    description: "We've added a new teacher dashboard with interactive weekly schedule view for all faculty.",
  },
  {
    id: 3,
    title: "Spring Break Notice",
    date: "2026-03-20",
    description: "The school will remain closed for Spring break from March 28th to April 5th.",
  },
];

export const StudentAnnouncements = ({ announcements = defaultAnnouncements }: AnnouncementsProps) => {
  const displayedAnnouncements = announcements.slice(0, 3);

  return (
    <Card className="border border-slate-100/80 shadow-sm bg-white overflow-hidden rounded-2xl h-full flex flex-col">
      <CardHeader className="p-6 pb-3 shrink-0 flex flex-row items-center justify-between border-b border-slate-50">
        <CardTitle className="text-[13px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          Notices
        </CardTitle>
        <Megaphone className="h-4 w-4 text-blue-500" />
      </CardHeader>
      
      <CardContent className="p-6 flex-grow flex flex-col justify-between">
        <div className="space-y-3.5 flex-1">
          {displayedAnnouncements.map((announcement, idx) => (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.08 }}
              className="p-4 rounded-2xl bg-white border border-slate-100/80 hover:bg-slate-50/20 hover:border-slate-200 transition-all duration-300 group"
            >
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-3 w-full">
                  <h3 className="font-extrabold text-slate-705 text-xs leading-tight truncate group-hover:text-primary transition-colors flex-1 min-w-0">
                    {announcement.title}
                  </h3>
                  <div className="flex items-center gap-1 text-[9px] font-bold text-blue-600 bg-blue-50/50 border border-blue-100 px-2.5 py-0.5 rounded-full shrink-0 select-none">
                    <Clock size={10} className="stroke-[2.5]" />
                    {formatDate(announcement.date)}
                  </div>
                </div>
                <p className="text-slate-400 text-xs leading-normal line-clamp-2 font-medium">
                  {announcement.description}
                </p>
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
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-center shrink-0">
          <Link 
            href="/main/notices" 
            className="flex items-center justify-center gap-2 text-[10px] font-bold text-blue-650 hover:text-blue-700 uppercase tracking-widest transition-colors select-none"
          >
            View All Announcements <ArrowRight size={12} className="stroke-[2.5]" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
