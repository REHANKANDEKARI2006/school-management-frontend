import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Rocket, Calendar, Clock, MapPin } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

interface ExamStatusProps {
  events?: Array<{
    id: number;
    title: string;
    time: string;
    description: string;
    location: string;
    category: string;
  }>;
}

export const ExamStatus = ({ events = [] }: ExamStatusProps) => {
  const exams = events.filter(e => e.category === 'exam');
  
  // Deduplicate by title + time
  const uniqueExamsMap = new Map();
  exams.forEach(e => {
    const key = `${e.title}_${e.time}`;
    if (!uniqueExamsMap.has(key)) {
      uniqueExamsMap.set(key, e);
    }
  });

  const upcomingExams = Array.from(uniqueExamsMap.values())
    .filter(e => new Date(e.time) >= new Date())
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
    .slice(0, 3);

  return (
    <Card className="border border-slate-100/80 shadow-sm bg-white h-full rounded-2xl">
      <CardHeader className="p-6 pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-3 select-none">
            <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100/50">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-slate-800">Upcoming Exams</span>
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Schedule</span>
            </div>
          </CardTitle>
          <Link href="/main/exams">
            <button className="flex items-center gap-1 px-3 py-1.5 border border-slate-100 bg-white hover:bg-slate-50/50 text-blue-650 font-extrabold text-[10px] uppercase tracking-wider rounded-xl shadow-sm transition-all select-none">
              View All
            </button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-4 space-y-4">
        {upcomingExams.length > 0 ? (
          upcomingExams.map((exam) => (
            <div key={exam.id} className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 hover:bg-white hover:border-indigo-100 hover:shadow-sm transition-all group">
              <div className="flex justify-between items-start mb-2 gap-4">
                <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{exam.title}</h4>
                <Badge variant="outline" className="bg-white text-indigo-600 border-indigo-100 shrink-0 font-bold">
                  {formatDate(exam.time)}
                </Badge>
              </div>
              <div className="space-y-2 text-[12px] font-medium text-slate-500">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-indigo-500" />
                  <span>{new Date(exam.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                  <span className="line-clamp-1">{exam.location || 'Examination Hall'}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center">
            <Calendar className="h-12 w-12 text-slate-200 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No upcoming exams scheduled</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
