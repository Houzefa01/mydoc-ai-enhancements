import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Indique si une session est disponible dans le navigateur.
 * Sert à ne déclencher les appels serveur authentifiés qu'une fois le jeton
 * présent : sans cela l'appel part sans en-tête et échoue en « Unauthorized ».
 */
export function useSessionReady(): { ready: boolean; hasSession: boolean } {
  const [state, setState] = useState<{ ready: boolean; hasSession: boolean }>({
    ready: false,
    hasSession: false,
  });

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setState({ ready: true, hasSession: Boolean(data.session) });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ ready: true, hasSession: Boolean(session) });
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
