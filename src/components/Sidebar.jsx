import { NavLink } from "react-router-dom";
import { CalendarDays, Video, MessageSquare, Users, LayoutDashboard } from "lucide-react";

const Sidebar = () => {
  const links = [
    { to: "/", label: "Dashboard", icon: <LayoutDashboard size={28} /> },
    { to: "/bookings", label: "Bookings", icon: <CalendarDays size={28} />, badge: 5 },
    { to: "/video-calls", label: "Video Calls", icon: <Video size={28} /> },
    { to: "/messages", label: "Messages", icon: <MessageSquare size={28} />, badge: 12 },
    { to: "/clients", label: "Clients", icon: <Users size={28} /> },
  ];

  return (
    <aside className="w-80 bg-white border-r border-gray-200 flex flex-col justify-between shadow-sm">
      {/* Logo Section */}
      <div>
        <div className="flex items-center gap-4 px-10 py-8 border-b border-gray-100">
          <div className="bg-indigo-600 text-white rounded-2xl p-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4z" />
              <path d="M6 20v-1a6 6 0 0112 0v1" />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-gray-800 text-xl">PetClinic Pro</h1>
            <p className="text-base text-gray-500">Clinic Dashboard</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-8 space-y-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-8 py-4 mx-4 rounded-2xl text-lg transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-600 text-white font-semibold shadow-md"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              {({ isActive }) => (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-5">
                    <span className={isActive ? "text-white" : "text-gray-700"}>
                      {link.icon}
                    </span>
                    <span>{link.label}</span>
                  </div>

                  {link.badge && (
                    <span
                      className={`text-sm font-bold px-3 py-[4px] rounded-full ${
                        link.to === "/bookings"
                          ? "bg-red-100 text-red-600"
                          : "bg-indigo-100 text-indigo-700"
                      }`}
                    >
                      {link.badge}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom User Section */}
      <div className="flex items-center gap-5 px-10 py-6 border-t border-gray-100">
        <div className="w-12 h-12 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center text-lg font-semibold">
          DC
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-800">Dr. Clark</p>
          <p className="text-base text-gray-500">Veterinarian</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
