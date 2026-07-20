"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import * as React from "react";
import axios from "@/lib/axios";
import { getFeeCategories, createFeeStructure, getFeeStructures } from "@/lib/api/fees";
import { Badge } from "@/components/ui/badge";
import { Info, Calculator, Layers, AlertCircle, IndianRupee } from "lucide-react";

const schema = z.object({
  class_id: z.string().min(1, "Standard is required"),
  fee_cat_id: z.string().min(1, "Category is required"),
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
});

export function FeeStructureForm({ onSubmit }: any) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      class_id: "",
      fee_cat_id: "",
      amount: 0,
    },
  });

  const [categories, setCategories] = React.useState<any[]>([]);
  const [uniqueStandards, setUniqueStandards] = React.useState<string[]>([]);
  const [allStructures, setAllStructures] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Watch for current standard selection
  const selectedStandard = form.watch("class_id");

  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, structs, clsRes] = await Promise.all([
        getFeeCategories(),
        getFeeStructures(),
        axios.get("/api/classes")
      ]);
      
      setCategories(cats || []);
      setAllStructures(structs || []);
      
      const clsData = clsRes.data.data || [];
      const stands = Array.from(new Set(clsData.map((c: any) => c.class_name))) as string[];
      setUniqueStandards(stands.sort((a, b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.localeCompare(b);
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);

  // DE-DUPLICATE: A standard has many sections, we only want to see each category ONCE in the preview
  const rawStructures = allStructures.filter(s => String(s.class_name) === String(selectedStandard));
  const categoryMap = new Map();
  rawStructures.forEach(s => {
    if (!categoryMap.has(s.fee_cat_id)) {
      categoryMap.set(s.fee_cat_id, s);
    }
  });
  const currentStandardStructures = Array.from(categoryMap.values());
  const assignedCategoryIds = new Set(currentStandardStructures.map(s => String(s.fee_cat_id)));

  const submit = async (data: any) => {
    try {
      setIsSubmitting(true);
      if (assignedCategoryIds.has(String(data.fee_cat_id))) {
          alert("This category is already assigned to this standard.");
          return;
      }

      await createFeeStructure(data);
      if (onSubmit) {
        onSubmit(data);
      }
      form.reset();
      loadData(); // Refresh structures
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-gray-100 rounded" />
      <div className="h-10 bg-gray-100 rounded" />
      <div className="h-10 bg-gray-100 rounded" />
  </div>;

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(submit)} className="space-y-5">
          <FormField
            control={form.control}
            name="class_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                    <Layers className="h-3 w-3" /> Select Standard
                </FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger className="border-2 focus:ring-blue-500 h-11">
                      <SelectValue placeholder="Which grade level?" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {uniqueStandards.map((std) => (
                      <SelectItem key={std} value={std}>
                        Standard {std}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedStandard && (
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-blue-800 uppercase tracking-widest flex items-center gap-2">
                        <Info className="h-3 w-3" /> Current Structure
                    </h4>
                    <span className="text-[10px] font-bold text-blue-500 bg-white px-2 py-0.5 rounded-full border border-blue-100 shadow-sm">
                        Total: ₹{currentStandardStructures.reduce((sum, s) => sum + Number(s.amount), 0).toLocaleString()}
                    </span>
                </div>
                
                {currentStandardStructures.length === 0 ? (
                    <p className="text-[10px] text-blue-400 italic">No categories assigned yet.</p>
                ) : (
                    <div className="flex flex-wrap gap-1.5">
                        {currentStandardStructures.map(s => (
                            <Badge key={s.fee_struct_id} variant="secondary" className="bg-white border-blue-100 text-blue-700 text-[10px] font-bold py-0.5 shadow-sm">
                                {s.category_name}: ₹{Number(s.amount).toLocaleString()}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>
          )}

          <FormField
            control={form.control}
            name="fee_cat_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                    <Calculator className="h-3 w-3" /> Fee Category
                </FormLabel>
                <Select
                  disabled={!selectedStandard}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger className="border-2 focus:ring-blue-500 h-11">
                      <SelectValue placeholder={selectedStandard ? "Select category" : "Pick a standard first"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((c) => {
                        const isAssigned = assignedCategoryIds.has(String(c.fee_category_id));
                        return (
                            <SelectItem
                              key={c.fee_category_id}
                              value={String(c.fee_category_id)}
                              disabled={isAssigned}
                              className={isAssigned ? "opacity-50 line-through text-gray-400" : ""}
                            >
                              <div className="flex items-center justify-between w-full gap-2">
                                  <span>{c.category_name}</span>
                                  {isAssigned && <Badge variant="outline" className="text-[8px] h-4 font-black uppercase text-gray-300 border-gray-200">Active</Badge>}
                              </div>
                            </SelectItem>
                        );
                    })}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                    <IndianRupee className="h-3 w-3" /> Annual Amount
                </FormLabel>
                <div className="relative">
                    <Input 
                        type="number" 
                        {...field} 
                        className="pl-8 border-2 focus:ring-blue-500 h-11 text-lg font-bold text-gray-800"
                        placeholder="0.00"
                    />
                    <span className="absolute left-3 top-2.5 font-bold text-gray-400">₹</span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            disabled={!selectedStandard} 
            loading={isSubmitting}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 font-bold transition-all hover:translate-y-[-2px]"
          >
            {isSubmitting ? "Processing..." : "Add to Structure"}
          </Button>
          
          {!selectedStandard && (
              <p className="text-[10px] text-center text-gray-400 font-medium animate-pulse flex items-center justify-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Start by selecting a grade level above
              </p>
          )}
        </form>
      </Form>
    </div>
  );
}
