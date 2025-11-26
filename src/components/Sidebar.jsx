import { NavLink } from "react-router-dom";
import {
  CalendarDays,
  Video,
  MessageSquare,
  Users,
  LayoutDashboard,
  Settings,
} from "lucide-react";

const Sidebar = () => {
  const links = [
    { to: "/", label: "Dashboard", icon: <LayoutDashboard size={24} /> },
    { to: "/bookings", label: "Bookings", icon: <CalendarDays size={24} />, badge: 5 },
    { to: "/video-calls", label: "Video Calls", icon: <Video size={24} /> },
    { to: "/messages", label: "Messages", icon: <MessageSquare size={24} />, badge: 12 },
    { to: "/clients", label: "Clients", icon: <Users size={24} /> },
    { to: "/settings", label: "Settings", icon: <Settings size={24} /> },
  ];

  return (
    <aside className="w-72 h-screen bg-base-100 border-r border-base-300 flex flex-col justify-between shadow-sm">

      {/* Logo Section */}
      <div>
        <div className="flex items-center gap-4 px-8 py-8 border-b border-base-300">
          <div className="bg-primary text-primary-content rounded-2xl p-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-7 h-7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4z" />
              <path d="M6 20v-1a6 6 0 0112 0v1" />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-base-content text-xl">Petzy</h1>
            <p className="text-base-content/60 text-sm">Clinic Dashboard</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 space-y-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `
                flex items-center justify-between mx-4 px-6 py-3 rounded-xl
                transition-all duration-200
                ${isActive
                  ? "bg-primary text-primary-content shadow-md"
                  : "text-base-content hover:bg-base-200"}
                `
              }
            >
              {({ isActive }) => (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-4">
                    <span
                      className={
                        isActive ? "text-primary-content" : "text-base-content"
                      }
                    >
                      {link.icon}
                    </span>
                    <span>{link.label}</span>
                  </div>

                  {link.badge && (
                    <span
                      className={`
                        badge badge-sm
                        ${isActive ? "badge-primary" : "badge-secondary"}
                      `}
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
      <div className="flex items-center gap-4 px-8 py-6 border-t border-base-300">
        <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center text-lg font-semibold">
          DC
        </div>
        <div>
          <p className="text-base-content font-semibold text-lg">Dr. Clark</p>
          <p className="text-base-content/60 text-sm">Veterinarian</p>
        </div>
      </div>

    </aside>
  );
};

export default Sidebar;
