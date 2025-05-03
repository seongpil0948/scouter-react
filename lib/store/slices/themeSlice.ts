import { StateCreator } from "zustand";

export interface ThemeSlice {
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
  toggleTheme: () => void;
}

export const createThemeSlice: StateCreator<ThemeSlice, [], [], ThemeSlice> = (
  set,
  get
) => ({
  theme: "system",

  setTheme: (theme) => set({ theme }),

  toggleTheme: () => {
    const currentTheme = get().theme;

    if (currentTheme === "light") {
      set({ theme: "dark" });
    } else {
      set({ theme: "light" });
    }
  },
});
