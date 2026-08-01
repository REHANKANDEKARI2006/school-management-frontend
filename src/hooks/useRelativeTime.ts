import { useState, useEffect } from "react";

/**
 * Lightweight relative-time formatter.
 * Returns human-readable strings like "just now", "2 minutes ago", "1 hour ago".
 * Updates automatically every 30 seconds so the displayed text stays current.
 */
export function useRelativeTime(timestamp: number | null): string {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!timestamp) return;
    const timer = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(timer);
  }, [timestamp]);

  if (!timestamp) return "";

  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds} seconds ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) return "1 minute ago";
  if (minutes < 60) return `${minutes} minutes ago`;

  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "1 hour ago";
  if (hours < 24) return `${hours} hours ago`;

  return "over a day ago";
}
