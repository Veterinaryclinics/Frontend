const AppointmentItem = ({ name, pet, time, status }) => {
  return (
    <div className="bg-primary border border-gray-200 rounded-lg p-4 flex items-center justify-between mb-2 hover:shadow-sm transition">
      <div>
        <p className="font-medium text-neutral-800">{name}</p>
        <p className="text-sm text-neutral-600">{pet}</p>
        <p className="text-xs text-neutral-600">{time}</p>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`text-xs px-2 py-[4px] rounded-full ${
            status === "In Progress"
              ? "bg-secondary text-neutral"
              : "bg-secondary text-neutral"
          }`}
        >
          {status}
        </span>
        <button className="text-xs text-neutral font-medium hover:underline">
          Chat
        </button>
      </div>
    </div>
  );
};

export default AppointmentItem;
