
"use client";

import * as React from "react";
import { MoreHorizontal, PlusCircle, CheckCircle, XCircle, FilePlus, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useSearch } from "@/components/campus-connect/search-provider";
import { FeeCategoryForm, type FeeCategory } from "@/components/campus-connect/fee-category-form";
import { getFeeCategories } from "@/lib/mock-data";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export default function FeesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { searchQuery } = useSearch();
  const [feeCategories, setFeeCategories] = React.useState<FeeCategory[]>(getFeeCategories());
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<FeeCategory | undefined>(undefined);

  const filteredCategories = React.useMemo(() => {
    if (!searchQuery) {
      return feeCategories;
    }
    return feeCategories.filter(category =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, feeCategories]);

  const handleFormSubmit = (categoryData: FeeCategory) => {
    if (selectedCategory) {
      setFeeCategories(feeCategories.map(c => c.id === categoryData.id ? { ...c, ...categoryData } : c));
      toast({ title: "Fee Category Updated", description: `${categoryData.name} has been updated.` });
    } else {
      const newCategory = {
         ...categoryData,
         id: (feeCategories.length + 1).toString(),
      };
      setFeeCategories([...feeCategories, newCategory]);
      toast({ title: "Fee Category Created", description: `${categoryData.name} has been added.` });
    }
    setIsFormOpen(false);
    setSelectedCategory(undefined);
  };

  const openEditDialog = (category: FeeCategory) => {
    setSelectedCategory(category);
    setIsFormOpen(true);
  }

  const openNewDialog = () => {
    setSelectedCategory(undefined);
    setIsFormOpen(true);
  }
  
  const handleDelete = (category: FeeCategory) => {
      setFeeCategories(feeCategories.filter(c => c.id !== category.id));
      toast({ title: "Fee Category Deleted", description: `${category.name} has been removed.` });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                  <CardTitle className="font-headline">Fee Categories</CardTitle>
                  <CardDescription>Manage different types of fees for the school.</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                 <Button size="sm" variant="outline" className="gap-1" onClick={() => router.push('/dashboard/fees/structures')}>
                    <Layers className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Manage Structures
                    </span>
                </Button>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => router.push('/dashboard/fees/collection')}>
                    <FilePlus className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Fee Collection
                    </span>
                </Button>
                <Button size="sm" className="gap-1" onClick={openNewDialog}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Add Category
                    </span>
                </Button>
              </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category Name</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead className="text-center">Installments</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">
                    {category.name}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{category.description}</TableCell>
                  <TableCell className="text-center">
                    {category.allowInstallments ? (
                        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="mr-1 h-3 w-3"/>
                            Allowed
                        </Badge>
                    ) : (
                        <Badge variant="secondary">
                            <XCircle className="mr-1 h-3 w-3"/>
                            Not Allowed
                        </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => openEditDialog(category)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(category)}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedCategory ? "Edit Fee Category" : "Create New Fee Category"}</DialogTitle>
            <DialogDescription>
              {selectedCategory ? "Update the details of the fee category." : "Fill in the details to create a new fee category."}
            </DialogDescription>
          </DialogHeader>
          <FeeCategoryForm onSubmit={handleFormSubmit} category={selectedCategory} />
        </DialogContent>
      </Dialog>
    </>
  );
}
