"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl p-2 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors shadow-sm cursor-pointer h-9 w-9"
      title="Toggle dark mode"
      aria-label="Toggle theme"
    >
      <span className="text-base leading-none">
        {theme === "dark" ? "☀️" : "🌙"}
      </span>
    </button>
  );
}
