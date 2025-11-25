import React from "react";
import { useThemeStore } from "../store/useThemeStore";
import { THEMES } from "../constants";
import { Send } from "lucide-react";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey there!", isSent: false },
  { id: 2, content: "Oh hi! How's it going?", isSent: true },
];

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();

  return (

    <div className="min-h-[90vh] container mx-auto px-6 pt-16 max-w-6xl transition-colors duration-300">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-base-content">Settings</h1>
        <p className="text-sm text-base-content/70">
          Customize your dashboard theme and preview the color palette
        </p>
      </div>

      {/* Theme Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-base-content">Theme</h2>
          <p className="text-sm text-base-content/70">
            Choose a theme for your dashboard
          </p>
        </div>

        {/* Theme Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {THEMES.map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`flex flex-col items-center gap-2 p-2 rounded-lg border transition-colors duration-200
                ${
                  theme === t
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-base-300 hover:bg-base-200"
                }`}
            >
              {/* Theme Color Preview */}
              <div
                className="relative h-8 w-full rounded-md overflow-hidden border border-base-300"
                data-theme={t}
              >
                <div className="absolute inset-0 grid grid-cols-4 gap-px p-1">
                  <div className="rounded bg-primary"></div>
                  <div className="rounded bg-secondary"></div>
                  <div className="rounded bg-accent"></div>
                  <div className="rounded bg-neutral"></div>
                </div>
              </div>
              <span className="text-xs font-medium text-base-content capitalize">
                {t}
              </span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
};

export default SettingsPage;
