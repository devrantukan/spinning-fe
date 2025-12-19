"use client";

import {
  createContext,
  useContext,
  useState,
  useLayoutEffect,
  ReactNode,
  useEffect,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialize state with function to read from localStorage on client, default to 'light' on server
  // This prevents hydration mismatches and avoids setState in effects
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme") as Theme | "system";
      // Migrate from "system" to actual theme if needed
      if (savedTheme === "light" || savedTheme === "dark") {
        return savedTheme;
      } else if (savedTheme === "system") {
        // Migrate: use system preference once, then save as light or dark
        const systemTheme = getSystemTheme();
        localStorage.setItem("theme", systemTheme);
        return systemTheme;
      }
    }
    // Default to system preference on first visit
    if (typeof window !== "undefined") {
      const systemTheme = getSystemTheme();
      return systemTheme;
    }
    return "light";
  });

  // Resolved theme is always the same as theme (no system mode)
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme") as Theme | "system";
      if (savedTheme === "light" || savedTheme === "dark") {
        return savedTheme;
      } else if (savedTheme === "system") {
        // Migrate from system
        return getSystemTheme();
      }
    }
    // Default to system preference on first visit
    if (typeof window !== "undefined") {
      return getSystemTheme();
    }
    return "light";
  });

  // Apply initial theme to DOM after hydration
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    const html = document.getElementsByTagName("html")[0];

    // Remove dark class initially to ensure clean state
    root.classList.remove("dark");
    html.classList.remove("dark");

    // Apply the initial resolved theme
    if (resolvedTheme === "dark") {
      root.classList.add("dark");
      html.classList.add("dark");
      root.setAttribute("data-theme", "dark");
      html.setAttribute("data-theme", "dark");
    } else {
      root.setAttribute("data-theme", "light");
      html.setAttribute("data-theme", "light");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount to apply initial theme

  // Update resolved theme when theme changes (no system mode, so it's always the same)
  useEffect(() => {
    setResolvedTheme(theme);
  }, [theme]);

  // Apply theme to document whenever resolvedTheme changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    const html = document.getElementsByTagName("html")[0];
    // Force remove first, then add if needed to ensure clean state
    root.classList.remove("dark");
    html.classList.remove("dark");
    if (resolvedTheme === "dark") {
      root.classList.add("dark");
      html.classList.add("dark");
      root.setAttribute("data-theme", "dark");
      html.setAttribute("data-theme", "dark");
    } else {
      root.setAttribute("data-theme", "light");
      html.setAttribute("data-theme", "light");
    }
  }, [resolvedTheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    setResolvedTheme(newTheme);

    // Immediately apply to DOM - force remove first to ensure clean state
    if (typeof window !== "undefined") {
      const root = document.documentElement;
      const html = document.getElementsByTagName("html")[0];

      // Remove from both root and html element
      root.classList.remove("dark");
      html.classList.remove("dark");

      if (newTheme === "dark") {
        root.classList.add("dark");
        html.classList.add("dark");
        root.setAttribute("data-theme", "dark");
        html.setAttribute("data-theme", "dark");
      } else {
        root.setAttribute("data-theme", "light");
        html.setAttribute("data-theme", "light");
      }

      localStorage.setItem("theme", newTheme);
    }
  };

  // Always provide the context, even before mounting
  // This prevents the "must be used within ThemeProvider" error
  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
