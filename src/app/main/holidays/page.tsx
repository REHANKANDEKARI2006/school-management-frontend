"use client";

import * as React from "react";
import axios from "@/lib/axios";
import { format } from "date-fns";
import { 
  PlusCircle, 
  Pencil, 
  Trash, 
  Globe, 
  User, 
  RefreshCcw,
  Check,
  X,
  MoreHorizontal
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useRoleGuard } from "@/hooks/useRoleGuard";
import { useToast } from "@/hooks/use-toast";
import { PageSkeleton } from "@/components/ui/skeletons";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

import { useSearch } from "@/components/campus-connect/search-provider";
import { ROLE, ADMIN_GROUP } from "@/config/roles";

const ALLOWED_ROLES = [ROLE.MASTER_ADMIN];

type Holiday = {
  id: string | number;
  name: string;
  date: string;
  category: string;
  source: string;
  description?: string;
  is_recurring?: boolean;
};

export default function HolidaysPage() {
  useRoleGuard(ALLOWED_ROLES as number[]);
  const { toast } = useToast();
  const { searchQuery } = useSearch();

  const [holidays, setHolidays] = React.useState<Holiday[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // Form State
  const [editingId, setEditingId] = React.useState<string | number | null>(null);
  const [formData, setFormData] = React.useState({
    name: "",
    date: format(new Date(), "yyyy-MM-dd"),
    category: "Maharashtra",
    description: "",
    is_recurring: false
  });

  const fetchHolidays = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const res = await axios.get(`/api/holidays?year=${currentYear}`);
      setHolidays(res.data.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load holidays",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchHolidays();
  }, []);

  const filteredHolidays = React.useMemo(() => {
    if (!searchQuery) return holidays;
    const q = searchQuery.toLowerCase();
    return holidays.filter(h => 
      h.name.toLowerCase().includes(q) || 
      h.category.toLowerCase().includes(q) ||
      (h.description && h.description.toLowerCase().includes(q))
    );
  }, [searchQuery, holidays]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: "",
      date: format(new Date(), "yyyy-MM-dd"),
      category: "Maharashtra",
      description: "",
      is_recurring: false
    });
    setModalOpen(true);
  };

  const handleEdit = (holiday: Holiday) => {
    if (holiday.source === 'Google') {
        toast({ title: "Note", description: "Google API holidays cannot be edited." });
        return;
    }
    
    setEditingId(holiday.id);
    setFormData({
      name: holiday.name,
      date: holiday.date,
      category: holiday.category,
      description: holiday.description || "",
      is_recurring: holiday.source === 'System' || holiday.is_recurring || holiday.id.toString().startsWith('rec_')
    });
    setModalOpen(true);
  };

  const handleDelete = async (holiday: Holiday) => {
    if (holiday.source === 'Google') return;
    if (!confirm(`Are you sure you want to delete "${holiday.name}"?`)) return;

    try {
      await axios.delete(`/api/holidays/custom/${holiday.id}`);
      toast({ title: "Deleted", description: "Holiday removed successfully." });
      fetchHolidays();
    } catch {
      toast({ title: "Error", description: "Failed to delete holiday.", variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        holiday_name: formData.name,
        holiday_date: formData.date,
        category: formData.category,
        description: formData.description,
        is_recurring: formData.is_recurring
      };

      if (editingId) {
        await axios.put(`/api/holidays/custom/${editingId}`, payload);
      } else {
        await axios.post("/api/holidays/custom", payload);
      }

      toast({ title: "Success", description: `Holiday ${editingId ? 'updated' : 'added'} successfully.` });
      setModalOpen(false);
      fetchHolidays();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Operation failed",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageSkeleton rows={10} />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <CardTitle>Academic Holidays</CardTitle>
            <CardDescription>
              Manage national, state, and school holidays
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="hidden sm:flex uppercase tracking-widest text-[10px] px-3 py-1">
              {filteredHolidays.length} Entries Found
            </Badge>
            <Button onClick={handleOpenAdd} className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Add Holiday
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Date</TableHead>
                  <TableHead>Holiday Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-center">Recurring</TableHead>
                  <TableHead className="text-right pr-6" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHolidays.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      No holidays found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHolidays.map((h, idx) => (
                    <TableRow key={`${h.id}-${idx}`} className="group cursor-pointer">
                      <TableCell className="pl-6 font-medium">
                        <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{format(new Date(h.date), "dd MMM")}</span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-tighter">
                                {h.source === 'System' ? 'Annual' : format(new Date(h.date), "yyyy")}
                            </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{h.name}</span>
                            {h.description && <span className="text-xs text-slate-400 line-clamp-1 max-w-[200px]">{h.description}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`
                            rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider
                            ${h.category.toLowerCase() === 'national' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : ''}
                            ${h.category.toLowerCase() === 'maharashtra' ? 'bg-orange-50 text-orange-700 border-orange-100' : ''}
                            ${h.category.toLowerCase() === 'karnataka' ? 'bg-sky-50 text-sky-700 border-sky-100' : ''}
                            ${h.category.toLowerCase() === 'school holiday' ? 'bg-rose-50 text-rose-700 border-rose-100' : ''}
                          `}
                        >
                          {h.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                            {h.source === 'Google' ? <Globe className="h-3.5 w-3.5 text-slate-400" /> : <User className="h-3.5 w-3.5 text-indigo-400" />}
                            {h.source}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                            {h.source === 'System' || h.is_recurring ? (
                                <Check className="h-4 w-4 text-emerald-500 bg-emerald-50 rounded-full p-0.5" />
                            ) : (
                                <X className="h-4 w-4 text-slate-300" />
                            )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        {h.source !== 'Google' && (
                          <div onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(h)}>Edit Holiday</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(h)}>Delete Holiday</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden flex flex-col gap-3 p-4 bg-muted/10">
            {filteredHolidays.length === 0 ? (
                <p className="text-center text-muted-foreground py-10 text-sm">No holidays found.</p>
            ) : (
                filteredHolidays.map((h, idx) => (
                    <div key={`${h.id}-${idx}`} className="bg-background border rounded-xl p-4 shadow-sm relative space-y-3">
                        <div className="flex justify-between items-start">
                            <div className="flex gap-3 items-center">
                                <div className="flex flex-col items-center justify-center bg-muted rounded-xl w-14 h-14 border">
                                    <span className="text-sm font-black text-slate-900 leading-none">{format(new Date(h.date), "dd")}</span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">{format(new Date(h.date), "MMM")}</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 leading-tight">{h.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge 
                                            variant="outline" 
                                            className={`
                                                rounded-md px-1.5 py-0 text-[8px] font-bold uppercase tracking-tighter
                                                ${h.category.toLowerCase() === 'national' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : ''}
                                                ${h.category.toLowerCase() === 'maharashtra' ? 'bg-orange-50 text-orange-700 border-orange-100' : ''}
                                                ${h.category.toLowerCase() === 'karnataka' ? 'bg-sky-50 text-sky-700 border-sky-100' : ''}
                                                ${h.category.toLowerCase() === 'school holiday' ? 'bg-rose-50 text-rose-700 border-rose-100' : ''}
                                            `}
                                        >
                                            {h.category}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            {h.source !== 'Google' && (
                              <div onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEdit(h)}>Edit Holiday</DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(h)}>Delete Holiday</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}
                        </div>
                        {h.description && (
                            <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg line-clamp-2">
                                {h.description}
                            </p>
                        )}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {h.source === 'System' ? 'Annual Recurring' : `Year: ${format(new Date(h.date), "yyyy")}`}
                            </span>
                            {(h.source === 'System' || h.is_recurring) && (
                                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 text-[8px] font-black py-0 px-2 rounded-full uppercase">Recurring</Badge>
                            )}
                        </div>
                    </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* ADD/EDIT MODAL */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="w-[94vw] sm:max-w-[425px] rounded-2xl left-[50%] top-[50%] -translate-x-[50%] -translate-y-[50%]">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Holiday' : 'Add Custom Holiday'}
            </DialogTitle>
            <DialogDescription>
              Setup specific dates for school observance.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label>Holiday Name</Label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Founder's Day"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input 
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(val) => setFormData({...formData, category: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                    <SelectItem value="Karnataka">Karnataka</SelectItem>
                    <SelectItem value="School Holiday">School Holiday</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <RefreshCcw className="h-3.5 w-3.5 text-muted-foreground" />
                  Recurring Every Year
                </Label>
                <p className="text-[10px] text-muted-foreground">Automatically repeat on this day/month</p>
              </div>
              <Switch 
                checked={formData.is_recurring}
                onCheckedChange={(checked) => setFormData({...formData, is_recurring: checked})}
              />
            </div>

            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Short note about the holiday..."
                className="min-h-[100px] resize-none"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : (editingId ? 'Update Holiday' : 'Save Holiday')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
