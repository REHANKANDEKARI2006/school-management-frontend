"use client";
import * as React from "react";
import { getStudentDetailedFeeStatus, collectFee } from "@/lib/api/fees";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { IndianRupee, History, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface StudentFeeLedgerProps {
  studentId: string;
  studentName: string;
}

export function StudentFeeLedger({ studentId, studentName }: StudentFeeLedgerProps) {
  const [fees, setFees] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();
  const [selectedFee, setSelectedFee] = React.useState<any>(null);
  const [amount, setAmount] = React.useState("");

  const loadFeeStatus = async () => {
    setLoading(true);
    try {
      const data = await getStudentDetailedFeeStatus(studentId);
      setFees(data || []);
    } catch (e) {
      console.error(e);
      toast({ title: "Error loading fees", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (studentId) loadFeeStatus();
  }, [studentId]);

  const handlePay = async () => {
    if (!selectedFee || !amount) return;
    
    // Simple validation
    const balance = Number(selectedFee.total_amount) - Number(selectedFee.paid_amount);
    if (Number(amount) > balance) {
        toast({ title: "Amount exceeds balance", variant: "destructive" });
        return;
    }

    try {
      await collectFee({
        student_id: studentId,
        fee_struct_id: selectedFee.fee_struct_id,
        amount_paid: Number(amount)
      });
      toast({ title: "Payment Recorded" });
      setSelectedFee(null);
      setAmount("");
      loadFeeStatus();
    } catch (e: any) {
      console.error(e);
      toast({ title: "Failed to record payment", description: e.response?.data?.message || "An error occurred", variant: "destructive" });
    }
  };

  if (loading) return (
      <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
      </div>
  );

  if (fees.length === 0) {
      return (
          <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-xl">
              No fee structures assigned to this student's class.
          </div>
      );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <History className="h-5 w-5 text-blue-600" />
          Fee Ledger for {studentName}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {fees.map((f, i) => {
            const balance = Number(f.total_amount) - Number(f.paid_amount);
            const status = balance === 0 ? "Paid" : (Number(f.paid_amount) > 0 ? "Partial" : "Unpaid");
            const statusColor = status === "Paid" ? "bg-green-100/50 text-green-700 border-green-200" : (status === "Partial" ? "bg-amber-100/50 text-amber-700 border-amber-200" : "bg-rose-100/50 text-rose-700 border-rose-200");

            return (
              <motion.div
                key={f.fee_struct_id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Card className={`overflow-hidden transition-all hover:shadow-md border-l-4 ${status === "Paid" ? "border-l-green-500" : (status === "Partial" ? "border-l-amber-500" : "border-l-rose-500")}`}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-md font-bold text-gray-800">{f.category_name}</CardTitle>
                        <CardDescription className="text-xs">
                          Due Date: {f.due_date ? new Date(f.due_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : "Not Set"}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className={`${statusColor} font-medium px-2 py-0.5`}>
                        {status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4 pt-0">
                    <div className="flex justify-between items-center">
                      <div className="space-y-0.5">
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          Paid: ₹{f.paid_amount} / <span className="font-semibold text-gray-600">₹{f.total_amount}</span>
                        </div>
                        <div className="text-lg font-extrabold text-blue-900 tracking-tight">
                          Balance: ₹{balance.toLocaleString()}
                        </div>
                      </div>
                      {balance > 0 && (
                        <Button 
                            size="sm" 
                            className="shadow-sm hover:translate-x-1 transition-transform"
                            onClick={() => setSelectedFee(f)}
                        >
                          Pay <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <Dialog open={!!selectedFee} onOpenChange={(o) => !o && setSelectedFee(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Collect Payment</DialogTitle>
            <DialogDescription className="text-sm">
                Apply payment to <span className="font-semibold text-gray-900">"{selectedFee?.category_name}"</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="grid gap-2.5">
              <Label htmlFor="amount" className="text-sm font-semibold">Payment Amount</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  className="pl-8 text-lg py-5 border-2 focus-visible:ring-blue-500"
                  placeholder="Enter amount"
                  autoFocus
                  value={amount}
                  autoComplete="off"
                  onChange={(e) => setAmount(e.target.value)}
                />
                <span className="absolute left-3 top-2.5 text-lg font-bold text-gray-500">₹</span>
              </div>
              <div className="flex justify-between px-1">
                <span className="text-xs text-muted-foreground">Outstanding: ₹{selectedFee ? (Number(selectedFee.total_amount) - Number(selectedFee.paid_amount)).toLocaleString() : 0}</span>
                <Button 
                    variant="link" 
                    className="h-auto p-0 text-xs font-bold text-blue-600 hover:text-blue-800"
                    onClick={() => setAmount(String(Number(selectedFee.total_amount) - Number(selectedFee.paid_amount)))}
                >
                    Pay Full
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelectedFee(null)}>Cancel</Button>
            <Button 
                className="bg-blue-600 hover:bg-blue-700 font-bold"
                onClick={handlePay} 
                disabled={!amount || Number(amount) <= 0}
            >
                Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
