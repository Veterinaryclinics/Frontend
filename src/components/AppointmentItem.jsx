const statusConfig = {
  "In Progress": {
    class: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  Upcoming: {
    class: "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  Pending: {
    class: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    dot: "bg-amber-400",
  },
  Completed: {
    class: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  Cancelled: {
    class: "bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    dot: "bg-red-400",
  },
  Unknown: {
    class: "bg-base-200 text-base-content/50",
    dot: "bg-base-300",
  },
};

/**
 * AppointmentItem
 * @param {string} name       - Client name
 * @param {string} pet        - Pet label e.g. "Biscuit (Dog • Golden Retriever)"
 * @param {string} time       - Formatted time string
 * @param {string} status     - One of the statusConfig keys
 * @param {number} [type]     - 0 = in-person, 1 = video call
 */
const AppointmentItem = ({ name, pet, time, status, type }) => {
  const config = statusConfig[status] || statusConfig.Unknown;
  const isVideo = type === 1;

  return (
    <div className="bg-base-100 border border-base-300 rounded-xl flex items-center gap-0 hover:border-base-content/20 transition-colors overflow-hidden">
      {/* Time column */}
      <div className="flex-shrink-0 w-20 py-4 flex flex-col items-center justify-center border-r border-base-300 gap-1">
        <span className="text-xs font-mono font-medium text-base-content/70 tabular-nums">
          {time}
        </span>
        {/* Type dot */}
        <span
          className={`w-1.5 h-1.5 rounded-full ${isVideo ? "bg-violet-500" : "bg-emerald-500"}`}
          title={isVideo ? "Video call" : "In-person"}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 px-4 py-3">
        <p className="text-sm font-medium text-base-content truncate">{name}</p>
        <p className="text-xs text-base-content/50 truncate mt-0.5">{pet}</p>
      </div>

      {/* Status badge */}
      <div className="pr-4 flex-shrink-0">
        <span
          className={`inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wide uppercase rounded px-2 py-1 ${config.class}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
          {status}
        </span>
      </div>
    </div>
  );
};

export default AppointmentItem;