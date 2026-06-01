
"use client";

import { useState, useEffect } from "react";
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight,
  Filter,
  Search,
  MoreVertical
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import axios from "@/lib/axios";
import { cn, formatDate } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function LeaveStatusPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  useEffect(() => {
    // Simulating API fetch
    const fetchLeaves = async () => {
      try {
        const staffId = localStorage.getItem("staff_id");
        if (!staffId) return;
        const res = await axios.get(`/api/leaves/my-leaves/${staffId}`);
        setLeaves(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaves();
  }, []);

  const getStatusBadge = (leave: any) => {
    const approverText = leave.approver_name ? `by ${leave.approver_name}` : '';

    if (leave.status_id === 3 || leave.hod_status === 3 || leave.principal_status === 3) {
      return (
        <div className="flex flex-col gap-0.5 w-fit">
          <Badge variant="rejected">Rejected</Badge>
          {approverText && <span className="text-[9px] text-muted-foreground font-medium">{approverText}</span>}
        </div>
      );
    }
    if (leave.status_id === 2 || leave.principal_status === 2) {
      return (
        <div className="flex flex-col gap-0.5 w-fit">
          <Badge variant="approved">Approved</Badge>
          {approverText && <span className="text-[9px] text-emerald-600/70 font-medium">{approverText}</span>}
        </div>
      );
    }
    if (leave.hod_status === 2) {
      return (
        <div className="flex flex-col gap-0.5 w-fit">
          <Badge variant="processing">Partially Approved</Badge>
          {approverText && <span className="text-[9px] text-blue-600/70 font-medium">{approverText}</span>}
        </div>
      );
    }
    return <Badge variant="pending">Pending</Badge>;
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Leave Status</h1>
        <p className="text-muted-foreground">Track and manage your applied leave requests.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search requests..." className="pl-9 bg-background/50" />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
          <Button size="sm">Download Report</Button>
        </div>
      </div>

      <Card className="border-none bg-background/50 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/30">
            <TableRow>
              <TableHead className="py-4">Leave Type</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Total Days</TableHead>
              <TableHead>Applied On</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6} className="h-14 animate-pulse bg-secondary/10" />
                </TableRow>
              ))
            ) : leaves.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                  No leave requests found.
                </TableCell>
              </TableRow>
            ) : (
              leaves.map((leave) => (
                <TableRow key={leave.leave_id} className="hover:bg-secondary/20 transition-colors">
                  <TableCell className="font-medium">{leave.type_name}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">{leave.total_days} Days</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(leave.created_at)}
                  </TableCell>
                  <TableCell>{getStatusBadge(leave)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[160px]">
                        <DropdownMenuItem onClick={() => {
                           setSelectedLeave(leave);
                           setViewModalOpen(true);
                        }}>
                           View Details
                        </DropdownMenuItem>
                        {leave.status_id === 1 && (
                          <DropdownMenuItem 
                            className="text-rose-600"
                            onClick={async () => {
                              try {
                                const staffId = localStorage.getItem("staff_id");
                                await axios.delete(`/api/leaves/my-leaves/${leave.leave_id}?staff_id=${staffId}`);
                                setLeaves(leaves.filter(l => l.leave_id !== leave.leave_id));
                              } catch (err) {
                                console.error("Failed to cancel request", err);
                              }
                            }}
                          >
                            Cancel Request
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
      </Card>

      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Details</DialogTitle>
            <DialogDescription>
              View the specifics of your leave application.
            </DialogDescription>
          </DialogHeader>
          {selectedLeave && (
            <div className="space-y-4 py-4">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground font-medium text-sm">Leave Type</span>
                <span className="font-semibold">{selectedLeave.type_name}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Duration</p>
                <p className="font-bold text-slate-700">
                  {formatDate(selectedLeave.start_date)} — {formatDate(selectedLeave.end_date)}
                </p>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground font-medium text-sm">Total Days</span>
                <span className="font-semibold">{selectedLeave.total_days}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground font-medium text-sm">Reason</span>
                <span className="font-semibold text-right max-w-[250px] whitespace-normal break-words">{selectedLeave.reason}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground font-medium text-sm">Status</span>
                <span className="font-semibold flex justify-end">{getStatusBadge(selectedLeave)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
