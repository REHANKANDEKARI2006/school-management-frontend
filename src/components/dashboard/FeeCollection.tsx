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
    <Card className="border border-slate-100/80 shadow-sm bg-white overflow-hidden rounded-2xl flex flex-col justify-between hover:shadow-md transition-all duration-300">
      <div>
        <CardHeader className="p-4 sm:p-5 pb-2">
          <CardTitle className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2 select-none">
            Fee Collection
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 pt-2">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 select-none">
            {/* THIS MONTH CARD */}
            <div className="p-3.5 sm:p-4 bg-slate-50/80 rounded-xl border border-slate-100 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">This Month</span>
                <div className="h-6 w-6 bg-blue-100/80 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                  <IndianRupee size={12} />
                </div>
              </div>
              <p className="text-base sm:text-lg font-black text-slate-900">₹{(stats?.feesMonth ?? 0).toLocaleString()}</p>
            </div>

            {/* PENDING DUES CARD */}
            <div className="p-3.5 sm:p-4 bg-amber-50/70 rounded-xl border border-amber-100/90 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider">Pending Dues</span>
                <div className="h-6 w-6 bg-amber-100/80 rounded-lg flex items-center justify-center text-amber-600 shrink-0">
                  <AlertCircle size={12} className="text-amber-500" />
                </div>
              </div>
              <p className="text-base sm:text-lg font-black text-slate-900">{stats?.pendingDuesCount ?? 0}</p>
            </div>
          </div>
        </CardContent>
      </div>

      <div className="px-4 sm:px-5 pb-4 select-none shrink-0">
        <div className="pt-3 border-t border-slate-100 flex justify-center">
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
