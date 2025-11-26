const DashboardCard = ({ title, value, change, icon: Icon, color = "blue" }) => {
  const colorMap = {
    blue: "text-blue-500 bg-blue-50",
    green: "text-green-500 bg-green-50",
    orange: "text-orange-500 bg-orange-50",
    purple: "text-purple-500 bg-purple-50",
  };

  return (
    <div className="bg-primary p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-sm text-neutral font-semibold">{title}</p>
        <h3 className="text-xl font-semibold text-neutral-800">{value}</h3>
      </div>
      <div className={`p-2 rounded-lg ${colorMap[color]}`}>
        <Icon size={20} />
      </div>
    </div>
  );
};

export default DashboardCard;
