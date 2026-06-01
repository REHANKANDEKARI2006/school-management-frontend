"use client";
import * as React from "react";
import { getStudentDetailedFeeStatus, collectFee, getStudentFeeCollection } from "@/lib/api/fees";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { IndianRupee, History, ArrowRight, CheckCircle2, FileText, Download, Check, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import axios from "@/lib/axios";

interface StudentFeeLedgerProps {
  studentId: string;
  studentName: string;
}

export function StudentFeeLedger({ studentId, studentName }: StudentFeeLedgerProps) {
  const [fees, setFees] = React.useState<any[]>([]);
  const [paymentHistory, setPaymentHistory] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const { toast } = useToast();

  // Selection states for bulk payments
  const [selectedFeeIds, setSelectedFeeIds] = React.useState<string[]>([]);
  const [isBulkPayOpen, setIsBulkPayOpen] = React.useState(false);
  const [bulkAmounts, setBulkAmounts] = React.useState<Record<string, string>>({});
  const [successBulkPayments, setSuccessBulkPayments] = React.useState<any[] | null>(null);

  // Single payment states
  const [selectedFee, setSelectedFee] = React.useState<any>(null);
  const [amount, setAmount] = React.useState("");
  const [successPayment, setSuccessPayment] = React.useState<any>(null);

  // Loading indicator for receipt generation
  const [receiptLoading, setReceiptLoading] = React.useState(false);
  const [downloadingReceiptId, setDownloadingReceiptId] = React.useState<string | null>(null);

  const loadFeeStatus = async () => {
    setLoading(true);
    try {
      const data = await getStudentDetailedFeeStatus(studentId);
      setFees(data || []);
      
      setHistoryLoading(true);
      const historyData = await getStudentFeeCollection(studentId);
      setPaymentHistory(historyData || []);
    } catch (e) {
      console.error(e);
      toast({ title: "Error loading fees", variant: "destructive" });
    } finally {
      setLoading(false);
      setHistoryLoading(false);
    }
  };

  React.useEffect(() => {
    if (studentId) {
      loadFeeStatus();
      setSelectedFeeIds([]);
    }
  }, [studentId]);

  // Handle individual payment recording
  const handlePay = async () => {
    if (!selectedFee || !amount || Number(amount) <= 0) return;
    try {
      const paymentRecord = await collectFee({
        student_id: studentId,
        fee_struct_id: selectedFee.fee_struct_id,
        amount_paid: Number(amount)
      });
      
      toast({ title: "Payment Recorded Successfully" });
      
      // Auto-generate the display receipt number in case backend doesn't return it
      const year = new Date().getFullYear();
      const generatedReceiptNo = paymentRecord.receipt_no || `REC-${year}-${String(paymentRecord.collection_id || paymentRecord.payment_id).padStart(4, '0')}`;
      
      setSuccessPayment({
        payment_id: paymentRecord.collection_id || paymentRecord.payment_id,
        amount: Number(amount),
        category_name: selectedFee.category_name,
        receipt_no: generatedReceiptNo
      });
      
      setSelectedFee(null);
      setAmount("");
      loadFeeStatus();
    } catch (e: any) {
      console.error(e);
      toast({ title: "Failed to record payment", description: e.response?.data?.message || "An error occurred", variant: "destructive" });
    }
  };

  // Toggle selection for bulk fee payment
  const toggleSelectFee = (feeStructId: string) => {
    setSelectedFeeIds(prev => 
      prev.includes(feeStructId) 
        ? prev.filter(id => id !== feeStructId)
        : [...prev, feeStructId]
    );
  };

  // Select all unpaid/partial fees
  const selectAllCollectableFees = () => {
    const collectableIds = fees
      .filter(f => (Number(f.total_amount) - Number(f.paid_amount)) > 0)
      .map(f => f.fee_struct_id);
    
    if (selectedFeeIds.length === collectableIds.length) {
      setSelectedFeeIds([]);
    } else {
      setSelectedFeeIds(collectableIds);
    }
  };

  // Initialize and open bulk payment dialog
  const handleOpenBulkPay = () => {
    if (selectedFeeIds.length === 0) return;
    
    const initialAmounts: Record<string, string> = {};
    selectedFeeIds.forEach(id => {
      const fee = fees.find(f => f.fee_struct_id === id);
      if (fee) {
        initialAmounts[id] = String(Number(fee.total_amount) - Number(fee.paid_amount));
      }
    });
    
    setBulkAmounts(initialAmounts);
    setIsBulkPayOpen(true);
  };

  // Handle bulk payment recording
  const handleBulkPay = async () => {
    setReceiptLoading(true);
    try {
      const paymentsToCollect = selectedFeeIds.map(id => {
        const fee = fees.find(f => f.fee_struct_id === id);
        const amt = Number(bulkAmounts[id] || 0);
        return { fee, amt };
      }).filter(p => p.fee && p.amt > 0);

      if (paymentsToCollect.length === 0) {
        toast({ title: "No valid payment amounts specified", variant: "destructive" });
        setReceiptLoading(false);
        return;
      }

      // Generate a SINGLE unified receipt number for all categories collected in this bulk transaction
      const year = new Date().getFullYear();
      const randomPart = Math.floor(100000 + Math.random() * 900000);
      const unifiedReceiptNo = `REC-${year}-${randomPart}`;

      // Record payments in parallel using the identical receipt number
      const results = await Promise.all(
        paymentsToCollect.map(async (p) => {
          const res = await collectFee({
            student_id: studentId,
            fee_struct_id: p.fee.fee_struct_id,
            amount_paid: p.amt,
            receipt_no: unifiedReceiptNo
          });
          
          return {
            payment_id: res.collection_id || res.payment_id,
            amount: p.amt,
            category_name: p.fee.category_name,
            receipt_no: unifiedReceiptNo
          };
        })
      );

      toast({ title: "All Payments Recorded Successfully!" });
      setSuccessBulkPayments(results);
      setIsBulkPayOpen(false);
      setSelectedFeeIds([]);
      loadFeeStatus();
    } catch (e: any) {
      console.error(e);
      toast({ 
        title: "Failed to collect some payments", 
        description: e.response?.data?.message || "An error occurred during bulk payment", 
        variant: "destructive" 
      });
    } finally {
      setReceiptLoading(false);
    }
  };

  // Download a single receipt dynamically
  const handleDownloadReceipt = async (paymentId: string) => {
    if (!paymentId) return;
    setDownloadingReceiptId(paymentId);
    try {
      const res = await axios.get(`/api/documents/fee-receipt/${paymentId}`, {
        responseType: 'blob'
      });

      const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Fee_Receipt_${studentName.replace(/\s+/g, '_')}_${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ title: "Success", description: "Receipt PDF downloaded successfully." });
    } catch (e) {
      console.error(e);
      toast({ title: "Receipt Download Failed", variant: "destructive" });
    } finally {
      setDownloadingReceiptId(null);
    }
  };

  // Group payment history dynamically by receipt number for a consolidated visual layout
  const groupedHistory = React.useMemo(() => {
    const groups: Record<string, {
      receipt_no: string;
      payment_date: string;
      amount_paid: number;
      categories: string[];
      payment_ids: string[];
    }> = {};

    paymentHistory.forEach(item => {
      const year = new Date(item.payment_date).getFullYear();
      const rNo = item.receipt_no || `REC-${year}-${String(item.collection_id).padStart(4, '0')}`;
      
      if (!groups[rNo]) {
        groups[rNo] = {
          receipt_no: rNo,
          payment_date: item.payment_date,
          amount_paid: 0,
          categories: [],
          payment_ids: []
        };
      }
      
      groups[rNo].amount_paid += Number(item.amount_paid);
      if (!groups[rNo].categories.includes(item.category_name || "School Fees")) {
        groups[rNo].categories.push(item.category_name || "School Fees");
      }
      groups[rNo].payment_ids.push(item.collection_id || item.payment_id);
    });

    return Object.values(groups);
  }, [paymentHistory]);

  // Compute total selected amount
  const totalSelectedAmount = selectedFeeIds.reduce((total, id) => {
    const fee = fees.find(f => f.fee_struct_id === id);
    if (!fee) return total;
    return total + (Number(fee.total_amount) - Number(fee.paid_amount));
  }, 0);

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

  // Separate fees into collectable and fully paid
  const collectableFees = fees.filter(f => (Number(f.total_amount) - Number(f.paid_amount)) > 0);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800">
            <History className="h-5 w-5 text-blue-600" />
            Fee Ledger for {studentName}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Select and pay multiple fees simultaneously</p>
        </div>
        {collectableFees.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={selectAllCollectableFees}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-50"
          >
            {selectedFeeIds.length === collectableFees.length ? "Deselect All" : "Select All Collectable"}
          </Button>
        )}
      </div>

      {/* Floating/Sticky Action Bar for Bulk Collection */}
      <AnimatePresence>
        {selectedFeeIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="relative z-10 p-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-4 border border-blue-400/20"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center text-white border border-white/10">
                <Sparkles size={20} className="animate-pulse" />
              </div>
              <div>
                <div className="font-extrabold text-md tracking-tight">Bulk Payment Ready</div>
                <div className="text-xs text-blue-100 font-medium">
                  Selected <span className="font-bold text-white bg-white/20 px-1.5 py-0.5 rounded-md">{selectedFeeIds.length}</span> fee structures • Total: <span className="font-bold text-white">₹{totalSelectedAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2.5 w-full md:w-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFeeIds([])}
                className="text-white hover:bg-white/10 font-bold w-full md:w-auto px-4 py-5"
              >
                Clear
              </Button>
              <Button
                onClick={handleOpenBulkPay}
                className="bg-white text-blue-700 hover:bg-slate-50 font-extrabold w-full md:w-auto px-6 py-5 shadow-lg flex items-center justify-center gap-2 rounded-xl transition-all hover:scale-[1.02]"
              >
                Collect Selected Fees
                <ArrowRight size={16} className="stroke-[2.5]" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Outstanding Fees Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {fees.map((f, i) => {
            const balance = Number(f.total_amount) - Number(f.paid_amount);
            const isPaid = balance === 0;
            const isSelected = selectedFeeIds.includes(f.fee_struct_id);
            const status = isPaid ? "Paid" : (Number(f.paid_amount) > 0 ? "Partial" : "Unpaid");
            const statusColor = isPaid 
              ? "bg-green-50 text-green-700 border-green-200/50" 
              : (status === "Partial" ? "bg-amber-50 text-amber-700 border-amber-200/50" : "bg-rose-50 text-rose-700 border-rose-200/50");

            return (
              <motion.div
                key={f.fee_struct_id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Card 
                  className={`overflow-hidden transition-all duration-200 relative border-l-4 ${
                    isPaid ? "border-l-green-500 bg-white" : (status === "Partial" ? "border-l-amber-500 bg-white" : "border-l-rose-500 bg-white")
                  } ${isSelected ? "ring-2 ring-blue-500 shadow-md translate-y-[-2px]" : "hover:shadow-md"}`}
                >
                  <CardHeader className="pb-3 pt-4 px-4 flex flex-row justify-between items-start">
                    <div className="space-y-1 pr-6">
                      <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                        {f.category_name}
                      </CardTitle>
                      <CardDescription className="text-[10px] uppercase font-bold text-slate-400">
                        Due Date: {f.due_date ? formatDate(f.due_date) : "Not Set"}
                      </CardDescription>
                    </div>
                    {/* Checkbox for Bulk pay */}
                    {!isPaid ? (
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelectFee(f.fee_struct_id)}
                        className="h-5 w-5 rounded-md border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                    ) : (
                      <div className="h-5 w-5 bg-green-50 rounded-full flex items-center justify-center border border-green-200 text-green-600">
                        <Check size={12} className="stroke-[3]" />
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="pb-4 pt-0 px-4">
                    <div className="flex justify-between items-end">
                      <div className="space-y-0.5">
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          Paid: <span className="font-extrabold text-slate-700">₹{f.paid_amount}</span> / <span className="font-semibold text-slate-400">₹{f.total_amount}</span>
                        </div>
                        <div className="text-md font-extrabold text-slate-800 tracking-tight">
                          Balance: <span className={balance > 0 ? "text-slate-800" : "text-green-600"}>₹{balance.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`${statusColor} font-semibold px-2 py-0.5 text-[10px]`}>
                          {status}
                        </Badge>
                        {balance > 0 && (
                          <Button 
                              size="sm" 
                              variant="outline"
                              className="h-8 border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg shadow-sm"
                              onClick={() => {
                                setSelectedFee(f);
                                setAmount(String(balance));
                              }}
                          >
                            Pay Individual
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Historical Payments & Receipts Download Panel */}
      <Card className="shadow-sm border-slate-100 rounded-2xl overflow-hidden bg-white">
        <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/50">
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <FileText className="h-4.5 w-4.5 text-blue-600" />
                Recent Payments & Receipt History
              </CardTitle>
              <CardDescription className="text-xs">Download consolidated PDF receipts for any past transactions</CardDescription>
            </div>
            <Badge variant="secondary" className="font-bold text-[10px] bg-slate-100 text-slate-600">
              {groupedHistory.length} Transactions Total
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {historyLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ) : groupedHistory.length === 0 ? (
            <div className="text-center py-10 text-slate-400 select-none flex flex-col items-center justify-center">
              <History size={36} className="text-slate-300 mb-2 stroke-[1.5]" />
              <p className="text-xs font-semibold">No payment history recorded yet.</p>
              <p className="text-[10px] text-slate-400">Payments will display here after fee collections.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 max-h-[300px] overflow-y-auto">
              {groupedHistory.map((item) => {
                const isDownloading = downloadingReceiptId === item.payment_ids[0];
                
                return (
                  <div key={item.receipt_no} className="p-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-3 pr-4">
                      <div className="h-8 w-8 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-100">
                        <Check size={14} className="stroke-[3]" />
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-slate-800 leading-tight">
                          {item.categories.join(" + ")}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-slate-400">
                          <span>{item.payment_date ? formatDate(item.payment_date) : "-"}</span>
                          <span>•</span>
                          <span className="font-mono text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded-md">{item.receipt_no}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-extrabold text-emerald-600">₹{item.amount_paid.toLocaleString()}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownloadReceipt(item.payment_ids[0])}
                        disabled={isDownloading}
                        className="h-8 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50/30 hover:bg-blue-50 border border-blue-100/50 hover:border-blue-200/50 rounded-lg flex items-center gap-1.5"
                      >
                        {isDownloading ? "Downloading..." : "Receipt"}
                        <Download size={12} className="stroke-[2.5]" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Collect Payment Modal */}
      <Dialog open={!!selectedFee} onOpenChange={(o) => !o && setSelectedFee(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl p-6 bg-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-slate-800">Collect Payment</DialogTitle>
            <DialogDescription className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                Apply payment to <span className="font-extrabold text-slate-700">"{selectedFee?.category_name}"</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-4 select-none">
            <div className="grid gap-2">
              <Label htmlFor="amount" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payment Amount (₹)</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  className="pl-8 text-md py-5 border-2 border-slate-100 focus-visible:ring-blue-500 rounded-xl font-extrabold"
                  placeholder="Enter amount"
                  autoFocus
                  value={amount}
                  autoComplete="off"
                  onChange={(e) => setAmount(e.target.value)}
                />
                <span className="absolute left-3 top-3 text-md font-extrabold text-slate-400">₹</span>
              </div>
              <div className="flex justify-between items-center px-1 text-xs">
                <span className="text-[11px] font-semibold text-slate-400">Outstanding: ₹{selectedFee ? (Number(selectedFee.total_amount) - Number(selectedFee.paid_amount)).toLocaleString() : 0}</span>
                <Button 
                    variant="link" 
                    className="h-auto p-0 text-[11px] font-extrabold text-blue-600 hover:text-blue-800"
                    onClick={() => setAmount(String(Number(selectedFee.total_amount) - Number(selectedFee.paid_amount)))}
                >
                    Pay Full Balance
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 select-none">
            <Button variant="ghost" onClick={() => setSelectedFee(null)} className="rounded-xl font-bold">Cancel</Button>
            <Button 
                className="bg-blue-600 hover:bg-blue-700 font-bold rounded-xl shadow-md transition-all px-5"
                onClick={handlePay} 
                disabled={!amount || Number(amount) <= 0}
            >
                Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MULTIPLE FEE COLLECTION MODAL */}
      <Dialog open={isBulkPayOpen} onOpenChange={(o) => !o && setIsBulkPayOpen(false)}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl p-6 bg-white shadow-2xl">
          <DialogHeader className="border-b border-slate-50 pb-3">
            <DialogTitle className="text-lg font-extrabold text-slate-800">Collect Multiple Fees</DialogTitle>
            <DialogDescription className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              Processing simultaneous collections
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4 max-h-[300px] overflow-y-auto pr-1">
            {selectedFeeIds.map((id) => {
              const fee = fees.find(f => f.fee_struct_id === id);
              if (!fee) return null;
              const outstanding = Number(fee.total_amount) - Number(fee.paid_amount);
              
              return (
                <div key={id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-4">
                  <div className="space-y-0.5 max-w-[200px]">
                    <div className="text-xs font-extrabold text-slate-800 truncate">{fee.category_name}</div>
                    <div className="text-[10px] font-bold text-slate-400">Outstanding: ₹{outstanding.toLocaleString()}</div>
                  </div>
                  
                  <div className="relative w-32 flex items-center">
                    <Input
                      type="number"
                      value={bulkAmounts[id] || ""}
                      onChange={(e) => setBulkAmounts(prev => ({ ...prev, [id]: e.target.value }))}
                      className="pl-5 text-right font-extrabold text-xs h-9 border-slate-200 rounded-lg focus-visible:ring-blue-500"
                    />
                    <span className="absolute left-2.5 text-[10px] font-extrabold text-slate-400">₹</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-50 pt-4 flex justify-between items-center px-1 select-none">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Grand Total Amount</span>
            <span className="text-lg font-extrabold text-blue-900">
              ₹{selectedFeeIds.reduce((sum, id) => sum + Number(bulkAmounts[id] || 0), 0).toLocaleString()}
            </span>
          </div>

          <DialogFooter className="gap-2 pt-3 border-t border-slate-50 select-none">
            <Button variant="ghost" onClick={() => setIsBulkPayOpen(false)} className="rounded-xl font-bold" disabled={receiptLoading}>Cancel</Button>
            <Button 
                className="bg-blue-600 hover:bg-blue-700 font-extrabold rounded-xl shadow-md transition-all px-5 flex items-center gap-1.5"
                onClick={handleBulkPay} 
                disabled={receiptLoading}
            >
                {receiptLoading ? "Processing..." : "Record Bulk Payments"}
                <ArrowRight size={14} className="stroke-[2.5]" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success & Receipt Download Dialog (Single Payment) */}
      <Dialog open={!!successPayment} onOpenChange={(o) => !o && setSuccessPayment(null)}>
        <DialogContent className="sm:max-w-[420px] bg-white rounded-2xl p-6 border border-slate-100 shadow-2xl">
          <DialogHeader className="flex flex-col items-center justify-center text-center pb-4 border-b border-slate-50 select-none">
            <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 border border-emerald-100/50 mb-3 animate-bounce">
              <CheckCircle2 size={36} className="stroke-[2.5]" />
            </div>
            <DialogTitle className="text-xl font-extrabold text-slate-800">Payment Successful!</DialogTitle>
            <DialogDescription className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
              Fee Collection Recorded
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-5 space-y-4 select-none">
            <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Student Name</span>
                <span className="font-extrabold text-slate-800">{studentName}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Fee Type</span>
                <span className="font-extrabold text-slate-800">{successPayment?.category_name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Amount Collected</span>
                <span className="font-extrabold text-emerald-600 text-sm">₹{successPayment?.amount?.toLocaleString()}</span>
              </div>
              {successPayment?.receipt_no && (
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Receipt No</span>
                  <span className="font-extrabold text-blue-600 font-mono bg-blue-50 px-1.5 py-0.5 rounded-md">{successPayment.receipt_no}</span>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              className="w-full font-bold border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl"
              onClick={() => setSuccessPayment(null)}
            >
              Close
            </Button>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 font-bold flex items-center justify-center gap-2 rounded-xl"
              onClick={() => handleDownloadReceipt(successPayment?.payment_id)}
              disabled={receiptLoading}
            >
              {receiptLoading ? "Downloading..." : "Download Receipt"}
              <FileText size={16} />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success & Consolidated Receipt Download Dialog (Bulk Payments) */}
      <Dialog open={!!successBulkPayments} onOpenChange={(o) => !o && setSuccessBulkPayments(null)}>
        <DialogContent className="sm:max-w-[460px] bg-white rounded-2xl p-6 border border-slate-100 shadow-2xl">
          <DialogHeader className="flex flex-col items-center justify-center text-center pb-4 border-b border-slate-50 select-none">
            <div className="h-16 w-16 bg-gradient-to-tr from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white shadow-md mb-3 animate-bounce">
              <CheckCircle2 size={36} className="stroke-[2.5]" />
            </div>
            <DialogTitle className="text-xl font-extrabold text-slate-800">Payments Recorded!</DialogTitle>
            <DialogDescription className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
              Consolidated Transaction Completed
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Summary of Collections</div>
            <div className="max-h-[220px] overflow-y-auto space-y-2.5 pr-1">
              {successBulkPayments?.map((payment) => (
                <div key={payment.payment_id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-extrabold text-slate-800">{payment.category_name}</div>
                    <div className="text-[9px] font-bold font-mono text-slate-400 mt-0.5">{payment.receipt_no}</div>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-600">₹{payment.amount?.toLocaleString()}</span>
                </div>
              ))}
            </div>
            
            <div className="p-3 bg-blue-50/30 border border-blue-50 rounded-xl flex justify-between items-center text-xs select-none">
              <span className="font-extrabold text-blue-800">Grand Total Collected</span>
              <span className="font-extrabold text-blue-900 text-sm">
                ₹{successBulkPayments?.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
              </span>
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2.5">
            <Button 
              variant="outline" 
              className="w-full font-bold border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl py-5"
              onClick={() => setSuccessBulkPayments(null)}
            >
              Dismiss
            </Button>
            {successBulkPayments && successBulkPayments.length > 0 && (
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 font-extrabold flex items-center justify-center gap-2 rounded-xl py-5 shadow-md shadow-blue-500/10"
                onClick={() => handleDownloadReceipt(successBulkPayments[0].payment_id)}
                disabled={receiptLoading}
              >
                {receiptLoading ? "Downloading..." : "Download Consolidated Receipt"}
                <FileText size={16} />
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
