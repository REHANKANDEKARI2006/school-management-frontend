import { useState, useEffect, useRef, useCallback } from "react";
import { formatExactTimestamp, getCachedData, setCachedData } from "@/lib/dashboardCache";

interface UseLeaveSSEOptions {
  /** Called to refetch data (mount, manual refresh) */
  onRefresh: () => Promise<void>;
  /** Set to true to delay connection until identity is resolved */
  enabled: boolean;
  /** Optional pageKey for reading/writing localStorage cache */
  pageKey?: string;
}

interface UseLeaveSSEReturn {
  /** true when SSE connection is open */
  sseConnected: boolean;
  /** true while a manual refresh is in progress */
  refreshing: boolean;
  /** Timestamp when data was last updated */
  lastUpdated: number | null;
  /** Exact time text like "Last updated - 2:15 PM" */
  lastUpdatedText: string;
  /** Setter for lastUpdated timestamp */
  setLastUpdated: (ts: number) => void;
  /** Call to trigger a manual data refresh */
  manualRefresh: () => Promise<void>;
}

export function useLeaveSSE({ onRefresh, enabled, pageKey }: UseLeaveSSEOptions): UseLeaveSSEReturn {
  const [sseConnected, setSseConnected] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdatedState] = useState<number | null>(() => {
    if (pageKey) {
      const cached = getCachedData(pageKey);
      return cached ? cached.timestamp : null;
    }
    return null;
  });
  const lastUpdatedText = formatExactTimestamp(lastUpdated);
  const refreshInFlight = useRef(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const setLastUpdated = useCallback((ts: number) => {
    setLastUpdatedState(ts);
  }, []);

  // SSE connection lifecycle — maintains real-time status indication
  useEffect(() => {
    if (!enabled) return;

    const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    const baseUrl =
      envUrl && envUrl.includes("://")
        ? envUrl.endsWith("/api")
          ? envUrl.slice(0, -4)
          : envUrl
        : `http://${hostname}:5000`;

    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    function connectSSE() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        const streamUrl = `${baseUrl}/api/leaves/stream${token ? `?token=${encodeURIComponent(token)}` : ""}`;
        const es = new EventSource(streamUrl, { withCredentials: true });
        eventSourceRef.current = es;

        es.onopen = () => {
          setSseConnected(true);
        };

        es.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "update") {
              onRefreshRef.current();
            }
          } catch (e) {
            console.error("Error parsing SSE message:", e);
          }
        };

        es.onerror = () => {
          setSseConnected(false);
          if (es.readyState === EventSource.CLOSED) {
            reconnectTimer = setTimeout(connectSSE, 5000);
          }
        };
      } catch (err) {
        console.error("SSE connection error:", err);
        setSseConnected(false);
        reconnectTimer = setTimeout(connectSSE, 5000);
      }
    }

    connectSSE();

    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      setSseConnected(false);
    };
  }, [enabled]);

  // Manual refresh with in-flight guard
  const manualRefresh = useCallback(async () => {
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;
    setRefreshing(true);
    try {
      await onRefreshRef.current();
      const now = Date.now();
      setLastUpdatedState(now);
    } finally {
      setRefreshing(false);
      refreshInFlight.current = false;
    }
  }, []);

  return { sseConnected, refreshing, lastUpdated, lastUpdatedText, setLastUpdated: setLastUpdated, manualRefresh };
}
