import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Wallet } from 'lucide-react';

interface FinanceChartProps {
  data: Array<{
    name: string;
    income: number;
    year_month?: string;
  }>;
}

export const FinanceChart = ({ data }: FinanceChartProps) => {
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short' });

  return (
    <Card className="border-none shadow-sm bg-white overflow-hidden col-span-1 lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Wallet className="h-5 w-5 text-indigo-600" />
            Monthly Fee Collection
          </CardTitle>
          <p className="text-xs text-slate-500">6-month collection overview</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748B', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748B', fontSize: 12 }}
                tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Collection']}
              />
              <Bar dataKey="income" radius={[6, 6, 0, 0]} barSize={40}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.name === currentMonth ? '#4f46e5' : '#cbd5e1'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
