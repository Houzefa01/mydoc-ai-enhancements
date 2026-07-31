import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  adminGetSettings,
  adminDeleteProviderKey,
  adminListProviderKeys,
  adminListProviderModels,
  adminListSettingsHistory,
  adminSetProviderKey,
  adminTestProviderKey,
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
  const listKeys = useServerFn(adminListProviderKeys);
  const setKey = useServerFn(adminSetProviderKey);
  const deleteKey = useServerFn(adminDeleteProviderKey);
  const testKey = useServerFn(adminTestProviderKey);

  const { data, isPending } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => getSettings(),
  });
  const { data: history } = useQuery({
    queryKey: ["admin", "settings", "history"],
    queryFn: () => listHistory(),
  });
  const { data: keys } = useQuery({
    queryKey: ["admin", "settings", "keys"],
    queryFn: () => listKeys(),
  });

  const [tokens, setTokens] = useState("");
  const [price, setPrice] = useState("");
  const [provider, setProvider] = useState("");
  const [model, setModel] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [keyDrafts, setKeyDrafts] = useState<Record<string, string>>({});
  const [keyTests, setKeyTests] = useState<Record<string, { ok: boolean; message: string }>>({});

  const invalidateKeys = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "settings", "keys"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "settings", "history"] });
  };

  const saveKey = useMutation({
    mutationFn: (input: { provider: string; apiKey: string }) => setKey({ data: input }),
    onSuccess: (_r, input) => {
      toast.success("Clé d'API enregistrée.");
      setKeyDrafts((d) => ({ ...d, [input.provider]: "" }));
      invalidateKeys();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeKey = useMutation({
    mutationFn: (provider: string) => deleteKey({ data: { provider } }),
    onSuccess: () => {
      toast.success("Clé supprimée.");
      invalidateKeys();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const tryKey = useMutation({
    mutationFn: (input: { provider: string; apiKey: string }) => testKey({ data: input }),
    onSuccess: (result, input) => {
      setKeyTests((t) => ({ ...t, [input.provider]: result }));
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      void queryClient.invalidateQueries({ queryKey: ["admin", "settings", "history"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

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
      if (result.error) {
        setModels([]);
        setModelsError(result.error);
        return;
      }
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
          <CardTitle className="text-base">Clés d'API des fournisseurs</CardTitle>
          <CardDescription>
            Les clés sont stockées côté serveur et ne sont jamais renvoyées au navigateur : seuls
            les quatre derniers caractères sont affichés. Une clé saisie ici remplace celle définie
            dans l'environnement.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {(keys ?? []).map((k) => (
            <div key={k.provider} className="space-y-2 border-b border-rule pb-4 last:border-0 last:pb-0">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-medium">{k.label}</span>
                <span className="font-numeric text-sm text-ink-soft">
                  {k.configured ? `${k.masked} · source : ${k.source}` : "aucune clé enregistrée"}
                </span>
                {k.updatedAt && (
                  <span className="ml-auto text-xs text-ink-soft">
                    {k.updatedByEmail || "compte inconnu"} ·{" "}
                    {new Date(k.updatedAt).toLocaleString("fr-FR")}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="password"
                  autoComplete="off"
                  placeholder={k.configured ? "Nouvelle clé (remplace l'actuelle)" : "Coller la clé d'API"}
                  value={keyDrafts[k.provider] ?? ""}
                  onChange={(e) =>
                    setKeyDrafts((d) => ({ ...d, [k.provider]: e.target.value }))
                  }
                  className="max-w-sm"
                  aria-label={`Clé d'API ${k.label}`}
                />
                <Button
                  disabled={saveKey.isPending || !(keyDrafts[k.provider] ?? "").trim()}
                  onClick={() =>
                    saveKey.mutate({
                      provider: k.provider,
                      apiKey: (keyDrafts[k.provider] ?? "").trim(),
                    })
                  }
                >
                  Enregistrer
                </Button>
                <Button
                  variant="outline"
                  disabled={tryKey.isPending}
                  onClick={() =>
                    tryKey.mutate({
                      provider: k.provider,
                      apiKey: (keyDrafts[k.provider] ?? "").trim(),
                    })
                  }
                >
                  Tester la clé
                </Button>
                {k.source === "interface" && (
                  <Button
                    variant="outline"
                    disabled={removeKey.isPending}
                    onClick={() => removeKey.mutate(k.provider)}
                  >
                    Supprimer
                  </Button>
                )}
              </div>
              {keyTests[k.provider] && (
                <p
                  role="status"
                  className={`text-xs ${keyTests[k.provider].ok ? "text-primary" : "text-destructive"}`}
                >
                  {keyTests[k.provider].message}
                </p>
              )}
            </div>
          ))}
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