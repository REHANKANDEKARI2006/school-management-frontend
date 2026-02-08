"use client";

import { Button } from "@/components/ui/button";

export default function SessionPopup({
  onContinue,
  onLogout,
}: {
  onContinue: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg p-6 w-[360px] text-center shadow-lg">
        <h2 className="text-lg font-semibold mb-2">
          Session Expiring Soon
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Your session will expire in 2 minutes. Do you want to continue?
        </p>

        <div className="flex gap-3 justify-center">
          <Button onClick={onContinue}>Continue</Button>
          <Button variant="destructive" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
