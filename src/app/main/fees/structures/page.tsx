"use client";

import * as React from "react";
import { PlusCircle, Download } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";

import { getFeeStructures } from "@/lib/api/fees";
import { getFeeCategories } from "@/lib/api/fees";
import { getClasses } from "@/lib/api/classes";

import type { FeeStructure, ClassItem } from "@/types";
import type { FeeCategory } from "@/components/campus-connect/fee-category-form";
import { FeeStructureForm } from "@/components/campus-connect/fee-structure-form";

interface ClassWithFeeStructures extends ClassItem {
  structures: (FeeStructure & { categoryName: string })[];
  totalAmount: number;
}

export default function FeeStructuresPage() {
  const { toast } = useToast();

  const [feeStructures, setFeeStructures] = React.useState<any[]>([]);
  const [feeCategories, setFeeCategories] = React.useState<FeeCategory[]>([]);
  const [classes, setClasses] = React.useState<ClassItem[]>([]);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

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
      toast({ title: "Failed to load fee structures data", variant: "destructive" });
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const getCategoryName = (id: number) => {
    // The API returns the database rows which have fee_category_id and category_name
    const category = (feeCategories as any[]).find((c) => c.fee_category_id === id);
    return category?.category_name || "Unknown";
  };

  const handleFormSubmit = async (payload: any) => {
    toast({
      title: "Fee Structure Created",
      description: "Structure saved successfully",
    });
    setIsFormOpen(false);
    loadData();
  };

  const structuresByClass: ClassWithFeeStructures[] = classes
    .map((cls: any) => {
      const structuresForClass = feeStructures
        .filter((s: any) => s.class_id === cls.class_id)
        .map((s: any) => ({
          ...s,
          id: s.fee_struct_id,
          classId: s.class_id,
          feeCategoryId: s.fee_cat_id,
          amount: Number(s.amount),
          categoryName: getCategoryName(s.fee_cat_id),
        }));

      return {
        id: cls.class_id,
        name: cls.class_name,
        subjectIds: [],
        structures: structuresForClass,
        totalAmount: structuresForClass.reduce((a, b) => a + b.amount, 0),
      };
    })
    .filter((c) => c.structures.length > 0);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>Fee Structures</CardTitle>
            <CardDescription>
              Map fee categories to classes
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Structure
          </Button>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {structuresByClass.map((cls) => (
          <Card key={cls.id}>
            <CardHeader>
              <CardTitle>{cls.name}</CardTitle>
              <CardDescription>Fee breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cls.structures.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.categoryName}</TableCell>
                      <TableCell className="text-right">
                        ₹{s.amount}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between">
              <strong>Total: ₹{cls.totalAmount}</strong>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Fee Structure</DialogTitle>
            <DialogDescription>
              Assign fee category to class
            </DialogDescription>
          </DialogHeader>
          <FeeStructureForm onSubmit={handleFormSubmit} />
        </DialogContent>
      </Dialog>
    </>
  );
}
