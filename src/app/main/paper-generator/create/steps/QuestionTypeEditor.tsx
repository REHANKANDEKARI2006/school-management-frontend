"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Image as ImageIcon } from "lucide-react";

interface Props {
  type: string;
  data: any;
  onChange: (newData: any) => void;
}

export default function QuestionTypeEditor({ type, data, onChange }: Props) {
  // Normalize data
  const qData = data || {};

  const updateData = (updates: any) => {
    onChange({ ...qData, ...updates });
  };

  switch (type) {
    case "MCQ_TEXT":
    case "MCQ_PICTURE":
      const options = qData.options || ["", "", "", ""];
      return (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {options.map((opt: string, i: number) => (
              <div key={i} className="flex items-center gap-2 group/opt">
                <div className={`h-6 w-6 rounded-full border flex items-center justify-center text-[10px] font-bold ${qData.correct_option === i ? "bg-primary text-white border-primary" : "bg-slate-50 text-slate-400"}`}>
                  {String.fromCharCode(65 + i)}
                </div>
                <Input 
                  value={opt} 
                  onChange={(e) => {
                    const next = [...options];
                    next[i] = e.target.value;
                    updateData({ options: next });
                  }}
                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  className="h-8 text-xs flex-1"
                />
                <RadioGroup 
                  value={qData.correct_option?.toString()} 
                  onValueChange={(v) => updateData({ correct_option: parseInt(v) })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={i.toString()} id={`q-opt-${i}`} className="h-3 w-3" />
                  </div>
                </RadioGroup>
              </div>
            ))}
          </div>
          {type === "MCQ_PICTURE" && (
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                {options.map((opt: string, i: number) => {
                    const optImg = qData.options_images?.[i];
                    return (
                        <div key={i} className="space-y-2">
                            <div className="relative h-24 w-full rounded-xl overflow-hidden bg-white border border-slate-100 shadow-sm group/optimg">
                                {optImg ? (
                                    <>
                                        <img src={`http://localhost:5000${optImg}`} className="h-full w-full object-cover" alt={`Opt ${i}`} />
                                        <button 
                                            onClick={() => {
                                                const next = [...(qData.options_images || ["", "", "", ""])];
                                                next[i] = "";
                                                updateData({ options_images: next });
                                            }}
                                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/optimg:opacity-100 transition-all text-white"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </>
                                ) : (
                                    <label className="h-full w-full flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-slate-50 transition-colors">
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                const formData = new FormData();
                                                formData.append("image", file);
                                                const res = await fetch("http://localhost:5000/api/upload/question-image", { method: "POST", body: formData });
                                                const result = await res.json();
                                                if (result.success) {
                                                    const next = [...(qData.options_images || ["", "", "", ""])];
                                                    next[i] = result.imageUrl;
                                                    updateData({ options_images: next });
                                                }
                                            }}
                                        />
                                        <ImageIcon className="h-5 w-5 text-slate-200" />
                                        <span className="text-[8px] font-black uppercase text-slate-300">Upload {String.fromCharCode(65+i)}</span>
                                    </label>
                                )}
                            </div>
                        </div>
                    );
                })}
             </div>
          )}
        </div>
      );

    case "TRUE_FALSE":
    case "YES_NO":
      return (
        <div className="flex items-center gap-4 pt-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Correct Answer:</span>
          <RadioGroup 
            className="flex gap-4" 
            value={qData.answer} 
            onValueChange={(v) => updateData({ answer: v })}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id="tf-t" className="h-4 w-4" />
              <Label htmlFor="tf-t" className="text-xs font-bold">{type === "TRUE_FALSE" ? "True" : "Yes"}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id="tf-f" className="h-4 w-4" />
              <Label htmlFor="tf-f" className="text-xs font-bold">{type === "TRUE_FALSE" ? "False" : "No"}</Label>
            </div>
          </RadioGroup>
        </div>
      );

    case "ASSERTION_REASON":
      return (
        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <Label className="text-[10px] font-bold uppercase text-slate-400">Assertion</Label>
            <Input 
              value={qData.assertion || ""} 
              onChange={e => updateData({ assertion: e.target.value })}
              placeholder="e.g. The sky appears blue during the day."
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-bold uppercase text-slate-400">Reason</Label>
            <Input 
              value={qData.reason || ""} 
              onChange={e => updateData({ reason: e.target.value })}
              placeholder="e.g. Because of Rayleigh scattering."
              className="h-8 text-xs"
            />
          </div>
        </div>
      );

    case "MATCH_FOLLOWING":
      const pairs = qData.pairs || [{ a: "", b: "", img_a: "", img_b: "" }];
      return (
        <div className="space-y-4 pt-2">
          {pairs.map((p: any, i: number) => (
            <div key={i} className="flex flex-col gap-2 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
              <div className="flex gap-2 items-center">
                <span className="text-[10px] font-bold text-slate-300 w-4">{i + 1}.</span>
                <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                        <Input 
                            value={p.a} 
                            onChange={e => {
                                const next = [...pairs];
                                next[i].a = e.target.value;
                                updateData({ pairs: next });
                            }}
                            placeholder="Column A (Text)"
                            className="h-8 text-xs flex-1"
                        />
                        <Input 
                            value={p.b} 
                            onChange={e => {
                                const next = [...pairs];
                                next[i].b = e.target.value;
                                updateData({ pairs: next });
                            }}
                            placeholder="Column B (Text)"
                            className="h-8 text-xs flex-1"
                        />
                    </div>
                    {/* Image Options for Matching */}
                    <div className="flex gap-2">
                        <div className="flex-1 h-12 border border-dashed rounded-lg flex items-center justify-center relative overflow-hidden bg-white group/imga">
                            {p.img_a ? (
                                <>
                                    <img src={`http://localhost:5000${p.img_a}`} className="h-full w-full object-contain" alt="A" />
                                    <button onClick={() => { const next = [...pairs]; next[i].img_a = ""; updateData({ pairs: next }); }} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/imga:opacity-100 text-white"><Trash2 className="h-3 w-3"/></button>
                                </>
                            ) : (
                                <label className="cursor-pointer h-full w-full flex items-center justify-center gap-1">
                                    <input type="file" className="hidden" onChange={async (e) => {
                                        const file = e.target.files?.[0]; if (!file) return;
                                        const fd = new FormData(); fd.append("image", file);
                                        const result = await (await fetch("http://localhost:5000/api/upload/question-image", { method: "POST", body: fd })).json();
                                        if (result.success) { const next = [...pairs]; next[i].img_a = result.imageUrl; updateData({ pairs: next }); }
                                    }}/>
                                    <ImageIcon className="h-3 w-3 text-slate-300" />
                                    <span className="text-[8px] font-black uppercase text-slate-400">Add Image A</span>
                                </label>
                            )}
                        </div>
                        <div className="flex-1 h-12 border border-dashed rounded-lg flex items-center justify-center relative overflow-hidden bg-white group/imgb">
                            {p.img_b ? (
                                <>
                                    <img src={`http://localhost:5000${p.img_b}`} className="h-full w-full object-contain" alt="B" />
                                    <button onClick={() => { const next = [...pairs]; next[i].img_b = ""; updateData({ pairs: next }); }} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/imgb:opacity-100 text-white"><Trash2 className="h-3 w-3"/></button>
                                </>
                            ) : (
                                <label className="cursor-pointer h-full w-full flex items-center justify-center gap-1">
                                    <input type="file" className="hidden" onChange={async (e) => {
                                        const file = e.target.files?.[0]; if (!file) return;
                                        const fd = new FormData(); fd.append("image", file);
                                        const result = await (await fetch("http://localhost:5000/api/upload/question-image", { method: "POST", body: fd })).json();
                                        if (result.success) { const next = [...pairs]; next[i].img_b = result.imageUrl; updateData({ pairs: next }); }
                                    }}/>
                                    <ImageIcon className="h-3 w-3 text-slate-300" />
                                    <span className="text-[8px] font-black uppercase text-slate-400">Add Image B</span>
                                </label>
                            )}
                        </div>
                    </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-slate-300 hover:text-destructive"
                  onClick={() => {
                    updateData({ pairs: pairs.filter((_: any, idx: number) => idx !== i) });
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-[10px] border-dashed w-full rounded-xl bg-white hover:bg-slate-50 transition-all font-bold opacity-60 hover:opacity-100"
            onClick={() => updateData({ pairs: [...pairs, { a: "", b: "", img_a: "", img_b: "" }] })}
          >
            <Plus className="h-3 w-3 mr-1" /> Add Match Pair
          </Button>
        </div>
      );

    default:
      return (
        <div className="pt-2">
          <span className="text-[10px] italic text-slate-400">
            Standard {type.replace("_", " ")} input — No special fields required.
          </span>
        </div>
      );
  }
}
