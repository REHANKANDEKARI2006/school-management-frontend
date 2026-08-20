"use client";

import { PageSkeleton } from "@/components/ui/skeletons";
import * as React from "react";
import { PlusCircle, Download, BookOpen, Calculator, Calendar, Layers, Edit, Trash2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getFeeStructures, getFeeCategories, deleteFeeStructure, updateFeeStructure } from "@/lib/api/fees";
import { getClasses } from "@/lib/api/classes";
import type { ClassItem } from "@/types";
import { FeeStructureForm } from "@/components/school-os/fee-structure-form";
import { UpdateFeeAmountDialog } from "@/components/school-os/update-fee-amount-dialog";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { useFeedback } from "@/components/school-os/feedback-provider";

interface ClassWithFeeStructures {
  id: string;
  name: string;
  structures: any[];
  totalAmount: number;
}

export default function FeeStructuresPage() {
  const { toast } = useToast();
  const { showWarning } = useFeedback();
  const router = useRouter();

  const [feeStructures, setFeeStructures] = React.useState<any[]>([]);
  const [feeCategories, setFeeCategories] = React.useState<any[]>([]);
  const [classes, setClasses] = React.useState<ClassItem[]>([]);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [selectedMobileStandard, setSelectedMobileStandard] = React.useState<string>("all");

  // Edit State
  const [editDialog, setEditDialog] = React.useState<{
    isOpen: boolean;
    standardName: string;
    categoryName: string;
    categoryId: number;
    amount: number;
  }>({
    isOpen: false,
    standardName: "",
    categoryName: "",
    categoryId: 0,
    amount: 0,
  });

  const loadData = async () => {
    try {
      const [structures, categories, classList] = await Promise.all([
        getFeeStructures(),
        getFeeCategories(),
        getClasses(),
      ]);

      setFeeStructures(structures || []);
      setFeeCategories(categories || []);
      setClasses(classList || []);
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to load fee structures", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const getCategoryName = (id: number) => {
    const category = feeCategories.find((c) => c.fee_category_id === id);
    return category?.category_name || "Unknown";
  };

  const [selectedEditStandard, setSelectedEditStandard] = React.useState<string | null>(null);

  const handleOpenCreateForm = (stdId?: string) => {
    setSelectedEditStandard(stdId || null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async () => {
    toast({ title: "Fee Structure Updated" });
    setIsFormOpen(false);
    setSelectedEditStandard(null);
    loadData();
  };

  const handleDelete = (standardName: string, feeCatId: number) => {
    showWarning(
      `Remove category from Standard ${standardName}?`,
      "This action cannot be undone. The category will be removed from this fee structure.",
      async () => {
        try {
          await deleteFeeStructure(standardName, feeCatId);
          toast({ title: "Category removed from structure" });
          loadData();
        } catch (e) {
          console.error(e);
          toast({ title: "Failed to delete", variant: "destructive" });
        }
      },
      "Yes, Remove"
    );
  };

  const handleEditAmount = (standardName: string, categoryName: string, feeCatId: number, currentAmount: number) => {
    setEditDialog({
        isOpen: true,
        standardName,
        categoryName,
        categoryId: feeCatId,
        amount: currentAmount,
    });
  };

  const structuresByStandardMap = new Map<string, ClassWithFeeStructures>();

  classes.forEach((cls: any) => {
    const stdName = cls.class_name;
    const structuresForClass = feeStructures
      .filter((s: any) => s.class_id === cls.class_id)
      .map((s: any) => ({
        ...s,
        categoryName: getCategoryName(s.fee_cat_id),
      }));

    if (structuresForClass.length > 0) {
      if (!structuresByStandardMap.has(stdName)) {
        structuresByStandardMap.set(stdName, {
          id: stdName,
          name: `Standard ${stdName}`,
          structures: [],
          totalAmount: 0,
        });
      }

      const standardEntry = structuresByStandardMap.get(stdName)!;
      structuresForClass.forEach(newStruct => {
        const alreadyExists = standardEntry.structures.find(s => s.fee_cat_id === newStruct.fee_cat_id);
        if (!alreadyExists) {
          standardEntry.structures.push(newStruct);
          standardEntry.totalAmount += Number(newStruct.amount);
        }
      });
    }
  });

  const structuresByClass = Array.from(structuresByStandardMap.values());

  if (loading) return <PageSkeleton rows={5} />;

  return (
    <div className="space-y-4 sm:space-y-6 pb-2 sm:pb-8">
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
              <CardTitle>Fee Structures</CardTitle>
              <CardDescription>Configuration & Class Structures</CardDescription>
            </div>
            
            <Button onClick={() => setIsFormOpen(true)} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Structure
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Mobile Header & Action (Strictly sm:hidden) */}
      <div className="sm:hidden w-full flex flex-col gap-3">
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
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Fee Structures</h1>
          <p className="text-xs font-medium text-slate-500">Configuration & Class Structures</p>
        </div>

        {/* Mobile Primary Action Button */}
        <Button
          onClick={() => setIsFormOpen(true)}
          className="w-full flex items-center justify-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Create Structure</span>
        </Button>
      </div>

      {/* Desktop Grid Layout (100% Untouched for Desktop) */}
      <div className="hidden sm:grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {structuresByClass.map((cls) => (
            <Card key={cls.id} className="flex flex-col border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
              <CardHeader className="bg-muted/30 border-b pb-4">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-bold text-slate-900">{cls.name}</CardTitle>
                    <Badge variant="secondary" className="font-semibold">
                        {cls.structures.length} Components
                    </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-grow">
                <div className="overflow-x-auto w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fee Category</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cls.structures.map((s) => (
                        <TableRow key={s.fee_struct_id}>
                          <TableCell className="font-medium p-3 sm:p-4">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between group/row gap-2 sm:gap-0">
                                  <span className="truncate max-w-[200px] whitespace-normal sm:whitespace-nowrap">{s.categoryName}</span>
                                  <div className="flex items-center gap-1 self-end sm:self-auto">
                                      <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-8 w-8 sm:h-7 sm:w-7 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                          onClick={() => handleEditAmount(cls.id, s.categoryName, s.fee_cat_id, s.amount)}
                                          title="Edit Amount"
                                      >
                                          <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-8 w-8 sm:h-7 sm:w-7 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                          onClick={() => handleDelete(cls.id, s.fee_cat_id)}
                                          title="Remove Category"
                                      >
                                          <Trash2 className="h-4 w-4" />
                                      </Button>
                                  </div>
                              </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₹{Number(s.amount).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center bg-muted/20 py-4 border-t mt-auto">
                <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground font-medium">Total Annual Fee</span>
                    <strong className="text-xl">₹{cls.totalAmount.toLocaleString()}</strong>
                </div>
                <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 transition-colors"
                      onClick={() => handleOpenCreateForm(cls.id)}
                    >
                      <PlusCircle className="mr-1.5 h-4 w-4 text-blue-600" />
                      Edit / Add Category
                    </Button>
                </div>
              </CardFooter>
            </Card>
        ))}
      </div>

      {/* Polished Native Mobile Layout (Strictly sm:hidden) */}
      <div className="sm:hidden w-full flex flex-col gap-3.5">
        {/* Mobile Standard Filter Dropdown */}
        <div className="w-full bg-white rounded-2xl px-3.5 py-2.5 border border-slate-200/80 shadow-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
            <Filter className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
            <span>Filter Standard:</span>
          </div>
          <select
            value={selectedMobileStandard}
            onChange={(e) => setSelectedMobileStandard(e.target.value)}
            className="h-8 rounded-xl border border-slate-200 bg-slate-50/90 px-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer text-center w-auto min-w-[120px]"
          >
            <option value="all">All Standards ({structuresByClass.length})</option>
            {structuresByClass.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        {/* Mobile Stacked Cards */}
        {structuresByClass
          .filter((cls) => selectedMobileStandard === "all" || cls.id === selectedMobileStandard)
          .map((cls) => (
            <div
              key={cls.id}
              className="w-full bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col gap-3"
            >
              {/* Standard Section Header Row */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h2 className="text-base font-black text-slate-900 tracking-tight">{cls.name}</h2>
                <Badge variant="secondary" className="font-bold text-[11px] px-2.5 py-0.5 rounded-xl">
                  {cls.structures.length} Components
                </Badge>
              </div>

              {/* Fee Category List Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  <span>Fee Category</span>
                  <span>Amount & Actions</span>
                </div>

                {cls.structures.map((s) => (
                  <div
                    key={s.fee_struct_id}
                    className="py-2 px-3 rounded-xl border border-slate-100 bg-slate-50/40 flex items-center justify-between gap-2"
                  >
                    <span className="text-xs font-bold text-slate-800 break-words flex-1">
                      {s.categoryName}
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-black text-slate-900 mr-1">
                        ₹{Number(s.amount).toLocaleString()}
                      </span>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 min-w-[32px] rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 active:scale-95 transition-all"
                        onClick={() => handleEditAmount(cls.id, s.categoryName, s.fee_cat_id, s.amount)}
                        title="Edit Amount"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 min-w-[32px] rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 active:scale-95 transition-all"
                        onClick={() => handleDelete(cls.id, s.fee_cat_id)}
                        title="Remove Category"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Annual Fee & Add/Edit Category Row */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Annual Fee</span>
                  <strong className="text-base font-black text-slate-900">₹{cls.totalAmount.toLocaleString()}</strong>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 rounded-xl border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100/50 text-xs font-bold active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
                  onClick={() => handleOpenCreateForm(cls.id)}
                >
                  <PlusCircle className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <span>Edit / Add</span>
                </Button>
              </div>
            </div>
          ))}
      </div>

      <Dialog open={isFormOpen} onOpenChange={(open) => {
        setIsFormOpen(open);
        if (!open) setSelectedEditStandard(null);
      }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] w-[calc(100vw-32px)] max-w-lg rounded-2xl overflow-y-auto p-5 border border-slate-200/90 shadow-xl bg-white space-y-0">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">
              {selectedEditStandard ? `Edit Structure: Standard ${selectedEditStandard}` : "Define Fee Structure"}
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-slate-500 leading-relaxed">
              {selectedEditStandard 
                ? `Add new fee categories or update fee components for Standard ${selectedEditStandard}.`
                : "Create a new mapping between a fee category and an academic standard. This will apply to all students in that standard."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="pt-2">
            <FeeStructureForm initialStandard={selectedEditStandard || undefined} onSubmit={handleFormSubmit} />
          </div>
        </DialogContent>
      </Dialog>

      <UpdateFeeAmountDialog 
        isOpen={editDialog.isOpen}
        onOpenChange={(open) => setEditDialog(prev => ({ ...prev, isOpen: open }))}
        standardName={editDialog.standardName}
        categoryName={editDialog.categoryName}
        categoryId={editDialog.categoryId}
        currentAmount={editDialog.amount}
        onSuccess={loadData}
      />
    </div>
  );
}
