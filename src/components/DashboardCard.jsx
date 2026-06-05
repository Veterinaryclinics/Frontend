const accentColors = {
  primary: "#185FA5",
  secondary: "#534AB7",
  accent: "#0F6E56",
  neutral: "hsl(var(--bc) / 0.2)",
};

const iconBg = {
  primary: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  secondary: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  accent: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  neutral: "bg-base-200 text-base-content/60",
};

const DashboardCard = ({ title, value, change, icon: Icon, color = "primary" }) => {
  const accent = accentColors[color] || accentColors.primary;
  const iconClass = iconBg[color] || iconBg.primary;

  return (
    <div className="bg-base-100 rounded-xl border border-base-300 shadow-sm overflow-hidden flex flex-col">
      {/* Accent bar */}
      <div className="h-[3px] w-full" style={{ background: accent }} />

      <div className="p-4 flex items-start justify-between gap-3 flex-1">
        <div className="min-w-0 flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-base-content/50">
            {title}
          </p>
          <h3 className="text-3xl font-semibold text-base-content font-mono leading-none">
            {value}
          </h3>
          <span className="inline-flex items-center gap-1 text-[11px] text-base-content/50 bg-base-200 rounded px-2 py-1 w-fit">
            {change}
          </span>
        </div>

        <div className={`p-2.5 rounded-lg flex-shrink-0 ${iconClass}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;