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
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface ClassWithFeeStructures {
  id: string;
  name: string;
  structures: any[];
  totalAmount: number;
}

export default function FeeStructuresPage() {
  const { toast } = useToast();
  const router = useRouter();

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
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {structuresByClass.map((cls) => (
            <Card key={cls.id} className="flex flex-col">
              <CardHeader className="bg-muted/30 border-b pb-4">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">{cls.name}</CardTitle>
                    <Badge variant="secondary">
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
                                  <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover/row:opacity-100 transition-opacity self-end sm:self-auto">
                                      <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-8 w-8 sm:h-6 sm:w-6 text-muted-foreground hover:text-primary"
                                          onClick={() => handleEditAmount(cls.id, s.categoryName, s.fee_cat_id, s.amount)}
                                      >
                                          <Edit className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                                      </Button>
                                      <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-8 w-8 sm:h-6 sm:w-6 text-muted-foreground hover:text-destructive"
                                          onClick={() => handleDelete(cls.id, s.fee_cat_id)}
                                      >
                                          <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
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
                    <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </div>
              </CardFooter>
            </Card>
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
