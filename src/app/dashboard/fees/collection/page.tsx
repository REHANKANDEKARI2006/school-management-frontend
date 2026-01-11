
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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getFeeCategories, getClasses, getStudentsByClass, getFeeStructureByClassAndCategory } from "@/lib/mock-data";
import type { FeeCategory } from "@/components/campus-connect/fee-category-form";
import type { ClassItem, Student, FeeStructure } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type FeeStatus = "Paid" | "Pending" | "Partial" | "Unpaid";

interface StudentWithFeeStatus extends Student {
    feeStatus: FeeStatus;
    amountPaid: number;
}

export default function FeeCollectionPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [feeCategories] = React.useState<FeeCategory[]>(getFeeCategories());
  const [classes] = React.useState<ClassItem[]>(getClasses());

  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = React.useState<string | null>(null);
  const [students, setStudents] = React.useState<StudentWithFeeStatus[]>([]);
  const [feeStructure, setFeeStructure] = React.useState<FeeStructure | null>(null);
  
  const [isCollectDialogOpen, setIsCollectDialogOpen] = React.useState(false);
  const [selectedStudent, setSelectedStudent] = React.useState<StudentWithFeeStatus | null>(null);
  const [amount, setAmount] = React.useState("");

  const storageKey = React.useMemo(() => {
    if (!selectedCategoryId || !selectedClassId) return null;
    return `fee-${selectedCategoryId}-${selectedClassId}`;
  }, [selectedCategoryId, selectedClassId]);

  React.useEffect(() => {
    if (selectedClassId && selectedCategoryId) {
      const structure = getFeeStructureByClassAndCategory(selectedClassId, selectedCategoryId);
      setFeeStructure(structure || null);

      const classStudents = getStudentsByClass(selectedClassId);
      const feeData = storageKey ? JSON.parse(localStorage.getItem(storageKey) || '{}') : {};

      setStudents(classStudents.map(s => {
        const studentRecord = feeData[s.id];
        const amountPaid = studentRecord?.amountPaid || 0;
        
        let status: FeeStatus = "Unpaid";
        if (structure) {
          if (amountPaid >= structure.amount) {
            status = "Paid";
          } else if (amountPaid > 0) {
            status = "Partial";
          }
        }
        
        return {
          ...s,
          feeStatus: studentRecord?.status || status,
          amountPaid: amountPaid,
        }
      }));
    } else {
      setStudents([]);
      setFeeStructure(null);
    }
  }, [selectedClassId, selectedCategoryId, storageKey]);
  
  const handleCollectFeeClick = (student: StudentWithFeeStatus) => {
    setSelectedStudent(student);
    setAmount("");
    setIsCollectDialogOpen(true);
  }

  const handleConfirmPayment = () => {
    if (!selectedStudent || !storageKey || !feeStructure) return;
    
    const paymentAmount = parseFloat(amount);
    if(isNaN(paymentAmount) || paymentAmount <= 0) {
        toast({ title: "Invalid Amount", description: "Please enter a valid payment amount.", variant: "destructive" });
        return;
    }

    const feeData = JSON.parse(localStorage.getItem(storageKey) || '{}');
    const studentFeeRecord = feeData[selectedStudent.id] || { status: 'Unpaid', amountPaid: 0 };
    
    const newAmountPaid = (studentFeeRecord.amountPaid || 0) + paymentAmount;
    let newStatus: FeeStatus = "Partial";
    if (newAmountPaid >= feeStructure.amount) {
        newStatus = "Paid";
    }
    
    feeData[selectedStudent.id] = { status: newStatus, amountPaid: newAmountPaid };
    localStorage.setItem(storageKey, JSON.stringify(feeData));

    setStudents(prev => prev.map(s => s.id === selectedStudent.id ? { ...s, feeStatus: newStatus, amountPaid: newAmountPaid } : s));

    toast({ title: "Payment Recorded", description: `Recorded ${paymentAmount} for ${selectedStudent.name}.` });
    setIsCollectDialogOpen(false);
    setSelectedStudent(null);
  }

  const getStatusVariant = (status: FeeStatus) => {
      switch(status) {
          case 'Paid': return 'default';
          case 'Pending': return 'destructive';
          case 'Unpaid': return 'destructive';
          case 'Partial': return 'secondary';
      }
  }

  const totalAmountDue = feeStructure ? feeStructure.amount * students.length : 0;
  const totalAmountCollected = students.reduce((acc, student) => acc + student.amountPaid, 0);

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="font-headline">Fee Collection</CardTitle>
          <CardDescription>Select a fee category and class to view student payment statuses and collect fees.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="grid gap-2">
              <Label htmlFor="category-select">Fee Category</Label>
              <Select onValueChange={setSelectedCategoryId}>
                <SelectTrigger id="category-select">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {feeCategories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="class-select">Class</Label>
              <Select onValueChange={setSelectedClassId} disabled={!selectedCategoryId}>
                <SelectTrigger id="class-select">
                  <SelectValue placeholder={selectedCategoryId ? "Select a class" : "Select a category first"} />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {feeStructure && (
              <div className="mb-4 text-sm font-semibold text-center bg-muted p-3 rounded-md grid grid-cols-2">
                  <div>
                      Total Due: <span className="text-primary">${totalAmountDue.toFixed(2)}</span>
                  </div>
                  <div>
                      Total Collected: <span className="text-green-600">${totalAmountCollected.toFixed(2)}</span>
                  </div>
              </div>
          )}

          {selectedClassId && selectedCategoryId && (
            students.length > 0 ? (
              !feeStructure ? (
                <p className="text-center text-destructive-foreground bg-destructive p-3 rounded-md">No fee structure defined for this Class and Fee Category combination. Please define one in 'Manage Structures'.</p>
              ) : (
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Roll No.</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Amount Due</TableHead>
                        <TableHead>Amount Paid</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {students.map((student) => (
                        <TableRow key={student.id}>
                        <TableCell>{student.rollNumber}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>
                            <Badge variant={getStatusVariant(student.feeStatus)}>{student.feeStatus}</Badge>
                        </TableCell>
                        <TableCell>${feeStructure.amount.toFixed(2)}</TableCell>
                        <TableCell>${student.amountPaid.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => handleCollectFeeClick(student)} disabled={student.feeStatus === 'Paid'}>Collect Fee</Button>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
              )
            ) : (
                <p className="text-center text-muted-foreground py-4">Select a category and class to see students.</p>
            )
          )}
        </CardContent>
      </Card>
       <AlertDialog open={isCollectDialogOpen} onOpenChange={setIsCollectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Collect Fee for {selectedStudent?.name}</AlertDialogTitle>
            <AlertDialogDescription>
              Total Amount: ${feeStructure?.amount.toFixed(2)} | Paid: ${selectedStudent?.amountPaid.toFixed(2)} | Due: ${((feeStructure?.amount || 0) - (selectedStudent?.amountPaid || 0)).toFixed(2)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="col-span-3"
                placeholder="Enter amount being paid"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPayment}>Confirm Payment</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
