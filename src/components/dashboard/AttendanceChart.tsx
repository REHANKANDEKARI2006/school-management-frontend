"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";

interface AttendanceChartProps {
  data?: { name: string; present: number; absent: number }[];
}

const defaultData = [
  { name: "Mon", present: 40, absent: 24 },
  { name: "Tue", present: 30, absent: 13 },
  { name: "Wed", present: 20, absent: 98 },
  { name: "Thur", present: 27, absent: 39 },
  { name: "Fri", present: 18, absent: 48 },
];

export const AttendanceChart = ({ data = defaultData }: AttendanceChartProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white rounded-xl w-full h-full p-4 border border-blue-100 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* TITLE */}
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">Attendance</h1>
        <MoreHorizontal className="h-5 w-5 text-gray-400 cursor-pointer" />
      </div>

      {/* CHART */}
      <div className="w-full h-[85%] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            barSize={20}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" axisLine={false} tick={{fill: "#d1d5db"}} tickLine={false} />
            <YAxis axisLine={false} tick={{fill: "#d1d5db"}} tickLine={false} />
            <Tooltip contentStyle={{borderRadius: "10px", borderColor: "lightgray"}} />
            <Legend align="left" verticalAlign="top" wrapperStyle={{paddingTop: "10px", paddingBottom: "30px"}} />
            <Bar dataKey="present" fill="#2563eb" radius={[10, 10, 0, 0]} />
            <Bar dataKey="absent" fill="#93c5fd" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};
