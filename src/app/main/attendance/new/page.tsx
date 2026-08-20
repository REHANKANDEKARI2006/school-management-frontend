
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import axios from "@/lib/axios";

export default function AttendanceSetupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedClassId, setSelectedClassId] = React.useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = React.useState<string | null>(null);
  const [classes, setClasses] = React.useState<any[]>([]);
  const [subjects, setSubjects] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchClasses = async () => {
      try {
        const classesRes = await axios.get("/api/classes/class-enrollments/list");
        if (classesRes.data.data) {
          setClasses(classesRes.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch classes", err);
        toast({ title: "Error", description: "Failed to load classes.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchClasses();
  }, [toast]);

  React.useEffect(() => {
    if (!selectedClassId) {
      setSubjects([]);
      setSelectedSubjectId(null);
      return;
    }

    const fetchSubjectsForClass = async () => {
      try {
        const subjectsRes = await axios.get("/api/subjects", {
          params: { class_id: selectedClassId }
        });
        if (subjectsRes.data.success) {
          setSubjects(subjectsRes.data.data);
          setSelectedSubjectId(null);
        }
      } catch (err) {
        console.error("Failed to fetch subjects for class", err);
      }
    };
    fetchSubjectsForClass();
  }, [selectedClassId]);

  const handleStartSession = () => {
    if (!selectedClassId || !selectedSubjectId) {
      toast({
        title: "Selection Incomplete",
        description: "Please select both a class and a subject to start.",
        variant: "destructive",
      });
      return;
    }
    router.push(`/main/attendance/${selectedClassId}/${selectedSubjectId}`);
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-140px)] sm:min-h-0 py-4 sm:py-12">
      <Card className="w-full max-w-lg rounded-3xl sm:rounded-xl border-slate-100/80 shadow-md sm:shadow-sm">
        <CardHeader className="p-5 sm:p-6 pb-2 sm:pb-4">
          <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Start Attendance Session</CardTitle>
          <CardDescription className="text-xs sm:text-sm text-muted-foreground">Select a class and a subject to begin taking attendance.</CardDescription>
        </CardHeader>
        <CardContent className="p-5 sm:p-6 pt-2 sm:pt-0">
          <div className="grid gap-5 sm:gap-6">
            {/* Mobile 2-column grid (Class & Subject side-by-side), Desktop single column */}
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-3 sm:gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="class-select" className="text-xs font-semibold text-slate-700">Class</Label>
                <Select onValueChange={setSelectedClassId}>
                  <SelectTrigger id="class-select" className="h-11 sm:h-10 rounded-xl sm:rounded-md border-slate-200 text-xs sm:text-sm font-semibold bg-slate-50/40 sm:bg-background">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(c => (
                      <SelectItem key={c.class_id} value={c.class_id}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="subject-select" className="text-xs font-semibold text-slate-700">Subject</Label>
                <Select onValueChange={setSelectedSubjectId} disabled={!selectedClassId}>
                  <SelectTrigger id="subject-select" className="h-11 sm:h-10 rounded-xl sm:rounded-md border-slate-200 text-xs sm:text-sm font-semibold bg-slate-50/40 sm:bg-background disabled:opacity-60">
                    <SelectValue placeholder={selectedClassId ? "Select subject" : "Select class first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => (
                      <SelectItem key={s.subject_id} value={s.subject_id}>{s.subject_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleStartSession} 
              disabled={!selectedClassId || !selectedSubjectId}
              className="w-full h-12 sm:h-10 font-bold rounded-xl sm:rounded-md shadow-md text-sm"
            >
              Start Session
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
