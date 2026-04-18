import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Rocket, Calendar, Clock, MapPin } from 'lucide-react';

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
    <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-50 to-white h-full">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Rocket className="h-5 w-5 text-indigo-600" />
          Upcoming Exams
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {upcomingExams.length > 0 ? (
          upcomingExams.map((exam) => (
            <div key={exam.id} className="p-4 bg-white rounded-lg border border-indigo-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-slate-900 line-clamp-1">{exam.title}</h4>
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 shrink-0">
                  {new Date(exam.time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </Badge>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{new Date(exam.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="line-clamp-1">{exam.location || 'Examination Hall'}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center">
            <Calendar className="h-12 w-12 text-slate-200 mx-auto mb-2" />
            <p className="text-slate-400">No upcoming exams scheduled</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
