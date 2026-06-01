import type {Metadata} from 'next';
import './globals.css';
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { GlobalProcessLoader } from "@/components/ui/global-process-loader";
import { NavigationLoader } from "@/components/ui/navigation-loader";

export const metadata: Metadata = {
  title: 'CampusConnect',
  description: 'A modern school management system',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;700&family=Source+Code+Pro&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        {children}
        <ShadcnToaster />
        <SonnerToaster richColors position="top-right" />
        <GlobalProcessLoader />
        <NavigationLoader />
      </body>
    </html>
  );
}
