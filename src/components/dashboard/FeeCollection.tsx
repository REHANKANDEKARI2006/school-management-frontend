import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee, Users, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface FeeCollectionProps {
  stats: {
    feesMonth: number;
    pendingDuesCount: number;
    overdueStudentsCount: number;
  };
}

export const FeeCollection = ({ stats }: FeeCollectionProps) => {
  return (
    <Card className="border border-slate-100/80 shadow-sm bg-white overflow-hidden rounded-2xl h-full flex flex-col justify-between hover:shadow-md transition-all duration-300 min-h-[380px]">
      <div>
        <CardHeader className="p-6 pb-2">
          <CardTitle className="text-sm font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2 select-none">
            Fee Collection
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100 select-none">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                <IndianRupee size={16} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">This Month</p>
                <p className="text-lg font-bold text-slate-900">₹{(stats?.feesMonth || 46336).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 select-none">
            <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100">
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Pending Dues</p>
              <div className="flex items-center gap-2">
                 <AlertCircle size={14} className="text-amber-500" />
                 <p className="text-lg font-bold text-slate-900">{stats?.pendingDuesCount ?? 247}</p>
              </div>
            </div>
            <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-100">
              <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-1">Overdue</p>
              <div className="flex items-center gap-2">
                 <Users size={14} className="text-rose-500" />
                 <p className="text-lg font-bold text-slate-900">{stats?.overdueStudentsCount ?? 0}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </div>

      <div className="p-6 pt-0 select-none shrink-0">
        <div className="pt-4 border-t border-slate-100 flex justify-center">
          <Link 
            href="/main/fees" 
            className="flex items-center justify-center gap-2 text-[10px] font-bold text-blue-650 hover:text-blue-700 uppercase tracking-widest transition-colors select-none"
          >
            View All Payments <ArrowRight size={12} className="stroke-[2.5]" />
          </Link>
        </div>
      </div>
    </Card>
  );
};
