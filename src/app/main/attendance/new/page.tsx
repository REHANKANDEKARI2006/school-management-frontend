
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
    const fetchInitialData = async () => {
      try {
        const [classesRes, subjectsRes] = await Promise.all([
          axios.get("/api/classes/class-enrollments/list"),
          axios.get("/api/subjects")
        ]);

        if (classesRes.data.data) {
          setClasses(classesRes.data.data);
        }
        if (subjectsRes.data.success) {
          setSubjects(subjectsRes.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch setup data", err);
        toast({ title: "Error", description: "Failed to load classes or subjects.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [toast]);

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
    <div className="flex justify-center items-center py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="font-headline">Start Attendance Session</CardTitle>
          <CardDescription>Select a class and a subject to begin taking attendance.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="class-select">Class</Label>
              <Select onValueChange={setSelectedClassId}>
                <SelectTrigger id="class-select">
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c.class_id} value={c.class_id}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject-select">Subject</Label>
              <Select onValueChange={setSelectedSubjectId} disabled={!selectedClassId}>
                <SelectTrigger id="subject-select">
                  <SelectValue placeholder={selectedClassId ? "Select a subject" : "Select a class first"} />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(s => (
                    <SelectItem key={s.subject_id} value={s.subject_id}>{s.subject_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleStartSession} disabled={!selectedClassId || !selectedSubjectId}>
              Start Session
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
