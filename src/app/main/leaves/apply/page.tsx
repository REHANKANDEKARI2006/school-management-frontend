
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  CalendarIcon, 
  Upload, 
  Loader2, 
  CheckCircle2,
  Info 
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import axios from "@/lib/axios";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function ApplyLeavePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    leave_type_id: "",
    range: {
      from: undefined as Date | undefined,
      to: undefined as Date | undefined,
    },
    reason: "",
    document: null as File | null
  });

  const totalDays = formData.range?.from && formData.range?.to 
    ? differenceInDays(formData.range.to, formData.range.from) + 1 
    : 0;

  useEffect(() => {
    // Fetch leave types from API
    const fetchTypes = async () => {
      try {
        const res = await axios.get("/api/leaves/types");
        setLeaveTypes(res.data || []);
      } catch (err) {
        console.error("Failed to fetch leave types:", err);
      }
    };
    fetchTypes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const staff_id = localStorage.getItem("staff_id");
    
    if (!staff_id) {
       toast({
         title: "Profile Sync Error",
         description: "Staff ID not found. Please log out and log in again to sync your profile.",
         variant: "destructive"
       });
       return;
    }

    if (!formData.leave_type_id || !formData.range?.from || !formData.range?.to || !formData.reason) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const staff_id = localStorage.getItem("staff_id");
      
      // 🛠️ ROOT FIX: Omit the raw 'document' File object from JSON payload
      // (File objects cannot be JSON serialized and cause submission failures)
      const { document, range, ...rest } = formData;
      
      await axios.post("/api/leaves/apply", {
        ...rest,
        staff_id,
        academic_year: "2025-2026",
        start_date: range?.from,
        end_date: range?.to,
        total_days: totalDays
      });
      
      setSuccess(true);
      toast({
        title: "Application Submitted",
        description: "Your leave request has been sent for approval.",
      });
      
      setTimeout(() => router.push("/main/leaves"), 2000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || "Failed to submit application. Please try again.";
      toast({
        title: "Submission Failed",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="h-[80vh] flex items-center justify-center animate-in zoom-in duration-300">
        <Card className="max-w-md w-full border-none bg-background shadow-2xl">
          <CardContent className="pt-12 pb-10 flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold">Success!</h2>
            <p className="text-muted-foreground px-4">
              Your leave application has been submitted successfully and is now pending approval by your HOD.
            </p>
            <div className="pt-4">
              <Button variant="outline" onClick={() => router.push("/main/leaves")}>
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Apply for Leave</h1>
        <p className="text-muted-foreground">Fill out the form below to submit your leave request.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 pb-20">
        <Card className="border-none shadow-sm bg-background/60 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg">Leave Details</CardTitle>
            <CardDescription>Select the type of leave and the date range.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="leave-type">Leave Type</Label>
                <Select 
                  value={formData.leave_type_id} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, leave_type_id: v }))}
                >
                  <SelectTrigger id="leave-type" className="bg-background/50">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map(type => (
                      <SelectItem key={type.leave_type_id} value={String(type.leave_type_id)}>
                        {type.type_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date Range</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      type="button"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-background/50",
                        !formData.range?.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.range?.from ? (
                        formData.range?.to ? (
                          <>
                            {format(formData.range.from, "LLL dd, y")} -{" "}
                            {format(formData.range.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(formData.range.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={formData.range?.from}
                      selected={{
                        from: formData.range?.from,
                        to: formData.range?.to
                      }}
                      onSelect={(range: any) => setFormData(prev => ({ ...prev, range }))}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {totalDays > 0 && (
              <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-100 flex items-center gap-3 text-sm text-blue-700">
                <Info className="w-4 h-4" />
                <span>Total Duration: <strong>{totalDays} {totalDays === 1 ? 'Day' : 'Days'}</strong></span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Leave</Label>
              <Textarea 
                id="reason" 
                placeholder="Briefly explain the reason for your leave request..." 
                className="min-h-[120px] bg-background/50 focus-visible:ring-1"
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="document">Supporting Document (Optional)</Label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input 
                    id="document" 
                    type="file" 
                    className="cursor-pointer bg-background/50"
                    onChange={(e) => setFormData(prev => ({ ...prev, document: e.target.files?.[0] || null }))}
                  />
                </div>
                <div className="text-muted-foreground">
                  <Upload className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Medical certificate or supporting docs (PDF, JPG up to 5MB)</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-4">
          <Button variant="ghost" type="button" onClick={() => router.back()}>Cancel</Button>
          <Button disabled={loading} className="min-w-[140px]">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : "Submit Application"}
          </Button>
        </div>
      </form>
    </div>
  );
}
