"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import QRCode from "react-qr-code";
import { 
  Undo2, Redo2, ZoomIn, ZoomOut, Eye, Save, ChevronLeft,
  RotateCcw, Lock, Unlock, Trash2, Copy, ArrowUp, ArrowDown,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, Grid, SwitchCamera,
  Maximize2, Minimize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { DYNAMIC_FIELDS, STATIC_FIELDS, MOCK_STUDENT, DIMENSIONS } from "./types";
import type { CanvasTemplate, CanvasElement, CanvasLayout, DocumentType, PaperSize } from "./types";
import { CanvasMiniPreview } from "./canvas-mini-preview";
// Note: We might need to rename IdCardPreviewModal to DocumentPreviewModal later
import { IdCardPreviewModal } from "./preview-modal";

interface EditorProps {
  template: CanvasTemplate;
  branding: {
    schoolName?: string;
    address?: string;
    phone?: string;
    logoUrl?: string;
    signatureUrl?: string;
    stampUrl?: string;
    primaryColor?: string;
    academicYear?: string;
  };
  onSave: (layout: CanvasLayout) => void;
  onBack: () => void;
}

// Font choices
const FONTS = ["Inter", "Outfit", "Roboto", "Poppins", "Montserrat", "Lato", "Raleway", "Oswald", "Open Sans"];

export function IdCardCanvasEditor({ template, branding, onSave, onBack }: EditorProps) {
  const [layout, setLayout] = useState<CanvasLayout>(template.layout);
  const [history, setHistory] = useState<CanvasLayout[]>([template.layout]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1.5);
  const [showGrid, setShowGrid] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Handle escape key for full screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullScreen]);
  const isPortrait = layout.orientation === "portrait";
  const { width: cardW, height: cardH } = DIMENSIONS[layout.paperSize || "CR80"][layout.orientation];

  const selectedEl = layout.elements.find(e => e.id === selectedId);

  // History management
  const pushHistory = useCallback((newLayout: CanvasLayout) => {
    setHistory(prev => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, newLayout];
    });
    setHistoryIndex(i => i + 1);
    setLayout(newLayout);
  }, [historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setLayout(history[newIndex]);
      setSelectedId(null);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setLayout(history[newIndex]);
    }
  };

  // Add element from panel
  const addElement = (type: CanvasElement["type"], label?: string) => {
    const isImage = ["school_logo", "student_photo", "signature", "stamp"].includes(type);
    const isShape = ["rectangle", "circle", "line"].includes(type);
    const isQR = type === "qr_code";
    
    // Default sizes based on type
    let defaultWidth = 120;
    let defaultHeight = 16;
    
    if (isImage) { defaultWidth = 52; defaultHeight = 52; }
    else if (isShape) { defaultWidth = 80; defaultHeight = type === "line" ? 2 : 80; }
    else if (isQR) { defaultWidth = 44; defaultHeight = 44; }
    else if (type === "certificate_title") { defaultWidth = cardW - 40; defaultHeight = 40; }
    else if (type === "certificate_description") { defaultWidth = cardW - 60; defaultHeight = 80; }

    const newEl: CanvasElement = {
      id: `${type}-${Date.now()}`,
      type,
      label: label || type,
      x: Math.floor(cardW / 2 - defaultWidth / 2),
      y: Math.floor(cardH / 2 - defaultHeight / 2),
      width: defaultWidth,
      height: defaultHeight,
      zIndex: Math.max(0, ...layout.elements.map(e => e.zIndex || 0)) + 1,
      opacity: 1,
      fontSize: type === "certificate_title" ? 24 : 9,
      fontFamily: "Inter",
      fontWeight: type === "certificate_title" ? "bold" : "normal",
      fontStyle: "normal",
      textAlign: type === "certificate_title" ? "center" : "left",
      textColor: layout.bgColor === "#0f172a" ? "#f8fafc" : "#1e293b",
      bgColor: isShape ? (branding.primaryColor || "#dc2626") : "transparent",
      borderRadius: isShape && type !== "line" ? 4 : 0,
      borderWidth: isImage ? 2 : 0,
      borderColor: branding.primaryColor || "#dc2626",
      objectFit: "cover",
      text: type === "text_box" ? "Text Here" : undefined,
      locked: false,
    };

    const newLayout = { ...layout, elements: [...layout.elements, newEl] };
    pushHistory(newLayout);
    setSelectedId(newEl.id);
  };

  // Update selected element property
  const updateEl = (props: Partial<CanvasElement>) => {
    if (!selectedId) return;
    const newLayout = {
      ...layout,
      elements: layout.elements.map(e => e.id === selectedId ? { ...e, ...props } : e)
    };
    pushHistory(newLayout);
  };

  // Delete selected
  const deleteSelected = () => {
    if (!selectedId) return;
    const newLayout = { ...layout, elements: layout.elements.filter(e => e.id !== selectedId) };
    pushHistory(newLayout);
    setSelectedId(null);
  };

  // Duplicate selected
  const duplicateSelected = () => {
    if (!selectedEl) return;
    const copy: CanvasElement = {
      ...selectedEl,
      id: `${selectedEl.type}-${Date.now()}`,
      x: selectedEl.x + 10,
      y: selectedEl.y + 10,
      zIndex: (selectedEl.zIndex || 1) + 1,
    };
    const newLayout = { ...layout, elements: [...layout.elements, copy] };
    pushHistory(newLayout);
    setSelectedId(copy.id);
  };

  // Toggle orientation
  const toggleOrientation = () => {
    const newOrientation = isPortrait ? "landscape" : "portrait";
    const newLayout = { ...layout, orientation: newOrientation as "portrait" | "landscape" };
    pushHistory(newLayout);
    setSelectedId(null);
  };

  // z-index
  const bringForward = () => {
    if (!selectedEl) return;
    updateEl({ zIndex: (selectedEl.zIndex || 1) + 1 });
  };
  const sendBackward = () => {
    if (!selectedEl) return;
    updateEl({ zIndex: Math.max(0, (selectedEl.zIndex || 1) - 1) });
  };

  // Drag on canvas
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    const el = layout.elements.find(el => el.id === id);
    if (!el || el.locked) return;
    e.stopPropagation();
    setSelectedId(id);
    setDragging({ id, startX: e.clientX, startY: e.clientY, origX: el.x, origY: el.y });
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const dx = (e.clientX - dragging.startX) / zoom;
      const dy = (e.clientY - dragging.startY) / zoom;
      const el = layout.elements.find(el => el.id === dragging.id);
      if (!el) return;
      const newX = Math.max(0, Math.min(cardW - el.width, dragging.origX + dx));
      const newY = Math.max(0, Math.min(cardH - el.height, dragging.origY + dy));
      setLayout(prev => ({
        ...prev,
        elements: prev.elements.map(e => e.id === dragging.id ? { ...e, x: Math.round(newX), y: Math.round(newY) } : e)
      }));
    };
    const onUp = () => {
      pushHistory(layout);
      setDragging(null);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, zoom, layout, cardW, cardH, pushHistory]);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 600));
    onSave(layout);
    toast.success("ID Card template saved successfully!");
    setIsSaving(false);
  };

  return (
    <div className={`
      flex flex-col bg-[#f1f5f9] overflow-hidden transition-all duration-500 ease-in-out
      ${isFullScreen ? "fixed inset-0 z-[150] h-screen w-screen shadow-2xl" : "h-full rounded-[2.5rem] border border-slate-200/60 shadow-2xl shadow-slate-200/50"}
    `}>
      
      {/* ===== TOP TOOLBAR ===== */}
      <div className="flex items-center h-16 px-6 bg-white/80 backdrop-blur-md border-b border-slate-200/60 gap-3 shrink-0 relative z-10">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 h-10 px-4 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all">
          <ChevronLeft className="h-4 w-4" />
          <div className="flex items-center gap-3">
            <span className="font-black text-slate-800 tracking-tight text-lg">{template.name}</span>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-black uppercase">
              {layout.paperSize} {layout.orientation}
            </Badge>
          </div>
        </Button>
        <Separator orientation="vertical" className="h-6 mx-2 opacity-50" />
        
        {/* Undo/Redo */}
        <div className="flex items-center bg-slate-100/50 p-1 rounded-xl">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white hover:shadow-sm transition-all" onClick={undo} disabled={historyIndex <= 0} title="Undo">
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white hover:shadow-sm transition-all" onClick={redo} disabled={historyIndex >= history.length - 1} title="Redo">
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 mx-2 opacity-50" />

        {/* Zoom Controls */}
        <div className="flex items-center bg-slate-100/50 p-1 rounded-xl">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white hover:shadow-sm transition-all" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} title="Zoom Out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-[10px] font-black text-slate-500 w-12 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white hover:shadow-sm transition-all" onClick={() => setZoom(z => Math.min(3, z + 0.25))} title="Zoom In">
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 mx-2 opacity-50" />

        {/* Layout Context */}
        <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-slate-900 rounded-xl shadow-lg shadow-slate-200">
          <div className="flex flex-col items-start leading-none gap-1">
             <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">{layout.paperSize || "CR80"} STANDARD</span>
             <span className="text-[10px] font-black text-white uppercase tracking-wider">{layout.documentType?.replace('_', ' ') || "DOCUMENT"}</span>
          </div>
          <Separator orientation="vertical" className="h-4 bg-white/20" />
          <Button variant="ghost" size="sm" className="h-6 px-2 hover:bg-white/10 text-white/70 hover:text-white transition-all gap-1.5 text-[9px] font-black uppercase tracking-widest" onClick={toggleOrientation}>
            <SwitchCamera className="h-3 w-3" />
            {isPortrait ? "Portrait" : "Landscape"}
          </Button>
        </div>

        <div className="flex-1" />

        {/* Primary Actions */}
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-10 rounded-xl gap-2 font-bold text-xs transition-all ${showGrid ? "bg-slate-100 text-primary" : "text-slate-500"}`}
            onClick={() => setShowGrid(!showGrid)}
          >
            <Grid className="h-4 w-4" /> 
            {showGrid ? "Grid On" : "No Grid"}
          </Button>

          <Button variant="outline" size="sm" className="h-10 px-6 rounded-xl border-slate-200 hover:bg-slate-50 font-bold text-xs gap-2 shadow-sm transition-all" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4" /> 
            Live Preview
          </Button>
          
          <Button size="sm" className="h-10 px-8 rounded-xl bg-slate-900 hover:bg-black text-white font-black text-xs gap-2 shadow-xl shadow-slate-200 transition-all active:scale-95" onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 text-primary" /> 
            {isSaving ? "Saving..." : "Deploy Design"}
          </Button>

          <Separator orientation="vertical" className="h-8 mx-1 opacity-50" />

          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 shrink-0 rounded-xl hover:bg-slate-100 transition-all"
            onClick={() => setIsFullScreen(!isFullScreen)}
          >
            {isFullScreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* ===== MAIN 3-COLUMN LAYOUT ===== */}
      <div className="flex flex-1 overflow-hidden">

        {/* ===== LEFT PANEL — ELEMENTS ===== */}
        <div className="w-64 shrink-0 bg-white/40 backdrop-blur-xl border-r border-slate-200/60 overflow-y-auto flex flex-col custom-scrollbar">
          <div className="p-6 border-b border-slate-200/40">
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Component Library</h3>
          </div>
          
          <div className="flex-1 space-y-6 p-6">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                <span className="w-4 h-px bg-slate-200" /> DYNAMIC TOKENS
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {DYNAMIC_FIELDS.map(f => (
                  <button
                    key={f.type}
                    onClick={() => addElement(f.type, f.label)}
                    className="group w-full text-left px-3 py-2.5 rounded-xl text-[11px] font-bold text-slate-600 hover:bg-white hover:text-primary hover:shadow-md hover:shadow-slate-200/50 transition-all flex items-center gap-3 border border-transparent hover:border-slate-100"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-primary transition-colors shrink-0" />
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                <span className="w-4 h-px bg-slate-200" /> STATICS & SHAPES
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {STATIC_FIELDS.map(f => (
                  <button
                    key={f.type}
                    onClick={() => addElement(f.type, f.label)}
                    className="group w-full text-left px-3 py-2.5 rounded-xl text-[11px] font-bold text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-md hover:shadow-slate-200/50 transition-all flex items-center gap-3 border border-transparent hover:border-slate-100"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-slate-800 transition-colors shrink-0" />
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Canvas Styles */}
          <div className="p-6 border-t border-slate-200/40 bg-white/40">
            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-4">Canvas Aesthetics</Label>
            <div className="space-y-4">
               <div>
                  <Label className="text-[10px] text-slate-500 font-bold mb-1.5 block">Background Base</Label>
                  <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-200 shadow-inner shrink-0">
                      <input
                        type="color"
                        value={layout.bgColor}
                        onChange={e => pushHistory({ ...layout, bgColor: e.target.value })}
                        className="absolute inset-[-20%] w-[140%] h-[140%] cursor-pointer"
                      />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">{layout.bgColor}</span>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* ===== CENTER CANVAS ===== */}
        <div
          className="flex-1 overflow-auto bg-slate-200 flex items-center justify-center p-8"
          style={{ backgroundImage: showGrid ? "radial-gradient(circle, #94a3b8 1px, transparent 1px)" : "none", backgroundSize: "20px 20px" }}
          onClick={() => setSelectedId(null)}
        >
          <div
            ref={canvasRef}
            style={{
              width: cardW * zoom,
              height: cardH * zoom,
              background: layout.bgColor,
              position: "relative",
              overflow: "hidden",
              borderRadius: 8,
              boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
              transform: "translateZ(0)",
              flexShrink: 0,
            }}
            onClick={e => e.stopPropagation()}
          >
            {[...layout.elements]
              .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
              .map(el => (
                <CanvasElementRenderer
                  key={el.id}
                  el={el}
                  zoom={zoom}
                  isSelected={selectedId === el.id}
                  branding={branding}
                  onMouseDown={(e) => handleMouseDown(e, el.id)}
                />
              ))}
          </div>
        </div>

        {/* ===== RIGHT PANEL — PROPERTIES ===== */}
        <div className="w-72 shrink-0 bg-white/80 backdrop-blur-xl border-l border-slate-200/60 overflow-y-auto custom-scrollbar">
          {selectedEl ? (
            <div className="flex flex-col">
              {/* Element header */}
              <div className="p-6 border-b border-slate-200/40 flex items-center justify-between bg-white/30">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none mb-1.5">Contextual Styling</p>
                  <p className="text-sm font-black text-slate-900">{selectedEl.label || selectedEl.type}</p>
                </div>
                <div className="flex gap-1.5">
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white hover:shadow-md transition-all" onClick={duplicateSelected} title="Duplicate">
                    <Copy className="h-4 w-4 text-slate-400" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-rose-50 text-rose-500 hover:text-rose-600 transition-all" onClick={deleteSelected} title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="p-6 space-y-8">
                {/* Position & Size */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Position & Size</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "X", key: "x" },
                      { label: "Y", key: "y" },
                      { label: "W", key: "width" },
                      { label: "H", key: "height" },
                    ].map(({ label, key }) => (
                      <div key={key}>
                        <Label className="text-[10px] text-slate-500 font-medium">{label}</Label>
                        <Input
                          type="number"
                          value={Math.round((selectedEl as any)[key])}
                          onChange={e => updateEl({ [key]: Number(e.target.value) })}
                          className="h-7 text-xs px-2 mt-0.5"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rotation & Opacity */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] text-slate-500 font-medium">Rotation°</Label>
                    <Input
                      type="number"
                      value={selectedEl.rotation || 0}
                      onChange={e => updateEl({ rotation: Number(e.target.value) })}
                      className="h-7 text-xs px-2 mt-0.5"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-slate-500 font-medium">Opacity %</Label>
                    <Input
                      type="number"
                      min={0} max={1} step={0.05}
                      value={selectedEl.opacity ?? 1}
                      onChange={e => updateEl({ opacity: Number(e.target.value) })}
                      className="h-7 text-xs px-2 mt-0.5"
                    />
                  </div>
                </div>

                {/* Layering */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Layering</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-7 text-xs flex-1 gap-1" onClick={bringForward}>
                      <ArrowUp className="h-3 w-3" /> Forward
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs flex-1 gap-1" onClick={sendBackward}>
                      <ArrowDown className="h-3 w-3" /> Backward
                    </Button>
                  </div>
                </div>

                {/* Lock */}
                <div className="flex items-center justify-between py-1">
                  <Label className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                    {selectedEl.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                    Lock Position
                  </Label>
                  <Switch
                    checked={selectedEl.locked || false}
                    onCheckedChange={v => updateEl({ locked: v })}
                  />
                </div>

                <Separator />

                {/* TEXT STYLES */}
                {!["rectangle", "circle", "line", "school_logo", "student_photo", "signature", "stamp", "qr_code", "barcode"].includes(selectedEl.type) && (
                  <>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Text Style</p>
                      
                      {/* Font Family */}
                      <div className="mb-2">
                        <Label className="text-[10px] text-slate-500 font-medium">Font Family</Label>
                        <select
                          value={selectedEl.fontFamily || "Inter"}
                          onChange={e => updateEl({ fontFamily: e.target.value })}
                          className="w-full mt-0.5 h-7 text-xs border border-slate-200 rounded-md px-2 bg-white"
                        >
                          {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>

                      {/* Size & Weight */}
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                          <Label className="text-[10px] text-slate-500 font-medium">Size (px)</Label>
                          <Input
                            type="number"
                            min={5} max={72}
                            value={selectedEl.fontSize || 8}
                            onChange={e => updateEl({ fontSize: Number(e.target.value) })}
                            className="h-7 text-xs px-2 mt-0.5"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-slate-500 font-medium">Color</Label>
                          <div className="relative h-7 rounded border border-slate-200 overflow-hidden mt-0.5">
                            <input
                              type="color"
                              value={selectedEl.textColor || "#000000"}
                              onChange={e => updateEl({ textColor: e.target.value })}
                              className="absolute inset-[-20%] w-[140%] h-[140%] cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Line Height & Letter Spacing */}
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div>
                          <Label className="text-[10px] text-slate-500 font-medium">Line Height</Label>
                          <Input
                            type="number"
                            min={0.5} max={3} step={0.1}
                            value={selectedEl.lineHeight || 1.2}
                            onChange={e => updateEl({ lineHeight: Number(e.target.value) })}
                            className="h-7 text-xs px-2 mt-0.5"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-slate-500 font-medium">Spacing (px)</Label>
                          <Input
                            type="number"
                            min={-5} max={20}
                            value={selectedEl.letterSpacing || 0}
                            onChange={e => updateEl({ letterSpacing: Number(e.target.value) })}
                            className="h-7 text-xs px-2 mt-0.5"
                          />
                        </div>
                      </div>

                      {/* Bold, Italic, Align */}
                      <div className="flex gap-1">
                        <Button
                          variant={selectedEl.fontWeight === "bold" ? "default" : "outline"}
                          size="icon" className="h-7 w-7"
                          onClick={() => updateEl({ fontWeight: selectedEl.fontWeight === "bold" ? "normal" : "bold" })}
                        >
                          <Bold className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant={selectedEl.fontStyle === "italic" ? "default" : "outline"}
                          size="icon" className="h-7 w-7"
                          onClick={() => updateEl({ fontStyle: selectedEl.fontStyle === "italic" ? "normal" : "italic" })}
                        >
                          <Italic className="h-3.5 w-3.5" />
                        </Button>
                        <div className="flex-1" />
                        {(["left", "center", "right"] as const).map(align => (
                          <Button
                            key={align}
                            variant={selectedEl.textAlign === align ? "default" : "outline"}
                            size="icon" className="h-7 w-7"
                            onClick={() => updateEl({ textAlign: align })}
                          >
                            {align === "left" ? <AlignLeft className="h-3.5 w-3.5" /> : align === "center" ? <AlignCenter className="h-3.5 w-3.5" /> : <AlignRight className="h-3.5 w-3.5" />}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Static text edit */}
                    {(selectedEl.type === "text_box") && (
                      <div>
                        <Label className="text-[10px] text-slate-500 font-medium block mb-1">Text Content</Label>
                        <Input
                          value={selectedEl.text || ""}
                          onChange={e => updateEl({ text: e.target.value })}
                          className="h-7 text-xs px-2"
                          placeholder="Enter text..."
                        />
                      </div>
                    )}
                    <Separator />
                  </>
                )}

                {/* SHAPE / FILL STYLES */}
                {["rectangle", "circle", "line"].includes(selectedEl.type) && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Shape Style</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] text-slate-500 font-medium">Fill Color</Label>
                        <div className="relative h-7 rounded border border-slate-200 overflow-hidden mt-0.5">
                          <input type="color" value={selectedEl.bgColor || "#000000"} onChange={e => updateEl({ bgColor: e.target.value })} className="absolute inset-[-20%] w-[140%] h-[140%] cursor-pointer" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-[10px] text-slate-500 font-medium">Border Color</Label>
                        <div className="relative h-7 rounded border border-slate-200 overflow-hidden mt-0.5">
                          <input type="color" value={selectedEl.borderColor || "#000000"} onChange={e => updateEl({ borderColor: e.target.value })} className="absolute inset-[-20%] w-[140%] h-[140%] cursor-pointer" />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <Label className="text-[10px] text-slate-500 font-medium">Border Width</Label>
                        <Input type="number" min={0} value={selectedEl.borderWidth || 0} onChange={e => updateEl({ borderWidth: Number(e.target.value) })} className="h-7 text-xs px-2 mt-0.5" />
                      </div>
                      <div>
                        <Label className="text-[10px] text-slate-500 font-medium">Border Radius</Label>
                        <Input type="number" min={0} value={selectedEl.borderRadius || 0} onChange={e => updateEl({ borderRadius: Number(e.target.value) })} className="h-7 text-xs px-2 mt-0.5" />
                      </div>
                    </div>
                  </div>
                )}

                {/* IMAGE STYLES */}
                {["school_logo", "student_photo", "signature", "stamp"].includes(selectedEl.type) && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Image Style</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] text-slate-500 font-medium">Border Color</Label>
                        <div className="relative h-7 rounded border border-slate-200 overflow-hidden mt-0.5">
                          <input type="color" value={selectedEl.borderColor || "#ffffff"} onChange={e => updateEl({ borderColor: e.target.value })} className="absolute inset-[-20%] w-[140%] h-[140%] cursor-pointer" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-[10px] text-slate-500 font-medium">Border Width</Label>
                        <Input type="number" min={0} value={selectedEl.borderWidth || 0} onChange={e => updateEl({ borderWidth: Number(e.target.value) })} className="h-7 text-xs px-2 mt-0.5" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <Label className="text-[10px] text-slate-500 font-medium">Border Radius (px)</Label>
                      <Input type="number" min={0} value={selectedEl.borderRadius || 0} onChange={e => updateEl({ borderRadius: Number(e.target.value) })} className="h-7 text-xs px-2 mt-0.5" />
                    </div>
                    <div className="mt-2">
                      <Label className="text-[10px] text-slate-500 font-medium block mb-1">Object Fit</Label>
                      <select
                        value={selectedEl.objectFit || "cover"}
                        onChange={e => updateEl({ objectFit: e.target.value as any })}
                        className="w-full h-7 text-xs border border-slate-200 rounded-md px-2 bg-white"
                      >
                        <option value="cover">Cover</option>
                        <option value="contain">Contain</option>
                        <option value="fill">Fill</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <RotateCcw className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium">Click an element on the canvas to edit its properties</p>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <IdCardPreviewModal
          layout={layout}
          branding={branding}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

// ---- Canvas Element Renderer ----
interface ElementRendererProps {
  el: CanvasElement;
  zoom: number;
  isSelected: boolean;
  branding: EditorProps["branding"];
  onMouseDown: (e: React.MouseEvent) => void;
}

function CanvasElementRenderer({ el, zoom, isSelected, branding, onMouseDown }: ElementRendererProps) {
  const s = el;
  const style: React.CSSProperties = {
    position: "absolute",
    left: s.x * zoom,
    top: s.y * zoom,
    width: s.width * zoom,
    height: s.height * zoom,
    opacity: s.opacity ?? 1,
    transform: s.rotation ? `rotate(${s.rotation}deg)` : undefined,
    zIndex: s.zIndex || 1,
    cursor: s.locked ? "not-allowed" : "move",
    boxSizing: "border-box",
    userSelect: "none",
  };

  const selectionStyle: React.CSSProperties = isSelected ? {
    outline: "2.5px solid #437ef1",
    outlineOffset: 1,
    boxShadow: "0 0 0 4px rgba(67, 126, 241, 0.15), 0 8px 24px rgba(0,0,0,0.15)",
  } : {};

  if (s.type === "rectangle" || s.type === "line") {
    return (
      <div
        onMouseDown={onMouseDown}
        style={{
          ...style,
          ...selectionStyle,
          backgroundColor: s.bgColor || "transparent",
          borderRadius: (s.borderRadius || 0) * zoom / 8,
          border: s.borderWidth && s.borderColor ? `${s.borderWidth}px solid ${s.borderColor}` : "none",
        }}
      />
    );
  }

  if (s.type === "circle") {
    return (
      <div
        onMouseDown={onMouseDown}
        style={{
          ...style,
          ...selectionStyle,
          backgroundColor: s.bgColor || "transparent",
          borderRadius: "50%",
          border: s.borderWidth && s.borderColor ? `${s.borderWidth}px solid ${s.borderColor}` : "none",
        }}
      />
    );
  }

  if (s.type === "school_logo") {
    return (
      <div
        onMouseDown={onMouseDown}
        style={{
          ...style,
          ...selectionStyle,
          borderRadius: (s.borderRadius ?? 4) * zoom / 8,
          border: s.borderWidth && s.borderColor ? `${s.borderWidth}px solid ${s.borderColor}` : "none",
          backgroundColor: "#f8fafc",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {branding.logoUrl ? (
          <img src={branding.logoUrl} alt="Logo" style={{ width: "100%", height: "100%", objectFit: s.objectFit || "contain" }} />
        ) : (
          <div style={{ fontSize: 7 * zoom, color: "#94a3b8", fontWeight: "bold" }}>LOGO</div>
        )}
      </div>
    );
  }

  if (s.type === "student_photo") {
    return (
      <div
        onMouseDown={onMouseDown}
        style={{
          ...style,
          ...selectionStyle,
          borderRadius: s.borderRadius !== undefined ? s.borderRadius * zoom / 8 : 4,
          border: s.borderWidth && s.borderColor ? `${s.borderWidth}px solid ${s.borderColor}` : "none",
          backgroundColor: "#e2e8f0",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg viewBox="0 0 24 24" fill="#94a3b8" style={{ width: "50%", height: "50%" }}>
          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
        </svg>
      </div>
    );
  }

  if (s.type === "signature") {
    return (
      <div
        onMouseDown={onMouseDown}
        style={{ ...style, ...selectionStyle, display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        {branding.signatureUrl ? (
          <img src={branding.signatureUrl} alt="Sig" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        ) : (
          <div style={{ width: "90%", borderBottom: `1.5px solid #64748b` }} />
        )}
      </div>
    );
  }

  if (s.type === "qr_code") {
    return (
      <div onMouseDown={onMouseDown} style={{ ...style, ...selectionStyle, padding: 3, backgroundColor: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <QRCode value={MOCK_STUDENT.admission_number} size={Math.min(s.width, s.height) * zoom - 6} />
      </div>
    );
  }

  if (s.type === "barcode") {
    return (
      <div onMouseDown={onMouseDown} style={{ ...style, ...selectionStyle, display: "flex", gap: 1, padding: 3, backgroundColor: "#fff", alignItems: "stretch" }}>
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} style={{ flex: i % 3 === 0 ? 2 : 1, backgroundColor: "#1e293b", height: "100%", borderRadius: 0.5 }} />
        ))}
      </div>
    );
  }

  // Text element — show live token value
  const DYNAMIC_TEXT_TYPES = [
    "student_name", "father_name", "mother_name", "class_section", "admission_number", 
    "dob", "blood_group", "contact_number", "address", "academic_year",
    "issue_date", "certificate_title", "certificate_description", "achievement_rank", "event_name"
  ];
  let displayText = s.text || "";
  
  // Resolve {{tokens}} using a central logic
  const resolveTokens = (t: string) => {
    return String(t)
      .replace(/\{\{school_name\}\}/g, branding.schoolName || "YOUR SCHOOL NAME")
      .replace(/\{\{school_address\}\}/g, branding.address || "School Address, City")
      .replace(/\{\{school_phone\}\}/g, branding.phone || "9876543210")
      .replace(/\{\{academic_year\}\}/g, branding.academicYear || MOCK_STUDENT.academic_year)
      .replace(/\{\{student_name\}\}/g, "{{student_name}}")
      .replace(/\{\{father_name\}\}/g, "{{father_name}}")
      .replace(/\{\{mother_name\}\}/g, "{{mother_name}}")
      .replace(/\{\{class_section\}\}/g, "{{class_section}}")
      .replace(/\{\{admission_number\}\}/g, "{{admission_number}}")
      .replace(/\{\{dob\}\}/g, "{{dob}}")
      .replace(/\{\{date\}\}/g, "{{date}}")
      .replace(/\{\{title\}\}/g, "{{title}}")
      .replace(/\{\{desc\}\}/g, "{{desc}}");
  };

  if (s.text) {
    displayText = resolveTokens(s.text);
  } else if (DYNAMIC_TEXT_TYPES.includes(s.type)) {
    // Show raw token in editor for clarity
    displayText = `{{${s.type}}}`;
  }

  const isMultiline = s.type === "certificate_description" || s.type === "address" || s.type === "text_box";

  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        ...style,
        ...selectionStyle,
        display: "flex",
        alignItems: isMultiline ? "flex-start" : "center",
        fontSize: (s.fontSize || 8) * zoom,
        fontFamily: s.fontFamily ? `'${s.fontFamily}', sans-serif` : "Inter, sans-serif",
        fontWeight: s.fontWeight || "normal",
        fontStyle: s.fontStyle || "normal",
        textAlign: s.textAlign || "left",
        color: s.textColor || "#1e293b",
        backgroundColor: s.bgColor || "transparent",
        lineHeight: s.lineHeight || 1.2,
        letterSpacing: s.letterSpacing ? `${s.letterSpacing}px` : "normal",
        padding: (isMultiline ? 4 : 0) * zoom,
        justifyContent: s.textAlign === "center" ? "center" : s.textAlign === "right" ? "flex-end" : "flex-start",
        whiteSpace: isMultiline ? "normal" : "nowrap",
        overflow: "hidden",
        wordBreak: isMultiline ? "break-word" : "normal",
      }}
    >
      {displayText}
    </div>
  );
}
