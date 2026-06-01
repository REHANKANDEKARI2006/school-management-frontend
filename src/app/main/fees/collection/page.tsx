"use client";

import { PageSkeleton } from "@/components/ui/skeletons";
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
import { StudentFeeLedger } from "@/components/campus-connect/student-fee-ledger";
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
    <div className="flex flex-col gap-6 pb-10">
      <Card>
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

      <div className="flex flex-col lg:flex-row gap-6 min-h-[600px]">
        {/* SIDEBAR: Student List */}
        <Card className="w-full lg:w-80 flex flex-col shadow-sm h-[400px] lg:h-auto lg:max-h-[800px] flex-shrink-0">
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
                    {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-gray-100 animate-pulse rounded-md" />)}
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
    </div>
  );
}
