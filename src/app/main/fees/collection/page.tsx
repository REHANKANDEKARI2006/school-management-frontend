"use client";

import { PageSkeleton } from "@/components/ui/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import * as React from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getClasses } from "@/lib/api/classes";
import { getFeeStatusByClass } from "@/lib/api/fees";
import { StudentFeeLedger } from "@/components/school-os/student-fee-ledger";
import { User, Search, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";

export default function FeeCollectionPage() {
  const { toast } = useToast();
  const router = useRouter();

  const [classes, setClasses] = React.useState<any[]>([]);
  const [students, setStudents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [fetchingStudents, setFetchingStudents] = React.useState(false);

  const [selectedClassId, setSelectedClassId] = React.useState<string>();
  const [selectedStudent, setSelectedStudent] = React.useState<any>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  /* =========================
     INITIAL LOAD
  ========================= */
  React.useEffect(() => {
    getClasses()
      .then((classList) => {
        setClasses(classList || []);
      })
      .catch((e) => {
        console.error(e);
        toast({ title: "Failed to load classes", variant: "destructive" });
      })
      .finally(() => setLoading(false));
  }, []);

  /* =========================
     LOAD STUDENTS FOR CLASS
  ========================= */
  const loadStudents = (classId: string) => {
    setFetchingStudents(true);
    getFeeStatusByClass(classId)
      .then((data) => {
        setStudents(data || []);
        setSelectedStudent(null); // Reset when class changes
      })
      .catch((e) => {
        console.error(e);
        toast({ title: "Failed to load students", variant: "destructive" });
      })
      .finally(() => setFetchingStudents(false));
  };

  React.useEffect(() => {
    if (selectedClassId) {
      loadStudents(selectedClassId);
    }
  }, [selectedClassId]);

  const [statusFilter, setStatusFilter] = React.useState<"all" | "complete" | "pending">("all");

  const filteredStudents = students.filter(s => {
    const matchesSearch = `${s.stu_first_name} ${s.stu_last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.roll_no && String(s.roll_no).includes(searchQuery));
    
    if (!matchesSearch) return false;
    
    const balance = Number(s.total_fees) - Number(s.total_paid);
    if (statusFilter === "complete") {
      return balance <= 0;
    } else if (statusFilter === "pending") {
      return balance > 0;
    }
    return true;
  });

  if (loading) return <PageSkeleton rows={5} />;

  return (
    <div className="flex flex-col gap-4 sm:gap-6 pb-4 sm:pb-10">
      {/* Desktop Header Card (100% Untouched for Desktop) */}
      <Card className="hidden sm:block">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div 
                className="flex items-center gap-2 text-sm text-muted-foreground mb-3 cursor-pointer hover:text-primary transition-colors w-fit" 
                onClick={() => router.push('/main/fees')}
              >
                <ArrowLeft className="h-4 w-4" /> Back to Fees
              </div>
              <CardTitle>Fee Collection</CardTitle>
              <CardDescription>Manage student fees and issue receipts</CardDescription>
            </div>
            
            <div className="w-full sm:w-64">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Select Class & Section</Label>
              <Select onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a class..." />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.class_id} value={String(c.class_id)}>
                      {c.class_name} {c.section_name ? ` - ${c.section_name}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Mobile Header (Strictly sm:hidden) */}
      <div className="sm:hidden w-full flex flex-col gap-3">
        {!selectedStudent ? (
          <>
            {/* Mobile Back Button */}
            <button
              onClick={() => router.push('/main/fees')}
              className="flex items-center gap-1.5 text-slate-700 font-bold text-xs bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 shadow-xs active:scale-95 transition-all w-fit"
            >
              <ArrowLeft className="h-4 w-4 text-slate-700" />
              <span>Back to Fees</span>
            </button>

            {/* Mobile Header Title Card */}
            <div className="w-full bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs space-y-1 hidden">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Fee Collection</h1>
              <p className="text-xs font-medium text-slate-500">Manage student fees and issue receipts</p>
            </div>

            {/* Mobile Select Class Dropdown */}
            <div className="w-full bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Select Class & Section
              </label>
              <Select onValueChange={setSelectedClassId}>
                <SelectTrigger className="w-full h-11 rounded-xl border-slate-200 text-xs font-bold text-slate-900 bg-white">
                  <SelectValue placeholder="Choose a class..." />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.class_id} value={String(c.class_id)}>
                      {c.class_name} {c.section_name ? ` - ${c.section_name}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        ) : (
          /* Mobile Detail Header: Back to Students List */
          <button
            onClick={() => setSelectedStudent(null)}
            className="flex items-center gap-1.5 text-slate-700 font-bold text-xs bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 shadow-xs active:scale-95 transition-all w-fit mb-1"
          >
            <ArrowLeft className="h-4 w-4 text-slate-700" />
            <span>Back to Students List</span>
          </button>
        )}
      </div>

      {/* Desktop Master-Detail Layout (100% Untouched for Desktop lg:flex) */}
      <div className="hidden lg:flex flex-row gap-6 min-h-[600px]">
        {/* SIDEBAR: Student List */}
        <Card className="w-80 flex flex-col shadow-sm max-h-[800px] flex-shrink-0">
          <CardHeader className="pb-4 bg-muted/30 border-b">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Students</span>
              <Badge variant="secondary" className="font-mono">{filteredStudents.length}</Badge>
            </CardTitle>
            <div className="flex flex-col gap-2 mt-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search name/roll..."
                  className="pl-8 h-9 text-xs border-gray-200"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
                <SelectTrigger className="h-9 text-xs border-gray-200 bg-white">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="complete">Complete (Fully Paid)</SelectItem>
                  <SelectItem value="pending">Pending (Has Balance)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <ScrollArea className="flex-grow">
            <CardContent className="p-2 space-y-1">
              {!selectedClassId ? (
                <div className="text-center py-10 text-xs text-muted-foreground">Please select a class</div>
              ) : fetchingStudents ? (
                <div className="space-y-2 p-2">
                    {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 rounded-md" />)}
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-10 text-xs text-muted-foreground">No students found</div>
              ) : (
                filteredStudents.map((s) => {
                  const balance = Number(s.total_fees) - Number(s.total_paid);
                  const isSelected = selectedStudent?.student_id === s.student_id;
                  return (
                    <button
                      key={s.student_id}
                      onClick={() => setSelectedStudent(s)}
                      className={`w-full text-left p-3 rounded-lg transition-all group relative border ${
                        isSelected 
                        ? "bg-primary/10 border-primary/20" 
                        : "border-transparent hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-xs font-bold truncate ${isSelected ? "text-primary" : "text-foreground"}`}>
                          {s.stu_first_name} {s.stu_last_name}
                        </span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                          #{s.roll_no || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-[10px] font-medium ${isSelected ? "text-primary/80" : "text-muted-foreground"}`}>
                            {balance <= 0 ? "Fully Paid" : `Bal: ₹${balance.toLocaleString()}`}
                        </span>
                        {balance > 0 && (
                            <div className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-primary" : "bg-destructive"}`} />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </CardContent>
          </ScrollArea>
        </Card>

        {/* MAIN AREA: Ledger */}
        <Card className="flex-grow shadow-sm">
             <ScrollArea className="h-full">
                <CardContent className="p-4 sm:p-6">
                        {selectedStudent ? (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <StudentFeeLedger 
                                    studentId={selectedStudent.student_id} 
                                    studentName={`${selectedStudent.stu_first_name} ${selectedStudent.stu_last_name}`} 
                                />
                            </div>
                        ) : (
                            <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground opacity-40">
                                <User className="h-20 w-20 mb-4 stroke-1" />
                                <p className="text-lg font-medium">Select a student to view and collect fees</p>
                                <p className="text-sm">Payments are instantly recorded in the system</p>
                            </div>
                        )}
                </CardContent>
             </ScrollArea>
        </Card>
      </div>

      {/* Mobile Responsive Native Push Layout (Strictly lg:hidden) */}
      <div className="lg:hidden w-full flex flex-col">
        {selectedStudent ? (
          /* Mobile Fee Collection Detail Screen */
          <div className="w-full bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs animate-in fade-in slide-in-from-right-4 duration-200">
            <StudentFeeLedger 
              studentId={selectedStudent.student_id} 
              studentName={`${selectedStudent.stu_first_name} ${selectedStudent.stu_last_name}`} 
            />
          </div>
        ) : (
          /* Mobile Student List View (No empty placeholder panel!) */
          <div className="w-full bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {/* Header: Title + Count Badge */}
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 tracking-tight">Students</h2>
              <Badge variant="secondary" className="font-bold text-[11px] px-2.5 py-0.5 rounded-xl">
                {filteredStudents.length}
              </Badge>
            </div>

            {/* Search Input & Status Filter Dropdown */}
            <div className="p-3 bg-slate-50/50 border-b border-slate-100 flex flex-col gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Search name/roll..."
                  className="pl-9 h-10 text-xs border-slate-200 rounded-xl bg-white focus:border-indigo-500"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
                <SelectTrigger className="h-10 text-xs border-slate-200 rounded-xl bg-white font-bold text-slate-800">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="complete">Complete (Fully Paid)</SelectItem>
                  <SelectItem value="pending">Pending (Has Balance)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Student List Items */}
            <div className="p-2 space-y-1">
              {!selectedClassId ? (
                <div className="text-center py-12 text-xs text-slate-400 italic">Please select a class above</div>
              ) : fetchingStudents ? (
                <div className="space-y-2 p-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-12 rounded-xl" />
                  ))}
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400 italic">No students found</div>
              ) : (
                filteredStudents.map((s) => {
                  const balance = Number(s.total_fees) - Number(s.total_paid);
                  const hasRoll = s.roll_no && String(s.roll_no).trim() !== '' && String(s.roll_no).toUpperCase() !== 'N/A';
                  return (
                    <button
                      key={s.student_id}
                      onClick={() => setSelectedStudent(s)}
                      className="w-full text-left p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 active:scale-[0.99] transition-all flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900 truncate">
                            {s.stu_first_name} {s.stu_last_name}
                          </span>
                          {hasRoll && (
                            <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0 rounded-md border-slate-200 text-slate-500 shrink-0">
                              #{s.roll_no}
                            </Badge>
                          )}
                        </div>
                        <span className={`text-[11px] font-bold ${balance <= 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                          {balance <= 0 ? "Fully Paid" : `Bal: ₹${balance.toLocaleString()}`}
                        </span>
                      </div>

                      {/* Status Dot */}
                      {balance > 0 ? (
                        <div className="h-2.5 w-2.5 rounded-full bg-rose-500 shrink-0 ring-4 ring-rose-50" />
                      ) : (
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0 ring-4 ring-emerald-50" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
