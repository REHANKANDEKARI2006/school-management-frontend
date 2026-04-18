
"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Clock, 
  MapPin, 
  BookOpen,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import axios from "@/lib/axios";

export default function SubstituteDutiesPage() {
  const [duties, setDuties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulating API fetch for substitute duties
    const fetchDuties = async () => {
      try {
        const staffId = localStorage.getItem("staff_id");
        if (!staffId) return;
        const res = await axios.get(`/api/leaves/duties/${staffId}`);
        const data = res.data || [];
        // Since backend might be empty, providing mockup for demonstration
        setDuties(data.length > 0 ? data : [
          {
            sub_id: 101,
            original_first_name: "John",
            original_last_name: "Doe",
            sub_date: "2026-04-18",
            period_number: 2,
            start_time: "09:50 AM",
            class_name: "Grade 10 - A",
            subject_name: "Mathematics",
            status: 1
          },
          {
            sub_id: 102,
            original_first_name: "Sarah",
            original_last_name: "Smith",
            sub_date: "2026-04-18",
            period_number: 4,
            start_time: "11:30 AM",
            class_name: "Grade 11 - B",
            subject_name: "English Literature",
            status: 1
          }
        ]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDuties();
  }, []);

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Substitute Duties</h1>
          <Badge className="bg-primary/10 text-primary border-primary/20">{duties.filter(d => d.status === 1).length} Pending</Badge>
        </div>
        <p className="text-muted-foreground">Manage the classroom sessions assigned to you for absent colleagues.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="animate-pulse bg-secondary/10 h-[240px] border-none" />
          ))
        ) : duties.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <h3 className="text-lg font-medium">Clear Schedule!</h3>
            <p className="text-muted-foreground">No substitute duties assigned to you at the moment.</p>
          </div>
        ) : (
          duties.map((duty) => (
            <Card key={duty.sub_id} className="border-none bg-background/50 hover:bg-background/80 shadow-sm transition-all overflow-hidden group">
              <div className="h-1.5 w-full bg-primary/20 group-hover:bg-primary transition-colors" />
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Absent Teacher</p>
                    <h3 className="font-bold flex items-center gap-2">
                       {duty.original_first_name} {duty.original_last_name}
                    </h3>
                  </div>
                  <Badge variant="secondary" className="bg-secondary/50">Period {duty.period_number}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>{duty.start_time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-right justify-end">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>{duty.sub_date}</span>
                  </div>
                </div>

                <div className="p-3 bg-secondary/30 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    {duty.class_name}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    {duty.subject_name}
                  </div>
                </div>

                {duty.status === 1 ? (
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1 text-rose-600 border-rose-100 hover:bg-rose-50 gap-2">
                      <XCircle className="w-4 h-4" /> Decline
                    </Button>
                    <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2">
                      <CheckCircle className="w-4 h-4" /> Accept
                    </Button>
                  </div>
                ) : (
                  <div className="pt-2">
                    <Badge className={duty.status === 2 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}>
                      {duty.status === 2 ? 'Accepted' : 'Declined'}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-4">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold text-amber-700 uppercase tracking-tight">Substitution Protocol</p>
          <p className="text-muted-foreground leading-relaxed">
            Please accept or decline duties at least 2 hours before the session. If you decline, the system will automatically 
            re-assign the duty to the next best suggested candidate.
          </p>
        </div>
      </div>
    </div>
  );
}
