import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/app/ThemeToggle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Connexion — myDoc IA" },
      {
        name: "description",
        content:
          "Connectez-vous à myDoc IA pour rédiger et exporter vos rapports, résumés, mémoires et présentations.",
      },
      { property: "og:title", content: "Connexion — myDoc IA" },
      {
        property: "og:description",
        content: "Accédez à votre atelier d'écriture assistée par IA.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, signIn, signUp, signInWithGoogle } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [pending, setPending] = useState(false);

  if (user) return <Navigate to="/dashboard" />;

  const submit = (mode: "login" | "signup") => async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signup") {
      if (!accepted) {
        toast.error("Veuillez accepter les conditions d'utilisation.");
        return;
      }
      if (password.length < 8) {
        toast.error("Le mot de passe doit faire 8 caractères minimum.");
        return;
      }
    }
    setPending(true);
    const error =
      mode === "login"
        ? await signIn(email, password)
        : await signUp({
            email,
            password,
            name,
            phone,
            address,
            birthDate,
            city,
            postalCode,
            country,
          });
    setPending(false);
    if (error) {
      toast.error(error);
      return;
    }
    if (mode === "signup") {
      toast.success("Compte créé. Vérifiez votre boîte mail si une confirmation est demandée.");
    }
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="grid min-h-dvh grid-cols-1 bg-paper lg:grid-cols-2">
      {/* Volet éditorial */}
      <div className="relative hidden overflow-hidden border-r border-rule bg-paper-deep/40 lg:flex lg:flex-col lg:justify-between lg:p-14">
        <div className="flex items-baseline gap-2">
          <span className="font-editorial text-2xl text-ink">myDoc</span>
          <span className="font-numeric text-xs uppercase tracking-[0.2em] text-brass">IA</span>
        </div>
        <div className="max-w-md">
          <p className="font-editorial text-4xl leading-[1.1] text-ink">
            Structurez, rédigez, exportez. Un atelier d'écriture pour vos documents professionnels.
          </p>
          <p className="mt-6 text-sm text-ink-soft">
            De la note de synthèse au mémoire, de la présentation Beamer au rapport annuel — myDoc
            IA compose la structure, vous gardez la plume.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-6 border-t border-rule pt-6 font-numeric text-xs uppercase tracking-wider text-ink-mute">
          <div>
            <div className="text-lg text-ink">05</div>
            formats d'export
          </div>
          <div>
            <div className="text-lg text-ink">07</div>
            types de documents
          </div>
          <div>
            <div className="text-lg text-ink">01</div>
            plume, la vôtre
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-2 lg:invisible">
              <span className="font-editorial text-xl text-ink">myDoc</span>
              <span className="font-numeric text-xs uppercase tracking-[0.2em] text-brass">IA</span>
            </div>
            <ThemeToggle />
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-paper-deep">
              <TabsTrigger value="login">Se connecter</TabsTrigger>
              <TabsTrigger value="signup">Créer un compte</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <h1 className="font-editorial text-2xl text-ink">Bon retour.</h1>
              <p className="mt-1 text-sm text-ink-soft">
                Retrouvez vos projets là où vous les avez laissés.
              </p>
              <form onSubmit={submit("login")} className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="email">Adresse e-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  {pending ? "Connexion…" : "Se connecter"} <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <h1 className="font-editorial text-2xl text-ink">Ouvrez votre atelier.</h1>
              <p className="mt-1 text-sm text-ink-soft">
                Créez un compte et commencez votre premier document dans la foulée.
              </p>
              <form onSubmit={submit("signup")} className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="name">Votre nom</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email-signup">Adresse e-mail</Label>
                  <Input
                    id="email-signup"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="password-signup">Mot de passe</Label>
                  <Input
                    id="password-signup"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="mt-1"
                  />
                  <p className="mt-1 text-xs text-ink-mute">8 caractères minimum.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="birth-date">Date de naissance</Label>
                    <Input
                      id="birth-date"
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      max="2012-12-31"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+33 6 12 34 56 78"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="14 rue des Lices"
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="postal-code">Code postal</Label>
                    <Input
                      id="postal-code"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Pays</Label>
                    <Input
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <label className="flex items-start gap-2 text-xs text-ink-soft">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-rule accent-[var(--primary)]"
                  />
                  J'accepte les conditions d'utilisation et la politique de confidentialité.
                </label>
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  {pending ? "Création…" : "Créer mon compte"} <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-ink-mute">
            <span className="h-px flex-1 bg-rule" />
            ou
            <span className="h-px flex-1 bg-rule" />
          </div>

          {/* BACKEND: OAuth Google — actuellement décoratif */}
          <button
            type="button"
            onClick={async () => {
              const error = await signInWithGoogle();
              if (error) toast.error(error);
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-rule bg-card px-4 py-2.5 text-sm text-ink transition hover:bg-paper-deep"
          >
            <GoogleMark /> Continuer avec Google
          </button>

          <p className="mt-6 text-center text-xs text-ink-mute">
            En continuant, vous acceptez nos conditions d'utilisation.
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.66 4.1-5.5 4.1-3.31 0-6-2.74-6-6.1s2.69-6.1 6-6.1c1.88 0 3.14.8 3.86 1.49l2.63-2.53C16.98 3.36 14.72 2.4 12 2.4 6.72 2.4 2.4 6.72 2.4 12s4.32 9.6 9.6 9.6c5.54 0 9.2-3.89 9.2-9.37 0-.63-.07-1.11-.16-1.59H12z"
      />
    </svg>
  );
}
