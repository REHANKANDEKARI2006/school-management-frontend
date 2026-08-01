/**
 * dashboardCache.ts — Persistent user-scoped localStorage caching utility
 * for Dashboard summaries and Leave pages.
 */

export function getCurrentUserId(): string {
  if (typeof window === "undefined") return "guest";

  const userId = localStorage.getItem("user_id");
  if (userId) return userId;

  const token = localStorage.getItem("accessToken");
  if (token) {
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload?.user_id) return String(payload.user_id);
        if (payload?.id) return String(payload.id);
        if (payload?.sub) return String(payload.sub);
      }
    } catch {
      // ignore parse error
    }
  }

  const staffId = localStorage.getItem("staff_id");
  if (staffId) return `staff_${staffId}`;

  const email = localStorage.getItem("user_email");
  if (email) return email.replace(/[^a-zA-Z0-9]/g, "_");

  return "default";
}

export interface CachedData<T = any> {
  data: T;
  timestamp: number;
}

export function getCachedData<T = any>(pageKey: string): CachedData<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const userId = getCurrentUserId();
    const key = `cache_${userId}_${pageKey}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.data && typeof parsed.timestamp === "number") {
      return parsed;
    }
    return null;
  } catch (err) {
    console.warn("Failed to read from localStorage cache:", err);
    return null;
  }
}

export function setCachedData<T = any>(pageKey: string, data: T, timestamp: number = Date.now()): void {
  if (typeof window === "undefined") return;
  try {
    const userId = getCurrentUserId();
    const key = `cache_${userId}_${pageKey}`;
    const entry: CachedData<T> = { data, timestamp };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (err) {
    console.warn("Failed to write to localStorage cache:", err);
  }
}

export function clearAllUserCaches(): void {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("cache_")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (err) {
    console.warn("Failed to clear localStorage caches:", err);
  }
}

/**
 * Format timestamp into exact human-readable date/time string (Requirement 5):
 * - Today: "Last updated - 2:15 PM"
 * - Previous days: "Last updated - Jul 31, 2:15 PM"
 */
export function formatExactTimestamp(timestamp: number | null | undefined): string {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) {
    return `Last updated - ${timeStr}`;
  }

  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return `Last updated - ${dateStr}, ${timeStr}`;
}
