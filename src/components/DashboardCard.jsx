const DashboardCard = ({ title, value, change, icon: Icon, color = "blue" }) => {
  const colorMap = {
    blue: "text-blue-500 bg-blue-50",
    green: "text-green-500 bg-green-50",
    orange: "text-orange-500 bg-orange-50",
    purple: "text-purple-500 bg-purple-50",
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <h3 className="text-xl font-semibold text-gray-800">{value}</h3>
        <p className="text-xs text-green-600 mt-1">{change}</p>
      </div>
      <div className={`p-2 rounded-lg ${colorMap[color]}`}>
        <Icon size={20} />
      </div>
    </div>
  );
};

export default DashboardCard;
