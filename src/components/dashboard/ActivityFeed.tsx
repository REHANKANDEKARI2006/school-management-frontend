"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History } from 'lucide-react';
import { formatDate, cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ActivityFeedProps {
  activities: Array<{
    action_type: string;
    description: string;
    time: string;
  }>;
}

const formatTimeAgo = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  return formatDate(dateString);
};

export const ActivityFeed = ({ activities = [] }: ActivityFeedProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const displayedActivities = activities.slice(0, 3);

  const ActivityItem = ({ activity, idx, isModal = false }: { activity: any, idx: number, isModal?: boolean }) => (
    <div key={idx} className="relative flex items-start gap-3">
      <div className={cn(
        "flex-1 min-w-0 transition-all",
        isModal ? "" : "p-3 rounded-xl border border-slate-100 bg-white hover:border-indigo-100 hover:shadow-sm"
      )}>
        <div className="flex items-start justify-between gap-2 mb-0.5 select-none">
          <span className="font-extrabold text-slate-800 text-[11px] capitalize truncate">
            {activity?.action_type?.replace(/_/g, ' ') || 'System Action'}
          </span>
          <span className="font-bold text-slate-400 text-[9px] uppercase shrink-0">
            {formatTimeAgo(activity?.time || '')}
          </span>
        </div>
        <p className="text-[10px] font-medium text-slate-500 leading-snug line-clamp-2">
          {activity?.description || 'Action details unavailable.'}
        </p>
      </div>
    </div>
  );

  return (
    <Card className="border border-slate-100/80 shadow-sm bg-white overflow-hidden h-full flex flex-col rounded-2xl">
      <CardHeader className="p-6 pb-2">
        <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-3 select-none">
          <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100/50">
            <History size={18} />
          </div>
          <div>
            <span className="block text-slate-800">Recent Activity</span>
            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">System Logs</span>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 pt-2 flex-grow flex flex-col justify-between gap-4">
        <div className="relative space-y-3 before:absolute before:inset-0 before:ml-3.5 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-50">
          {activities && activities.length > 0 ? (
            displayedActivities.map((activity, idx) => (
              <ActivityItem key={idx} activity={activity} idx={idx} />
            ))
          ) : (
            <div className="py-12 text-center select-none">
              <History className="h-12 w-12 text-slate-200 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No activity logged yet</p>
            </div>
          )}
        </div>

        {activities.length > 3 && (
          <div className="border-t border-slate-50 pt-4 flex justify-center">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <button 
                  className="flex items-center gap-1.5 px-4 py-2 border border-slate-100 bg-white hover:bg-slate-50/50 text-indigo-600 hover:text-indigo-700 font-extrabold text-[10px] uppercase tracking-wider rounded-xl shadow-sm transition-all duration-200 select-none"
                >
                  View All Activities ({activities.length})
                </button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl rounded-2xl bg-white">
                <div className="p-6 pb-4 border-b border-slate-50">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-3 select-none">
                      <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100/50">
                        <History size={18} />
                      </div>
                      <div>
                        <span className="block text-slate-900">System Activity Log</span>
                        <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Comprehensive audit log</span>
                      </div>
                    </DialogTitle>
                  </DialogHeader>
                </div>
                
                <div className="divide-y divide-slate-50 p-4 max-h-[60vh] overflow-y-auto space-y-2">
                  {activities.map((activity, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-100/50 bg-slate-50/20 hover:bg-white hover:border-indigo-100 hover:shadow-sm transition-colors">
                      <ActivityItem activity={activity} idx={idx} isModal={true} />
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
