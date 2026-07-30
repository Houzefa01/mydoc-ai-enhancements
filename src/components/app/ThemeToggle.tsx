import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? "Passer en thème clair" : "Passer en thème sombre"}
      title={dark ? "Thème clair" : "Thème sombre"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-rule bg-card text-ink-soft transition hover:text-ink"
    >
      {dark ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
    </button>
  );
}
