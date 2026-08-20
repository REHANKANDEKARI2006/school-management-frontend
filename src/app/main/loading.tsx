import React from "react";
import { PageSkeleton } from "@/components/ui/skeletons";

export default function MainLoading() {
  return (
    <div className="p-4 sm:p-6 w-full animate-in fade-in duration-300">
      <PageSkeleton rows={6} />
    </div>
  );
}
