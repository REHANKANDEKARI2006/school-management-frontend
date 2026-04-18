import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, UserPlus, CreditCard, ClipboardCheck, ScrollText, Calendar, PlusCircle } from 'lucide-react';

interface ActivityFeedProps {
  activities: Array<{
    action_type: string;
    description: string;
    time: string;
  }>;
}

const getActionIcon = (type: string) => {
  if (!type) return <History className="h-4 w-4 text-slate-500" />;
  switch (type.toLowerCase()) {
    case 'student enrolled': return <UserPlus className="h-4 w-4 text-emerald-500" />;
    case 'fee payment collected': return <CreditCard className="h-4 w-4 text-blue-500" />;
    case 'notice posted': return <PlusCircle className="h-4 w-4 text-amber-500" />;
    case 'exam scheduled': return <Calendar className="h-4 w-4 text-purple-500" />;
    case 'attendance marked': return <ClipboardCheck className="h-4 w-4 text-indigo-500" />;
    case 'paper generated': return <ScrollText className="h-4 w-4 text-cyan-500" />;
    case 'tc issued': return <History className="h-4 w-4 text-rose-500" />;
    default: return <History className="h-4 w-4 text-slate-500" />;
  }
};

const formatTimeAgo = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  return date.toLocaleDateString();
};

export const ActivityFeed = ({ activities = [] }: ActivityFeedProps) => {
  return (
    <Card className="border-none shadow-sm bg-white overflow-hidden h-full">
      <CardHeader className="pb-3 border-b border-slate-50">
        <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <History className="h-5 w-5 text-indigo-500" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="relative space-y-6 before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
          {activities && activities.length > 0 ? (
            activities.map((activity, idx) => (
              <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-8 h-8 rounded-full border border-white bg-slate-50 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors duration-300 group-hover:bg-white group-hover:text-indigo-600 group-hover:border-indigo-100 group-hover:shadow-md">
                   {getActionIcon(activity?.action_type || '')}
                </div>
                
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2rem)] p-3 rounded-lg border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:border-indigo-100 relative group-hover:-translate-y-0.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 text-sm capitalize">{activity?.action_type || 'System Action'}</span>
                    <span className="font-medium text-slate-400 text-[10px] uppercase tracking-wider">{formatTimeAgo(activity?.time || '')}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-snug">
                    {activity?.description || 'Action details unavailable.'}
                  </p>
                  
                  {/* Arrow for timeline - Desktop only */}
                  <div className="hidden md:block absolute top-[14px] w-2 h-2 bg-white border-slate-100 border-t border-r rotate-45 
                    group-odd:-left-[5px] group-odd:border-l-0 group-odd:border-b-0
                    group-even:-right-[5px] group-even:border-l group-even:border-b group-even:border-t-0 group-even:border-r-0
                    group-hover:border-indigo-100 transition-colors"></div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center bg-white relative z-20">
              <History className="h-10 w-10 text-slate-200 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No activity logged yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
