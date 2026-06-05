import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Video,
  MessageSquare,
  Users,
  LayoutDashboard,
  Settings,
  Building2,
  ArrowLeftRight,
} from "lucide-react";
import api from "../lib/axios";
import { useClinicStore } from "../store/useClinicStore";

const normalizeInbox = (responseData) => {
  if (!responseData) return [];
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.data)) return responseData.data;
  if (Array.isArray(responseData?.inbox)) return responseData.inbox;
  if (Array.isArray(responseData?.data?.inbox)) return responseData.data.inbox;
  if (Array.isArray(responseData?.result)) return responseData.result;
  if (Array.isArray(responseData?.data?.result)) return responseData.data.result;
  return [];
};

const Sidebar = () => {
  const navigate = useNavigate();

  const selectedClinic = useClinicStore((state) => state.selectedClinic);
  const clearSelectedClinic = useClinicStore((state) => state.clearSelectedClinic);

  const [profile, setProfile] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

const fetchUnreadMessagesCount = useCallback(async () => {
  try {
    const res = await api.get("/inbox");

    const inbox = normalizeInbox(res.data);

    const totalUnread = inbox.reduce((total, conversation) => {
      const count = Number(conversation.unreadCount || 0);
      return total + count;
    }, 0);

    setUnreadMessagesCount(totalUnread);
  } catch (error) {
    console.log(
      "SIDEBAR INBOX ERROR:",
      error.response?.data || error.message
    );

    setUnreadMessagesCount(0);
  }
}, []);

  const links = [
    { to: "/", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { to: "/bookings", label: "Bookings", icon: <CalendarDays size={20} /> },
    { to: "/video-calls", label: "Video Calls", icon: <Video size={20} /> },
    {
      to: "/messages",
      label: "Messages",
      icon: <MessageSquare size={20} />,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : null,
    },
    { to: "/clients", label: "Clients", icon: <Users size={20} /> },
    { to: "/settings", label: "Settings", icon: <Settings size={20} /> },
  ];

useEffect(() => {
  const fetchProfile = async () => {
    try {
      const res = await api.get("/account/profile");
      setProfile(res.data?.data ?? res.data);
    } catch (error) {
      console.log("PROFILE ERROR:", error.response?.data || error.message);
    } finally {
      setIsProfileLoading(false);
    }
  };

  fetchProfile();
}, []);
useEffect(() => {
  fetchUnreadMessagesCount();
}, [
  fetchUnreadMessagesCount,
  selectedClinic?.id,
  selectedClinic?.clinicId,
]);

useEffect(() => {
  const handleInboxUpdated = () => {
    fetchUnreadMessagesCount();
  };

  window.addEventListener("petzy:inbox-updated", handleInboxUpdated);

  return () => {
    window.removeEventListener("petzy:inbox-updated", handleInboxUpdated);
  };
}, [fetchUnreadMessagesCount]);

  const fullName = useMemo(() => {
    if (!profile?.firstName && !profile?.lastName) return "Clinic Owner";
    return `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim();
  }, [profile]);

  const initials = useMemo(() => {
    const first = profile?.firstName?.charAt(0) || "";
    const last = profile?.lastName?.charAt(0) || "";
    return (first || last) ? `${first}${last}`.toUpperCase() : "CO";
  }, [profile]);

  const handleSwitchClinic = () => {
    clearSelectedClinic();
    navigate("/clinics", { replace: true });
  };

  return (
    <aside className="w-72 bg-base-100 border-r border-base-300 flex flex-col fixed left-0 top-0 h-screen shadow-sm">

      {/* ── Clinic Header ── */}
      <div className="px-6 pt-6 pb-5 border-b border-base-300">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <Building2 size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-base-content/40 mb-0.5">
              Current Clinic
            </p>
            <h1 className="text-base font-semibold text-base-content truncate leading-tight">
              {selectedClinic?.name || "No clinic selected"}
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSwitchClinic}
          className="w-full flex items-center justify-center gap-2 text-sm text-base-content/60 border border-base-300 rounded-xl px-3 py-2.5 hover:bg-base-200 transition-colors"
        >
          <ArrowLeftRight size={14} />
          Switch Clinic
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 pt-4 pb-2 space-y-0.5 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all ${
                isActive
                  ? "bg-primary text-primary-content font-medium shadow-sm"
                  : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  <span className={isActive ? "text-primary-content" : "text-base-content/50"}>
                    {link.icon}
                  </span>
                  <span>{link.label}</span>
                </div>

                {link.badge != null && (
                  <span
                  className={`text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center leading-none ${
                    isActive
                      ? "bg-primary-content/25 text-primary-content"
                      : "bg-error text-error-content"
                  }`}
                >
                  {link.badge > 99 ? "99+" : link.badge}
                </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Profile Footer ── */}
      <div className="px-5 py-4 border-t border-base-300 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
          {isProfileLoading ? "…" : initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-base-content truncate leading-tight">
            {isProfileLoading ? "Loading…" : fullName}
          </p>
          <p className="text-xs text-base-content/50 truncate mt-0.5">
            {profile?.email || "Clinic Owner"}
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
