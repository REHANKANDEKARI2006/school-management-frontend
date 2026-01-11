
"use client";

import * as React from "react";
import { type Event } from "./event-form";
import { useIdCardSettings } from "./id-card-settings-provider";
import { Button } from "@/components/ui/button";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EventCertificateDialogProps {
  event: Event;
}

const SealIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48" fill="#d4af37" stroke="#b8860b" strokeWidth="2" />
        <circle cx="50" cy="50" r="40" fill="none" stroke="#fff" strokeWidth="1" strokeDasharray="5,5"/>
        <text x="50" y="55" fontFamily="serif" fontSize="12" fill="#b8860b" textAnchor="middle" fontWeight="bold">AWARD</text>
    </svg>
);

export function EventCertificateDialog({ event }: EventCertificateDialogProps) {
  const { settings } = useIdCardSettings();
  const [recipientName, setRecipientName] = React.useState("");
  const [showCertificate, setShowCertificate] = React.useState(false);

  const handleGenerate = () => {
    if (recipientName.trim()) {
      setShowCertificate(true);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById("certificate-content");
    const windowUrl = 'about:blank';
    const uniqueName = new Date().getTime();
    const windowName = 'Print' + uniqueName;
    const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');

    if (printWindow && printContent) {
        printWindow.document.write('<html><head><title>Print Certificate</title>');
        printWindow.document.write('<link rel="stylesheet" href="/_next/static/css/app/layout.css" type="text/css" media="print">'); // Simplified path
        printWindow.document.write(`<style>@media print { body { -webkit-print-color-adjust: exact; } #certificate-content { transform: scale(0.95); margin: auto; } }</style>`);
        printWindow.document.write('</head><body>');
        printWindow.document.write(printContent.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
    }
  };

  return (
    <DialogContent className="sm:max-w-4xl p-0">
      <DialogHeader className="p-6 pb-0 sr-only">
        <DialogTitle>Generate Certificate</DialogTitle>
        <DialogDescription>
          Enter the recipient's name to generate a certificate of appreciation.
        </DialogDescription>
      </DialogHeader>
      
      {!showCertificate ? (
        <div className="p-6">
            <h3 className="text-lg font-medium mb-2">Generate Certificate for {event.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">Enter the recipient's full name to create their certificate.</p>
            <div className="grid gap-2">
                <Label htmlFor="recipient-name">Recipient's Name</Label>
                <Input
                id="recipient-name"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="e.g., Andrew Scott"
                />
            </div>
            <Button onClick={handleGenerate} className="mt-4 w-full">Generate Certificate</Button>
        </div>

      ) : (
        <div className="bg-gray-50 p-4">
            <div id="certificate-content" className="w-[800px] h-[600px] bg-white p-8 relative flex flex-col font-serif border-2 border-gray-300 shadow-lg">
                {/* Decorative Borders */}
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
                        For their outstanding participation and contribution to the event "{event.name}". 
                        Your dedication and effort are highly valued and have greatly contributed to the success of this event.
                    </p>
                    
                    <div className="mt-12 flex justify-between items-end px-8">
                        <div className="text-left">
                            <p className="font-semibold text-lg">{new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            <hr className="border-gray-600 my-1"/>
                            <p className="text-sm font-bold tracking-widest text-gray-500">DATE</p>
                        </div>

                        <div className="mx-4">
                            <SealIcon />
                        </div>
                        
                        <div className="text-right">
                            <p className="font-semibold text-lg" style={{ fontFamily: 'Brush Script MT, cursive' }}>{settings.slogan || "Dr. Rodrigo Mattos"}</p>
                            <hr className="border-gray-600 my-1"/>
                            <p className="text-sm font-bold tracking-widest text-gray-500">REPRESENTATIVE</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="w-[800px] mx-auto mt-4 flex justify-between">
                <Button variant="outline" onClick={() => setShowCertificate(false)}>Back to Edit</Button>
                <Button onClick={handlePrint}>Print Certificate</Button>
            </div>
        </div>
      )}
    </DialogContent>
  );
}

