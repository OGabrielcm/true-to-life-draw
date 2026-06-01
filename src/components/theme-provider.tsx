import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

// 4 temas (Bloco 3.3). "dark" é o padrão. Light/Baby Blue/Sépia são da família
// clara. A identidade visual de cada tema vive nas CSS vars (styles.css):
//   - dark      → classe .dark no <html>
//   - light     → nenhuma classe extra (:root)
//   - babyblue  → classe .theme-babyblue
//   - sepia     → classe .theme-sepia
export type Theme = "dark" | "light" | "babyblue" | "sepia";

export const THEMES: { id: Theme; label: string; swatch: string }[] = [
  { id: "dark", label: "Dark", swatch: "#111111" },
  { id: "light", label: "Light", swatch: "#f4f5f7" },
  { id: "babyblue", label: "Baby Blue", swatch: "#cfe4f7" },
  { id: "sepia", label: "Sépia", swatch: "#fbf1c7" },
];

const KEY = "kb_theme";
const DEFAULT_THEME: Theme = "dark";
const VALID = new Set<Theme>(["dark", "light", "babyblue", "sepia"]);

// Lê o tema do localStorage de forma síncrona (paint instantâneo, sem flash).
// NUNCA bloqueia render — na ausência de preferência, cai no default (dark).
function readInitialTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const saved = localStorage.getItem(KEY) as Theme | null;
  return saved && VALID.has(saved) ? saved : DEFAULT_THEME;
}

// Aplica o tema no <html>: remove classes de tema e adiciona a do tema atual.
function applyThemeClass(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("dark", "theme-babyblue", "theme-sepia");
  if (theme === "dark") root.classList.add("dark");
  else if (theme === "babyblue") root.classList.add("theme-babyblue");
  else if (theme === "sepia") root.classList.add("theme-sepia");
  // light = sem classe (usa :root)
}

const Ctx = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
  // Aplica o tema vindo do Supabase (cross-device). Só sobrescreve se o usuário
  // ainda não trocou manualmente NESTA sessão — evita pisar numa escolha fresca.
  setThemeFromRemote: (t: Theme) => void;
  // Mantido por compat: alterna entre dark e light.
  toggle: () => void;
} | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readInitialTheme);
  // Marca se o usuário trocou o tema manualmente nesta sessão.
  const userChoseRef = useRef(false);

  // Aplica a classe sempre que o tema muda + persiste no localStorage
  // (camada síncrona; o Supabase é a camada cross-device — a persistência no DB
  // é feita por quem chama setTheme na UI, ver AppShell).
  useEffect(() => {
    applyThemeClass(theme);
    localStorage.setItem(KEY, theme);
  }, [theme]);

  const setTheme = (t: Theme) => {
    if (!VALID.has(t)) return;
    userChoseRef.current = true;
    setThemeState(t);
  };

  const setThemeFromRemote = (t: Theme) => {
    if (!VALID.has(t)) return;
    if (userChoseRef.current) return; // não pisa escolha manual da sessão
    setThemeState(t);
  };

  const toggle = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <Ctx.Provider value={{ theme, setTheme, setThemeFromRemote, toggle }}>{children}</Ctx.Provider>
  );
}

export function useTheme() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTheme must be used inside ThemeProvider");
  return v;
}
