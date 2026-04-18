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
      <DialogContent className="sm:max-w-[400px] border-none shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Calculator className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl font-black text-blue-900 tracking-tight">Update Fee Amount</DialogTitle>
          </div>
          <DialogDescription className="text-sm font-medium text-gray-500">
            Modifying <span className="text-blue-600 font-bold">{categoryName}</span> for <span className="text-blue-600 font-bold">Standard {standardName}</span>. This change will sync across all sections.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-xs font-bold text-gray-400 uppercase tracking-widest">New Annual Amount</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-9 h-14 text-xl font-black border-2 border-gray-100 focus:border-blue-500 focus:ring-0 transition-all rounded-xl"
                autoFocus
              />
              <IndianRupee className="absolute left-3 top-4 h-6 w-6 text-blue-400 font-bold" />
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-start gap-2">
          <Button
            type="button"
            className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100 transition-all active:scale-95"
            onClick={handleUpdate}
            loading={loading}
          >
            {loading ? "Updating..." : "Save Changes"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-12 font-bold text-gray-500 rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
