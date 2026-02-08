"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center">
      <ShieldAlert className="h-16 w-16 text-red-500" />
      
      <h1 className="text-2xl font-bold">Access Denied</h1>
      
      <p className="text-muted-foreground max-w-md">
        You do not have permission to access this page.
        Please contact the administrator if you think this is a mistake.
      </p>

      <Button onClick={() => router.back()}>
        Go Back
      </Button>
    </div>
  );
}
