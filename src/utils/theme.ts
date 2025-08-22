// Simple theme management utility
export type Theme = "light" | "dark" | "system";

// Apply theme to document
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;

  // Remove any existing theme classes
  root.classList.remove("dark");

  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "system") {
    // Check system preference
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (isDark) {
      root.classList.add("dark");
    }
  }

  // Save to localStorage with the same key as settings store
  const currentSettings = JSON.parse(
    localStorage.getItem("userSettings") || "{}"
  );
  const updatedSettings = { ...currentSettings, theme };
  localStorage.setItem("userSettings", JSON.stringify(updatedSettings));
}

// Get current theme from localStorage (compatible with settings store)
export function getCurrentTheme(): Theme {
  const userSettings = localStorage.getItem("userSettings");

  if (userSettings) {
    try {
      const settings = JSON.parse(userSettings);
      if (
        settings.theme &&
        ["light", "dark", "system"].includes(settings.theme)
      ) {
        return settings.theme;
      }
    } catch (error) {
      console.error("Error parsing userSettings:", error);
    }
  }

  return "system";
}

// Toggle between light and dark themes
export function toggleTheme(): void {
  const current = getCurrentTheme();
  const newTheme = current === "dark" ? "light" : "dark";
  applyTheme(newTheme);
}

// Initialize theme on app start
export function initializeTheme(): void {
  const theme = getCurrentTheme();
  applyTheme(theme);

  // Listen for system theme changes (only if using system theme)
  if (theme === "system") {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      const root = document.documentElement;
      if (e.matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    mediaQuery.addEventListener("change", handleChange);

    // Store the listener for cleanup (optional)
    (window as any).__systemThemeListener = handleChange;
  }
}

// Clean up system theme listener
export function cleanupThemeListener(): void {
  const listener = (window as any).__systemThemeListener;
  if (listener) {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .removeEventListener("change", listener);
    delete (window as any).__systemThemeListener;
  }
}
