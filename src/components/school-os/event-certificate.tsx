"use client";

import * as React from "react";
import { type Event } from "./event-form";
import { useIdCardSettings } from "./id-card-settings-provider";
import { Button } from "@/components/ui/button";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarIcon, Download, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import { cn, formatDate } from "@/lib/utils";

interface EventCertificateDialogProps {
  event: Event;
}

const SealIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="48" fill="#d4af37" stroke="#b8860b" strokeWidth="2" />
    <circle cx="50" cy="50" r="40" fill="none" stroke="#fff" strokeWidth="1" strokeDasharray="5,5" />
    <text x="50" y="55" fontFamily="serif" fontSize="12" fill="#b8860b" textAnchor="middle" fontWeight="bold">AWARD</text>
  </svg>
);

export function EventCertificateDialog({ event }: EventCertificateDialogProps) {
  const { settings } = useIdCardSettings();
  const [recipientName, setRecipientName] = React.useState("");
  const [showCertificate, setShowCertificate] = React.useState(false);
  const [scale, setScale] = React.useState(1);
  const [downloading, setDownloading] = React.useState(false);

  React.useEffect(() => {
    const updateScale = () => {
      const containerWidth = Math.min(800, window.innerWidth - 48);
      setScale(containerWidth / 800);
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const handleGenerate = () => {
    if (recipientName.trim()) {
      setShowCertificate(true);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    const element = document.getElementById("certificate-content");
    if (!element) return;
    
    setDownloading(true);
    try {
      const originalTransform = element.style.transform;
      element.style.transform = 'none';
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: 800,
        windowHeight: 600
      });
      
      element.style.transform = originalTransform;
      
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.setAttribute("download", `Certificate_${recipientName.replace(/\s+/g, '_')}.png`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[95vh] p-0 border shadow-2xl rounded-2xl flex flex-col overflow-hidden left-[50%] top-[50%] -translate-x-[50%] -translate-y-[50%]">
      <DialogHeader className="p-6 pb-4 bg-slate-50/50 border-b shrink-0">
        <DialogTitle>Generate Certificate</DialogTitle>
        <DialogDescription>
          Enter the recipient's name to generate a certificate of appreciation.
        </DialogDescription>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto">
        {!showCertificate ? (
          <div className="p-6">
            <h3 className="text-lg font-medium mb-2 text-slate-900">Generate Certificate for {event.event_name}</h3>
            <p className="text-sm text-muted-foreground mb-4 font-medium uppercase tracking-wider text-[10px]">Enter the recipient's full name to create their certificate.</p>
            <div className="grid gap-2">
              <Label htmlFor="recipient-name" className="text-xs font-bold uppercase text-slate-500">Recipient's Name</Label>
              <Input
                id="recipient-name"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="e.g., Andrew Scott"
                className="h-11"
              />
            </div>
            <Button onClick={handleGenerate} className="mt-4 w-full h-11 font-bold uppercase tracking-widest text-xs">Generate Certificate</Button>
          </div>
        ) : (
          <div className="bg-slate-50 p-4 sm:p-8 flex flex-col items-center">
             <div className="w-full flex justify-center py-6 bg-slate-200/30 overflow-hidden">
               <div 
                 className="relative" 
                 style={{ 
                   width: 800 * scale, 
                   height: 600 * scale
                 }}
               >
                 <div 
                   id="certificate-content" 
                   className="w-[800px] h-[600px] bg-white p-8 relative flex flex-col font-serif border-2 border-gray-300 shadow-2xl transition-all"
                   style={{ 
                     width: '800px',
                     height: '600px',
                     transform: `scale(${scale})`,
                     transformOrigin: 'top left',
                     position: 'absolute',
                     top: 0,
                     left: 0
                   }}
                 >
                  <div className="absolute top-8 left-8 w-32 h-16 border-t-4 border-l-4 border-yellow-600"></div>
                  <div className="absolute top-8 right-8 w-32 h-16 border-t-4 border-r-4 border-[#0c2340]"></div>
                  <div className="absolute bottom-8 left-8 w-16 h-32 border-b-4 border-l-4 border-[#0c2340]"></div>
                  <div className="absolute bottom-8 right-8 w-16 h-32 border-b-4 border-r-4 border-yellow-600"></div>

                  <div className="relative z-10 text-center flex-grow flex flex-col justify-center">
                    <h1 className="text-5xl font-bold tracking-wider text-gray-800">CERTIFICATE</h1>
                    <h2 className="text-2xl text-gray-600 mt-2">Of Appreciation</h2>

                    <p className="mt-8 text-lg text-gray-500">This certificate is presented to</p>

                    <p className="text-5xl font-cursive text-gray-900 my-4" style={{ fontFamily: 'Brush Script MT, cursive' }}>{recipientName}</p>

                    <p className="max-w-lg mx-auto text-sm text-gray-600">
                      For their outstanding participation and contribution to the event "{event.event_name}".
                      Your dedication and effort are highly valued and have greatly contributed to the success of this event.
                    </p>

                    <div className="mt-12 flex justify-between items-end px-8">
                      <div className="text-left">
                        <p className="font-semibold text-lg">{event.event_date ? formatDate(event.event_date) : "N/A"}</p>
                        <hr className="border-gray-600 my-1" />
                        <p className="text-sm font-bold tracking-widest text-gray-500">DATE</p>
                      </div>

                      <div className="mx-4">
                        <SealIcon />
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-lg" style={{ fontFamily: 'Brush Script MT, cursive' }}>{settings.slogan || "Dr. Rodrigo Mattos"}</p>
                        <hr className="border-gray-600 my-1" />
                        <p className="text-sm font-bold tracking-widest text-gray-500">REPRESENTATIVE</p>
                      </div>
                    </div>
                  </div>
                 </div>
               </div>
            </div>
            <div className="w-full sm:w-[800px] mx-auto mt-4 flex flex-wrap justify-between gap-2 px-4 pb-4">
              <Button variant="outline" onClick={() => setShowCertificate(false)} className="flex-1 sm:flex-none">Back to Edit</Button>
              <div className="flex gap-2 flex-1 sm:flex-none">
                <Button 
                  variant="secondary" 
                  onClick={handleDownload} 
                  className="flex-1 gap-2"
                  disabled={downloading}
                >
                  {downloading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download
                    </>
                  )}
                </Button>
                <Button onClick={handlePrint} className="flex-1">Print Certificate</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DialogContent>
  );
}
