
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
import { getClasses, getSubjectsForClass } from "@/lib/mock-data";

export default function AttendanceSetupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedClassId, setSelectedClassId] = React.useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = React.useState<string | null>(null);
  const [classes] = React.useState(getClasses());
  const [subjects, setSubjects] = React.useState<ReturnType<typeof getSubjectsForClass>>([]);

  React.useEffect(() => {
    if (selectedClassId) {
      setSubjects(getSubjectsForClass(selectedClassId));
      setSelectedSubjectId(null); // Reset subject when class changes
    } else {
      setSubjects([]);
    }
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
    router.push(`/dashboard/attendance/${selectedClassId}/${selectedSubjectId}`);
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
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
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
                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
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
