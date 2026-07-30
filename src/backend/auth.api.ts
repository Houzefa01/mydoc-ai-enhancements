import { supabase } from "@/integrations/supabase/client";

export interface SignUpInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
  birthDate?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

export const authApi = {
  onAuthStateChange(callback: (userId: string | null) => void) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user.id ?? null);
    });
    return () => data.subscription.unsubscribe();
  },

  async currentUserId(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.user.id ?? null;
  },

  async signIn(email: string, password: string): Promise<string | null> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  },

  async signUp(input: SignUpInput): Promise<string | null> {
    const { error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          name: input.name,
          phone: input.phone ?? "",
          birth_date: input.birthDate ?? "",
          address: input.address ?? "",
          city: input.city ?? "",
          postal_code: input.postalCode ?? "",
          country: input.country ?? "",
        },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    return error?.message ?? null;
  },

  async signInWithGoogle(): Promise<string | null> {
    const { lovable } = await import("@/integrations/lovable/index");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    return result.error ? String(result.error) : null;
  },

  async sendPasswordReset(email: string): Promise<string | null> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return error?.message ?? null;
  },

  async changePassword(email: string, current: string, next: string): Promise<string | null> {
    const { error: checkError } = await supabase.auth.signInWithPassword({
      email,
      password: current,
    });
    if (checkError) return "Mot de passe actuel incorrect.";
    const { error } = await supabase.auth.updateUser({ password: next });
    return error?.message ?? null;
  },

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  },
};