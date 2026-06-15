"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { MoreHorizontal, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AttendanceChartProps {
  data?: any[];
  isHoliday?: boolean;
  stats?: {
    present: number;
    total: number;
  };
}

const COLORS = ["#10B981", "#EF4444"]; // Green, Red

export const AttendanceChart = ({ data, isHoliday, stats }: AttendanceChartProps) => {
  const presentCount = stats?.present ?? 0;
  const totalCount = stats?.total ?? 0;
  const absentCount = Math.max(0, totalCount - presentCount);
  
  const attendancePercentage = totalCount ? Math.round((presentCount / totalCount) * 1000) / 10 : 0;

  const chartData = [
    { name: "Present", value: presentCount },
    { name: "Absent", value: absentCount },
  ];

  return (
    <Card className="border border-slate-100/80 shadow-sm bg-white overflow-hidden rounded-2xl h-full flex flex-col min-h-[380px] hover:shadow-md transition-all duration-300">
      <CardHeader className="p-6 pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2 select-none">
             Attendance Overview
          </CardTitle>
          <div className="p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer select-none">
            <MoreHorizontal className="h-5 w-5 text-slate-400" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 pt-0 flex-grow flex flex-col justify-between">
        <div className="w-full relative flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-4 h-auto sm:h-[220px] py-4 sm:py-0">
          <AnimatePresence>
            {isHoliday && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-4 rounded-2xl"
              >
                <div className="bg-orange-100 p-3 rounded-full mb-2 text-orange-600">
                  <AlertCircle size={24} />
                </div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tighter">School Closed</h3>
                <p className="text-slate-500 font-bold text-[10px] mt-0.5">Today is a holiday / Sunday</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Left half: Pie chart */}
          <div className="w-full sm:w-1/2 h-[160px] sm:h-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center percentage indicator */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
              <span className="text-xl font-extrabold text-slate-900 leading-none">
                {attendancePercentage}%
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                Present
              </span>
            </div>
          </div>

          {/* Right half: Legend */}
          <div className="w-full sm:w-1/2 flex flex-col gap-3.5 px-4 sm:px-0 sm:pr-2 select-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Present</span>
              </div>
              <span className="text-xs font-extrabold text-slate-800">{presentCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-rose-500" />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Absent</span>
              </div>
              <span className="text-xs font-extrabold text-slate-800">{absentCount}</span>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider select-none border-t border-slate-50 pt-4 mt-2">
          Based on this month's attendance
        </p>
      </CardContent>
    </Card>
  );
};
