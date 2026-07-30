import { useEffect, useState } from "react";

/**
 * State persisted in localStorage, hydration-safe:
 * the first render always uses `initial` (same output on server and client),
 * the stored value is read in an effect after hydration.
 *
 * BACKEND: à remplacer par la session serveur / la base de données.
 */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      // valeur corrompue : on garde l'état initial
    }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // quota dépassé : on ignore
    }
  }, [key, value, hydrated]);

  return [value, setValue, hydrated] as const;
}
