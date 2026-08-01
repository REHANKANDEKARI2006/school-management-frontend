"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, Check, RefreshCw } from "lucide-react";
import axios from "@/lib/axios";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Configurable polling interval in milliseconds (5 minutes)
const NOTIFICATION_POLL_INTERVAL_MS = 300000; // 300 seconds / 5 minutes

export function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchNotifications = useCallback(async (isManual = false) => {
    if (typeof window === "undefined") return;
    if (!isManual && document.visibilityState !== "visible") return; // Skip polling when tab is inactive/hidden

    const token = localStorage.getItem("accessToken");
    if (!token) return; // Skip fetch if user is logged out

    if (isManual) setIsRefreshing(true);
    try {
      const res = await axios.get("/api/notifications/my-notifications", {
        skipGlobalErrorLogging: true,
      } as any);
      if (res.data.success) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.data.filter((n: any) => !n.is_read).length);
      }
    } catch (err) {
      // Silently fail if session expires or network error
    } finally {
      if (isManual) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => fetchNotifications(false), NOTIFICATION_POLL_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchNotifications(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchNotifications]);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      fetchNotifications(true); // Always fetch fresh notifications on dropdown open
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await axios.patch(`/api/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.notification_id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.patch("/api/notifications/read-all");
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-[1.2rem] w-[1.2rem]" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="font-semibold">Notifications</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchNotifications(true)}
              disabled={isRefreshing}
              className="h-6 w-6 text-slate-400 hover:text-slate-600"
              title="Refresh notifications"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-6 text-xs text-blue-600 px-2">
                Mark all as read
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup className="max-h-[300px] overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((notif: any) => (
              <DropdownMenuItem 
                key={notif.notification_id} 
                className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${!notif.is_read ? 'bg-blue-50/50' : ''}`}
                onClick={(e) => {
                  e.preventDefault(); // Keep menu open
                  if (!notif.is_read) markAsRead(notif.notification_id);
                }}
              >
                <div className="flex w-full justify-between items-start gap-2">
                   <span className={`font-semibold text-sm ${!notif.is_read ? 'text-blue-700' : 'text-slate-800'}`}>
                     {notif.title}
                   </span>
                   {notif.is_read && <Check className="h-3 w-3 text-slate-400 mt-1" />}
                </div>
                <span className="text-xs text-slate-500 whitespace-normal line-clamp-3">
                  {notif.message}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 font-medium">
                  {new Date(notif.created_at).toLocaleString()}
                </span>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-slate-500">
              No recent notifications
            </div>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
