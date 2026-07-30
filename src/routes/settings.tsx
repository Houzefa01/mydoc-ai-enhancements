import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  Coins,
  CreditCard,
  History,
  KeyRound,
  Plus,
  ShieldCheck,
  Upload,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { AppShell } from "@/components/app/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Paramètres — myDoc IA" },
      {
        name: "description",
        content: "Gérez votre profil, votre solde de crédits et vos achats.",
      },
      { property: "og:title", content: "Paramètres — myDoc IA" },
      {
        property: "og:description",
        content: "Profil, crédits et facturation myDoc IA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SettingsPage,
});

const quickAmounts = [10, 50, 100, 250, 500];

function SettingsPage() {
  const { user, credits, settings, purchaseCredits, updateProfile, changePassword } = useStore();
  const [profile, setProfile] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    avatarUrl: user?.avatarUrl ?? "",
    birthDate: user?.birthDate ?? "",
    phone: user?.phone ?? "",
    address: user?.address ?? "",
    postalCode: user?.postalCode ?? "",
    city: user?.city ?? "",
    country: user?.country ?? "",
    bio: user?.bio ?? "",
  });
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const [customAmount, setCustomAmount] = useState<number>(1);
  const [sliderValue, setSliderValue] = useState<number[]>([1]);

  const setField = (key: keyof typeof profile, value: string) =>
    setProfile((p) => ({ ...p, [key]: value }));

  const initials = (profile.name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleAvatar = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choisissez un fichier image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image trop lourde (5 Mo maximum).");
      return;
    }
    // BACKEND: upload vers le stockage, puis persistance de l'URL
    const reader = new FileReader();
    reader.onload = () => setField("avatarUrl", String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    if (!profile.name.trim()) {
      toast.error("Le nom affiché est obligatoire.");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(profile.email.trim())) {
      toast.error("Adresse e-mail invalide.");
      return;
    }
    // BACKEND: PATCH /api/users/me
    updateProfile({ ...profile, name: profile.name.trim(), email: profile.email.trim() });
    toast.success("Profil mis à jour.");
  };

  const handleChangePassword = () => {
    if (!passwords.current) {
      toast.error("Saisissez votre mot de passe actuel.");
      return;
    }
    if (passwords.next.length < 8) {
      toast.error("Le nouveau mot de passe doit faire au moins 8 caractères.");
      return;
    }
    if (passwords.next !== passwords.confirm) {
      toast.error("La confirmation ne correspond pas.");
      return;
    }
    const ok = changePassword(passwords.current, passwords.next);
    if (!ok) {
      toast.error("Mot de passe actuel incorrect.");
      return;
    }
    setPasswords({ current: "", next: "", confirm: "" });
    toast.success("Mot de passe modifié.");
  };

  const syncAmount = (value: number) => {
    const clamped = Math.max(1, Math.floor(value));
    setCustomAmount(clamped);
    setSliderValue([clamped]);
  };

  const handlePurchase = () => {
    if (customAmount < 1) {
      toast.error("Vous devez acheter au moins 1 crédit.");
      return;
    }
    purchaseCredits(customAmount);
    toast.success(`+${customAmount} crédit${customAmount > 1 ? "s" : ""} ajoutés à votre compte.`);
  };

  return (
    <AppShell>
      <div className="mb-8 border-b border-rule pb-6">
        <p className="font-numeric text-xs uppercase tracking-[0.2em] text-ink-mute">Compte</p>
        <h1 className="mt-2 font-editorial text-3xl text-ink">Paramètres</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profil */}
        <Card className="border-rule bg-card lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 text-ink-mute">
              <User className="h-4 w-4" />
              <span className="font-numeric text-xs uppercase tracking-[0.2em]">Profil</span>
            </div>
            <CardTitle className="font-editorial text-xl text-ink">Vos informations</CardTitle>
            <CardDescription className="text-ink-soft">
              Photo, coordonnées et informations personnelles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-rule bg-paper-deep/40">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={`Photo de profil de ${profile.name || "l'utilisateur"}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-editorial text-xl text-ink-mute">{initials}</span>
                )}
              </div>
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => handleAvatar(e.target.files?.[0])}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-rule"
                    onClick={() => fileRef.current?.click()}
                  >
                    <Upload className="mr-2 h-3.5 w-3.5" /> Changer la photo
                  </Button>
                  {profile.avatarUrl && (
                    <Button variant="ghost" size="sm" onClick={() => setField("avatarUrl", "")}>
                      Retirer
                    </Button>
                  )}
                </div>
                <p className="mt-2 text-xs text-ink-mute">JPG ou PNG, 5 Mo maximum.</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="s-name">Nom affiché</Label>
                <Input
                  id="s-name"
                  value={profile.name}
                  onChange={(e) => setField("name", e.target.value)}
                  maxLength={100}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="s-email">Adresse e-mail</Label>
                <Input
                  id="s-email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setField("email", e.target.value)}
                  maxLength={255}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="s-birth">Date de naissance</Label>
                <Input
                  id="s-birth"
                  type="date"
                  value={profile.birthDate}
                  onChange={(e) => setField("birthDate", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="s-phone">Numéro de téléphone</Label>
                <Input
                  id="s-phone"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  placeholder="+33 6 12 34 56 78"
                  maxLength={30}
                  className="mt-1"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="s-address">Adresse</Label>
                <Input
                  id="s-address"
                  value={profile.address}
                  onChange={(e) => setField("address", e.target.value)}
                  placeholder="Numéro et rue"
                  maxLength={200}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="s-postal">Code postal</Label>
                <Input
                  id="s-postal"
                  value={profile.postalCode}
                  onChange={(e) => setField("postalCode", e.target.value)}
                  maxLength={12}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="s-city">Ville</Label>
                <Input
                  id="s-city"
                  value={profile.city}
                  onChange={(e) => setField("city", e.target.value)}
                  maxLength={100}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="s-country">Pays</Label>
                <Input
                  id="s-country"
                  value={profile.country}
                  onChange={(e) => setField("country", e.target.value)}
                  maxLength={100}
                  className="mt-1"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="s-bio">Présentation</Label>
                <Textarea
                  id="s-bio"
                  value={profile.bio}
                  onChange={(e) => setField("bio", e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Quelques lignes sur votre activité — reprises dans vos CV et lettres."
                  className="mt-1"
                />
              </div>
            </div>
            <Button onClick={handleSaveProfile} className="mt-4">
              Enregistrer
            </Button>
          </CardContent>
        </Card>

        {/* Solde de crédits */}
        <Card className="border border-brass/40 bg-brass-soft/50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 text-brass">
              <Coins className="h-4 w-4" />
              <span className="font-numeric text-xs uppercase tracking-[0.2em]">
                Solde de crédits
              </span>
            </div>
            <CardTitle className="font-numeric text-5xl font-medium text-ink tabular-nums">
              {credits.balance}
            </CardTitle>
            <CardDescription className="text-ink-soft">
              Un crédit couvre environ une section rédigée ou un export standard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="border-brass/40 text-brass">
              1 crédit = {settings.creditPrice.toFixed(2)} $
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Mot de passe */}
      <Card className="mt-6 border-rule bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 text-ink-mute">
            <KeyRound className="h-4 w-4" />
            <span className="font-numeric text-xs uppercase tracking-[0.2em]">Sécurité</span>
          </div>
          <CardTitle className="font-editorial text-xl text-ink">Changer le mot de passe</CardTitle>
          <CardDescription className="text-ink-soft">
            Au moins 8 caractères. Vous resterez connecté sur cet appareil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="pw-current">Mot de passe actuel</Label>
              <Input
                id="pw-current"
                type="password"
                autoComplete="current-password"
                value={passwords.current}
                onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="pw-next">Nouveau mot de passe</Label>
              <Input
                id="pw-next"
                type="password"
                autoComplete="new-password"
                value={passwords.next}
                onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="pw-confirm">Confirmation</Label>
              <Input
                id="pw-confirm"
                type="password"
                autoComplete="new-password"
                value={passwords.confirm}
                onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
          <Button onClick={handleChangePassword} className="mt-4">
            Mettre à jour le mot de passe
          </Button>
        </CardContent>
      </Card>

      {/* Recharge personnalisée */}
      <Card className="mt-6 border-rule bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 text-ink-mute">
            <CreditCard className="h-4 w-4" />
            <span className="font-numeric text-xs uppercase tracking-[0.2em]">Recharge</span>
          </div>
          <CardTitle className="font-editorial text-xl text-ink">Recharger votre compte</CardTitle>
          <CardDescription className="text-ink-soft">
            Choisissez librement le nombre de crédits à acheter. Aucun pack imposé, le minimum est
            de 1 crédit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-rule bg-paper p-5">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <Label htmlFor="custom-credits" className="text-ink-soft">
                  Nombre de crédits
                </Label>
                <div className="mt-2 flex items-center gap-4">
                  <Input
                    id="custom-credits"
                    type="number"
                    min={1}
                    step={1}
                    value={customAmount}
                    onChange={(e) => syncAmount(Number(e.target.value) || 1)}
                    className="w-28 text-center font-numeric text-lg"
                  />
                  <div className="font-numeric text-2xl text-ink tabular-nums">
                    {(customAmount * settings.creditPrice).toFixed(2)} $
                  </div>
                </div>
                <div className="mt-4 px-1">
                  <Slider
                    value={sliderValue}
                    onValueChange={(values) => syncAmount(values[0])}
                    min={1}
                    max={1000}
                    step={1}
                  />
                  <div className="mt-2 flex justify-between font-numeric text-xs text-ink-mute">
                    <span>1</span>
                    <span>250</span>
                    <span>500</span>
                    <span>750</span>
                    <span>1000</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  {quickAmounts.map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => syncAmount(amount)}
                      className={cn(
                        "border-rule font-numeric",
                        customAmount === amount && "border-primary text-primary",
                      )}
                    >
                      {amount}
                    </Button>
                  ))}
                </div>
                <Button
                  onClick={handlePurchase}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground"
                >
                  <Plus className="h-4 w-4" /> Acheter {customAmount} crédit
                  {customAmount > 1 ? "s" : ""}
                </Button>
              </div>
            </div>
          </div>
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-ink-mute">
            <ShieldCheck className="h-3.5 w-3.5" />
            Paiement sécurisé Stripe — annulation possible à tout moment.
          </p>
        </CardContent>
      </Card>

      {/* Historique */}
      <Card className="mt-6 border-rule bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 text-ink-mute">
            <History className="h-4 w-4" />
            <span className="font-numeric text-xs uppercase tracking-[0.2em]">Historique</span>
          </div>
          <CardTitle className="font-editorial text-xl text-ink">Historique des crédits</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-rule rounded-md border border-rule bg-card">
            {credits.transactions.map((t) => (
              <li key={t.id} className="flex items-center gap-4 px-4 py-3">
                <span className="font-numeric text-xs text-ink-mute tabular-nums">
                  {new Date(t.createdAt).toLocaleDateString("fr-FR")}
                </span>
                <span className="flex-1 truncate text-sm text-ink">{t.label}</span>
                <span
                  className={cn(
                    "font-numeric text-sm tabular-nums",
                    t.amount > 0 ? "text-primary" : "text-ink-soft",
                  )}
                >
                  {t.amount > 0 ? "+" : ""}
                  {t.amount}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </AppShell>
  );
}
