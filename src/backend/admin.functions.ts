import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type {
  AdminExportJob,
  AdminStats,
  AdminUserRow,
  ExportFormat,
} from "./admin.types";

/**
 * Espace admin — toutes les fonctions ci-dessous vérifient le rôle CÔTÉ SERVEUR.
 * L'interface ne fait que masquer les écrans : elle n'autorise rien.
 */

/** Lève une erreur si l'appelant n'a pas le rôle `admin`. */
async function assertAdmin(context: {
  supabase: { from: (t: string) => any };
  userId: string;
}): Promise<void> {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Accès refusé : rôle administrateur requis.");
}

export const adminIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    return { isAdmin: Boolean(data) };
  });

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminUserRow[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: profiles }, { data: credits }, { data: projects }, { data: roles }] =
      await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select("id, email, name, created_at, suspended")
          .order("created_at", { ascending: false }),
        supabaseAdmin.from("credits").select("user_id, balance"),
        supabaseAdmin.from("projects").select("owner_id"),
        supabaseAdmin.from("user_roles").select("user_id, role"),
      ]);

    const balanceOf = new Map<string, number>();
    for (const c of credits ?? []) balanceOf.set(c.user_id, c.balance);
    const projectCount = new Map<string, number>();
    for (const p of projects ?? [])
      projectCount.set(p.owner_id, (projectCount.get(p.owner_id) ?? 0) + 1);
    const admins = new Set((roles ?? []).filter((r) => r.role === "admin").map((r) => r.user_id));

    return (profiles ?? []).map((p) => ({
      id: p.id,
      email: p.email ?? "",
      name: p.name ?? "",
      createdAt: p.created_at,
      balance: balanceOf.get(p.id) ?? 0,
      projectCount: projectCount.get(p.id) ?? 0,
      suspended: Boolean(p.suspended),
      isAdmin: admins.has(p.id),
    }));
  });

export const adminAdjustCredits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string; amount: number; reason: string }) => {
    if (!data.userId) throw new Error("Utilisateur manquant.");
    if (!Number.isFinite(data.amount) || data.amount === 0)
      throw new Error("Indiquez un montant non nul.");
    if (!data.reason.trim()) throw new Error("Le motif est obligatoire.");
    return { userId: data.userId, amount: Math.trunc(data.amount), reason: data.reason.trim() };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row } = await supabaseAdmin
      .from("credits")
      .select("balance")
      .eq("user_id", data.userId)
      .maybeSingle();
    const current = row?.balance ?? 0;
    const next = Math.max(0, current + data.amount);

    await supabaseAdmin
      .from("credits")
      .upsert({ user_id: data.userId, balance: next }, { onConflict: "user_id" });

    // Tracé dans l'historique de transactions existant, avec le motif saisi.
    await supabaseAdmin.from("credit_transactions").insert({
      user_id: data.userId,
      label: `Ajustement administrateur — ${data.reason}`,
      amount: next - current,
    });

    return { balance: next };
  });

export const adminSetSuspended = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string; suspended: boolean }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId)
      throw new Error("Vous ne pouvez pas suspendre votre propre compte.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ suspended: data.suspended })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { suspended: data.suspended };
  });

export const adminListFailedExports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminExportJob[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: jobs } = await supabaseAdmin
      .from("export_jobs")
      .select("id, owner_id, document_id, format, status, error_message, created_at")
      .eq("status", "echec")
      .order("created_at", { ascending: false })
      .limit(200);

    const documentIds = [...new Set((jobs ?? []).map((j) => j.document_id))];
    const { data: documents } = documentIds.length
      ? await supabaseAdmin.from("documents").select("id, project_id").in("id", documentIds)
      : { data: [] as { id: string; project_id: string }[] };

    const projectIds = [...new Set((documents ?? []).map((d) => d.project_id))];
    const { data: projects } = projectIds.length
      ? await supabaseAdmin.from("projects").select("id, title, type").in("id", projectIds)
      : { data: [] as { id: string; title: string; type: string }[] };

    const ownerIds = [...new Set((jobs ?? []).map((j) => j.owner_id))];
    const { data: profiles } = ownerIds.length
      ? await supabaseAdmin.from("profiles").select("id, email").in("id", ownerIds)
      : { data: [] as { id: string; email: string | null }[] };

    const projectOf = new Map((documents ?? []).map((d) => [d.id, d.project_id]));
    const projectById = new Map((projects ?? []).map((p) => [p.id, p]));
    const emailById = new Map((profiles ?? []).map((p) => [p.id, p.email ?? ""]));

    return (jobs ?? []).map((j) => {
      const project = projectById.get(projectOf.get(j.document_id) ?? "");
      return {
        id: j.id,
        format: j.format as ExportFormat,
        documentTitle: project?.title ?? "Document supprimé",
        documentType: project?.type ?? "rapport",
        ownerEmail: emailById.get(j.owner_id) ?? "",
        errorMessage: j.error_message ?? "Erreur inconnue.",
        createdAt: j.created_at,
      };
    });
  });

export const adminRetryExport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { jobId: string }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // La génération du fichier est produite par l'application du propriétaire :
    // on remet le job en file d'attente et on efface l'erreur précédente.
    const { error } = await supabaseAdmin
      .from("export_jobs")
      .update({ status: "en_attente", error_message: null })
      .eq("id", data.jobId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminStats> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

    const [{ count: totalUsers }, { count: newUsers }, { count: totalProjects }] =
      await Promise.all([
        supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
        supabaseAdmin
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .gte("created_at", since),
        supabaseAdmin
          .from("projects")
          .select("id", { count: "exact", head: true })
          .gte("created_at", since),
      ]);

    const { data: exports } = await supabaseAdmin
      .from("export_jobs")
      .select("format, status")
      .gte("created_at", since);

    const byFormat: Record<string, number> = {};
    let failed = 0;
    for (const e of exports ?? []) {
      if (e.status === "echec") failed += 1;
      else byFormat[e.format] = (byFormat[e.format] ?? 0) + 1;
    }

    return {
      totalUsers: totalUsers ?? 0,
      newUsers30d: newUsers ?? 0,
      projects30d: totalProjects ?? 0,
      exportsByFormat30d: byFormat,
      failedExports30d: failed,
    };
  });