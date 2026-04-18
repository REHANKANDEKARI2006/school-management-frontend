"use client";

import { PageSkeleton } from "@/components/ui/skeletons";
import * as React from "react";
import { PlusCircle, Download, BookOpen, Calculator, Calendar, Layers, Edit, Trash2 } from "lucide-react";
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
import { FeeStructureForm } from "@/components/campus-connect/fee-structure-form";
import { UpdateFeeAmountDialog } from "@/components/campus-connect/update-fee-amount-dialog";
import { motion } from "framer-motion";

interface ClassWithFeeStructures {
  id: string;
  name: string;
  structures: any[];
  totalAmount: number;
}

export default function FeeStructuresPage() {
  const { toast } = useToast();

  const [feeStructures, setFeeStructures] = React.useState<any[]>([]);
  const [feeCategories, setFeeCategories] = React.useState<any[]>([]);
  const [classes, setClasses] = React.useState<ClassItem[]>([]);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

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

  const handleFormSubmit = async () => {
    toast({ title: "Fee Structure Updated" });
    setIsFormOpen(false);
    loadData();
  };

  const handleDelete = async (standardName: string, feeCatId: number) => {
    if (!confirm(`Are you sure you want to remove this category from Standard ${standardName}?`)) return;
    try {
        await deleteFeeStructure(standardName, feeCatId);
        toast({ title: "Category removed from structure" });
        loadData();
    } catch (e) {
        console.error(e);
        toast({ title: "Failed to delete", variant: "destructive" });
    }
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
    <div className="space-y-8 pb-10">
      <Card className="border-none shadow-sm bg-blue-50/50">
        <CardContent className="flex flex-col md:flex-row justify-between items-center py-8 gap-6">
          <div className="flex items-center gap-5">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-blue-200 shadow-xl">
                <Layers className="h-8 w-8" />
            </div>
            <div className="space-y-1">
                <CardTitle className="text-3xl font-black tracking-tight text-blue-900 line-clamp-1">Fee Management</CardTitle>
                <CardDescription className="text-blue-600 text-sm font-semibold opacity-80 uppercase tracking-widest flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" /> Configuration & Structures
                </CardDescription>
            </div>
          </div>
          <Button 
            className="bg-blue-600 text-white hover:bg-blue-700 font-bold px-8 py-6 shadow-xl shadow-blue-100 transition-all hover:translate-y-[-2px] group"
            onClick={() => setIsFormOpen(true)}
          >
            <PlusCircle className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
            Create New Structure
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {structuresByClass.map((cls, idx) => (
          <motion.div
            key={cls.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: idx * 0.1 }}
          >
            <Card className="border-2 border-gray-100 hover:border-blue-200 transition-all shadow-md group">
              <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 text-white rounded-lg group-hover:rotate-12 transition-transform">
                            <BookOpen className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-xl font-bold">{cls.name}</CardTitle>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none px-3 font-mono">
                        {cls.structures.length} Components
                    </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="font-bold text-gray-700 uppercase text-[10px] tracking-widest px-4">Fee Category</TableHead>
                      <TableHead className="text-right font-bold text-gray-700 uppercase text-[10px] tracking-widest px-4">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cls.structures.map((s) => (
                      <TableRow key={s.fee_struct_id} className="hover:bg-blue-50/30 transition-colors">
                        <TableCell className="font-medium text-gray-800 py-4 px-4">
                            <div className="flex items-center justify-between group/row">
                                <span>{s.categoryName}</span>
                                <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                        onClick={() => handleEditAmount(cls.id, s.categoryName, s.fee_cat_id, s.amount)}
                                    >
                                        <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => handleDelete(cls.id, s.fee_cat_id)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell className="text-right font-bold text-indigo-600 py-4 px-4">
                          ₹{Number(s.amount).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="flex justify-between items-center bg-indigo-50/50 py-5 rounded-b-xl border-t border-indigo-100">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Total Annual Fee</span>
                    <strong className="text-2xl font-black text-indigo-900">₹{cls.totalAmount.toLocaleString()}</strong>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="text-indigo-600 hover:bg-white hover:text-indigo-800">
                        <Calendar className="mr-2 h-4 w-4" />
                        Due Dates
                    </Button>
                    <Button variant="outline" size="sm" className="border-indigo-200 text-indigo-700 hover:bg-white shadow-sm font-bold">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Define Fee Structure</DialogTitle>
            <DialogDescription className="text-sm font-medium">
              Create a new mapping between a fee category and an academic standard. This will apply to all students in that standard.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
              <FeeStructureForm onSubmit={handleFormSubmit} />
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
