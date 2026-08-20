"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, IndianRupee, Save } from "lucide-react";
import { updateFeeStructure } from "@/lib/api/fees";
import { useToast } from "@/hooks/use-toast";

interface UpdateFeeAmountDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  standardName: string;
  categoryName: string;
  categoryId: number;
  currentAmount: number;
  onSuccess: () => void;
}

export function UpdateFeeAmountDialog({
  isOpen,
  onOpenChange,
  standardName,
  categoryName,
  categoryId,
  currentAmount,
  onSuccess,
}: UpdateFeeAmountDialogProps) {
  const { toast } = useToast();
  const [amount, setAmount] = React.useState(String(currentAmount));
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setAmount(String(currentAmount));
    }
  }, [isOpen, currentAmount]);

  const handleUpdate = async () => {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({ title: "Please enter a valid amount", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await updateFeeStructure({
        standardName,
        feeCatId: categoryId,
        newAmount: numAmount,
      });
      toast({ title: "Structure updated successfully" });
      onSuccess();
      onOpenChange(false);
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Update failed",
        description: e.response?.data?.message || "Internal server error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] w-[calc(100vw-32px)] max-w-md rounded-2xl p-5 border border-slate-200/90 shadow-xl bg-white space-y-0">
        <DialogHeader className="pb-3">
          <div className="flex items-center gap-3 mb-1.5">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
              <Calculator className="h-5 w-5" />
            </div>
            <DialogTitle className="text-lg font-black text-slate-900 tracking-tight">Update Fee Amount</DialogTitle>
          </div>
          <DialogDescription className="text-xs font-medium text-slate-500 leading-relaxed">
            Modifying <span className="text-slate-900 font-bold">{categoryName}</span> for <span className="text-slate-900 font-bold">Standard {standardName}</span>. This change will sync across all sections.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="amount" className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">New Annual Amount</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-9 h-11 text-base font-bold border border-slate-200 focus:border-indigo-500 focus:ring-0 transition-all rounded-xl text-slate-900"
                autoFocus
              />
              <IndianRupee className="absolute left-3 top-3 h-5 w-5 text-slate-400 font-bold" />
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            className="w-full sm:w-auto h-11 font-bold text-slate-500 hover:bg-slate-100 rounded-xl text-xs"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="w-full sm:flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-all text-xs"
            onClick={handleUpdate}
            loading={loading}
          >
            {loading ? "Updating..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
