"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { MoreHorizontal, User, UserCheck } from "lucide-react";
import { motion } from "framer-motion";

interface GenderChartProps {
  data?: { name: string; value: number; fill: string }[];
}

const defaultData = [
  { name: "Boys", value: 1234, fill: "#2563eb" },
  { name: "Girls", value: 1234, fill: "#60a5fa" },
];

export const GenderChart = ({ data = defaultData }: GenderChartProps) => {
  const total = data.reduce((acc, item) => acc + item.value, 0);
  const boys = data.find(d => d.name === "Boys")?.value || 0;
  const girls = data.find(d => d.name === "Girls")?.value || 0;
  const boysPct = total > 0 ? Math.round((boys / total) * 100) : 0;
  const girlsPct = total > 0 ? Math.round((girls / total) * 100) : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl w-full h-full p-4 border border-blue-100 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* TITLE */}
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">Students</h1>
        <MoreHorizontal className="h-5 w-5 text-gray-400 cursor-pointer" />
      </div>

      {/* CHART */}
      <div className="relative w-full h-[75%] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-1">
            <User className="h-10 w-10 text-blue-200" />
            <UserCheck className="h-10 w-10 text-blue-100" />
        </div>
      </div>

      {/* BOTTOM */}
      <div className="flex justify-center gap-16">
        <div className="flex flex-col gap-1 items-center">
          <div className="w-5 h-5 bg-[#2563eb] rounded-full" />
          <h1 className="font-bold">{boys.toLocaleString()}</h1>
          <h2 className="text-xs text-gray-400 whitespace-nowrap">Boys ({boysPct}%)</h2>
        </div>
        <div className="flex flex-col gap-1 items-center">
          <div className="w-5 h-5 bg-[#60a5fa] rounded-full" />
          <h1 className="font-bold">{girls.toLocaleString()}</h1>
          <h2 className="text-xs text-gray-400 whitespace-nowrap">Girls ({girlsPct}%)</h2>
        </div>
      </div>
    </motion.div>
  );
};
