import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee, TrendingUp, Users, AlertCircle } from 'lucide-react';

interface FeeCollectionProps {
  stats: {
    feesMonth: number;
    pendingDuesCount: number;
    overdueStudentsCount: number;
  };
}

export const FeeCollection = ({ stats }: FeeCollectionProps) => {
  const currentFees = stats?.feesMonth || 0;
  const pendingCount = stats?.pendingDuesCount || 0;
  const overdueCount = stats?.overdueStudentsCount || 0;

  return (
    <Card className="border-none shadow-sm bg-white overflow-hidden h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <IndianRupee className="h-5 w-5 text-emerald-600" />
          Fee Status
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between space-y-4">
        {/* Main Stat: Monthly Collection */}
        <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Month Collection</span>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-3xl font-black text-slate-900">₹{currentFees.toLocaleString()}</p>
        </div>

        {/* Secondary Stats: Pending and Overdue */}
        <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 mb-1">
                    <Users className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pending</span>
                </div>
                <p className="text-xl font-bold text-slate-800">{pendingCount}</p>
                <p className="text-[9px] text-slate-400 font-medium">unpaid records</p>
            </div>

            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
                <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Overdue</span>
                </div>
                <p className="text-xl font-bold text-rose-700">{overdueCount}</p>
                <p className="text-[9px] text-rose-400 font-medium">beyond deadline</p>
            </div>
        </div>
      </CardContent>
    </Card>
  );
};
