"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import axios from "@/lib/axios";
import { useRouter } from "next/navigation";

// ── Configuration ────────────────────────────────────────────────────────────
const IDLE_TIMEOUT       = 10 * 60; // 10 minutes of inactivity → show popup
const POPUP_COUNTDOWN    = 120;     // 2-minute countdown on the popup before auto-logout
const CHECK_INTERVAL     = 15_000;  // check every 15 seconds (not every 1s!)
const REFRESH_BUFFER     = 60;      // refresh token when <60s left on access token

export function useSessionManager() {
  const router = useRouter();
  const [showPopup, setShowPopup]     = useState(false);
  const [countdown, setCountdown]     = useState(POPUP_COUNTDOWN);

  const lastActivityRef   = useRef(Date.now());
  const popupTimerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRefreshingRef   = useRef(false);

  // ── Reset activity timestamp ───────────────────────────────────────────
  const markActive = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // ── Logout (clear everything) ──────────────────────────────────────────
  const logout = useCallback(() => {
    // Clear any popup countdown
    if (popupTimerRef.current) {
      clearInterval(popupTimerRef.current);
      popupTimerRef.current = null;
    }

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role_id");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_name");
    localStorage.removeItem("student_id");
    localStorage.removeItem("class_id");
    localStorage.removeItem("isAuthenticated");
    sessionStorage.clear();

    router.push("/auth/login?session=expired");
  }, [router]);

  // ── Silent token refresh ───────────────────────────────────────────────
  const silentRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;

    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        logout();
        return;
      }

      const res = await axios.post("/api/auth/refresh-token", { refreshToken });

      if (res.data.success && res.data.accessToken) {
        localStorage.setItem("accessToken", res.data.accessToken);
      } else {
        logout();
      }
    } catch {
      logout();
    } finally {
      isRefreshingRef.current = false;
    }
  }, [logout]);

  // ── Continue session (dismiss popup + refresh) ─────────────────────────
  const continueSession = useCallback(() => {
    // Stop the countdown
    if (popupTimerRef.current) {
      clearInterval(popupTimerRef.current);
      popupTimerRef.current = null;
    }

    setShowPopup(false);
    setCountdown(POPUP_COUNTDOWN);
    markActive();
    silentRefresh();
  }, [silentRefresh, markActive]);

  // ── Start the popup countdown timer ────────────────────────────────────
  const startPopupCountdown = useCallback(() => {
    // Don't start twice
    if (popupTimerRef.current) return;

    setCountdown(POPUP_COUNTDOWN);
    setShowPopup(true);

    popupTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Time's up → force logout
          logout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [logout]);

  // ── Main session check (runs every CHECK_INTERVAL) ─────────────────────
  useEffect(() => {
    const checkSession = () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        logout();
        return;
      }

      // Decode JWT to get expiry
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const now = Math.floor(Date.now() / 1000);
        const timeLeft = payload.exp - now;

        // Token already expired
        if (timeLeft <= 0) {
          logout();
          return;
        }

        // Check idle time
        const idleSeconds = (Date.now() - lastActivityRef.current) / 1000;

        // If popup is already showing, don't interfere
        if (showPopup) return;

        // 🟡 User is idle beyond threshold → show popup
        if (idleSeconds >= IDLE_TIMEOUT) {
          startPopupCountdown();
          return;
        }

        // 🟢 User is active and token is about to expire → silent refresh
        if (timeLeft <= REFRESH_BUFFER) {
          silentRefresh();
        }
      } catch {
        // Malformed token
        logout();
      }
    };

    // Run immediately, then at intervals
    checkSession();
    const interval = setInterval(checkSession, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [logout, silentRefresh, showPopup, startPopupCountdown]);

  // ── Listen to user activity events ─────────────────────────────────────
  useEffect(() => {
    // Throttle activity updates to avoid excessive updates
    let throttleTimer: ReturnType<typeof setTimeout> | null = null;
    const throttledMarkActive = () => {
      if (throttleTimer) return;
      markActive();
      throttleTimer = setTimeout(() => {
        throttleTimer = null;
      }, 2000); // At most once every 2 seconds
    };

    const events = ["keydown", "click", "scroll", "mousemove", "touchstart"];
    events.forEach((e) => window.addEventListener(e, throttledMarkActive, { passive: true }));

    return () => {
      events.forEach((e) => window.removeEventListener(e, throttledMarkActive));
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [markActive]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (popupTimerRef.current) {
        clearInterval(popupTimerRef.current);
      }
    };
  }, []);

  return {
    showPopup,
    countdown,
    continueSession,
    logout,
  };
}
