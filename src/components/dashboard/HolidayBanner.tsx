"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Palmtree, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/axios";

interface HolidayBannerProps {
  todayHolidays?: any[];
}

export const HolidayBanner = ({ todayHolidays: propHolidays }: HolidayBannerProps) => {
  const [holidays, setHolidays] = useState<any[]>(propHolidays || []);
  const [loading, setLoading] = useState(!propHolidays);

  useEffect(() => {
    if (propHolidays) {
      setHolidays(propHolidays);
      return;
    }

    const checkHoliday = async () => {
      try {
        const now = new Date();
        const year = format(now, "yyyy");
        const month = format(now, "M");
        const dateStr = format(now, "yyyy-MM-dd");
        const isSunday = now.getDay() === 0;
        
        const res = await api.get(`/api/holidays?year=${year}&month=${month}`);
        let found = [];
        if (res.data.success) {
          found = res.data.data.filter((h: any) => h.date === dateStr);
        }

        if (isSunday && !found.some((h: any) => h.name.toLowerCase().includes('sunday'))) {
          found.push({
            name: "Sunday Off",
            category: "Weekend",
            isSunday: true
          });
        }
        setHolidays(found || []);
      } catch (err) {
        console.error("Holiday check failed:", err);
      } finally {
        setLoading(false);
      }
    };

    checkHoliday();
  }, [propHolidays]);

  if (loading || holidays.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 relative"
      >
        <div className="bg-white border border-orange-100 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row items-stretch">
          <div className="bg-orange-500 w-full md:w-2 shrink-0" />
          <div className="p-4 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-orange-50 p-2.5 rounded-xl border border-orange-100">
                <Palmtree className="w-5 h-5 text-orange-500" />
              </div>
              <div className="space-y-0.5">
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">
                    School Closed
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {format(new Date(), "EEEE, d MMMM")}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  {holidays.map((h, i) => (
                    <h2 key={i} className="text-lg font-black text-slate-900 leading-tight">
                      {h.isSunday ? (
                        <>It's <span className="text-orange-600">Sunday</span> — School is Closed</>
                      ) : (
                        <>Today is <span className="text-orange-600">{h.name}</span></>
                      )}
                      {h.category && (
                        <span className="ml-2 text-[8px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded uppercase font-bold align-middle">
                          {h.category}
                        </span>
                      )}
                    </h2>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="hidden md:block text-right">
              <p className="text-[11px] font-bold text-slate-400 leading-tight max-w-[240px]">
                No scheduled classes or attendance required. Enjoy the observance.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
