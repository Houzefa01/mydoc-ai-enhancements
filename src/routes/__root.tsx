import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  ScriptOnce,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { StoreProvider } from "../lib/store";
import { ThemeProvider, themeBootstrapScript } from "../lib/theme";
import { Toaster } from "../components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper px-4">
      <div className="max-w-md text-center">
        <div className="font-numeric text-xs uppercase tracking-[0.24em] text-ink-mute">
          Erreur 404
        </div>
        <h1 className="mt-3 font-editorial text-4xl text-ink">Page introuvable</h1>
        <p className="mt-3 text-sm text-ink-soft">
          Cette adresse ne correspond à aucun document. Vérifiez le lien ou revenez à votre espace
          de travail.
        </p>
        <div className="mt-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Revenir aux projets
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper px-4">
      <div className="max-w-md text-center">
        <h1 className="font-editorial text-2xl text-ink">Cette page n'a pas pu s'afficher</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Un problème est survenu au chargement. Rechargez pour réessayer, ou revenez à vos projets.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Recharger
          </button>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md border border-rule bg-card px-4 py-2 text-sm font-medium text-ink transition hover:bg-paper-deep"
          >
            Mes projets
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "myDoc IA — Rédigez et exportez vos documents" },
      {
        name: "description",
        content:
          "myDoc IA génère rapports, résumés, mémoires et présentations à partir de vos sources, puis les exporte en PDF, DOCX, PPTX, LaTeX et Beamer.",
      },
      { name: "author", content: "myDoc IA" },
      { property: "og:title", content: "myDoc IA — L'atelier d'écriture assistée" },
      {
        property: "og:description",
        content:
          "Structurez, rédigez et exportez vos documents professionnels à partir de vos propres sources.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:site_name", content: "myDoc IA" },
      { property: "og:locale", content: "fr_FR" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "myDoc IA",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          inLanguage: "fr-FR",
          description:
            "Atelier d'écriture assistée : génération de rapports, résumés, mémoires et présentations à partir de vos sources, avec export PDF, DOCX, PPTX, LaTeX et Beamer.",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ScriptOnce>{themeBootstrapScript}</ScriptOnce>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <StoreProvider>
          <Outlet />
          <Toaster position="bottom-right" />
        </StoreProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
