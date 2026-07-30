import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { adminListFailedExports, adminRetryExport } from "@/backend/admin.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/exports")({ component: AdminExportsPage });

function AdminExportsPage() {
  const listJobs = useServerFn(adminListFailedExports);
  const retry = useServerFn(adminRetryExport);
  const queryClient = useQueryClient();

  const { data: jobs = [], isPending } = useQuery({
    queryKey: ["admin", "failed-exports"],
    queryFn: () => listJobs(),
  });

  const retryMutation = useMutation({
    mutationFn: (jobId: string) => retry({ data: { jobId } }),
    onSuccess: () => {
      toast.success("Export remis en file d'attente.");
      queryClient.invalidateQueries({ queryKey: ["admin", "failed-exports"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isPending) return <p className="text-sm text-ink-soft">Chargement des exports…</p>;
  if (jobs.length === 0)
    return <p className="text-sm text-ink-soft">Aucun export en échec. Tout va bien.</p>;

  return (
    <div className="overflow-x-auto rounded-lg border border-rule">
      <table className="w-full text-sm">
        <thead className="bg-card text-left text-ink-soft">
          <tr>
            <th className="px-4 py-3 font-medium">Document</th>
            <th className="px-4 py-3 font-medium">Propriétaire</th>
            <th className="px-4 py-3 font-medium">Format</th>
            <th className="px-4 py-3 font-medium">Erreur</th>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rule">
          {jobs.map((j) => (
            <tr key={j.id}>
              <td className="px-4 py-3 font-medium">{j.documentTitle}</td>
              <td className="px-4 py-3 font-numeric text-xs break-all text-ink-mute">
                {j.ownerEmail}
              </td>
              <td className="px-4 py-3 uppercase tracking-wide text-ink-soft">{j.format}</td>
              <td className="max-w-xs px-4 py-3 text-ink-soft">{j.errorMessage}</td>
              <td className="px-4 py-3 font-numeric tabular-nums text-ink-soft">
                {new Date(j.createdAt).toLocaleDateString("fr-FR")}
              </td>
              <td className="px-4 py-3 text-right">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={retryMutation.isPending}
                  onClick={() => retryMutation.mutate(j.id)}
                >
                  Relancer
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}