import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { Moon, Sun, Laptop } from "lucide-react";

type Mode = "light" | "dark" | "system";
const STORAGE_KEY = "theme";

function getInitialMode(): Mode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Mode | null;
    return stored ?? "system";
  } catch { return "system"; }
}

function applyMode(mode: Mode) {
  const isDark =
    mode === "dark" ? true :
    mode === "light" ? false :
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  document.documentElement.classList.toggle("dark", isDark);
  try { localStorage.setItem(STORAGE_KEY, mode); } catch {}
}

export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("system");

  useEffect(() => { setMode(getInitialMode()); }, []);

  const setAndApply = (m: Mode) => { setMode(m); applyMode(m); };
  const Icon = mode === "dark" ? Sun : mode === "light" ? Moon : Laptop;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" title="Téma">
          <Icon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setAndApply("light")}>
          <Moon className="mr-2 h-4 w-4" /> Svetlý
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setAndApply("dark")}>
          <Sun className="mr-2 h-4 w-4" /> Tmavý
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setAndApply("system")}>
          <Laptop className="mr-2 h-4 w-4" /> Systém
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
