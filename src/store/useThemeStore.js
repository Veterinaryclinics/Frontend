import { create } from "zustand";

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem("dashboard-theme") || "coffee", 
  setTheme: (theme) => {
    localStorage.setItem("dashboard-theme", theme);
    set({ theme });
  },
}));
