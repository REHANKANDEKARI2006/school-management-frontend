"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

export const BigCalendar = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white p-6 rounded-3xl border border-blue-50 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all"
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-black font-headline text-slate-800">Calendar</h2>
        <button className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors">
           <MoreHorizontal size={20} />
        </button>
      </div>

      <div className="calendar-wrapper flex justify-center">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-xl border-0 p-0 pointer-events-auto"
          classNames={{
            months: "w-full space-y-4",
            month: "w-full space-y-4",
            caption: "flex justify-center pt-1 relative items-center mb-4",
            caption_label: "text-sm font-black font-headline text-blue-600 uppercase tracking-widest",
            nav: "space-x-1 flex items-center",
            nav_button: "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity",
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "flex w-full mb-2",
            head_cell: "text-slate-400 font-bold w-full text-[10px] uppercase tracking-tighter",
            row: "flex w-full mt-2",
            cell: "h-9 w-full text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
            day: "h-9 w-9 p-0 font-bold aria-selected:opacity-100 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all flex items-center justify-center mx-auto",
            day_selected: "bg-blue-600 text-white hover:bg-blue-700 hover:text-white shadow-lg shadow-blue-200 focus:bg-blue-600 focus:text-white",
            day_today: "bg-slate-100 text-slate-800",
            day_outside: "text-slate-300 opacity-50",
            day_disabled: "text-slate-300 opacity-50",
            day_range_middle: "aria-selected:bg-blue-50 aria-selected:text-blue-900",
            day_hidden: "invisible",
          }}
          components={{
            IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
            IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
          }}
        />
      </div>
    </motion.div>
  );
};
