import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { adminAdjustCredits, adminListUsers, adminSetSuspended } from "@/backend/admin.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/users")({ component: AdminUsersPage });

function AdminUsersPage() {
  const listUsers = useServerFn(adminListUsers);
  const adjust = useServerFn(adminAdjustCredits);
  const setSuspended = useServerFn(adminSetSuspended);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [target, setTarget] = useState<{ id: string; email: string } | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const { data: users = [], isPending } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => listUsers(),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] });

  const adjustMutation = useMutation({
    mutationFn: (input: { userId: string; amount: number; reason: string }) =>
      adjust({ data: input }),
    onSuccess: (res) => {
      toast.success(`Nouveau solde : ${res.balance} crédits.`);
      setTarget(null);
      setAmount("");
      setReason("");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const suspendMutation = useMutation({
    mutationFn: (input: { userId: string; suspended: boolean }) => setSuspended({ data: input }),
    onSuccess: (res) => {
      toast.success(res.suspended ? "Compte suspendu." : "Compte réactivé.");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = users.filter((u) =>
    `${u.email} ${u.name}`.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher par nom ou adresse e-mail…"
        className="max-w-sm"
        aria-label="Rechercher un compte"
      />

      {isPending ? (
        <p className="text-sm text-ink-soft">Chargement des comptes…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-rule">
          <table className="w-full text-sm">
            <thead className="bg-card text-left text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-medium">Compte</th>
                <th className="px-4 py-3 font-medium">Inscrit le</th>
                <th className="px-4 py-3 font-medium">Projets</th>
                <th className="px-4 py-3 font-medium">Crédits</th>
                <th className="px-4 py-3 font-medium">État</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{u.name || "—"}</div>
                    <div className="font-numeric text-xs break-all text-ink-mute">{u.email}</div>
                  </td>
                  <td className="px-4 py-3 font-numeric tabular-nums text-ink-soft">
                    {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 font-numeric tabular-nums">{u.projectCount}</td>
                  <td className="px-4 py-3 font-numeric tabular-nums">{u.balance}</td>
                  <td className="px-4 py-3">
                    {u.suspended ? (
                      <Badge variant="destructive">Suspendu</Badge>
                    ) : u.isAdmin ? (
                      <Badge>Administrateur</Badge>
                    ) : (
                      <Badge variant="secondary">Actif</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setTarget({ id: u.id, email: u.email })}
                      >
                        Crédits
                      </Button>
                      <Button
                        size="sm"
                        variant={u.suspended ? "outline" : "destructive"}
                        disabled={suspendMutation.isPending}
                        onClick={() =>
                          suspendMutation.mutate({ userId: u.id, suspended: !u.suspended })
                        }
                      >
                        {u.suspended ? "Réactiver" : "Suspendre"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-soft">
                    Aucun compte ne correspond à cette recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={target !== null} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajuster les crédits</DialogTitle>
            <DialogDescription>
              Compte : {target?.email}. Utilisez un montant négatif pour retirer des crédits.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-amount">Montant (crédits)</Label>
              <Input
                id="admin-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ex. 50 ou -10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-reason">Motif</Label>
              <Input
                id="admin-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex. geste commercial, export en échec…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)}>
              Annuler
            </Button>
            <Button
              disabled={adjustMutation.isPending}
              onClick={() =>
                target &&
                adjustMutation.mutate({
                  userId: target.id,
                  amount: Number(amount),
                  reason,
                })
              }
            >
              Appliquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}