"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getUnreadCount } from "@/services/portal";

const POLL_INTERVAL = 30_000; // 30 seconds

export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCount = useCallback(async () => {
    try {
      const res = await getUnreadCount();
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
