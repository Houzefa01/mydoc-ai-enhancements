import { createFileRoute, Link, Outlet, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck } from "lucide-react";
import { adminIsAdmin } from "@/backend/admin.functions";
import { AppShell } from "@/components/app/AppShell";

export const Route = createFileRoute("/admin")({
  // La vérification du rôle se fait via un appel serveur authentifié par le
  // jeton du navigateur : ce rendu doit donc rester côté client.
  ssr: false,
  head: () => ({
    meta: [
      { title: "Administration — myDoc IA" },
      {
        name: "description",
        content:
          "Espace d'administration myDoc IA : comptes, crédits, exports en échec et statistiques d'usage.",
      },
      { property: "og:title", content: "Administration — myDoc IA" },
      {
        property: "og:description",
        content: "Gestion des comptes, des crédits et suivi des exports de myDoc IA.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const tabs = [
  { to: "/admin", label: "Statistiques", exact: true },
  { to: "/admin/users", label: "Comptes" },
  { to: "/admin/exports", label: "Exports en échec" },
] as const;

function AdminLayout() {
  const check = useServerFn(adminIsAdmin);
  const { data, isPending, isFetching } = useQuery({
    queryKey: ["admin", "is-admin"],
    queryFn: () => check(),
    retry: 1,
  });

  return (
    <AppShell>
      {isPending || isFetching ? (
        <p className="text-sm text-ink-soft">Vérification des droits…</p>
      ) : !data?.isAdmin ? (
        <Navigate to="/dashboard" />
      ) : (
        <div className="space-y-8">
          <header className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-brass" aria-hidden />
            <div>
              <h1 className="text-2xl font-semibold">Administration</h1>
              <p className="text-sm text-ink-soft">
                Comptes, crédits, exports en échec et statistiques d'usage.
              </p>
            </div>
          </header>

          <nav className="flex flex-wrap gap-2 border-b border-rule pb-3">
            {tabs.map((t) => (
              <Link
                key={t.to}
                to={t.to}
                activeOptions={{ exact: "exact" in t }}
                activeProps={{ className: "bg-brass-soft text-brass border-brass/40" }}
                className="rounded-md border border-rule px-3 py-1.5 text-sm text-ink-soft hover:text-ink"
              >
                {t.label}
              </Link>
            ))}
          </nav>

          <Outlet />
        </div>
      )}
    </AppShell>
  );
}