"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getAdminUnreadCount } from "@/services/admin";

const POLL_INTERVAL = 30_000; // 30 seconds

export function useAdminNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCount = useCallback(async () => {
    try {
      const res = await getAdminUnreadCount();
      setUnreadCount(res.unread_count ?? 0);
    } catch {
      // Silently ignore polling errors
    }
  }, []);

  useEffect(() => {
    fetchCount();
    intervalRef.current = setInterval(fetchCount, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchCount]);

  return { unreadCount, refresh: fetchCount };
}
