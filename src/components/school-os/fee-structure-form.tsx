"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import axios from "@/lib/axios";
import { getFeeCategories, createFeeStructure, getFeeStructures, createFeeCategory } from "@/lib/api/fees";
import { Badge } from "@/components/ui/badge";
import { Info, Calculator, Layers, AlertCircle, IndianRupee, Plus, Trash2 } from "lucide-react";

interface CategoryItem {
  fee_cat_id: string;
  amount: string | number;
}

interface FeeStructureFormProps {
  initialStandard?: string;
  onSubmit?: (data: any) => void;
}

export function FeeStructureForm({ initialStandard, onSubmit }: FeeStructureFormProps) {
  const [selectedStandard, setSelectedStandard] = React.useState<string>(initialStandard || "");
  const [items, setItems] = React.useState<CategoryItem[]>([
    { fee_cat_id: "", amount: "" }
  ]);

  const [categories, setCategories] = React.useState<any[]>([]);
  const [uniqueStandards, setUniqueStandards] = React.useState<string[]>([]);
  const [allStructures, setAllStructures] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  // New category inline creation state
  const [isCreatingCategory, setIsCreatingCategory] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [isCategoryCreating, setIsCategoryCreating] = React.useState(false);

  React.useEffect(() => {
    if (initialStandard) {
      setSelectedStandard(initialStandard);
    }
  }, [initialStandard]);

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

  const handleAddItem = () => {
    setItems(prev => [...prev, { fee_cat_id: "", amount: "" }]);
    setFormError(null);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
    setFormError(null);
  };

  const handleUpdateItem = (index: number, key: keyof CategoryItem, value: any) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
    setFormError(null);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      setIsCategoryCreating(true);
      const newCat = await createFeeCategory({
        category_name: newCategoryName.trim(),
        description: `Created for fee structure setup`,
      });
      await loadData();
      if (newCat && newCat.fee_category_id) {
        setItems(prev => {
          const updated = [...prev];
          const emptyIdx = updated.findIndex(item => !item.fee_cat_id);
          const targetIdx = emptyIdx !== -1 ? emptyIdx : updated.length - 1;
          updated[targetIdx] = { ...updated[targetIdx], fee_cat_id: String(newCat.fee_category_id) };
          return updated;
        });
      }
      setNewCategoryName("");
      setIsCreatingCategory(false);
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || "Failed to create category");
    } finally {
      setIsCategoryCreating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedStandard) {
      setFormError("Please select a Grade / Standard.");
      return;
    }

    const validItems: { fee_cat_id: number; amount: number }[] = [];
    const selectedCatIds = new Set<string>();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.fee_cat_id) {
        setFormError(`Please select a fee category for row #${i + 1}.`);
        return;
      }

      const numAmount = Number(item.amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        setFormError(`Please enter a valid amount (> 0) for row #${i + 1}.`);
        return;
      }

      if (selectedCatIds.has(item.fee_cat_id)) {
        const catName = categories.find(c => String(c.fee_category_id) === item.fee_cat_id)?.category_name || "category";
        setFormError(`"${catName}" is selected multiple times in this form.`);
        return;
      }
      selectedCatIds.add(item.fee_cat_id);

      if (assignedCategoryIds.has(item.fee_cat_id)) {
        const catName = categories.find(c => String(c.fee_category_id) === item.fee_cat_id)?.category_name || "category";
        setFormError(`"${catName}" is already assigned to Standard ${selectedStandard}.`);
        return;
      }

      validItems.push({
        fee_cat_id: Number(item.fee_cat_id),
        amount: numAmount
      });
    }

    try {
      setIsSubmitting(true);
      const payload = {
        class_id: selectedStandard,
        items: validItems
      };

      await createFeeStructure(payload);
      if (onSubmit) {
        onSubmit(payload);
      }
      setItems([{ fee_cat_id: "", amount: "" }]);
      loadData();
    } catch (e: any) {
      console.error(e);
      setFormError(e.response?.data?.message || "Failed to save fee structure.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const newTotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-gray-100 rounded" />
      <div className="h-10 bg-gray-100 rounded" />
      <div className="h-10 bg-gray-100 rounded" />
    </div>
  );

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Standard Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
            <Layers className="h-3 w-3" /> Select Standard
          </label>
          <Select
            value={selectedStandard}
            onValueChange={(val) => {
              setSelectedStandard(val);
              setFormError(null);
            }}
          >
            <SelectTrigger className="border-2 focus:ring-blue-500 h-11">
              <SelectValue placeholder="Which grade level?" />
            </SelectTrigger>
            <SelectContent>
              {uniqueStandards.map((std) => (
                <SelectItem key={std} value={std}>
                  Standard {std}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Current Structure Preview */}
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

        {/* Fee Categories Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
              <Calculator className="h-3 w-3" /> Fee Categories ({items.length})
            </label>
            {selectedStandard && (
              <button
                type="button"
                onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> {isCreatingCategory ? "Cancel" : "New Category"}
              </button>
            )}
          </div>

          {/* New Category Inline Creation */}
          {isCreatingCategory && (
            <div className="flex items-center gap-2 p-2 bg-slate-50 border rounded-lg">
              <Input
                placeholder="e.g. Activity Fee, Transport Fee"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="h-9 text-xs"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleCreateCategory}
                disabled={isCategoryCreating || !newCategoryName.trim()}
                className="h-9 px-3 text-xs bg-blue-600 text-white"
              >
                {isCategoryCreating ? "Creating..." : "Create"}
              </Button>
            </div>
          )}

          {/* Category Item Rows */}
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl relative group">
                {/* Category Dropdown */}
                <div className="flex-1">
                  <Select
                    disabled={!selectedStandard}
                    value={item.fee_cat_id}
                    onValueChange={(val) => handleUpdateItem(index, "fee_cat_id", val)}
                  >
                    <SelectTrigger className="border-2 focus:ring-blue-500 h-10 bg-white text-xs font-medium">
                      <SelectValue placeholder={selectedStandard ? "Select Category" : "Pick standard first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => {
                        const isAssignedInDb = assignedCategoryIds.has(String(c.fee_category_id));
                        const isSelectedInForm = items.some((it, i) => i !== index && String(it.fee_cat_id) === String(c.fee_category_id));
                        const isDisabled = isAssignedInDb || isSelectedInForm;

                        return (
                          <SelectItem
                            key={c.fee_category_id}
                            value={String(c.fee_category_id)}
                            disabled={isDisabled}
                            className={isDisabled ? "opacity-50 line-through text-gray-400" : ""}
                          >
                            <div className="flex items-center justify-between w-full gap-2">
                              <span>{c.category_name}</span>
                              {isAssignedInDb && <Badge variant="outline" className="text-[8px] h-4 font-black uppercase text-gray-300 border-gray-200">Active</Badge>}
                              {isSelectedInForm && <Badge variant="outline" className="text-[8px] h-4 font-black uppercase text-blue-400 border-blue-200">Selected</Badge>}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount Input */}
                <div className="w-full sm:w-44 relative">
                  <Input
                    type="number"
                    disabled={!selectedStandard}
                    value={item.amount}
                    onChange={(e) => handleUpdateItem(index, "amount", e.target.value)}
                    className="pl-7 border-2 focus:ring-blue-500 h-10 text-sm font-bold text-gray-800 bg-white"
                    placeholder="Amount"
                  />
                  <span className="absolute left-2.5 top-2.5 font-bold text-xs text-gray-400">₹</span>
                </div>

                {/* Remove Row Button */}
                {items.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(index)}
                    className="h-10 w-10 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg shrink-0 self-end sm:self-auto"
                    title="Remove row"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Add Another Category Row Button */}
          {selectedStandard && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              className="w-full border-dashed border-2 border-blue-200 text-blue-600 hover:bg-blue-50/70 hover:border-blue-300 font-semibold h-10 rounded-xl transition-all"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add Another Category
            </Button>
          )}
        </div>

        {/* Error Message */}
        {formError && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs font-semibold text-rose-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}

        {/* Summary Footer */}
        {newTotal > 0 && selectedStandard && (
          <div className="flex items-center justify-between bg-slate-100/80 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700">
            <span>Adding {items.filter(i => i.fee_cat_id && Number(i.amount) > 0).length} Category Component(s)</span>
            <span className="font-bold text-blue-700 text-sm">Total Added: ₹{newTotal.toLocaleString()}</span>
          </div>
        )}

        {/* Submit Button */}
        <Button 
          type="submit" 
          disabled={!selectedStandard || isSubmitting} 
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 font-bold transition-all hover:translate-y-[-2px] rounded-xl text-base"
        >
          {isSubmitting 
            ? "Processing..." 
            : items.length > 1 
              ? `Add ${items.length} Categories to Structure` 
              : "Add to Structure"
          }
        </Button>
        
        {!selectedStandard && (
          <p className="text-[10px] text-center text-gray-400 font-medium animate-pulse flex items-center justify-center gap-1">
            <AlertCircle className="h-3 w-3" /> Start by selecting a grade level above
          </p>
        )}
      </form>
    </div>
  );
}
