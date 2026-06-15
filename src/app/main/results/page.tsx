"use client";

import * as React from "react";
import RouteGuard from "@/components/auth/RouteGuard";
import { ROLE, ADMIN_GROUP, TEACHING_STAFF_GROUP, STUDENT_PARENT_GROUP, ALL_STAFF_GROUP } from "@/config/roles";
import axios from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import {
  Award,
  Lock,
  Unlock,
  RefreshCw,
  CheckCircle,
  Eye,
  Send,
  Loader2,
  Trophy,
  Users,
  BookOpen,
  ArrowRight,
  Info,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Download,
  FileDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { GradeEntryForm } from "@/components/campus-connect/grade-entry-form";

// Allowed roles for RouteGuard
const RESULTS_ALLOWED_ROLES = [...ALL_STAFF_GROUP, ...STUDENT_PARENT_GROUP];

export default function ResultsPage() {
  const [roleId, setRoleId] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("role_id");
      if (stored) setRoleId(Number(stored));
    }
  }, []);

  if (roleId === null) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Determine view based on role
  const isAdmin = (ADMIN_GROUP as readonly number[]).includes(roleId) || roleId === ROLE.IT_SUPPORT;
  const isFaculty = (TEACHING_STAFF_GROUP as readonly number[]).includes(roleId);
  const isStudentOrParent = (STUDENT_PARENT_GROUP as readonly number[]).includes(roleId);

  return (
    <RouteGuard allowedRoles={RESULTS_ALLOWED_ROLES}>
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Award className="h-8 w-8 text-indigo-600 animate-pulse" />
              Result Management
            </h1>
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
              CampusConnect Academic Hub
            </p>
          </div>
          <Badge variant="outline" className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-slate-50 border-slate-200">
            Role: {isAdmin ? "Administrator" : isFaculty ? "Faculty Member" : "Student / Guardian"}
          </Badge>
        </div>

        {/* ROLE VIEW ROUTER */}
        {isAdmin && <AdminResultsDashboard />}
        {isFaculty && <FacultyResultsDashboard />}
        {isStudentOrParent && <StudentParentResultsDashboard />}

      </div>
    </RouteGuard>
  );
}

/* ==========================================================================
   ADMIN RESULTS DASHBOARD
   ========================================================================== */
function AdminResultsDashboard() {
  const { toast } = useToast();
  const [classes, setClasses] = React.useState<any[]>([]);
  const [exams, setExams] = React.useState<any[]>([]);
  
  const [selectedClass, setSelectedClass] = React.useState<string>("all");
  const [selectedExam, setSelectedExam] = React.useState<string>("all");
  
  const [trackingData, setTrackingData] = React.useState<any[]>([]);
  const [overallStatus, setOverallStatus] = React.useState<string>("None");
  const [loading, setLoading] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState(false);

  // Preview Modal States
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewData, setPreviewData] = React.useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = React.useState(false);

  // Load filter options
  React.useEffect(() => {
    const loadFilters = async () => {
      try {
        const [classesRes, examsRes] = await Promise.all([
          axios.get("/api/classes"),
          axios.get("/api/exams")
        ]);
        
        // Extract unique class names
        const classList = classesRes.data.data || [];
        const uniqueClassNames = Array.from(new Set(classList.map((c: any) => c.class_name))).filter(Boolean);
        setClasses(uniqueClassNames);

        // Extract unique exam names
        const examList = examsRes.data.data || [];
        const uniqueExamNames = Array.from(new Set(examList.map((e: any) => e.exam_name))).filter(Boolean);
        setExams(uniqueExamNames);
      } catch (err: any) {
        console.error("Failed to load admin filters", err);
      }
    };
    loadFilters();
  }, []);

  // Fetch tracking list
  const fetchTracking = React.useCallback(async () => {
    if (selectedClass === "all" || selectedExam === "all") {
      setTrackingData([]);
      setOverallStatus("None");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(`/api/results/tracking?class_name=${encodeURIComponent(selectedClass)}&exam_name=${encodeURIComponent(selectedExam)}`);
      if (res.data.success) {
        setTrackingData(res.data.data || []);
        setOverallStatus(res.data.overallStatus || "None");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to load tracking data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedExam, toast]);

  React.useEffect(() => {
    fetchTracking();
  }, [selectedClass, selectedExam, fetchTracking]);

  // Check if all subject marks are locked/submitted
  const allSubmitted = trackingData.length > 0 && trackingData.every((item) => item.marks_status === "Submitted");

  const handleGenerate = async () => {
    setActionLoading(true);
    try {
      const res = await axios.post("/api/results/generate", {
        class_name: selectedClass,
        exam_name: selectedExam
      });
      if (res.data.success) {
        toast({
          title: "Results Generated",
          description: `Scorecards successfully compiled for ${selectedClass} - ${selectedExam}.`
        });
        fetchTracking();
      }
    } catch (err: any) {
      toast({
        title: "Generation Failed",
        description: err?.response?.data?.message || "Calculation failed",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublish = async () => {
    setActionLoading(true);
    try {
      const res = await axios.post("/api/results/publish", {
        class_name: selectedClass,
        exam_name: selectedExam
      });
      if (res.data.success) {
        toast({
          title: "Results Published",
          description: `Student scorecard visibility released online.`
        });
        fetchTracking();
      }
    } catch (err: any) {
      toast({
        title: "Publish Failed",
        description: err?.response?.data?.message || "Publish failed",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlock = async (examId: number) => {
    try {
      const res = await axios.post(`/api/results/unlock/${examId}`);
      if (res.data.success) {
        toast({
          title: "Marks Unlocked",
          description: "Teacher access restored. Marks status changed back to Draft."
        });
        fetchTracking();
      }
    } catch (err: any) {
      toast({
        title: "Unlock Failed",
        description: err?.response?.data?.message || "Failed to unlock entry",
        variant: "destructive"
      });
    }
  };

  const handlePreview = async () => {
    setPreviewOpen(true);
    setPreviewLoading(true);
    try {
      const res = await axios.get(`/api/results/preview?class_name=${encodeURIComponent(selectedClass)}&exam_name=${encodeURIComponent(selectedExam)}`);
      if (res.data.success) {
        setPreviewData(res.data.data || []);
      }
    } catch (err: any) {
      toast({
        title: "Preview Load Failed",
        description: "Could not fetch report card previews.",
        variant: "destructive"
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* FILTER BAR CARDS */}
      <Card className="border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[1.5rem]">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Select Standard Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-full h-11 rounded-xl">
                  <SelectValue placeholder="Choose Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">-- Select Class --</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Select Examination</label>
              <Select value={selectedExam} onValueChange={setSelectedExam}>
                <SelectTrigger className="w-full h-11 rounded-xl">
                  <SelectValue placeholder="Choose Exam" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">-- Select Exam --</SelectItem>
                  {exams.map((ex) => (
                    <SelectItem key={ex} value={ex}>{ex}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FILTER PENDING DEFAULT STATE */}
      {(selectedClass === "all" || selectedExam === "all") && (
        <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 py-16 text-center rounded-[2rem]">
          <CardContent className="flex flex-col items-center gap-4 max-w-sm mx-auto">
            <div className="h-16 w-16 bg-white border border-slate-100 rounded-3xl flex items-center justify-center text-indigo-600 shadow-sm animate-bounce">
              <Sparkles size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-800">Review Marks Entries</h3>
              <p className="text-sm font-medium text-slate-500">
                Select a class and examination above to track marks entry progress, calculate averages, and publish student scorecards.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TRACKING LIST STATE */}
      {selectedClass !== "all" && selectedExam !== "all" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* PROGRESS & PUBLISHING CONTROL CARD */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-indigo-100 bg-indigo-50/20 rounded-[2rem] shadow-sm">
              <CardHeader className="p-6 pb-2">
                <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-indigo-600" />
                  Result Status
                </CardTitle>
                <CardDescription className="text-slate-500 text-xs">
                  Generate and publish report card summaries.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-2 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Overall Status</span>
                    <Badge
                      className={`px-3 py-1 text-[11px] font-black uppercase tracking-wider rounded-full border ${
                        overallStatus === "Published"
                          ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                          : overallStatus === "Generated"
                          ? "bg-blue-100 text-blue-800 border-blue-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {overallStatus}
                    </Badge>
                  </div>

                  {/* Submission Progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-600">
                      <span>Subject Lock Progress</span>
                      <span>
                        {trackingData.filter((i) => i.marks_status === "Submitted").length} / {trackingData.length} Subjects Locked
                      </span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className="h-full bg-indigo-600 transition-all duration-500 rounded-full"
                        style={{
                          width: `${
                            trackingData.length > 0
                              ? (trackingData.filter((i) => i.marks_status === "Submitted").length / trackingData.length) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTON CONTROLS */}
                <div className="space-y-3 pt-2">
                  {/* GENERATE */}
                  <Button
                    onClick={handleGenerate}
                    disabled={actionLoading || !allSubmitted}
                    className="w-full font-semibold rounded-xl py-5 h-auto flex items-center justify-center gap-2"
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    {overallStatus !== "None" ? "Re-Generate Results" : "Generate Results"}
                  </Button>

                  {/* PREVIEW */}
                  {(overallStatus === "Generated" || overallStatus === "Published") && (
                    <Button
                      variant="outline"
                      onClick={handlePreview}
                      className="w-full border-slate-200 hover:bg-white text-slate-700 font-semibold rounded-xl py-5 h-auto flex items-center justify-center gap-2"
                    >
                      <Eye className="h-4 w-4 text-slate-500" />
                      Preview Scorecards
                    </Button>
                  )}

                  {/* PUBLISH */}
                  {overallStatus === "Generated" && (
                    <Button
                      onClick={handlePublish}
                      disabled={actionLoading}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl py-5 h-auto flex items-center justify-center gap-2 shadow-sm"
                    >
                      {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Publish Scorecards
                    </Button>
                  )}
                </div>

                {/* HELPERS & WARNINGS */}
                {!allSubmitted && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed text-amber-900 font-medium">
                      Calculation locked. All subject entries must be submitted and locked by teachers before generating summaries.
                    </p>
                  </div>
                )}
                {overallStatus === "Published" && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed text-green-950 font-medium">
                      Success! Report cards have been made visible to student and parent portals.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* DETAILED TRACKING LIST TABLE */}
          <div className="lg:col-span-2">
            <Card className="border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[2rem] overflow-hidden">
              <CardHeader className="p-6">
                <CardTitle className="text-lg font-black text-slate-800">
                  Subject Entry Tracker
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Monitor faculty marks submission details.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 border-t border-slate-50">
                {loading ? (
                  <div className="flex justify-center items-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : trackingData.length === 0 ? (
                  <p className="text-slate-400 text-center py-12 text-sm font-medium">
                    No completed exams found for this class and exam.
                  </p>
                ) : (
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow>
                        <TableHead className="pl-6">Subject</TableHead>
                        <TableHead>Teacher</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="pr-6 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-50">
                      {trackingData.map((item) => (
                        <TableRow key={item.exam_id} className="hover:bg-slate-50/30 transition-colors group">
                          <TableCell className="pl-6">
                            <div className="font-bold text-slate-800">{item.subject_name}</div>
                            <div className="text-[10px] text-indigo-600 font-black uppercase tracking-wider mt-0.5">
                              Section: {item.section_name || "A"}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-medium text-slate-600">{item.teacher_name || "Unassigned"}</TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                item.marks_status === "Submitted"
                                  ? "bg-green-50 text-green-700 border-green-100 hover:bg-green-50"
                                  : item.marks_status === "Draft"
                                  ? "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-50"
                                  : "bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-50"
                              }`}
                            >
                              {item.marks_status || "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                            {item.marks_status === "Submitted" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUnlock(item.exam_id)}
                                className="h-8 border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 ml-auto"
                              >
                                <Unlock size={13} />
                                Unlock Entry
                              </Button>
                            ) : (
                              <span className="text-slate-400 text-xs font-medium">Teacher Entering</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      )}

      {/* PREVIEW DIALOG */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-white rounded-3xl p-6 overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <Eye className="h-6 w-6 text-indigo-600" />
              Class Scorecard Preview
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Generated scorecard list for {selectedClass} - {selectedExam}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto border rounded-2xl my-4">
            {previewLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            ) : previewData.length === 0 ? (
              <p className="text-slate-400 text-center py-16 font-medium">No results generated yet.</p>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="pl-6">Student Name</TableHead>
                    <TableHead className="text-center">Obtained Marks</TableHead>
                    <TableHead className="text-center">Max Marks</TableHead>
                    <TableHead className="text-center">Percentage</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                    <TableHead className="pr-6 text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row) => (
                    <TableRow key={row.result_id} className="hover:bg-slate-50/50">
                      <TableCell className="pl-6 font-bold text-slate-800">{row.student_name}</TableCell>
                      <TableCell className="text-center font-semibold text-slate-700">{row.total_obtained}</TableCell>
                      <TableCell className="text-center text-slate-500">{row.total_max}</TableCell>
                      <TableCell className="text-center font-bold text-indigo-600">{Number(row.percentage).toFixed(1)}%</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={row.grade === "Fail" || row.grade === "F" ? "destructive" : "default"} className="font-bold px-2 py-0.5 rounded">
                          {row.grade}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-6 text-center">
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 uppercase text-[9px] font-black">
                          {row.result_status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

/* ==========================================================================
   FACULTY RESULTS DASHBOARD
   ========================================================================== */
function FacultyResultsDashboard() {
  const { toast } = useToast();
  const [exams, setExams] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  // Grade entry modal
  const [selectedExam, setSelectedExam] = React.useState<any>(null);
  const [formOpen, setFormOpen] = React.useState(false);

  const fetchAssigned = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/results/faculty/assigned");
      if (res.data.success) {
        setExams(res.data.data || []);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to load assigned subjects",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchAssigned();
  }, [fetchAssigned]);

  const handleOpenEntry = (exam: any) => {
    setSelectedExam(exam);
    setFormOpen(true);
  };

  const handleSaveSuccess = () => {
    setFormOpen(false);
    fetchAssigned();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-black text-slate-800">My Subject Classes</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Enter and lock examination marks</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : exams.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 py-16 text-center rounded-[2rem]">
          <CardContent className="flex flex-col items-center gap-4 max-w-sm mx-auto">
            <div className="h-16 w-16 bg-white border border-slate-100 rounded-3xl flex items-center justify-center text-slate-300 shadow-sm">
              <BookOpen size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-800">No Exams Scheduled</h3>
              <p className="text-sm font-medium text-slate-500">
                You are currently not listed as the scheduled teacher for any completed subjects or classes.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((ex) => {
            const isLocked = ex.marks_status === "Submitted";
            return (
              <Card key={ex.exam_id} className="border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[1.5rem] hover:shadow-[0_12px_35px_rgb(0,0,0,0.04)] transition-all group overflow-hidden">
                <CardHeader className="p-6 pb-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-2.5 py-0.5 uppercase tracking-wider">
                      {ex.class_name} - {ex.section_name || "A"}
                    </span>
                    <Badge
                      className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                        isLocked
                          ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-100"
                          : ex.marks_status === "Draft"
                          ? "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100"
                          : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {ex.marks_status || "Pending"}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-black text-slate-800 tracking-tight mt-2.5 truncate">
                    {ex.subject_name}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 font-semibold truncate">
                    {ex.exam_name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-2 space-y-4">
                  <div className="text-xs text-slate-500 font-semibold space-y-1">
                    <div className="flex justify-between">
                      <span>Total Marks:</span>
                      <span className="text-slate-800 font-bold">{ex.total_score}</span>
                    </div>
                    {ex.min_marks && (
                      <div className="flex justify-between">
                        <span>Pass Limit:</span>
                        <span className="text-slate-800 font-bold">{ex.min_marks}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => handleOpenEntry(ex)}
                    variant={isLocked ? "secondary" : "default"}
                    className="w-full h-10 rounded-xl font-bold flex items-center justify-center gap-1.5"
                  >
                    {isLocked ? (
                      <>
                        <Lock size={14} className="text-slate-500" />
                        View Final Grades
                      </>
                    ) : (
                      <>
                        <Eye size={14} />
                        Enter / Edit Marks
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* GRADE ENTRY DIALOG */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-3xl p-6 overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-800 truncate">
              {selectedExam?.class_name} ({selectedExam?.section_name || "A"}) — {selectedExam?.subject_name}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Exam: {selectedExam?.exam_name} | Max Marks: {selectedExam?.total_score}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-1">
            {selectedExam && (
              <GradeEntryForm exam={selectedExam} onSave={handleSaveSuccess} />
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

/* ==========================================================================
   STUDENT / PARENT RESULTS DASHBOARD
   ========================================================================== */
interface ReportDetail {
  result_id: number;
  exam_name: string;
  total_obtained: number;
  total_max: number;
  percentage: number;
  grade: string;
  result_status: string;
  subjects: Array<{
    subject_name: string;
    marks_obtained: number;
    subject_max: number;
    subject_grade: string;
  }>;
}

interface StudentResultSummary {
  student_id: number;
  student_name: string;
  class_name: string;
  section_name: string;
  reports: ReportDetail[];
}

function StudentParentResultsDashboard() {
  const { toast } = useToast();
  const [data, setData] = React.useState<StudentResultSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  // Selected student & report indexes
  const [studentIndex, setStudentIndex] = React.useState<number>(0);
  const [reportIndex, setReportIndex] = React.useState<number>(0);
  const [downloadingMarksheet, setDownloadingMarksheet] = React.useState(false);

  React.useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await axios.get("/api/results/my-results");
        if (res.data.success) {
          setData(res.data.data || []);
        }
      } catch (err: any) {
        toast({
          title: "Error",
          description: err?.response?.data?.message || "Failed to load report cards",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [toast]);

  const handleDownloadMarksheet = async (studentId: number, examName: string) => {
    setDownloadingMarksheet(true);
    try {
      const encodedExam = encodeURIComponent(examName);
      const res = await axios.get(`/api/results/marksheet/${studentId}/${encodedExam}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Marksheet_${examName.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: "Marksheet Downloaded", description: `${examName} marksheet saved.` });
    } catch (err: any) {
      toast({
        title: "Download Failed",
        description: err?.response?.data?.message || "Could not generate marksheet. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDownloadingMarksheet(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 py-20 text-center rounded-[2rem]">
        <CardContent className="flex flex-col items-center gap-4 max-w-sm mx-auto">
          <div className="h-16 w-16 bg-white border border-slate-100 rounded-3xl flex items-center justify-center text-indigo-600 shadow-sm">
            <Trophy size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-800">No Published Results</h3>
            <p className="text-sm font-medium text-slate-500">
              Academic scorecards have not been published by the administration yet. Check back here later.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Active student and report
  const activeStudent = data[studentIndex];
  const activeReport = activeStudent?.reports?.[reportIndex];
  const isPassed = activeReport && (activeReport.result_status === 'Passed' || (Number(activeReport.percentage) >= 35));

  return (
    <div className="space-y-6">
      
      {/* MULTI STUDENT OR MULTI REPORT TOGGLER */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Child Selector (Parents/Guardians with multiple kids) */}
        {data.length > 1 ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Select Child:</span>
            <Select
              value={String(studentIndex)}
              onValueChange={(val) => {
                setStudentIndex(Number(val));
                setReportIndex(0);
              }}
            >
              <SelectTrigger className="w-56 h-10 rounded-xl bg-white shadow-sm border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {data.map((student, idx) => (
                  <SelectItem key={student.student_id} value={String(idx)}>
                    {student.student_name} ({student.class_name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-black text-slate-800">{activeStudent.student_name}</h2>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {activeStudent.class_name} - {activeStudent.section_name || "A"}
            </p>
          </div>
        )}

        {/* Report Selector (e.g. Unit Test, Term Exam) */}
        {activeStudent?.reports?.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Select Exam:</span>
            <Select value={String(reportIndex)} onValueChange={(val) => setReportIndex(Number(val))}>
              <SelectTrigger className="w-56 h-10 rounded-xl bg-white shadow-sm border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {activeStudent.reports.map((report, idx) => (
                  <SelectItem key={report.result_id} value={String(idx)}>
                    {report.exam_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* DETAILED SCORECARD DISPLAY */}
      {!activeReport ? (
        <Card className="border border-slate-100 shadow-sm py-16 text-center rounded-[2rem]">
          <CardContent>
            <p className="text-slate-400 font-medium">No exam reports generated for this student.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          
          {/* TOP THREE HIGHLIGHT CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* CARD 1: Percentage */}
            <Card className="border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-gradient-to-br from-indigo-50/50 to-white rounded-[1.5rem] overflow-hidden">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block">Percentage</span>
                  <span className="text-3xl font-black text-slate-800">{Number(activeReport.percentage).toFixed(1)}%</span>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-indigo-100/50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                  <Award size={22} />
                </div>
              </CardContent>
            </Card>

            {/* CARD 2: Final Grade */}
            <Card className="border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-gradient-to-br from-emerald-50/50 to-white rounded-[1.5rem] overflow-hidden">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">Letter Grade</span>
                  <span className="text-3xl font-black text-slate-800">{activeReport.grade}</span>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-emerald-100/50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                  <Trophy size={22} />
                </div>
              </CardContent>
            </Card>

            {/* CARD 3: Score Summary */}
            <Card className="border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-gradient-to-br from-sky-50/50 to-white rounded-[1.5rem] overflow-hidden">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-sky-600 uppercase tracking-widest block">Total Marks</span>
                  <span className="text-3xl font-black text-slate-800">
                    {activeReport.total_obtained} <span className="text-lg text-slate-400 font-medium">/ {activeReport.total_max}</span>
                  </span>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-sky-100/50 flex items-center justify-center text-sky-600 border border-sky-100">
                  <BookOpen size={22} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* MAIN BREAKDOWN CARD TABLE */}
          <Card className="border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[2rem] overflow-hidden">
            <CardHeader className="p-6 pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black text-slate-800">Subject Breakdown</CardTitle>
                <CardDescription className="text-xs text-slate-500">Report details for exam: {activeReport.exam_name}</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  className={`px-3 py-1 rounded-full uppercase text-[10px] font-black tracking-wider border ${
                    isPassed
                      ? "bg-green-100 text-green-800 border-green-200"
                      : "bg-red-100 text-red-800 border-red-200"
                  }`}
                >
                  {isPassed ? "Passed" : "Failed"}
                </Badge>
                {/* DOWNLOAD MARKSHEET BUTTON */}
                <Button
                  onClick={() => handleDownloadMarksheet(activeStudent.student_id, activeReport.exam_name)}
                  disabled={downloadingMarksheet}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl px-4 h-9 flex items-center gap-1.5 shadow-sm"
                >
                  {downloadingMarksheet ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <FileDown size={13} />
                  )}
                  Download Marksheet
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="pl-8">Subject Name</TableHead>
                    <TableHead className="text-center">Marks Obtained</TableHead>
                    <TableHead className="text-center">Max Marks</TableHead>
                    <TableHead className="text-center">Subject Grade</TableHead>
                    <TableHead className="pr-8 text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-50">
                  {activeReport.subjects.map((sub, idx) => {
                    const subPassed = sub.marks_obtained != null && sub.subject_max != null
                      ? sub.marks_obtained >= sub.subject_max * 0.35
                      : sub.subject_grade !== 'F' && sub.subject_grade !== 'Fail';
                    return (
                      <TableRow key={idx} className="hover:bg-slate-50/30">
                        <TableCell className="pl-8 font-bold text-slate-800">{sub.subject_name}</TableCell>
                        <TableCell className="text-center font-bold text-slate-700">{sub.marks_obtained ?? "-"}</TableCell>
                        <TableCell className="text-center text-slate-500">{sub.subject_max ?? "-"}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={sub.subject_grade === "F" || sub.subject_grade === "Fail" ? "destructive" : "default"}
                            className="font-bold rounded-lg px-2.5 py-0.5"
                          >
                            {sub.subject_grade || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-8 text-center">
                          <span className={`text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            subPassed
                              ? "text-green-700 bg-green-50"
                              : "text-red-700 bg-red-50"
                          }`}>
                            {subPassed ? "Pass" : "Fail"}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

        </div>
      )}

    </div>
  );
}

