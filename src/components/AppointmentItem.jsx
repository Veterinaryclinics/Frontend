const AppointmentItem = ({ name, pet, time, status }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between mb-2 hover:shadow-sm transition">
      <div>
        <p className="font-medium text-gray-800">{name}</p>
        <p className="text-sm text-gray-500">{pet}</p>
        <p className="text-xs text-gray-400">{time}</p>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`text-xs px-2 py-[2px] rounded-full ${
            status === "In Progress"
              ? "bg-blue-100 text-blue-600"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {status}
        </span>
        <button className="text-xs text-indigo-600 font-medium hover:underline">
          Chat
        </button>
      </div>
    </div>
  );
};

export default AppointmentItem;
