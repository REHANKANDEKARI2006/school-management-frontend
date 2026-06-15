"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import axios from "@/lib/axios";
import { useRouter } from "next/navigation";

const WARNING_TIME = 60; // seconds before expiry
const IDLE_LIMIT = 3600;  // 1 hour idle allowed

export function useSessionManager() {
  const router = useRouter();
  const [showPopup, setShowPopup] = useState(false);

  // 🕒 Track last user activity
  const lastActivityRef = useRef(Date.now());

  // 🔄 Update activity
  const updateActivity = () => {
    lastActivityRef.current = Date.now();
    // console.log("🖱️ User active");
  };

  // 🔒 Logout
  const logout = useCallback(() => {
    console.log("⛔ Auto logout");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role_id");
    router.push("/auth/login");
  }, [router]);

  // 🔄 Silent refresh
  const silentRefresh = useCallback(async () => {
    try {
      console.log("🔄 Silent refresh");
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) return logout();

      const res = await axios.post("/api/auth/refresh-token", {
        refreshToken,
      });

      localStorage.setItem("accessToken", res.data.accessToken);
    } catch {
      logout();
    }
  }, [logout]);

  // 🔁 Main session loop
  useEffect(() => {
    console.log("🟢 Session manager STARTED");

    const interval = setInterval(() => {
      const token = localStorage.getItem("accessToken");
      if (!token) return logout();

      const payload = JSON.parse(atob(token.split(".")[1]));
      const now = Math.floor(Date.now() / 1000);
      const timeLeft = payload.exp - now;

      const idleTime =
        (Date.now() - lastActivityRef.current) / 1000;

      console.log("⏱️ timeLeft:", timeLeft, "idle:", idleTime);

      // 🟢 Active user → silent refresh
      if (timeLeft <= WARNING_TIME && idleTime < IDLE_LIMIT) {
        silentRefresh();
        setShowPopup(false);
      }

      // 🟡 Idle user → show popup
      if (timeLeft <= WARNING_TIME && idleTime >= IDLE_LIMIT) {
        setShowPopup(true);
      }

      // 🔴 Expired → logout
      if (timeLeft <= 0) {
        logout();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [logout, silentRefresh]);

  // 🖱️ Listen to activity
  useEffect(() => {
    const markActive = () => {
      lastActivityRef.current = Date.now();
      // console.log("👤 User interaction");
    };

    window.addEventListener("keydown", markActive);
    window.addEventListener("click", markActive);
    window.addEventListener("scroll", markActive);

    return () => {
      window.removeEventListener("keydown", markActive);
      window.removeEventListener("click", markActive);
      window.removeEventListener("scroll", markActive);
    };
  }, []);


  return {
    showPopup,
    continueSession: silentRefresh,
    logout,
  };
}
