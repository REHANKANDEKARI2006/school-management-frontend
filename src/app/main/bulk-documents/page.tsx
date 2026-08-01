// @ts-nocheck
"use client";

import * as React from "react";
import axios from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  CreditCard,
  Award,
  Printer,
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Users,
  School,
  UserCheck,
  Check,
  ChevronRight,
  Clock,
  Sparkles,
  FileCheck
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function BulkDocumentsPage() {
  const { toast } = useToast();

  // Form State
  const [documentType, setDocumentType] = React.useState<"id_card" | "bonafide" | "certificate">("id_card");
  const [layoutType, setLayoutType] = React.useState<"grid" | "single">("grid");
  const [scopeType, setScopeType] = React.useState<"whole_school" | "class" | "specific_students">("whole_school");
  const [selectedClassId, setSelectedClassId] = React.useState<string>("");
  const [selectedStudentIds, setSelectedStudentIds] = React.useState<number[]>([]);

  // Data State
  const [classes, setClasses] = React.useState<any[]>([]);
  const [students, setStudents] = React.useState<any[]>([]);
  const [studentSearch, setStudentSearch] = React.useState<string>("");
  const [loadingData, setLoadingData] = React.useState<boolean>(false);

  // Active Job & Polling State
  const [activeJob, setActiveJob] = React.useState<any>(null);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [jobHistory, setJobHistory] = React.useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = React.useState<boolean>(false);

  // Fetch Classes on mount
  React.useEffect(() => {
    fetchClasses();
    fetchJobHistory();
  }, []);

  // Fetch Students when scope is 'specific_students' or when class changes
  React.useEffect(() => {
    if (scopeType === "specific_students" || scopeType === "class") {
      fetchStudents();
    }
  }, [scopeType, selectedClassId]);

  // Polling for Active Job status
  React.useEffect(() => {
    if (!activeJob || activeJob.status === "completed" || activeJob.status === "failed") {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`/api/bulk-documents/${activeJob.jobId}/status`);
        if (res.data.success) {
          const updated = res.data.data;
          setActiveJob(updated);

          if (updated.status === "completed") {
            toast({
              title: "🎉 Generation Complete!",
              description: `Bulk ${updated.documentType} generated for ${updated.progressCount} students.`,
            });
            fetchJobHistory();
          } else if (updated.status === "failed") {
            toast({
              variant: "destructive",
              title: "Generation Failed",
              description: updated.errorMessage || "An error occurred during background processing.",
            });
            fetchJobHistory();
          }
        }
      } catch (err) {
        console.error("Error polling job status:", err);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [activeJob]);

  // ── API HELPERS ──
  const fetchClasses = async () => {
    try {
      const res = await axios.get("/api/classes");
      if (res.data && res.data.data) {
        setClasses(res.data.data);
      } else if (Array.isArray(res.data)) {
        setClasses(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch classes:", err);
    }
  };

  const fetchStudents = async () => {
    setLoadingData(true);
    try {
      let url = "/api/students?limit=200";
      if (scopeType === "class" && selectedClassId) {
        url += `&class_id=${selectedClassId}`;
      }
      const res = await axios.get(url);
      if (res.data && res.data.data) {
        setStudents(res.data.data);
      } else if (Array.isArray(res.data)) {
        setStudents(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch students:", err);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchJobHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await axios.get("/api/bulk-documents/history?limit=10");
      if (res.data && res.data.data) {
        setJobHistory(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch job history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // ── SUBMIT JOB ──
  const handleGenerate = async () => {
    if (scopeType === "class" && !selectedClassId) {
      toast({
        variant: "destructive",
        title: "Class Required",
        description: "Please select a class for class-wise generation.",
      });
      return;
    }

    if (scopeType === "specific_students" && selectedStudentIds.length === 0) {
      toast({
        variant: "destructive",
        title: "Students Required",
        description: "Please select at least one student from the list.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let scopeValue = null;
      if (scopeType === "class") scopeValue = [Number(selectedClassId)];
      if (scopeType === "specific_students") scopeValue = selectedStudentIds;

      const payload = {
        document_type: documentType,
        scope_type: scopeType,
        scope_value: scopeValue,
        template_id: "template1",
        layout_type: layoutType
      };

      const res = await axios.post("/api/bulk-documents/generate", payload);
      if (res.data && res.data.success) {
        const jobData = res.data.data;
        setActiveJob({
          jobId: jobData.jobId,
          documentType: jobData.documentType,
          scopeType: jobData.scopeType,
          status: jobData.status,
          progressCount: 0,
          totalCount: jobData.totalCount
        });

        toast({
          title: "🚀 Job Submitted!",
          description: `Generating ${jobData.totalCount} documents in background...`,
        });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to create document generation job";
      toast({
        variant: "destructive",
        title: "Error",
        description: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Student list checkbox handlers
  const filteredStudents = students.filter(s =>
    `${s.stu_first_name || ''} ${s.stu_last_name || ''} ${s.student_id || ''}`
      .toLowerCase()
      .includes(studentSearch.toLowerCase())
  );

  const toggleSelectAllStudents = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map(s => s.student_id || s.id));
    }
  };

  const toggleStudentSelect = (id: number) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const getDownloadUrl = (jobId: number) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") || "" : "";
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : "";
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      const port = "5000";
      const isLocal = hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("192.168.") || hostname.startsWith("10.") || hostname.startsWith("172.");
      if (isLocal) return `http://${hostname}:${port}/api/bulk-documents/${jobId}/download${tokenParam}`;
    }
    return `/api/bulk-documents/${jobId}/download${tokenParam}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Printer className="h-7 w-7 text-blue-600" />
            Bulk Document Generator
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate high-res ID Cards, Bonafide Certificates, and Marksheets in bulk with background progress tracking.
          </p>
        </div>
      </div>

      {/* ── ACTIVE JOB PROGRESS BANNER ── */}
      {activeJob && (
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={activeJob.status === "completed" ? "completed" : activeJob.status === "failed" ? "destructive" : "default"} className="px-3 py-1 text-xs font-bold uppercase tracking-wider">
                  {activeJob.status}
                </Badge>
                <CardTitle className="text-lg font-bold text-slate-800">
                  Bulk {activeJob.documentType?.replace(/_/g, " ")} Generation
                </CardTitle>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-500">
                Job #{activeJob.jobId}
              </span>
            </div>
            <CardDescription className="text-xs text-slate-600">
              Scope: <strong className="capitalize">{activeJob.scopeType?.replace(/_/g, " ")}</strong> • Total Students: <strong>{activeJob.totalCount}</strong>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>
                  {activeJob.status === "completed"
                    ? "All documents rendered!"
                    : activeJob.status === "failed"
                    ? "Job failed"
                    : `Rendering ${activeJob.progressCount} of ${activeJob.totalCount} documents...`}
                </span>
                <span>
                  {activeJob.totalCount > 0
                    ? `${Math.round((activeJob.progressCount / activeJob.totalCount) * 100)}%`
                    : "0%"}
                </span>
              </div>
              <Progress
                value={activeJob.totalCount > 0 ? (activeJob.progressCount / activeJob.totalCount) * 100 : 0}
                className="h-3 bg-slate-200"
              />
            </div>

            {/* Completed Actions */}
            {activeJob.status === "completed" && activeJob.outputFileUrl && (
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-lg border border-emerald-200">
                <div className="flex items-center gap-2 text-emerald-700 font-medium text-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  PDF document bundle ready for download
                  {activeJob.fileSizeBytes && (
                    <span className="text-xs text-slate-500 font-mono">
                      ({(activeJob.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  )}
                </div>
                <Button
                  asChild
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
                >
                  <a href={getDownloadUrl(activeJob.jobId)} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Download Final PDF
                  </a>
                </Button>
              </div>
            )}

            {/* Skipped Students Warning */}
            {activeJob.skippedStudents && activeJob.skippedStudents.length > 0 && (
              <Alert variant="warning" className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800 font-semibold text-sm">
                  {activeJob.skippedStudents.length} student(s) required fallbacks or details
                </AlertTitle>
                <AlertDescription className="text-xs text-amber-700 mt-1">
                  <ul className="list-disc pl-4 space-y-1">
                    {activeJob.skippedStudents.map((s: any, idx: number) => (
                      <li key={idx}>
                        <strong>{s.student_name}</strong> (ID: {s.student_id}): {s.reason}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── GENERATION CONFIGURATION FORM ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 1. DOCUMENT TYPE SELECTOR */}
        <Card className="lg:col-span-1 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              1. Document Type
            </CardTitle>
            <CardDescription className="text-xs">
              Select which document layout to generate.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* ID Card Option */}
            <div
              onClick={() => setDocumentType("id_card")}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                documentType === "id_card"
                  ? "border-blue-600 bg-blue-50/60 text-blue-900 shadow-sm"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${documentType === "id_card" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Student ID Cards</h3>
                    <p className="text-xs text-slate-500 mt-0.5">5×2 Grid on A4 Landscape (10/page)</p>
                  </div>
                </div>
                {documentType === "id_card" && <Check className="h-5 w-5 text-blue-600" />}
              </div>
            </div>

            {/* Bonafide Certificate Option */}
            <div
              onClick={() => setDocumentType("bonafide")}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                documentType === "bonafide"
                  ? "border-blue-600 bg-blue-50/60 text-blue-900 shadow-sm"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${documentType === "bonafide" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                    <FileCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Bonafide Certificate</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Formal Certificate (1 per A4 page)</p>
                  </div>
                </div>
                {documentType === "bonafide" && <Check className="h-5 w-5 text-blue-600" />}
              </div>
            </div>

            {/* Certificate of Recognition Option */}
            <div
              onClick={() => setDocumentType("certificate")}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                documentType === "certificate"
                  ? "border-blue-600 bg-blue-50/60 text-blue-900 shadow-sm"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${documentType === "certificate" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Certificate of Recognition</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Achievement Certificate (1 per A4 Landscape page)</p>
                  </div>
                </div>
                {documentType === "certificate" && <Check className="h-5 w-5 text-blue-600" />}
              </div>
            </div>

            {/* ID Card Print Layout Mode Selector (Appears ONLY when ID Card is selected) */}
            {documentType === "id_card" && (
              <div className="mt-4 pt-4 border-t border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                    ID Card Layout Mode
                  </label>
                  <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                    {layoutType === "grid" ? "10 Cards / Page" : "1 Card / Page"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLayoutType("grid")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      layoutType === "grid"
                        ? "border-blue-600 bg-blue-50/80 text-blue-900 font-bold ring-2 ring-blue-600/20 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-600"
                    }`}
                  >
                    <div className="text-xs font-bold">Grid Layout</div>
                    <div className="text-[11px] text-slate-500 font-normal mt-0.5">10 cards / A4 Landscape</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLayoutType("single")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      layoutType === "single"
                        ? "border-blue-600 bg-blue-50/80 text-blue-900 font-bold ring-2 ring-blue-600/20 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-600"
                    }`}
                  >
                    <div className="text-xs font-bold">Single Card</div>
                    <div className="text-[11px] text-slate-500 font-normal mt-0.5">1 card per page</div>
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. SCOPE SELECTOR & TARGET DEFINITION */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                2. Scope & Target Selection
              </CardTitle>
              <CardDescription className="text-xs">
                Choose whether to generate for the entire school, a specific class, or selected individual students.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Scope Radio Tabs */}
              <div className="grid grid-cols-3 gap-3">
                {/* Whole School */}
                <button
                  type="button"
                  onClick={() => setScopeType("whole_school")}
                  className={`p-3 rounded-lg text-left border flex flex-col items-center justify-center text-center transition-all ${
                    scopeType === "whole_school"
                      ? "border-blue-600 bg-blue-50 text-blue-900 font-bold"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <School className="h-5 w-5 mb-1 text-blue-600" />
                  <span className="text-xs">Whole School</span>
                </button>

                {/* Class-wise */}
                <button
                  type="button"
                  onClick={() => setScopeType("class")}
                  className={`p-3 rounded-lg text-left border flex flex-col items-center justify-center text-center transition-all ${
                    scopeType === "class"
                      ? "border-blue-600 bg-blue-50 text-blue-900 font-bold"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <Users className="h-5 w-5 mb-1 text-blue-600" />
                  <span className="text-xs">Specific Class</span>
                </button>

                {/* Specific Students */}
                <button
                  type="button"
                  onClick={() => setScopeType("specific_students")}
                  className={`p-3 rounded-lg text-left border flex flex-col items-center justify-center text-center transition-all ${
                    scopeType === "specific_students"
                      ? "border-blue-600 bg-blue-50 text-blue-900 font-bold"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <UserCheck className="h-5 w-5 mb-1 text-blue-600" />
                  <span className="text-xs">Selected Students</span>
                </button>
              </div>

              {/* ── SCOPE SPECIFIC INPUTS ── */}

              {/* A. WHOLE SCHOOL INFO */}
              {scopeType === "whole_school" && (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    Generating for Whole School
                  </p>
                  <p>All active enrolled students across all classes and sections will be included, sorted alphabetically by class & section for orderly distribution.</p>
                </div>
              )}

              {/* B. CLASS DROPDOWN */}
              {scopeType === "class" && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Select Class & Section</label>
                  <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue placeholder="-- Choose Class --" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(c => (
                        <SelectItem key={c.class_id} value={String(c.class_id)}>
                          Class {c.class_name} {c.section_name ? `- Section ${c.section_name}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* C. SPECIFIC STUDENTS MULTI-SELECT LIST */}
              {scopeType === "specific_students" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search student by name or ID..."
                        value={studentSearch}
                        onChange={e => setStudentSearch(e.target.value)}
                        className="pl-9 h-9 text-xs"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={toggleSelectAllStudents}
                      className="text-xs h-9 shrink-0"
                    >
                      {selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0
                        ? "Deselect All"
                        : "Select All"}
                    </Button>
                  </div>

                  <div className="border rounded-lg max-h-56 overflow-y-auto divide-y bg-white">
                    {loadingData ? (
                      <div className="p-4 text-center text-xs text-slate-400">Loading students...</div>
                    ) : filteredStudents.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">No students found.</div>
                    ) : (
                      filteredStudents.map(s => {
                        const sId = s.student_id || s.id;
                        const isChecked = selectedStudentIds.includes(sId);
                        return (
                          <div
                            key={sId}
                            onClick={() => toggleStudentSelect(sId)}
                            className={`p-2.5 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 transition-colors ${
                              isChecked ? "bg-blue-50/50" : ""
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox checked={isChecked} onCheckedChange={() => toggleStudentSelect(sId)} />
                              <div>
                                <span className="font-semibold text-slate-800">
                                  {s.stu_first_name} {s.stu_last_name}
                                </span>
                                <span className="text-slate-400 ml-2 font-mono text-[10px]">
                                  ID: {sId}
                                </span>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-[10px]">
                              Class {s.class_name || '—'} {s.section_name || ''}
                            </Badge>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="text-xs text-slate-500 font-medium text-right">
                    Selected: <strong>{selectedStudentIds.length}</strong> student(s)
                  </div>
                </div>
              )}
            </CardContent>
          </div>

          <CardFooter className="pt-4 border-t bg-slate-50/50 rounded-b-xl">
            <Button
              onClick={handleGenerate}
              disabled={isSubmitting || (activeJob && activeJob.status === "processing")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Submitting Job...
                </>
              ) : (
                <>
                  <Printer className="h-4 w-4 mr-2" />
                  Start Bulk Generation
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* ── RECENT BULK JOBS HISTORY TABLE ── */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Clock className="h-5 w-5 text-slate-600" />
              Recent Generation History
            </CardTitle>
            <CardDescription className="text-xs">
              View past document generation jobs and access download links.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchJobHistory} className="h-8 text-xs">
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 text-xs">
                <TableHead className="w-16 font-bold">Job ID</TableHead>
                <TableHead className="font-bold">Document Type</TableHead>
                <TableHead className="font-bold">Scope</TableHead>
                <TableHead className="font-bold text-center">Progress</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="font-bold">Created At</TableHead>
                <TableHead className="text-right font-bold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingHistory ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-xs text-slate-400">
                    Loading job history...
                  </TableCell>
                </TableRow>
              ) : jobHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-xs text-slate-400">
                    No bulk document jobs generated yet.
                  </TableCell>
                </TableRow>
              ) : (
                jobHistory.map(job => (
                  <TableRow key={job.job_id} className="text-xs">
                    <TableCell className="font-mono font-bold text-slate-700">#{job.job_id}</TableCell>
                    <TableCell className="font-semibold text-slate-800">
                      {job.document_type?.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell className="capitalize text-slate-600">
                      {job.scope_type?.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {job.progress_count} / {job.total_count}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          job.status === "completed"
                            ? "completed"
                            : job.status === "failed"
                            ? "destructive"
                            : "default"
                        }
                        className="text-[10px] uppercase font-bold"
                      >
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 font-mono text-[11px]">
                      {new Date(job.created_at).toLocaleString('en-GB')}
                    </TableCell>
                    <TableCell className="text-right">
                      {job.output_file_url ? (
                        <Button asChild size="sm" variant="outline" className="h-7 text-[11px] font-bold text-blue-600 hover:text-blue-700 border-blue-200">
                          <a href={getDownloadUrl(job.job_id)} target="_blank" rel="noopener noreferrer">
                            <Download className="h-3 w-3 mr-1" />
                            Download PDF
                          </a>
                        </Button>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">
                          {job.status === "failed" ? "Failed" : "Processing..."}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
