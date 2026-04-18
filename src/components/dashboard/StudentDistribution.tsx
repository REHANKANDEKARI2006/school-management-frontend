import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface StudentDistributionProps {
  genderRatio: Array<{
    name: string;
    value: number;
    fill: string;
  }>;
}

export const StudentDistribution = ({ genderRatio }: StudentDistributionProps) => {
  return (
    <Card className="border-none shadow-sm bg-white overflow-hidden h-full">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-500" />
          Student Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="h-[200px] w-full flex items-center justify-center">
          {genderRatio && genderRatio.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderRatio.filter(d => d.name === 'Boys' || d.name === 'Girls')}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {genderRatio.filter(d => d.name === 'Boys' || d.name === 'Girls').map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => [`${value} Students`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center text-slate-400">
              <Users className="h-10 w-10 text-slate-200 mb-2" />
              <p className="text-sm">No data available</p>
            </div>
          )}
        </div>

        {genderRatio && genderRatio.length > 0 && (
          <div className="grid grid-cols-2 gap-4 w-full mt-2">
            {genderRatio.filter(d => d.name === 'Boys' || d.name === 'Girls').map((item) => {
              const total = genderRatio
                .filter(d => d.name === 'Boys' || d.name === 'Girls')
                .reduce((acc, curr) => acc + curr.value, 0);
              const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
              
              return (
                <div key={item.name} className="flex flex-col items-center p-3 rounded-2xl bg-slate-50 border border-slate-100/50">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.name}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black text-slate-800">{item.value}</span>
                    <span className="text-[10px] font-bold text-slate-400">{percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
