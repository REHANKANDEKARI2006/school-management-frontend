"use client";
import { PageSkeleton } from "@/components/ui/skeletons";

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
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Fees</CardTitle>
                <CardDescription>Manage fee categories</CardDescription>
              </div>

              {/* ✅ ACTION BUTTONS */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/main/fees/structures")}
                >
                  Manage Structures
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/main/fees/collection")}
                >
                  Fee Collection
                </Button>

                <Button
                  size="sm"
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Installments</TableHead>
                  <TableHead />
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
                          fee.allow_installments ? "default" : "secondary"
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
                          <Button size="icon" variant="ghost">
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
                            className="text-red-600"
                            onClick={async () => {
                              if (!confirm("Delete this category?")) return;
                              try {
                                await deleteFeeCategory(fee.fee_category_id);
                                toast({ title: "Category deleted" });
                                loadFees();
                              } catch (e: any) {
                                toast({
                                  title: "Cannot delete category",
                                  description: e.response?.data?.message || "Category might be linked to a fee structure.",
                                  variant: "destructive"
                                });
                              }
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
                toast({ title: "Saved successfully" });
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
