
"use client";

import * as React from "react";
import axios from "@/lib/axios";
import { MoreHorizontal, PlusCircle, Calendar as CalendarIcon, User, Bell } from "lucide-react";
import { PageSkeleton, TableSkeleton } from "@/components/ui/skeletons";
import { useFeedback } from "@/components/school-os/feedback-provider";
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
import { NoticeForm } from "@/components/school-os/notice-form";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useSearch } from "@/components/school-os/search-provider";
import { getNotices, createNotice, updateNotice, deleteNotice } from "@/lib/api/notices";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

import { ROLE } from "@/config/roles";

export default function NoticesPage() {
  const { toast } = useToast();
  const { showSuccess, showError, showWarning } = useFeedback();
  const { searchQuery } = useSearch();
  const [notices, setNotices] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [formLoading, setFormLoading] = React.useState(false);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedNotice, setSelectedNotice] = React.useState<any>(undefined);
  const [deleteTarget, setDeleteTarget] = React.useState<any>(null);

  const roleId =
    typeof window !== "undefined"
      ? Number(localStorage.getItem("role_id"))
      : null;
  const isStudent = roleId === ROLE.STUDENT;

  const fetchNoticesData = React.useCallback(async () => {
    try {
      const studentClassId = typeof window !== "undefined" ? localStorage.getItem("class_id") : null;
      const url = isStudent && studentClassId ? `/api/notices?class_id=${studentClassId}` : "/api/notices";
      const res = await axios.get(url);
      setNotices(res.data.data || []);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load notices", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [isStudent, toast]);

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
        showSuccess("Notice Updated", `"${noticeData.title}" has been updated successfully.`);
      } else {
        await createNotice(noticeData);
        showSuccess("Notice Published", `"${noticeData.title}" has been posted to the notice board.`);
      }
      setIsFormOpen(false);
      setSelectedNotice(undefined);
      fetchNoticesData();
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Operation failed", variant: "destructive" });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteNotice(deleteTarget.notice_id);
      toast({ title: "Notice Deleted", description: `"${deleteTarget.title}" has been removed.`, variant: "destructive" });
      setDeleteTarget(null);
      fetchNoticesData();
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Deletion failed", variant: "destructive" });
    }
  };

  const confirmDelete = (notice: any) => {
    showWarning(
      `Delete "${notice.title}"?`,
      "This will permanently remove the notice and cannot be undone.",
      async () => {
        await deleteNotice(notice.notice_id);
        toast({ title: "Notice Deleted", description: `"${notice.title}" has been removed.`, variant: "destructive" });
        fetchNoticesData();
      },
      "Yes, Delete"
    );
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
    <div className="space-y-4 animate-in fade-in duration-500 pb-6">
      {/* ── Mobile Layout (< md) ── */}
      <div className="block md:hidden space-y-4">
        {/* Header */}
        <div className="space-y-1 hidden">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            E-Notice Board
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Post and manage digital notices for all users.
          </p>
        </div>

        {/* Action Button */}
        {!isStudent && (
          <Button
            onClick={openNewDialog}
            className="w-full h-11 font-bold rounded-xl shadow-sm text-xs justify-center flex items-center gap-2 active:scale-95 transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            Post Notice
          </Button>
        )}

        {/* Content Area */}
        {loading ? (
          <PageSkeleton rows={3} />
        ) : filteredNotices.length === 0 ? (
          <Card className="border border-slate-100 shadow-sm rounded-2xl bg-white p-8 text-center flex flex-col items-center justify-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-slate-100/80 text-slate-400 flex items-center justify-center">
              <Bell className="h-6 w-6 text-slate-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-700">No notices found.</p>
              <p className="text-xs text-slate-400">Published notices will appear here.</p>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredNotices.map((notice) => (
              <div
                key={notice.notice_id}
                className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:border-slate-300 transition-all space-y-3"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 space-y-1">
                    <h3 className="font-bold text-sm text-slate-900 leading-snug">{notice.title}</h3>
                    <Badge
                      variant="outline"
                      className="rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-slate-50 text-slate-700 border-slate-200"
                    >
                      {notice.audience_name || "General"}
                    </Badge>
                  </div>
                  {!isStudent && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(notice)}>Edit Notice</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => confirmDelete(notice)}>Delete Notice</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                <p className="text-xs font-medium text-slate-600 bg-slate-50 border border-slate-100 p-2.5 rounded-xl line-clamp-3 leading-relaxed">
                  {notice.content}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs text-slate-500 font-medium">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 border border-slate-200">
                      <AvatarImage src={notice.author_img || ""} alt={notice.author_name} />
                      <AvatarFallback className="text-[8px] font-black bg-slate-100 text-slate-700">
                        {getFallback(notice.author_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-semibold text-slate-700">{notice.author_name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <CalendarIcon className="h-3 w-3" />
                    {notice.post_date ? format(new Date(notice.post_date), "MMM d, yyyy") : "N/A"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Desktop Layout (>= md) ── */}
      <Card className="hidden md:block">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="font-headline text-2xl">E-Notice Board</CardTitle>
              <CardDescription>Post and manage digital notices for all users.</CardDescription>
            </div>
            {!isStudent && (
              <Button className="gap-1 w-full sm:w-auto" onClick={openNewDialog}>
                <PlusCircle className="h-4 w-4" />
                <span>Post Notice</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Notice Details</TableHead>
                  <TableHead>Audience</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Date</TableHead>
                  {!isStudent && <TableHead className="w-12 text-right pr-6">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                  {loading ? (
                    <TableSkeleton cols={5} rows={4} />
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
                      <TableCell>
                        <Badge variant="outline">{notice.audience_name || "General"}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-slate-100 shadow-sm">
                            <AvatarImage src={notice.author_img || ""} alt={notice.author_name} />
                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-[10px] font-bold">
                              {getFallback(notice.author_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700">{notice.author_name}</span>
                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{notice.author_type || "Staff"}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {notice.post_date ? format(new Date(notice.post_date), "PPP") : "No date"}
                        </div>
                      </TableCell>
                      {!isStudent && (
                        <TableCell className="text-right pr-6">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-slate-100">
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
                                  onClick={() => confirmDelete(notice)}
                                >
                                  Delete Notice
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="w-[92vw] sm:max-w-lg max-h-[90vh] p-0 border shadow-2xl rounded-2xl flex flex-col overflow-hidden left-[50%] top-[50%] -translate-x-[50%] -translate-y-[50%]">
          <DialogHeader className="p-5 pb-4 sm:p-6 sm:pb-4 bg-slate-50/50 border-b shrink-0">
            <DialogTitle className="text-lg sm:text-xl font-bold text-slate-900">
              {selectedNotice ? "Edit Notice" : "Post New Notice"}
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-0.5">
              {selectedNotice ? "Update the details of the notice." : "Fill in the details to post a new notice."}
            </DialogDescription>
          </DialogHeader>
          <NoticeForm
            onSubmit={handleFormSubmit}
            onCancel={() => setIsFormOpen(false)}
            notice={selectedNotice}
            loading={formLoading}
          />
        </DialogContent>
      </Dialog>
      {/* Feedback modals handled by global FeedbackProvider */}
    </div>
  );
}
