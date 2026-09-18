"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getAdminUnreadCount } from "@/services/admin";

const POLL_INTERVAL = 30_000; // 30 seconds

export function useAdminNotifications() {
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCount = useCallback(async () => {
    try {
      const res = await getAdminUnreadCount();
      setUnreadCount(res.unread_count ?? 0);
      setError(false);
    } catch {
      // Keep the last known count rather than implying "nothing unread".
      setError(true);
    }
  }, []);

  useEffect(() => {
    fetchCount();
    intervalRef.current = setInterval(fetchCount, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchCount]);

  return { unreadCount: unreadCount ?? 0, loaded: unreadCount !== null, error, refresh: fetchCount };
}
