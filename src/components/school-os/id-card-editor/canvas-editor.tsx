"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import QRCode from "react-qr-code";
import { 
  Undo2, Redo2, ZoomIn, ZoomOut, Eye, Save, ChevronLeft,
  RotateCcw, Lock, Unlock, Trash2, Copy, ArrowUp, ArrowDown,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, Grid, SwitchCamera,
  Maximize2, Minimize2, PanelLeft, Settings2
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
  const [isMobile, setIsMobile] = useState(false);
  const [activeSidebar, setActiveSidebar] = useState<'none' | 'elements' | 'properties'>('none');

  const canvasRef = useRef<HTMLDivElement>(null);

  const isPortrait = layout.orientation === "portrait";
  const { width: cardW, height: cardH } = DIMENSIONS[layout.paperSize || "CR80"][layout.orientation];

  // Detect mobile and handle resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-zoom on mobile to fit screen
  useEffect(() => {
    if (isMobile && cardW) {
      const containerW = window.innerWidth - 48; // 24px padding on each side
      const fitZoom = containerW / cardW;
      setZoom(Math.min(1.2, fitZoom));
    }
  }, [isMobile, cardW]);

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
  const handleStart = (clientX: number, clientY: number, id: string) => {
    const el = layout.elements.find(el => el.id === id);
    if (!el || el.locked) return;
    setSelectedId(id);
    setDragging({ id, startX: clientX, startY: clientY, origX: el.x, origY: el.y });
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    handleStart(e.clientX, e.clientY, id);
  };

  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    e.stopPropagation();
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY, id);
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (clientX: number, clientY: number) => {
      const dx = (clientX - dragging.startX) / zoom;
      const dy = (clientY - dragging.startY) / zoom;
      const el = layout.elements.find(el => el.id === dragging.id);
      if (!el) return;
      const newX = Math.max(0, Math.min(cardW - el.width, dragging.origX + dx));
      const newY = Math.max(0, Math.min(cardH - el.height, dragging.origY + dy));
      setLayout(prev => ({
        ...prev,
        elements: prev.elements.map(e => e.id === dragging.id ? { ...e, x: Math.round(newX), y: Math.round(newY) } : e)
      }));
    };

    const handleMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      onMove(touch.clientX, touch.clientY);
    };

    const onUp = () => {
      pushHistory(layout);
      setDragging(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", onUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", onUp);
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
      flex flex-col bg-slate-50 overflow-hidden transition-all duration-500 ease-in-out
      ${isFullScreen ? "fixed inset-0 z-[150] h-screen w-screen shadow-2xl" : "h-full border-t border-slate-200"}
    `}>
      
      {/* ===== TOP TOOLBAR ===== */}
      <div className="flex items-center h-16 px-4 md:px-6 bg-white border-b border-slate-200 gap-2 md:gap-3 shrink-0 relative z-10">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 h-10 px-2 md:px-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all">
          <ChevronLeft className="h-4 w-4" />
          {!isMobile && (
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-800 text-base">{template.name}</span>
              <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none text-[10px] font-bold uppercase px-2 py-0">
                {layout.paperSize} • {layout.orientation}
              </Badge>
            </div>
          )}
        </Button>

        {isMobile && (
          <Button 
            variant="ghost" size="icon" 
            className={`h-10 w-10 rounded-xl transition-all ${activeSidebar === 'elements' ? 'bg-primary/10 text-primary' : 'text-slate-500'}`}
            onClick={() => setActiveSidebar(activeSidebar === 'elements' ? 'none' : 'elements')}
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
        )}

        <Separator orientation="vertical" className="h-6 mx-1 md:mx-2 opacity-50" />
        
        {/* Undo/Redo */}
        <div className="flex items-center bg-slate-50 p-1 rounded-lg border border-slate-200">
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-white hover:shadow-sm transition-all" onClick={undo} disabled={historyIndex <= 0} title="Undo">
            <Undo2 className="h-4 w-4" />
          </Button>
          {!isMobile && (
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-white hover:shadow-sm transition-all" onClick={redo} disabled={historyIndex >= history.length - 1} title="Redo">
              <Redo2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {!isMobile && (
          <>
            <Separator orientation="vertical" className="h-6 mx-2 opacity-50" />
            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-50 p-1 rounded-lg border border-slate-200">
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-white hover:shadow-sm transition-all" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} title="Zoom Out">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-[10px] font-bold text-slate-500 w-12 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-white hover:shadow-sm transition-all" onClick={() => setZoom(z => Math.min(3, z + 0.25))} title="Zoom In">
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        <div className="flex-1" />

        {/* Primary Actions */}
        <div className="flex items-center gap-1.5 md:gap-2">
          {isMobile && selectedId && (
            <Button 
              variant="ghost" size="icon" 
              className={`h-10 w-10 rounded-xl transition-all ${activeSidebar === 'properties' ? 'bg-primary/10 text-primary' : 'text-slate-500'}`}
              onClick={() => setActiveSidebar(activeSidebar === 'properties' ? 'none' : 'properties')}
            >
              <Settings2 className="h-5 w-5" />
            </Button>
          )}

          {!isMobile && (
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-10 rounded-lg gap-2 font-bold text-xs transition-all ${showGrid ? "bg-primary/5 text-primary" : "text-slate-500"}`}
              onClick={() => setShowGrid(!showGrid)}
            >
              <Grid className="h-4 w-4" /> 
              {showGrid ? "Grid On" : "No Grid"}
            </Button>
          )}

          <Button variant="outline" size="sm" className="h-10 px-2 md:px-4 rounded-lg border-slate-200 hover:bg-slate-50 font-bold text-xs gap-2 shadow-sm transition-all" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4" /> 
            {!isMobile && "Preview"}
          </Button>
          
          <Button size="sm" className="h-10 px-4 md:px-6 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-xs gap-2 shadow-sm transition-all active:scale-95" onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4" /> 
            {!isMobile && (isSaving ? "Saving..." : "Deploy Design")}
          </Button>

          {!isMobile && (
            <>
              <Separator orientation="vertical" className="h-8 mx-1 opacity-50" />
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 shrink-0 rounded-xl hover:bg-slate-100 transition-all"
                onClick={() => setIsFullScreen(!isFullScreen)}
              >
                {isFullScreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ===== MAIN 3-COLUMN LAYOUT ===== */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Mobile Sidebar Overlay */}
        {isMobile && activeSidebar !== 'none' && (
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[90] transition-opacity"
            onClick={() => setActiveSidebar('none')}
          />
        )}

        {/* ===== LEFT PANEL — ELEMENTS ===== */}
        <div className={`
          ${isMobile ? "fixed inset-y-0 left-0 z-[100] w-[80%] max-w-[300px] shadow-2xl transition-transform duration-300 transform" : "w-64 shrink-0 border-r"}
          ${isMobile && activeSidebar !== 'elements' ? "-translate-x-full" : "translate-x-0"}
          bg-white border-slate-200 overflow-y-auto flex flex-col custom-scrollbar
        `}>
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Component Library</h3>
          </div>
          
          <div className="flex-1 space-y-6 p-4">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-2">Dynamic Tokens</p>
              <div className="grid grid-cols-1 gap-1">
                {DYNAMIC_FIELDS.map(f => (
                  <button
                    key={f.type}
                    onClick={() => addElement(f.type, f.label)}
                    className="group w-full text-left px-3 py-2 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-primary/5 hover:text-primary transition-all flex items-center gap-2 border border-transparent"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-primary transition-colors shrink-0" />
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-2">Statics & Shapes</p>
              <div className="grid grid-cols-1 gap-1">
                {STATIC_FIELDS.map(f => (
                  <button
                    key={f.type}
                    onClick={() => addElement(f.type, f.label)}
                    className="group w-full text-left px-3 py-2 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-2 border border-transparent"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-slate-800 transition-colors shrink-0" />
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Canvas Styles */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <Label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-3">Canvas Aesthetics</Label>
            <div className="space-y-3">
               <div>
                  <Label className="text-[10px] text-slate-500 font-bold mb-1.5 block">Background Base</Label>
                  <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-slate-200">
                    <div className="relative w-6 h-6 rounded-md overflow-hidden border border-slate-200 shrink-0">
                      <input
                        type="color"
                        value={layout.bgColor}
                        onChange={e => pushHistory({ ...layout, bgColor: e.target.value })}
                        className="absolute inset-[-20%] w-[140%] h-[140%] cursor-pointer"
                      />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex-1">{layout.bgColor}</span>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* ===== CENTER CANVAS ===== */}
        <div
          className={`flex-1 overflow-auto bg-slate-200 flex items-center justify-center ${isMobile ? "p-4" : "p-8"}`}
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
                  onTouchStart={(e) => handleTouchStart(e, el.id)}
                />
              ))}
          </div>
        </div>

        {/* ===== RIGHT PANEL — PROPERTIES ===== */}
        <div className={`
          ${isMobile ? "fixed inset-y-0 right-0 z-[100] w-[80%] max-w-[300px] shadow-2xl transition-transform duration-300 transform" : "w-72 shrink-0 border-l"}
          ${isMobile && activeSidebar !== 'properties' ? "translate-x-full" : "translate-x-0"}
          bg-white border-slate-200 overflow-y-auto custom-scrollbar
        `}>
          {selectedEl ? (
            <div className="flex flex-col">
              {/* Element header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-none mb-1">Properties</p>
                  <p className="text-xs font-bold text-slate-900">{selectedEl.label || selectedEl.type}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white hover:border-slate-200 border border-transparent transition-all" onClick={duplicateSelected} title="Duplicate">
                    <Copy className="h-3.5 w-3.5 text-slate-400" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-rose-50 text-rose-500 hover:text-rose-600 transition-all" onClick={deleteSelected} title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
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
  onTouchStart: (e: React.TouchEvent) => void;
}

function CanvasElementRenderer({ el, zoom, isSelected, branding, onMouseDown, onTouchStart }: ElementRendererProps) {
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
        onTouchStart={onTouchStart}
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
        onTouchStart={onTouchStart}
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
        onTouchStart={onTouchStart}
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
        onTouchStart={onTouchStart}
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
        onTouchStart={onTouchStart}
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
      <div 
        onMouseDown={onMouseDown} 
        onTouchStart={onTouchStart}
        style={{ ...style, ...selectionStyle, padding: 3, backgroundColor: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <QRCode value={MOCK_STUDENT.admission_number} size={Math.min(s.width, s.height) * zoom - 6} />
      </div>
    );
  }

  if (s.type === "barcode") {
    return (
      <div 
        onMouseDown={onMouseDown} 
        onTouchStart={onTouchStart}
        style={{ ...style, ...selectionStyle, display: "flex", gap: 1, padding: 3, backgroundColor: "#fff", alignItems: "stretch" }}
      >
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
      onTouchStart={onTouchStart}
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
