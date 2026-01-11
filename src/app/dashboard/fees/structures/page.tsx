
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
  CardFooter
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
import { getFeeStructures, getFeeCategories, getClasses } from "@/lib/mock-data";
import type { FeeStructure, ClassItem } from "@/types";
import type { FeeCategory } from "@/components/campus-connect/fee-category-form";
import { FeeStructureForm } from "@/components/campus-connect/fee-structure-form";

interface ClassWithFeeStructures extends ClassItem {
    structures: (FeeStructure & { categoryName: string })[];
    totalAmount: number;
}


export default function FeeStructuresPage() {
  const { toast } = useToast();
  const [feeStructures, setFeeStructures] = React.useState<FeeStructure[]>(getFeeStructures());
  const [feeCategories] = React.useState<FeeCategory[]>(getFeeCategories());
  const [classes] = React.useState<ClassItem[]>(getClasses());
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedStructure, setSelectedStructure] = React.useState<FeeStructure | undefined>(undefined);

  const getCategoryName = (id: string) => feeCategories.find(c => c.id === id)?.name || "Unknown";

  const handleFormSubmit = (structureData: FeeStructure) => {
    let updatedStructures;
    if (selectedStructure) {
      // Update existing structure
      updatedStructures = feeStructures.map(s => s.id === structureData.id ? { ...s, ...structureData } : s);
      toast({ title: "Fee Structure Updated", description: "The fee structure has been updated." });
    } else {
      // Add new structure
      const newStructure = {
         ...structureData,
         id: `fs${feeStructures.length + 1}`,
      };
      updatedStructures = [...feeStructures, newStructure];
      toast({ title: "Fee Structure Created", description: "A new fee structure has been added." });
    }
    setFeeStructures(updatedStructures);
    // Note: In a real app, you would persist this to a DB. Here we simulate it.
    // For this demo, we can't easily update localStorage from here as it's not a direct user interaction.
    setIsFormOpen(false);
    setSelectedStructure(undefined);
  };

  const openNewDialog = () => {
    setSelectedStructure(undefined);
    setIsFormOpen(true);
  }
  
  const handleDownload = (className: string) => {
      toast({
          title: "Preparing Download",
          description: `Generating fee structure summary for ${className}.`
      })
  }

  const structuresByClass: ClassWithFeeStructures[] = classes.map(cls => {
      const structuresForClass = feeStructures
          .filter(s => s.classId === cls.id)
          .map(s => ({
              ...s,
              categoryName: getCategoryName(s.feeCategoryId),
          }));
      const totalAmount = structuresForClass.reduce((acc, s) => acc + s.amount, 0);
      return {
          ...cls,
          structures: structuresForClass,
          totalAmount: totalAmount,
      };
  }).filter(c => c.structures.length > 0);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-headline">Fee Structures</CardTitle>
              <CardDescription>Map fee categories to classes and define amounts.</CardDescription>
            </div>
            <Button size="sm" className="gap-1" onClick={openNewDialog}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Add New Structure
              </span>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {structuresByClass.map((classData) => (
             <Card key={classData.id}>
                <CardHeader>
                    <CardTitle>{classData.name}</CardTitle>
                    <CardDescription>Fee breakdown for this class.</CardDescription>
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
                            {classData.structures.map(structure => (
                                <TableRow key={structure.id}>
                                    <TableCell className="font-medium">{structure.categoryName}</TableCell>
                                    <TableCell className="text-right">${structure.amount.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter className="flex-col items-start gap-4">
                     <div className="font-bold text-lg self-end">
                        Total: ${classData.totalAmount.toFixed(2)}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(classData.name)}>
                        <Download className="mr-2 h-4 w-4" />
                        Download Structure
                    </Button>
                </CardFooter>
             </Card>
        ))}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedStructure ? "Edit Fee Structure" : "Create New Fee Structure"}</DialogTitle>
            <DialogDescription>
              {selectedStructure ? "Update the details of the fee structure." : "Fill in the details to create a new fee structure."}
            </DialogDescription>
          </DialogHeader>
          <FeeStructureForm onSubmit={handleFormSubmit} structure={selectedStructure} />
        </DialogContent>
      </Dialog>
    </>
  );
}
