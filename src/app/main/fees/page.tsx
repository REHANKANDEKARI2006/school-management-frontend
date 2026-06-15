"use client";
import { PageSkeleton } from "@/components/ui/skeletons";
import { useFeedback } from "@/components/campus-connect/feedback-provider";

import * as React from "react";
import { useRouter } from "next/navigation";
import RouteGuard from "@/components/auth/RouteGuard";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useSearch } from "@/components/campus-connect/search-provider";
import { useToast } from "@/hooks/use-toast";

import {
  getFeeCategories,
  deleteFeeCategory,
  createFeeCategory,
  updateFeeCategory,
} from "@/lib/api/fees";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { FeeCategoryForm } from "@/components/campus-connect/fee-category-form";

import { ROLE, ADMIN_GROUP, RoleId } from "@/config/roles";

export default function FeesPage() {
  const router = useRouter();
  const { searchQuery } = useSearch();
  const { toast } = useToast();
  const { showWarning } = useFeedback();

  const roleId =
    typeof window !== "undefined"
      ? Number(localStorage.getItem("role_id"))
      : null;

  const canManage = roleId ? ([...ADMIN_GROUP, ROLE.CASHIER, ROLE.ACCOUNTANT] as RoleId[]).includes(roleId as RoleId) : false;

  const [categories, setCategories] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true); // Added loading state
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<any>(null);

  const loadFees = async () => {
    setLoading(true); // Set loading to true
    try {
      const data = await getFeeCategories();
      setCategories((data || []).map((c: any) => ({
        fee_category_id: c.fee_category_id,
        category_name: c.category_name,
        description: c.description,
        allow_installments: c.allow_installments,
      })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false); // Set loading to false
    }
  };

  React.useEffect(() => {
    loadFees();
  }, []);

  const filtered = categories.filter((f) => // Changed fees to categories
    f.category_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <RouteGuard allowedRoles={[...ADMIN_GROUP, ROLE.CASHIER, ROLE.ACCOUNTANT]}>
      {loading ? ( // Conditional rendering for skeleton
        <PageSkeleton />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Fees</CardTitle>
                <CardDescription>Manage fee categories</CardDescription>
              </div>

              {/* ✅ ACTION BUTTONS */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="flex-1 sm:flex-none"
                  onClick={() => router.push("/main/fees/structures")}
                >
                  Manage Structures
                </Button>

                <Button
                  variant="outline"
                  className="flex-1 sm:flex-none"
                  onClick={() => router.push("/main/fees/collection")}
                >
                  Fee Collection
                </Button>

                <Button
                  className="w-full sm:w-auto mt-2 sm:mt-0"
                  onClick={() => {
                    setEditing(null);
                    setOpen(true);
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Fee
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto w-full">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Name</TableHead>
                    <TableHead className="min-w-[200px]">Description</TableHead>
                    <TableHead className="w-[120px]">Installments</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>

              <TableBody>
                {filtered.map((fee) => (
                  <TableRow key={fee.fee_category_id}>
                    <TableCell>{fee.category_name}</TableCell>
                    <TableCell>{fee.description}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          fee.allow_installments ? "active" : "cancelled"
                        }
                      >
                        {fee.allow_installments
                          ? "Allowed"
                          : "Not Allowed"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-slate-100">
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditing(fee);
                              setOpen(true);
                            }}
                          >
                            Edit
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            onClick={async () => {
                              showWarning(
                                `Delete "${fee.category_name}"?`,
                                "This fee category may be linked to fee structures. Deleting it is permanent.",
                                async () => {
                                  try {
                                    await deleteFeeCategory(fee.fee_category_id);
                                    toast({ title: "Category Deleted", variant: "destructive" });
                                    loadFees();
                                  } catch (e: any) {
                                    toast({
                                      title: "Cannot Delete",
                                      description: e.response?.data?.message || "Category might be linked to a fee structure.",
                                      variant: "destructive"
                                    });
                                  }
                                },
                                "Yes, Delete"
                              );
                            }}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ✅ ADD / EDIT DIALOG */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Fee Category" : "Add Fee Category"}
            </DialogTitle>
          </DialogHeader>

          <FeeCategoryForm
            key={editing ? editing.fee_category_id : 'new'}
            category={
              editing
                ? {
                  id: editing.fee_category_id,
                  name: editing.category_name,
                  description: editing.description,
                  allowInstallments: editing.allow_installments,
                }
                : undefined
            }
            onSubmit={async (data: any) => {
              try {
                if (editing) {
                  await updateFeeCategory(editing.fee_category_id, {
                    category_name: data.name,
                    description: data.description,
                    allow_installments: data.allowInstallments,
                    is_active: true,
                  });
                } else {
                  await createFeeCategory({
                    category_name: data.name,
                    description: data.description,
                    allow_installments: data.allowInstallments,
                  });
                }
                toast({ title: "Saved Successfully", variant: "success" });
                setOpen(false);
                setEditing(null);
                loadFees();
              } catch (e: any) {
                toast({
                  title: "Failed to save category",
                  description: e.response?.data?.message || "An error occurred.",
                  variant: "destructive"
                });
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </RouteGuard>
  );
}
