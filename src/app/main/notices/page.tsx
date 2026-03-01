
"use client";

import * as React from "react";
import { MoreHorizontal, PlusCircle, Loader2, Calendar as CalendarIcon, User } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { NoticeForm } from "@/components/campus-connect/notice-form";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useSearch } from "@/components/campus-connect/search-provider";
import { getNotices, createNotice, updateNotice, deleteNotice } from "@/lib/api/notices";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function NoticesPage() {
  const { toast } = useToast();
  const { searchQuery } = useSearch();
  const [notices, setNotices] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [formLoading, setFormLoading] = React.useState(false);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedNotice, setSelectedNotice] = React.useState<any>(undefined);
  const [deleteTarget, setDeleteTarget] = React.useState<any>(null);

  const fetchNoticesData = React.useCallback(async () => {
    try {
      const data = await getNotices();
      setNotices(data || []);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load notices", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchNoticesData();
  }, [fetchNoticesData]);

  const filteredNotices = React.useMemo(() => {
    if (!searchQuery) {
      return notices;
    }
    const q = searchQuery.toLowerCase();
    return notices.filter(notice =>
      notice.title?.toLowerCase().includes(q) ||
      notice.content?.toLowerCase().includes(q) ||
      notice.author_name?.toLowerCase().includes(q) ||
      notice.audience_name?.toLowerCase().includes(q)
    );
  }, [searchQuery, notices]);

  const handleFormSubmit = async (noticeData: any) => {
    setFormLoading(true);
    try {
      if (selectedNotice) {
        await updateNotice(selectedNotice.notice_id, noticeData);
        toast({ title: "Notice Updated", description: `"${noticeData.title}" has been updated.` });
      } else {
        await createNotice(noticeData);
        toast({ title: "Notice Posted", description: `"${noticeData.title}" has been published.` });
      }
      setIsFormOpen(false);
      setSelectedNotice(undefined);
      fetchNoticesData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Operation failed",
        variant: "destructive"
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteNotice(deleteTarget.notice_id);
      toast({ title: "Notice Deleted", description: `"${deleteTarget.title}" has been removed.` });
      setDeleteTarget(null);
      fetchNoticesData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Deletion failed",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (notice: any) => {
    setSelectedNotice(notice);
    setIsFormOpen(true);
  }

  const openNewDialog = () => {
    setSelectedNotice(undefined);
    setIsFormOpen(true);
  }

  const getFallback = (author?: string) => {
    if (!author) return "??";
    return author.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="font-headline text-2xl">E-Notice Board</CardTitle>
              <CardDescription>Post and manage digital notices for all users.</CardDescription>
            </div>
            <Button size="sm" className="gap-1 w-full sm:w-auto" onClick={openNewDialog}>
              <PlusCircle className="h-4 w-4" />
              <span>Post Notice</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Notice Details</TableHead>
                  <TableHead className="hidden md:table-cell">Audience</TableHead>
                  <TableHead className="hidden md:table-cell">Author</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead className="w-12 text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      <p className="text-xs mt-2 text-muted-foreground">Loading notices...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredNotices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      No notices found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNotices.map((notice) => (
                    <TableRow key={notice.notice_id}>
                      <TableCell className="font-medium">
                        <div className="font-medium text-base">{notice.title}</div>
                        <div className="text-sm text-muted-foreground md:max-w-md truncate">
                          {notice.content}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">{notice.audience_name || "General"}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={`https://picsum.photos/seed/${notice.author_name}/100/100`} alt={notice.author_name} />
                            <AvatarFallback>{getFallback(notice.author_name)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{notice.author_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {notice.post_date ? format(new Date(notice.post_date), "PPP") : "No date"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openEditDialog(notice)}>
                              Edit Notice
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteTarget(notice)}
                            >
                              Delete Notice
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{selectedNotice ? "Edit Notice" : "Post New Notice"}</DialogTitle>
            <DialogDescription>
              {selectedNotice ? "Update the details of the notice." : "Fill in the details to post a new notice."}
            </DialogDescription>
          </DialogHeader>
          <NoticeForm
            onSubmit={handleFormSubmit}
            notice={selectedNotice}
            loading={formLoading}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the notice
              <strong> "{deleteTarget?.title}"</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
