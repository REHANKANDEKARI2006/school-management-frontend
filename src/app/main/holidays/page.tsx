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
  X
} from "lucide-react";

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

import { ROLE, ADMIN_GROUP } from "@/config/roles";

const ALLOWED_ROLES = ADMIN_GROUP;

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Academic Holidays</h1>
          <p className="text-slate-500 font-medium">Manage national, state, and school holidays</p>
        </div>
        <Button onClick={handleOpenAdd} className="bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Custom Holiday
        </Button>
      </div>

      <Card className="border-none shadow-xl bg-white overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800">Holiday List</CardTitle>
              <CardDescription>Unified view of all recognition dates</CardDescription>
            </div>
            <Badge variant="outline" className="bg-white border-slate-200 text-slate-500 uppercase tracking-widest text-[10px]">
              {holidays.length} Entries Found
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-bold text-slate-700">Date</TableHead>
                <TableHead className="font-bold text-slate-700">Holiday Name</TableHead>
                <TableHead className="font-bold text-slate-700">Category</TableHead>
                <TableHead className="font-bold text-slate-700">Source</TableHead>
                <TableHead className="font-bold text-slate-700 text-center">Recurring</TableHead>
                <TableHead className="text-right font-bold text-slate-700 pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holidays.map((h, idx) => (
                <TableRow key={`${h.id}-${idx}`} className="hover:bg-slate-50/50 transition-colors group">
                  <TableCell className="font-medium text-slate-600">
                    <div className="flex flex-col pl-2">
                        <span className="font-bold text-slate-900">{format(new Date(h.date), "dd MMM")}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-tighter">
                            {h.source === 'System' ? 'Annual' : format(new Date(h.date), "yyyy")}
                        </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{h.name}</span>
                        {h.description && <span className="text-xs text-slate-400 line-clamp-1">{h.description}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`
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
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                        {h.source === 'Google' ? <Globe className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                        {h.source}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                        {h.source === 'System' || h.is_recurring ? (
                            <Check className="h-4 w-4 text-emerald-500 bg-emerald-50 rounded-full" />
                        ) : (
                            <X className="h-4 w-4 text-slate-300" />
                        )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    {h.source !== 'Google' && (
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(h)} className="h-8 w-8 text-indigo-600 hover:bg-indigo-50">
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(h)} className="h-8 w-8 text-rose-600 hover:bg-rose-50">
                                <Trash className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ADD/EDIT MODAL */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl border-none shadow-2xl overflow-hidden p-0">
          <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          <div className="p-6">
            <DialogHeader className="mb-4">
                <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
                {editingId ? 'Edit Holiday' : 'Add Custom Holiday'}
                </DialogTitle>
                <p className="text-sm text-slate-500">Setup specific dates for school observance</p>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Holiday Name</Label>
                <Input 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Founder's Day"
                    className="h-12 rounded-xl border-slate-200 focus:ring-indigo-500 bg-slate-50/50"
                    required
                />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Date</Label>
                        <Input 
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                            className="h-12 rounded-xl border-slate-200 focus:ring-indigo-500 bg-slate-50/50"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Category</Label>
                        <Select 
                            value={formData.category} 
                            onValueChange={(val) => setFormData({...formData, category: val})}
                        >
                            <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50/50">
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

                <div className="flex items-center justify-between p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                    <div className="space-y-0.5">
                        <Label className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                            <RefreshCcw className="h-3.5 w-3.5 text-indigo-500" />
                            Recurring Every Year
                        </Label>
                        <p className="text-[10px] text-indigo-600/70">Automatically repeat on this day/month</p>
                    </div>
                    <Switch 
                        checked={formData.is_recurring}
                        onCheckedChange={(checked) => setFormData({...formData, is_recurring: checked})}
                        className="data-[state=checked]:bg-indigo-600"
                    />
                </div>

                <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Description (Optional)</Label>
                <Textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Short note about the holiday..."
                    className="rounded-xl border-slate-200 focus:ring-indigo-500 min-h-[80px] bg-slate-50/50"
                />
                </div>

                <DialogFooter className="pt-2 gap-2">
                <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} className="h-12 rounded-xl px-6 font-bold text-slate-500">
                    Cancel
                </Button>
                <Button type="submit" loading={saving} className="h-12 rounded-xl px-8 bg-indigo-600 hover:bg-indigo-700 shadow-md font-bold">
                    {editingId ? 'Update Holiday' : 'Save Holiday'}
                </Button>
                </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
