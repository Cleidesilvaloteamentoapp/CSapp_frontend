"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getPendingCycleCount } from "@/services/admin";
import type { CyclePendingCount } from "@/types";

const POLL_INTERVAL = 60_000; // 1 minute

const EMPTY: CyclePendingCount = {
  pending: 0,
  final_cycle: 0,
  blocked_by_unpaid: 0,
};

/**
 * Live count of renewals waiting on the admin.
 *
 * The sidebar used to render a hard-coded "!" that was always lit, so it said
 * the same thing whether there were zero renewals or forty -- and admins
 * learned to ignore it. This returns the real number, or null while unknown,
 * so the badge can stay hidden rather than cry wolf.
 */
export function usePendingCycles() {
  const [counts, setCounts] = useState<CyclePendingCount | null>(null);
  const [error, setError] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCounts = useCallback(async () => {
    try {
      setCounts(await getPendingCycleCount());
      setError(false);
    } catch {
      // Keep the last known figure: showing 0 would read as "nothing pending".
      setError(true);
    }
  }, []);

  useEffect(() => {
    fetchCounts();
    intervalRef.current = setInterval(fetchCounts, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchCounts]);

  return {
    counts: counts ?? EMPTY,
    loaded: counts !== null,
    error,
    refresh: fetchCounts,
  };
}
