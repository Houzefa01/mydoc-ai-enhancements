import type { ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { AppHeader } from "./AppHeader";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, ready } = useStore();

  // Tant que la session n'est pas relue, on évite de rediriger (et de faire
  // clignoter la page) après un rechargement.
  if (!ready) {
    return (
      <div className="min-h-dvh bg-paper" aria-busy="true">
        <span className="sr-only">Chargement…</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/" />;

  // Compte suspendu par un administrateur : l'application reste inaccessible
  // (les règles de sécurité de la base bloquent déjà les écritures).
  if (user.suspended) {
    return (
      <div className="flex min-h-dvh flex-col bg-paper text-ink">
        <AppHeader />
        <main className="mx-auto flex w-full max-w-xl flex-1 items-center px-4 py-16">
          <div className="rounded-lg border border-rule bg-card p-8 text-center">
            <h1 className="text-xl font-semibold">Compte suspendu</h1>
            <p className="mt-3 text-sm text-ink-soft">
              L'accès à votre espace a été suspendu par un administrateur. Contactez le support
              pour rétablir votre compte.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      <AppHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
