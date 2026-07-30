import { Link, useNavigate } from "@tanstack/react-router";
import { Coins, FolderOpen, LogOut, Settings, UserRound } from "lucide-react";
import { useStore } from "@/lib/store";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppHeader() {
  const { user, credits, logout } = useStore();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper shadow-[0_1px_0_var(--rule)]">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:gap-6 sm:px-6">
        <Link to="/dashboard" className="flex items-baseline gap-2 text-ink hover:opacity-80">
          <span className="font-editorial text-xl leading-none">myDoc</span>
          <span className="font-numeric text-xs uppercase tracking-[0.18em] text-brass">IA</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-ink-soft md:flex">
          <Link
            to="/dashboard"
            activeProps={{ className: "text-ink font-medium" }}
            className="hover:text-ink"
          >
            Projets
          </Link>
          <Link
            to="/settings"
            activeProps={{ className: "text-ink font-medium" }}
            className="hover:text-ink"
          >
            Paramètres
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle />
          <Link
            to="/settings"
            className="group inline-flex items-center gap-2 rounded-md border border-brass/40 bg-brass-soft/60 px-3 py-1.5 text-brass transition hover:bg-brass-soft"
            aria-label={`Solde de crédits : ${credits.balance}`}
          >
            <Coins className="h-4 w-4" aria-hidden />
            <span className="font-numeric text-sm tabular-nums">{credits.balance}</span>
            <span className="hidden text-xs uppercase tracking-wider text-brass/80 sm:inline">
              crédits
            </span>
          </Link>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-rule bg-card text-ink-soft hover:text-ink sm:h-9 sm:w-9">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <UserRound className="h-4 w-4" aria-hidden />
                )}
                <span className="sr-only">Compte</span>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <div className="text-sm font-medium text-ink">{user.name}</div>
                  <div className="font-numeric text-xs break-all text-ink-mute">{user.email}</div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="md:hidden"
                  onSelect={() => navigate({ to: "/dashboard" })}
                >
                  <FolderOpen className="mr-2 h-4 w-4" /> Projets
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate({ to: "/settings" })}>
                  <Settings className="mr-2 h-4 w-4" /> Paramètres
                </DropdownMenuItem>

                <DropdownMenuItem
                  onSelect={() => {
                    logout();
                    navigate({ to: "/" });
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
