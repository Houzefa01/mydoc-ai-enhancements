import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminStats } from "@/backend/admin.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/admin/")({ component: AdminStatsPage });

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-ink-soft">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-numeric text-3xl tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

function AdminStatsPage() {
  const fetchStats = useServerFn(adminStats);
  const { data, isPending } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => fetchStats(),
  });

  if (isPending) return <p className="text-sm text-ink-soft">Chargement des statistiques…</p>;
  if (!data) return <p className="text-sm text-ink-soft">Statistiques indisponibles.</p>;

  const formats = Object.entries(data.exportsByFormat30d);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Comptes au total" value={data.totalUsers} />
        <Stat label="Nouveaux comptes (30 j)" value={data.newUsers30d} />
        <Stat label="Projets créés (30 j)" value={data.projects30d} />
        <Stat label="Exports en échec (30 j)" value={data.failedExports30d} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exports réussis par format (30 derniers jours)</CardTitle>
        </CardHeader>
        <CardContent>
          {formats.length === 0 ? (
            <p className="text-sm text-ink-soft">Aucun export sur la période.</p>
          ) : (
            <ul className="divide-y divide-rule">
              {formats.map(([format, count]) => (
                <li key={format} className="flex items-center justify-between py-2 text-sm">
                  <span className="uppercase tracking-wide text-ink-soft">{format}</span>
                  <span className="font-numeric tabular-nums">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}