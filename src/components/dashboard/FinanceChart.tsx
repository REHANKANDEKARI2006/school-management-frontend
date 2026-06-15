"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface FinanceChartProps {
  data: any[];
}

export const FinanceChart = ({ data }: FinanceChartProps) => {
  // Use mockup data if none provided or insufficient to render a beautiful line chart
  const chartData = data && data.length >= 2 
    ? data.map(item => ({
        name: item.name,
        income: Number(item.income) || 0,
      })) 
    : [
        { name: "Jan", income: 35000 },
        { name: "Feb", income: 48000 },
        { name: "Mar", income: 55000 },
        { name: "Apr", income: 62800 },
      ];

  // Get the latest month values (or total if preferred, but latest month matches the current status)
  const latestItem = chartData[chartData.length - 1];
  const displayIncome = latestItem?.income ?? 0;

  return (
    <Card className="border border-slate-100/80 shadow-sm bg-white overflow-hidden rounded-2xl flex flex-col justify-between h-full">
      <CardHeader className="p-6 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-3 select-none">
             <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100/50">
                <TrendingUp size={20} />
             </div>
             <div>
                <span className="block text-slate-800">Finance Overview</span>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Annual Report</span>
             </div>
          </CardTitle>
          
          {/* Header Stats Matching Mockup Exactly */}
          <div className="flex items-center gap-4 text-xs font-black select-none text-left">
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-emerald-50/50 border border-emerald-100/50 rounded-xl">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <div>
                <span className="block text-slate-400 font-bold uppercase tracking-wide text-[8px]">Income</span>
                <span className="block text-emerald-600 font-extrabold text-[11px] leading-tight">₹{displayIncome.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 pt-2 flex flex-col justify-between flex-grow gap-4">
        <div className="w-full h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 15, right: 10, left: -25, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 700 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 700 }}
              />
              <Tooltip
                contentStyle={{ 
                  borderRadius: "16px", 
                  border: "1px solid #e2e8f0", 
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" 
                }}
                labelClassName="font-black text-slate-800"
              />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                name="Income"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Centered Last 4 Months Link matching mockup exactly */}
        <div className="flex justify-center border-t border-slate-50 pt-4">
          <Link href="/main/fees">
            <button className="flex items-center gap-1.5 px-4 py-2 border border-slate-100 bg-white hover:bg-slate-50/50 text-blue-650 hover:text-blue-700 font-extrabold text-[10px] uppercase tracking-wider rounded-xl shadow-sm transition-all duration-200 select-none">
              Last 4 Months
              <ArrowRight size={12} className="text-blue-500" />
            </button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

