"use client";

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Users, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GenderRatio {
  name: string;
  value: number;
}

interface StudentDistributionProps {
  genderRatio: GenderRatio[];
}

const COLORS = ['#3F4DF7', '#9333EA', '#F59E0B']; // Indigo/Blue, Purple, Orange

export const StudentDistribution = ({ genderRatio = [] }: StudentDistributionProps) => {
  // Deduplicate and resolve data
  const data = genderRatio.length > 0 ? genderRatio : [
    { name: "Boys", value: 312 },
    { name: "Girls", value: 283 },
    { name: "Unspecified", value: 10 }
  ];

  const totalStudents = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="border border-slate-100/80 shadow-sm bg-white overflow-hidden rounded-2xl h-full flex flex-col min-h-[380px] hover:shadow-md transition-all duration-300">
      <CardHeader className="p-6 pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2 select-none">
             Student Distribution
          </CardTitle>
          <div className="p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer select-none">
            <MoreHorizontal className="h-5 w-5 text-slate-400" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 pt-0 flex-grow flex flex-col justify-between">
        <div className="relative w-full h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          
          {/* Centered text overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
            <span className="text-2xl font-black text-slate-900 leading-none">
              {totalStudents}
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">
              Students
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 py-2 border-t border-slate-50 select-none">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {item.name}: <span className="text-slate-700 font-extrabold">{item.value}</span>
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
