"use client";

import React from "react";
import { BookOpen } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface AssignmentTrackerProps {
  assignments: Array<{
    material_id: number;
    title: string;
    class_name: string;
    submitted: number;
    total: number;
  }>;
}

export const AssignmentTracker = ({ assignments }: AssignmentTrackerProps) => {
  return (
    <Card className="rounded-[2.5rem] border-blue-50 shadow-sm overflow-hidden bg-white">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-black text-slate-800 tracking-tight">Assignment Tracker</CardTitle>
        <div className="bg-indigo-50 p-2 rounded-xl">
          <BookOpen className="w-4 h-4 text-indigo-600" />
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-6 flex flex-col gap-5">
        {assignments.length > 0 ? (
          assignments.map((item, idx) => {
            const percentage = item.total > 0 ? (item.submitted / item.total) * 100 : 0;
            return (
              <div key={idx} className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-800 line-clamp-1">{item.title}</span>
                    <span className="text-[10px] font-bold text-slate-400 capitalize">{item.class_name}</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-600">{item.submitted}/{item.total}</span>
                </div>
                <div className="relative h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-4 text-center">
            <p className="text-xs font-bold text-slate-400">No active assignments tracker.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
