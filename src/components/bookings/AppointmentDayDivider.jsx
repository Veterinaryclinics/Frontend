const getLocalDateKey = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "unknown-date";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const getDayDividerLabel = (dateValue) => {
  if (!dateValue) return { label: "No Date", isSpecial: false };
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return { label: "No Date", isSpecial: false };

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const dateKey = getLocalDateKey(date);
  const todayKey = getLocalDateKey(today);
  const tomorrowKey = getLocalDateKey(tomorrow);

  if (dateKey === todayKey) return { label: "Today", sublabel: date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }), isSpecial: true, isToday: true };
  if (dateKey === tomorrowKey) return { label: "Tomorrow", sublabel: date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }), isSpecial: true, isToday: false };

  return {
    label: date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" }),
    isSpecial: false,
  };
};

const AppointmentDayDivider = ({ dateValue }) => {
  const { label, sublabel, isSpecial, isToday } = getDayDividerLabel(dateValue);

  return (
    <div className="flex items-center gap-4 py-3">
      <div className="h-px flex-1 bg-base-200" />

      <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-colors
        ${isToday
          ? "bg-primary text-primary-content shadow-sm shadow-primary/20"
          : isSpecial
          ? "bg-base-content/10 text-base-content/80 border border-base-content/10"
          : "bg-base-200 text-base-content/50 border border-base-200"
        }`}
      >
        {label}
        {sublabel && (
          <span className={`font-normal opacity-70`}>· {sublabel}</span>
        )}
      </div>

      <div className="h-px flex-1 bg-base-200" />
    </div>
  );
};

export default AppointmentDayDivider;