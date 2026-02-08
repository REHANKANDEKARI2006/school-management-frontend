"use client";

import * as React from "react";
import RouteGuard from "@/components/auth/RouteGuard";

import { MoreHorizontal, PlusCircle, Download } from "lucide-react";
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
import { MaterialForm, type Material } from "@/components/campus-connect/material-form";
import { Badge } from "@/components/ui/badge";
import { useSearch } from "@/components/campus-connect/search-provider";

const initialMaterials: Material[] = [
  {
    id: "1",
    name: "Introduction to Algebra",
    subject: "Mathematics",
    class: "9-A",
    fileType: "PDF",
    date: new Date("2024-07-15"),
  },
];

const getFileTypeVariant = (fileType: string) => {
  switch (fileType) {
    case "PDF": return "destructive";
    case "DOCX": return "default";
    case "PPTX": return "secondary";
    case "VIDEO": return "outline";
    default: return "secondary";
  }
};

export default function MaterialsPage() {
  const { toast } = useToast();
  const { searchQuery } = useSearch();

  const [materials, setMaterials] = React.useState(initialMaterials);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedMaterial, setSelectedMaterial] = React.useState<Material | undefined>();

  const filteredMaterials = React.useMemo(() => {
    if (!searchQuery) return materials;
    return materials.filter(m =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, materials]);

  return (
    <RouteGuard allowedRoles={[1, 2]}>
      <>
        <Card>
          <CardHeader>
            <div className="flex justify-between">
              <div>
                <CardTitle>Materials</CardTitle>
                <CardDescription>Study materials</CardDescription>
              </div>
              <Button onClick={() => setIsFormOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Upload
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredMaterials.map(material => (
                  <TableRow key={material.id}>
                    <TableCell>{material.name}</TableCell>
                    <TableCell>
                      <Badge variant={getFileTypeVariant(material.fileType)}>
                        {material.fileType}
                      </Badge>
                    </TableCell>
                    <TableCell>{String(material.date)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => toast({ title: "Downloading..." })}>
                            <Download className="mr-2 h-4 w-4" /> Download
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setMaterials(materials.filter(m => m.id !== material.id))}>
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

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Material</DialogTitle>
              <DialogDescription>Add study material</DialogDescription>
            </DialogHeader>
            <MaterialForm onSubmit={() => setIsFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </>
    </RouteGuard>
  );
}
