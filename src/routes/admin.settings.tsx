import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  adminGetSettings,
  adminListProviderModels,
  adminListSettingsHistory,
  adminUpdateSettings,
} from "@/backend/settings.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/settings")({ component: AdminSettingsPage });

function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const getSettings = useServerFn(adminGetSettings);
  const updateSettings = useServerFn(adminUpdateSettings);
  const listHistory = useServerFn(adminListSettingsHistory);
  const listModels = useServerFn(adminListProviderModels);

  const { data, isPending } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => getSettings(),
  });
  const { data: history } = useQuery({
    queryKey: ["admin", "settings", "history"],
    queryFn: () => listHistory(),
  });

  const [tokens, setTokens] = useState("");
  const [price, setPrice] = useState("");
  const [provider, setProvider] = useState("");
  const [model, setModel] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [modelsError, setModelsError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setTokens(String(data.tokensPerCredit));
    setPrice(String(data.creditPrice));
    setProvider(data.aiProvider);
    setModel(data.aiModel);
  }, [data]);

  const save = useMutation({
    mutationFn: (input: Parameters<typeof adminUpdateSettings>[0]["data"]) =>
      updateSettings({ data: input }),
    onSuccess: (result) => {
      toast.success(
        result.changed === 0 ? "Aucune modification." : "Paramètres enregistrés.",
      );
      void queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const refreshModels = useMutation({
    mutationFn: () => listModels({ data: { provider } }),
    onSuccess: (result) => {
      setModels(result.models);
      setModelsError(null);
      toast.success(`${result.models.length} modèles disponibles.`);
    },
    onError: (error: Error) => {
      setModels([]);
      setModelsError(error.message);
    },
  });

  if (isPending || !data) return <p className="text-sm text-ink-soft">Chargement des paramètres…</p>;

  const options = models.length > 0 ? models : model ? [model] : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tarification</CardTitle>
          <CardDescription>
            Ces deux valeurs pilotent tout le calcul et l'affichage des coûts en crédits dans
            l'application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="tokens">Nombre de tokens par crédit</Label>
              <Input
                id="tokens"
                type="number"
                min={1}
                step={1}
                value={tokens}
                onChange={(e) => setTokens(e.target.value)}
                className="mt-1 font-numeric"
              />
            </div>
            <div>
              <Label htmlFor="price">Prix d'un crédit ($)</Label>
              <Input
                id="price"
                type="number"
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1 font-numeric"
              />
            </div>
          </div>
          <Button
            disabled={save.isPending}
            onClick={() =>
              save.mutate({
                tokensPerCredit: Math.trunc(Number(tokens)),
                creditPrice: Number(price),
              })
            }
          >
            Enregistrer la tarification
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Modèle IA utilisé</CardTitle>
          <CardDescription>
            Le fournisseur et le modèle sélectionnés sont lus à chaque génération : un changement
            prend effet immédiatement. La clé d'API reste côté serveur.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Fournisseur IA actif</Label>
              <Select
                value={provider}
                onValueChange={(v) => {
                  setProvider(v);
                  setModels([]);
                  setModelsError(null);
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choisir un fournisseur" />
                </SelectTrigger>
                <SelectContent>
                  {data.providers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Modèle actif</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choisir un modèle" />
                </SelectTrigger>
                <SelectContent>
                  {options.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              disabled={refreshModels.isPending}
              onClick={() => refreshModels.mutate()}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${refreshModels.isPending ? "animate-spin" : ""}`}
                aria-hidden
              />
              Rafraîchir la liste des modèles disponibles
            </Button>
            <Button
              disabled={save.isPending || !model}
              onClick={() => save.mutate({ aiProvider: provider, aiModel: model })}
            >
              Enregistrer le modèle
            </Button>
          </div>

          {modelsError && (
            <p role="alert" className="text-sm text-destructive">
              {modelsError}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historique des modifications</CardTitle>
          <CardDescription>Qui a changé quoi, quand, et avec quelle valeur.</CardDescription>
        </CardHeader>
        <CardContent>
          {!history || history.length === 0 ? (
            <p className="text-sm text-ink-soft">Aucune modification enregistrée.</p>
          ) : (
            <ul className="divide-y divide-rule">
              {history.map((h) => (
                <li key={h.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2 text-sm">
                  <span className="font-medium">{h.settingLabel}</span>
                  <span className="font-numeric tabular-nums text-ink-soft">
                    {h.oldValue || "—"} → {h.newValue}
                  </span>
                  <span className="ml-auto text-xs text-ink-soft">
                    {h.changedByEmail || "compte inconnu"} ·{" "}
                    {new Date(h.createdAt).toLocaleString("fr-FR")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}