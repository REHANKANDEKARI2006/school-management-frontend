
"use client";

import * as React from "react";
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
    date: "2024-07-15",
  },
  {
    id: "2",
    name: "Photosynthesis Explained",
    subject: "Biology",
    class: "10-B",
    fileType: "DOCX",
    date: "2024-07-12",
  },
  {
    id: "3",
    name: "World War II Overview",
    subject: "History",
    class: "11-C",
    fileType: "PPTX",
    date: "2024-07-10",
  },
  {
    id: "4",
    name: "Shakespeare's Sonnets",
    subject: "English",
    class: "12-A",
    fileType: "PDF",
    date: "2024-07-08",
  },
  {
    id: "5",
    name: "Newton's Laws of Motion",
    subject: "Physics",
    class: "11-A",
    fileType: "VIDEO",
    date: "2024-07-05",
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
}

export default function MaterialsPage() {
  const { toast } = useToast();
  const { searchQuery } = useSearch();
  const [materials, setMaterials] = React.useState(initialMaterials);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedMaterial, setSelectedMaterial] = React.useState<Material | undefined>(undefined);

  const filteredMaterials = React.useMemo(() => {
    if (!searchQuery) {
      return materials;
    }
    return materials.filter(material =>
      material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.class.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.fileType.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, materials]);

  const handleFormSubmit = (materialData: Material) => {
    if (selectedMaterial) {
      // Update existing material
      setMaterials(materials.map(m => m.id === materialData.id ? materialData : m));
      toast({ title: "Material Updated", description: `${materialData.name} has been updated.` });
    } else {
      // Add new material
      const newMaterial = { ...materialData, id: (materials.length + 1).toString() };
      setMaterials([...materials, newMaterial]);
      toast({ title: "Material Uploaded", description: `${materialData.name} has been added.` });
    }
    setIsFormOpen(false);
    setSelectedMaterial(undefined);
  };

  const openEditDialog = (material: Material) => {
    setSelectedMaterial(material);
    setIsFormOpen(true);
  }

  const openNewDialog = () => {
    setSelectedMaterial(undefined);
    setIsFormOpen(true);
  }
  
  const handleDownload = (materialName: string) => {
    toast({
        title: "Downloading Material",
        description: `Your download for "${materialName}" has started.`
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="font-headline">Learning Materials</CardTitle>
              <CardDescription>Upload and distribute learning materials to students.</CardDescription>
            </div>
            <Button size="sm" className="gap-1 w-full sm:w-auto" onClick={openNewDialog}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Upload Material
              </span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material Name</TableHead>
                <TableHead className="hidden md:table-cell">Subject</TableHead>
                <TableHead className="hidden md:table-cell">Class</TableHead>
                <TableHead>File Type</TableHead>
                <TableHead className="hidden sm:table-cell">Date Uploaded</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaterials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell className="font-medium">
                    {material.name}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{material.subject}</TableCell>
                  <TableCell className="hidden md:table-cell">{material.class}</TableCell>
                  <TableCell>
                    <Badge variant={getFileTypeVariant(material.fileType)}>{material.fileType}</Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{material.date}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleDownload(material.name)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(material)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setMaterials(materials.filter(m => m.id !== material.id));
                          toast({ title: "Material Deleted", description: `${material.name} has been removed.` });
                        }}>Delete</DropdownMenuItem>
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
            <DialogTitle>{selectedMaterial ? "Edit Material" : "Upload New Material"}</DialogTitle>
            <DialogDescription>
              {selectedMaterial ? "Update the details of the material." : "Fill in the details to upload a new material."}
            </DialogDescription>
          </DialogHeader>
          <MaterialForm onSubmit={handleFormSubmit} material={selectedMaterial} />
        </DialogContent>
      </Dialog>
    </>
  );
}
