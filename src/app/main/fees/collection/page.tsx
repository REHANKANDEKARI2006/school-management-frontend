"use client";

import * as React from "react";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
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

/* ✅ REAL APIs */
import { getFeeCategories, getFeeStructures, collectFee, getStudentFeeCollection } from "@/lib/api/fees";
import { getClasses } from "@/lib/api/classes";
import { getStudentsByClass } from "@/lib/api/students";

// import { getFeeCategories } from "@/lib/api/fees";
// import { getClasses } from "@/lib/api/classes";
// import { getStudentsByClass } from "@/lib/api/students";
// import { getFeeStructures } from "@/lib/api/fees";


type FeeStatus = "Paid" | "Partial" | "Unpaid";

export default function FeeCollectionPage() {
  const { toast } = useToast();

  const [feeCategories, setFeeCategories] = React.useState<any[]>([]);
  const [classes, setClasses] = React.useState<any[]>([]);
  const [students, setStudents] = React.useState<any[]>([]);
  const [feeStructures, setFeeStructures] = React.useState<any[]>([]);

  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string>();
  const [selectedClassId, setSelectedClassId] = React.useState<string>();
  const [selectedStructure, setSelectedStructure] = React.useState<any>();

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedStudent, setSelectedStudent] = React.useState<any>();
  const [amount, setAmount] = React.useState("");

  /* =========================
     INITIAL LOAD
  ========================= */
  React.useEffect(() => {
    Promise.all([
      getFeeCategories(),
      getClasses(),
      getFeeStructures()
    ])
      .then(([categories, classList, structures]) => {
        setFeeCategories(categories || []);
        setClasses(classList || []);
        setFeeStructures(structures || []);
      })
      .catch(e => {
        console.error(e);
        toast({ title: "Failed to load collection data", variant: "destructive" });
      });
  }, []);

  /* =========================
     LOAD STUDENTS + STRUCTURE
  ========================= */
  React.useEffect(() => {
    if (!selectedClassId || !selectedCategoryId) return;

    const structure = feeStructures.find(
      (s) =>
        String(s.class_id) === selectedClassId &&
        String(s.fee_cat_id) === selectedCategoryId
    );

    setSelectedStructure(structure || null);

    getStudentsByClass(selectedClassId).then(async (data) => {
      const classStudents = (data || []).filter((s: any) => String(s.class_id) === String(selectedClassId));

      const enriched = await Promise.all(
        classStudents.map(async (stu: any) => {
          let totalPaid = 0;

          if (structure) {
            try {
              const history = await getStudentFeeCollection(stu.student_id);
              totalPaid = (history || [])
                .filter((h: any) => h.fee_struct_id === structure.fee_struct_id)
                .reduce((sum: number, h: any) => sum + Number(h.amount_paid), 0);
            } catch (e) {
              console.error("Failed to fetch history for student:", stu.student_id, e);
            }
          }

          let status: FeeStatus = "Unpaid";
          if (totalPaid > 0 && totalPaid < structure?.amount) status = "Partial";
          if (totalPaid >= structure?.amount) status = "Paid";

          return {
            ...stu,
            amountPaid: totalPaid,
            feeStatus: status,
          };
        })
      );

      setStudents(enriched);
    });
  }, [selectedClassId, selectedCategoryId, feeStructures]);

  /* =========================
     COLLECT FEE
  ========================= */
  const handleConfirmPayment = async () => {
    if (!selectedStudent || !selectedStructure) return;

    try {
      await collectFee({
        student_id: selectedStudent.student_id,
        fee_struct_id: selectedStructure.fee_struct_id,
        amount_paid: Number(amount),
      });

      toast({ title: "Fee Collected Successfully" });
      setIsDialogOpen(false);
      setAmount("");

      // ✅ Trick to force React to re-trigger the useEffect and reload students:
      const tempClassId = selectedClassId;
      setSelectedClassId("");
      setTimeout(() => setSelectedClassId(tempClassId), 10);

    } catch (e: any) {
      console.error(e);
      toast({
        title: "Failed to collect fee",
        description: e.response?.data?.message || e.message,
        variant: "destructive"
      });
    }
  };

  /* =========================
     UI
  ========================= */
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Fee Collection</CardTitle>
          <CardDescription>
            Student-wise paid / pending / partial fees
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <Label>Fee Category</Label>
              <Select onValueChange={setSelectedCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {feeCategories.map((c) => (
                    <SelectItem
                      key={c.fee_category_id}
                      value={String(c.fee_category_id)}
                    >
                      {c.category_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Class</Label>
              <Select
                onValueChange={setSelectedClassId}
                disabled={!selectedCategoryId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem
                      key={c.class_id}
                      value={String(c.class_id)}
                    >
                      {c.class_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedStructure ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {students.map((s) => (
                  <TableRow key={s.student_id}>
                    <TableCell>
                      {s.stu_first_name} {s.stu_last_name}
                    </TableCell>
                    <TableCell>
                      <Badge>{s.feeStatus}</Badge>
                    </TableCell>
                    <TableCell>{selectedStructure.amount}</TableCell>
                    <TableCell>{s.amountPaid}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        disabled={s.feeStatus === "Paid"}
                        onClick={() => {
                          setSelectedStudent(s);
                          setIsDialogOpen(true);
                        }}
                      >
                        Collect
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-red-500">
              No fee structure defined for this class & category
            </p>
          )}
        </CardContent>
      </Card>

      {/* ================= DIALOG ================= */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Collect Fee – {selectedStudent?.stu_first_name}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Enter amount to collect
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPayment}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
