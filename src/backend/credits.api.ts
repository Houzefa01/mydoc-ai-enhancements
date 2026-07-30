import { supabase } from "@/integrations/supabase/client";
import { mapTransaction, type Row } from "./mappers";
import type { CreditBalance } from "./types";

export const creditsApi = {
  async get(userId: string): Promise<CreditBalance> {
    const [{ data: c }, { data: tx }] = await Promise.all([
      supabase.from("credits").select("*").eq("user_id", userId).maybeSingle(),
      supabase
        .from("credit_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    return {
      balance: (c as Row | null)?.balance ?? 0,
      transactions: ((tx ?? []) as Row[]).map(mapTransaction),
    };
  },

  async adjust(userId: string, amount: number, label: string, current: number): Promise<void> {
    const next = Math.max(0, current + amount);
    await supabase.from("credits").update({ balance: next }).eq("user_id", userId);
    await supabase.from("credit_transactions").insert({ user_id: userId, label, amount });
  },
};