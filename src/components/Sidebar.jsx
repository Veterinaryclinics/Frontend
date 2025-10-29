import { NavLink } from "react-router-dom";
import { CalendarDays, Video, MessageSquare, Users, LayoutDashboard } from "lucide-react";

const Sidebar = () => {
  const links = [
    { to: "/", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { to: "/bookings", label: "Bookings", icon: <CalendarDays size={18} />, badge: 5 },
    { to: "/video-calls", label: "Video Calls", icon: <Video size={18} /> },
    { to: "/messages", label: "Messages", icon: <MessageSquare size={18} />, badge: 12 },
    { to: "/clients", label: "Clients", icon: <Users size={18} /> },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 px-6 py-5 border-b">
          <div className="bg-indigo-500 text-white rounded-lg p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4z" />
              <path d="M6 20v-1a6 6 0 0112 0v1" />
            </svg>
          </div>
          <div>
            <h1 className="font-semibold text-gray-800 text-sm">PetClinic Pro</h1>
            <p className="text-xs text-gray-500">Clinic Dashboard</p>
          </div>
        </div>

        <nav className="mt-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-6 py-2 text-sm transition ${
                  isActive ? "bg-indigo-100 text-indigo-700 font-medium" : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              <div className="flex items-center gap-3">
                {link.icon}
                {link.label}
              </div>
              {link.badge && (
                <span className="text-xs bg-red-500 text-white px-2 py-[1px] rounded-full">
                  {link.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3 px-6 py-4 border-t">
        <div className="w-8 h-8 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center text-sm font-semibold">
          DC
        </div>
        <div>
          <p className="text-sm font-medium">Dr. Clark</p>
          <p className="text-xs text-gray-500">Clark's Clinics</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
