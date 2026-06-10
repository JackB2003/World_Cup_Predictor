"use client";

import { createContext, useEffect, useState, type ReactNode } from "react";
import type { AccentKey, Density, ThemeMode } from "@/types/world-cup";

const ACCENTS: Record<AccentKey, { c: string; rgb: string }> = {
  lime: { c: "#C6FF3D", rgb: "198, 255, 61" },
  cyan: { c: "#36D1FF", rgb: "54, 209, 255" },
  magenta: { c: "#FF3D7F", rgb: "255, 61, 127" },
  violet: { c: "#9B7BFF", rgb: "155, 123, 255" },
  amber: { c: "#FFB23D", rgb: "255, 178, 61" },
};

type ThemeState = {
  theme: ThemeMode;
  accent: AccentKey;
  density: Density;
  setTheme: (t: ThemeMode) => void;
  setAccent: (a: AccentKey) => void;
  setDensity: (d: Density) => void;
};

const ThemeContext = createContext<ThemeState | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("dark");
  const [accent, setAccentState] = useState<AccentKey>("lime");
  const [density, setDensityState] = useState<Density>("regular");

  useEffect(() => {
    const saved = localStorage.getItem("pitchiq-theme");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<{ theme: ThemeMode; accent: AccentKey; density: Density }>;
        if (parsed.theme) setThemeState(parsed.theme);
        if (parsed.accent) setAccentState(parsed.accent);
        if (parsed.density) setDensityState(parsed.density);
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("theme-switching");
    root.setAttribute("data-theme", theme);
    const a = ACCENTS[accent];
    root.style.setProperty("--accent", a.c);
    root.style.setProperty("--accent-rgb", a.rgb);
    const id = setTimeout(() => root.classList.remove("theme-switching"), 80);
    localStorage.setItem("pitchiq-theme", JSON.stringify({ theme, accent, density }));
    return () => clearTimeout(id);
  }, [theme, accent, density]);

  const setTheme = (t: ThemeMode) => setThemeState(t);
  const setAccent = (a: AccentKey) => setAccentState(a);
  const setDensity = (d: Density) => setDensityState(d);

  return (
    <ThemeContext.Provider value={{ theme, accent, density, setTheme, setAccent, setDensity }}>
      <div data-density={density}>{children}</div>
    </ThemeContext.Provider>
  );
}
