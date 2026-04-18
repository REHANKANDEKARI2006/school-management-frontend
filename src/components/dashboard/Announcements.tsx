"use client";

import { motion } from "framer-motion";
import { Megaphone, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";

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

export const Announcements = ({ announcements = defaultAnnouncements }: AnnouncementsProps) => {
  const displayedAnnouncements = announcements.slice(0, 3);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
           <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
              <Megaphone size={16} />
           </div>
           <h2 className="text-lg font-black font-headline text-slate-800">Notices</h2>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {displayedAnnouncements.map((announcement, idx) => (
          <motion.div
            key={announcement.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + idx * 0.1 }}
            className="p-3.5 rounded-xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:border-blue-100 hover:shadow-sm transition-all group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-0.5 min-w-0">
                 <h3 className="font-bold text-slate-700 text-[13px] group-hover:text-blue-600 transition-colors leading-tight truncate">{announcement.title}</h3>
                 <p className="text-slate-500 text-[11px] leading-relaxed truncate">{announcement.description}</p>
              </div>
              <div className="flex items-center text-[9px] font-black text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-100 shrink-0 h-fit">
                 {new Date(announcement.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
          </motion.div>
        ))}
        
        {announcements.length > 3 && (
          <Link 
            href="/main/notices" 
            className="flex items-center justify-center gap-2 py-2 mt-1 text-[11px] font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest border border-dashed border-slate-200 rounded-xl hover:border-blue-200 hover:bg-blue-50/30"
          >
            View All Announcements <ArrowRight size={12} />
          </Link>
        )}

        {announcements.length === 0 && (
          <div className="text-center py-6">
             <p className="text-slate-400 text-[11px] font-bold">No recent announcements</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
