"use client";

import * as React from "react";
import { useEffect, useState, useMemo } from "react";
import RouteGuard from "@/components/auth/RouteGuard";
import axios from "@/lib/axios";
import { PageSkeleton } from "@/components/ui/skeletons";
import { format } from "date-fns";

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
    subject_id: "1",
    class_id: "1",
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

import { ROLE, RoleId, ADMIN_GROUP } from "@/config/roles";

export default function MaterialsPage() {
  const { toast } = useToast();
  const { searchQuery } = useSearch();

  const roleId =
    typeof window !== "undefined"
      ? Number(localStorage.getItem("role_id"))
      : null;
  const isStudent = roleId === ROLE.STUDENT;
  const studentClassId = typeof window !== "undefined" ? localStorage.getItem("class_id") : null;

  const [materials, setMaterials] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const fetchMaterials = async () => {
    try {
      const url = isStudent && studentClassId ? `/api/materials?class_id=${studentClassId}` : "/api/materials";
      const res = await axios.get(url);
      if (res.data.success) {
        setMaterials(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch materials", error);
      toast({ title: "Error", description: "Failed to load materials", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [isStudent, studentClassId]);

  const handleCreateMaterial = async (data: any) => {
    try {
      const res = await axios.post('/api/materials', data);
      if (res.data.success) {
        toast({ title: "Success", description: "Material uploaded successfully" });
        setIsFormOpen(false);
        fetchMaterials();
      }
    } catch (error) {
      console.error("Failed to create material", error);
      toast({ title: "Error", description: "Failed to save material", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setDeletingId(id);
      const res = await axios.delete(`/api/materials/${id}`);
      if (res.data.success) {
        toast({ title: "Success", description: "Material deleted successfully" });
        fetchMaterials();
      }
    } catch (error) {
      console.error("Failed to delete material", error);
      toast({ title: "Error", description: "Failed to delete material", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (material: any) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || '';

      const res = await axios.get(`/api/materials/download/${material.material_id}`, {
        responseType: 'arraybuffer', // Using arraybuffer enables parsing JSON or Blob manually based on header
        headers: {
          Authorization: 'Bearer ' + token
        }
      });

      const contentType = res.headers['content-type'];

      // 1. Backend returned JSON (either Google drive link or Error)
      if (contentType && contentType.includes('application/json')) {
        const jsonStr = new TextDecoder('utf-8').decode(res.data);
        const jsonData = JSON.parse(jsonStr);

        if (jsonData.isExternal && jsonData.url) {
          window.open(jsonData.url, "_blank");
          toast({ title: "Success", description: "Opening External Link" });
          return;
        }

        if (!jsonData.success) {
          throw new Error(jsonData.message || "Failed to download");
        }
      }

      // 2. Backend returned a Steam (Cloudinary File)
      // Get filename from content-disposition header or fallback
      const contentDisposition = res.headers['content-disposition'];
      let filename = material.file_path.split('/').pop() || 'downloaded_file';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      }

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);

      toast({ title: "Success", description: "Download successful" });
    } catch (error: any) {
      console.error("Failed to download material detail:", error);
      let errorMessage = "Failed to download material";

      // If Axios threw a specific Network or HTTP Error
      if (error.response?.data) {
        try {
          if (error.response.data instanceof Blob) {
            const text = await error.response.data.text();
            const json = JSON.parse(text);
            errorMessage = json.message || errorMessage;
            console.error("Server returned Blob error:", json);
          } else {
            // If response type was arraybuffer, decode it back to string
            const text = new TextDecoder('utf-8').decode(error.response.data);
            const json = JSON.parse(text);
            errorMessage = json.message || errorMessage;
            console.error("Server returned Error:", json);
          }
        } catch (e) {
          console.error("Failed to parse arraybuffer or blob error", e);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredMaterials = useMemo(() => {
    if (!searchQuery) return materials;
    return materials.filter(m =>
      m.material_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subject_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.class_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, materials]);

  return (
    <RouteGuard allowedRoles={[...ADMIN_GROUP, ROLE.TEACHER, ROLE.CLASS_TEACHER, ROLE.STUDENT]}>
      <>
        <Card>
          <CardHeader>
            <div className="flex justify-between">
              <div>
                <CardTitle>Materials</CardTitle>
                <CardDescription>Study materials</CardDescription>
              </div>
              {!isStudent && (
                <Button onClick={() => setIsFormOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Upload
                </Button>
              )}
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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="p-0">
                      <PageSkeleton rows={4} />
                    </TableCell>
                  </TableRow>
                ) : filteredMaterials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                      No materials found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMaterials.map(material => (
                    <TableRow key={material.material_id}>
                      <TableCell>
                        <div className="font-medium">{material.material_name}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1 mt-1">
                          {material.class_name}{material.section_name ? ` - ${material.section_name}` : ""} • {material.subject_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          Document
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(material.upload_date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() => handleDownload(material)}
                              disabled={downloadingId === material.material_id}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              {downloadingId === material.material_id ? "Downloading..." : "Download"}
                            </DropdownMenuItem>
                            {!isStudent && (
                              <DropdownMenuItem
                                onClick={() => handleDelete(material.material_id)}
                                disabled={deletingId === material.material_id}
                              >
                                {deletingId === material.material_id ? "Deleting..." : "Delete"}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="w-[94vw] sm:max-w-[425px] rounded-2xl left-[50%] top-[50%] -translate-x-[50%] -translate-y-[50%]">
            <DialogHeader>
              <DialogTitle>Upload Material</DialogTitle>
              <DialogDescription>Add study material</DialogDescription>
            </DialogHeader>
            <MaterialForm 
              onSubmit={handleCreateMaterial} 
              onCancel={() => setIsFormOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      </>
    </RouteGuard>
  );
}