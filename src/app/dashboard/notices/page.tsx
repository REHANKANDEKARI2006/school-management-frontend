
"use client";

import * as React from "react";
import { MoreHorizontal, PlusCircle } from "lucide-react";
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
import { NoticeForm, type Notice } from "@/components/campus-connect/notice-form";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useSearch } from "@/components/campus-connect/search-provider";

const initialNotices: Notice[] = [
  {
    id: "1",
    title: "Mid-term Exam Schedule",
    content: "The schedule for the upcoming mid-term exams is now available on the portal.",
    author: "Principal",
    date: "2024-07-28",
  },
  {
    id: "2",
    title: "Annual Sports Day Registration",
    content: "Registrations for Sports Day events are now open. Please sign up before the deadline.",
    author: "Sports Dept.",
    date: "2024-07-25",
  },
  {
    id: "3",
    title: "Library Hour Changes",
    content: "Please note the new library timings for the summer break, effective from August 1st.",
    author: "Librarian",
    date: "2024-07-20",
  },
    {
    id: "4",
    title: "Science Fair Volunteers Needed",
    content: "We are looking for student volunteers for the Annual Science Fair. Please contact the science department.",
    author: "Science Dept.",
    date: "2024-07-18",
  },
];

export default function NoticesPage() {
  const { toast } = useToast();
  const { searchQuery } = useSearch();
  const [notices, setNotices] = React.useState(initialNotices);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedNotice, setSelectedNotice] = React.useState<Notice | undefined>(undefined);

  const filteredNotices = React.useMemo(() => {
    if (!searchQuery) {
      return notices;
    }
    return notices.filter(notice =>
      notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notice.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notice.author.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, notices]);

  const handleFormSubmit = (noticeData: Notice) => {
    if (selectedNotice) {
      // Update existing notice
      setNotices(notices.map(n => n.id === noticeData.id ? noticeData : n));
      toast({ title: "Notice Updated", description: `"${noticeData.title}" has been updated.` });
    } else {
      // Add new notice
      const newNotice = { ...noticeData, id: (notices.length + 1).toString() };
      setNotices([newNotice, ...notices]);
      toast({ title: "Notice Posted", description: `"${noticeData.title}" has been published.` });
    }
    setIsFormOpen(false);
    setSelectedNotice(undefined);
  };

  const openEditDialog = (notice: Notice) => {
    setSelectedNotice(notice);
    setIsFormOpen(true);
  }

  const openNewDialog = () => {
    setSelectedNotice(undefined);
    setIsFormOpen(true);
  }

  const getFallback = (author?: string) => {
    if (!author) return "??";
    return author.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                  <CardTitle className="font-headline">E-Notice Board</CardTitle>
                  <CardDescription>Post and manage digital notices for all users.</CardDescription>
              </div>
              <Button size="sm" className="gap-1 w-full sm:w-auto" onClick={openNewDialog}>
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Post Notice
                  </span>
              </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Author</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNotices.map((notice) => (
                <TableRow key={notice.id}>
                  <TableCell className="font-medium">
                     <div className="font-medium">{notice.title}</div>
                    <div className="text-sm text-muted-foreground md:max-w-md truncate">
                        {notice.content}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={`https://picsum.photos/seed/${notice.author}/100/100`} alt={notice.author} />
                            <AvatarFallback>{getFallback(notice.author)}</AvatarFallback>
                        </Avatar>
                        <span>{notice.author}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{notice.date}</TableCell>
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
                        <DropdownMenuItem onClick={() => openEditDialog(notice)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setNotices(notices.filter(n => n.id !== notice.id));
                          toast({ title: "Notice Deleted", description: `"${notice.title}" has been removed.` });
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
            <DialogTitle>{selectedNotice ? "Edit Notice" : "Post New Notice"}</DialogTitle>
            <DialogDescription>
              {selectedNotice ? "Update the details of the notice." : "Fill in the details to post a new notice."}
            </DialogDescription>
          </DialogHeader>
          <NoticeForm onSubmit={handleFormSubmit} notice={selectedNotice} />
        </DialogContent>
      </Dialog>
    </>
  );
}
