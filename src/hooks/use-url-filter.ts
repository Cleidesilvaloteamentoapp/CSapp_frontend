"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * A filter whose value lives in the URL.
 *
 * List screens used to hold every filter in local state, so a dashboard tile
 * could only ever link to the unfiltered page and leave the admin to re-pick
 * the filter by hand. Keeping it in the URL makes the tile's count and the rows
 * on screen the same thing, and survives a reload or a shared link.
 */
export function useUrlFilter(
  key: string,
  defaultValue: string
): [string, (value: string) => void] {
  const router = useRouter();
  const searchParams = useSearchParams();
  const value = searchParams.get(key) ?? defaultValue;

  const setValue = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === defaultValue) params.delete(key);
      else params.set(key, next);
      const qs = params.toString();
      // replace, not push: filtering is not a navigation step the back button
      // should have to walk through.
      router.replace(qs ? `?${qs}` : window.location.pathname);
    },
    [key, defaultValue, router, searchParams]
  );

  return [value, setValue];
}
