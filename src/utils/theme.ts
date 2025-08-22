// Simple theme management utility
export type Theme = "light" | "dark" | "system";

// Apply theme to document
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;

  console.log("Applying theme:", theme); // Debug log

  // Remove any existing theme classes
  root.classList.remove("dark");

  if (theme === "dark") {
    root.classList.add("dark");
    console.log("Added dark class"); // Debug log
  } else if (theme === "system") {
    // Check system preference
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    console.log("System preference is dark:", isDark); // Debug log
    if (isDark) {
      root.classList.add("dark");
      console.log("Added dark class for system preference"); // Debug log
    }
  } else {
    console.log("Light theme - dark class removed"); // Debug log
  }

  // Save to localStorage with the same key as settings store
  const currentSettings = JSON.parse(
    localStorage.getItem("userSettings") || "{}"
  );
  const updatedSettings = { ...currentSettings, theme };
  localStorage.setItem("userSettings", JSON.stringify(updatedSettings));
  console.log("Theme saved to userSettings:", theme); // Debug log
}

// Get current theme from localStorage (compatible with settings store)
export function getCurrentTheme(): Theme {
  const userSettings = localStorage.getItem("userSettings");
  console.log("Getting theme from userSettings:", userSettings); // Debug log

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
  console.log("Toggling theme from", current, "to", newTheme); // Debug log
  applyTheme(newTheme);
}

// Initialize theme on app start
export function initializeTheme(): void {
  console.log("Initializing theme..."); // Debug log
  const theme = getCurrentTheme();
  applyTheme(theme);

  // Listen for system theme changes (only if using system theme)
  if (theme === "system") {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      console.log("System theme changed:", e.matches ? "dark" : "light"); // Debug log
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

// Test function to check session saving (for debugging)
export async function testSessionSaving(): Promise<void> {
  try {
    const { sessionService } = await import("../services/database");

    // Create a test session
    const testSession = {
      projectId: "test-project-id",
      categoryId: "test-category-id",
      type: "work" as const,
      plannedDuration: 25 * 60 * 1000, // 25 minutes in milliseconds
      actualDuration: 20 * 60 * 1000, // 20 minutes in milliseconds
      startTime: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
      endTime: new Date(),
      completed: true,
    };

    console.log("Creating test session:", testSession);
    const savedSession = await sessionService.create(testSession);
    console.log("Test session saved successfully:", savedSession);

    // Try to retrieve it
    const allSessions = await sessionService.getAll();
    console.log("All sessions in database:", allSessions);
  } catch (error) {
    console.error("Error testing session saving:", error);
  }
}

// Make test function available globally for debugging
if (typeof window !== "undefined") {
  (window as any).testSessionSaving = testSessionSaving;
}
