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
import { User, Search, School } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";

export default function FeeCollectionPage() {
  const { toast } = useToast();

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

  const filteredStudents = students.filter(s => 
    `${s.stu_first_name} ${s.stu_last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.roll_no && String(s.roll_no).includes(searchQuery))
  );

  if (loading) return <PageSkeleton rows={5} />;

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] gap-6">
      <Card className="flex-shrink-0 shadow-sm border-none bg-blue-50/30">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6 items-end">
            <div className="w-full md:w-1/3">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block">Select Class & Section</Label>
              <Select onValueChange={setSelectedClassId}>
                <SelectTrigger className="bg-white border-2 border-blue-100 hover:border-blue-200 transition-colors">
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
            
            <div className="flex-grow">
               <div className="flex items-center gap-4 text-blue-800">
                    <School className="h-10 w-10 p-2 bg-blue-100 rounded-lg" />
                    <div>
                        <h2 className="text-2xl font-black tracking-tight">Fee Collection Center</h2>
                        <p className="text-sm text-blue-600 font-medium">Manage student fees and issue receipts</p>
                    </div>
               </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* SIDEBAR: Student List */}
        <Card className="w-full md:w-80 flex flex-col shadow-md border-gray-100 overflow-hidden">
          <CardHeader className="pb-4 bg-gray-50/50">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Students</span>
              <Badge variant="secondary" className="font-mono">{filteredStudents.length}</Badge>
            </CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search name/roll..."
                className="pl-8 h-9 text-xs border-gray-200"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
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
                      className={`w-full text-left p-3 rounded-lg transition-all group relative ${
                        isSelected 
                        ? "bg-blue-600 shadow-blue-200 shadow-lg translate-x-1" 
                        : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-xs font-bold truncate ${isSelected ? "text-white" : "text-gray-900"}`}>
                          {s.stu_first_name} {s.stu_last_name}
                        </span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                          #{s.roll_no || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-[10px] font-medium ${isSelected ? "text-blue-100" : "text-gray-500"}`}>
                            {balance <= 0 ? "Fully Paid" : `Bal: ₹${balance.toLocaleString()}`}
                        </span>
                        {balance > 0 && (
                            <div className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-red-500"}`} />
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
        <Card className="flex-grow shadow-md border-gray-100 overflow-hidden bg-dot-pattern">
             <ScrollArea className="h-full">
                <CardContent className="p-6">
                    <AnimatePresence mode="wait">
                        {selectedStudent ? (
                            <motion.div
                                key={selectedStudent.student_id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <StudentFeeLedger 
                                    studentId={selectedStudent.student_id} 
                                    studentName={`${selectedStudent.stu_first_name} ${selectedStudent.stu_last_name}`} 
                                />
                            </motion.div>
                        ) : (
                            <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground opacity-40">
                                <User className="h-20 w-20 mb-4 stroke-1" />
                                <p className="text-lg font-medium">Select a student to view and collect fees</p>
                                <p className="text-sm">Payments are instantly recorded in the system</p>
                            </div>
                        )}
                    </AnimatePresence>
                </CardContent>
             </ScrollArea>
        </Card>
      </div>
    </div>
  );
}
