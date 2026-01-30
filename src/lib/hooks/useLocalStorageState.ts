"use client";

import { useEffect, useState } from "react";
import { getJSON, setJSON } from "@/lib/storage";

export function useLocalStorageState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = getJSON<T | null>(key, null);
    if (stored !== null) {
      setState(stored);
    }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    setJSON(key, state);
  }, [key, state, hydrated]);

  return [state, setState] as const;
}
