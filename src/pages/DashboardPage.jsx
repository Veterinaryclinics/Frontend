import { useEffect, useMemo, useState } from "react";
import { Calendar, Video, MessageSquare, Users, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

import DashboardCard from "../components/DashboardCard";
import AppointmentItem from "../components/AppointmentItem";
import api from "../lib/axios";
import { useClinicStore } from "../store/useClinicStore";``

/* ─── helpers (unchanged from original) ─── */

const normalizeArray = (responseData, keys = []) => {
  if (!responseData) return [];
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.data)) return responseData.data;
  if (Array.isArray(responseData?.result)) return responseData.result;
  if (Array.isArray(responseData?.data?.result)) return responseData.data.result;
  for (const key of keys) {
    if (Array.isArray(responseData?.[key])) return responseData[key];
    if (Array.isArray(responseData?.data?.[key])) return responseData.data[key];
  }
  return [];
};

const getLocalDateKey = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const isToday = (dateValue) => getLocalDateKey(dateValue) === getLocalDateKey(new Date());

const formatTime = (dateValue) => {
  if (!dateValue) return "—";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};

const getClientName = (client) => {
  if (!client) return null;
  const fullName = `${client.firstName || ""} ${client.lastName || ""}`.trim();
  return fullName || client.userName || client.email || null;
};

const getPetLabel = (pet) => {
  if (!pet) return null;
  const details = [pet.species, pet.breed].filter(Boolean).join(" • ");
  return details ? `${pet.name || "Pet"} (${details})` : pet.name || "Pet";
};

const buildClientPetMaps = (clients) => {
  const clientMap = {};
  const petMap = {};
  clients.forEach((client) => {
    if (client.id) clientMap[client.id] = client;
    if (Array.isArray(client.pets)) {
      client.pets.forEach((pet) => { if (pet.id) petMap[pet.id] = pet; });
    }
  });
  return { clientMap, petMap };
};

const getAppointmentStatus = (appointment) => {
  const now = new Date();
  const start = new Date(appointment.startTime);
  const end = appointment.endTime
    ? new Date(appointment.endTime)
    : new Date(start.getTime() + 30 * 60 * 1000);

  if (appointment.status === 0) return "Pending";
  if (appointment.status === 2) return "Cancelled";
  if (appointment.status === 3) return "Completed";
  if (
    appointment.status === 1 &&
    !Number.isNaN(start.getTime()) &&
    !Number.isNaN(end.getTime()) &&
    now >= start &&
    now <= end
  ) return "In Progress";
  if (appointment.status === 1) return "Upcoming";
  return "Unknown";
};

const isCancelledAppointment = (appointment) => {
  const status = appointment.status;

  return (
    status === 2 ||
    status === "2" ||
    String(status).toLowerCase() === "cancelled" ||
    String(status).toLowerCase() === "canceled"
  );
};

const isCompletedAppointment = (appointment) => {
  const status = appointment.status;

  return (
    status === 3 ||
    status === "3" ||
    String(status).toLowerCase() === "completed"
  );
};

const isVideoAppointment = (appointment) => {
  const type = appointment.type;

  return (
    type === 1 ||
    type === "1" ||
    String(type).toLowerCase() === "online" ||
    String(type).toLowerCase() === "video" ||
    String(type).toLowerCase() === "video call" ||
    String(type).toLowerCase() === "videocall" ||
    Boolean(appointment.videoRoomId)
  );
};

const isActiveAppointment = (appointment) => {
  return !isCancelledAppointment(appointment) && !isCompletedAppointment(appointment);
};
const isConfirmedAppointment = (appointment) => {
  const status = appointment.status;

  return (
    status === 1 ||
    status === "1" ||
    String(status).toLowerCase() === "confirmed"
  );
};

/* ─── Page ─── */

const DashboardPage = () => {
  const selectedClinic = useClinicStore((state) => state.selectedClinic);
  const clinicId = selectedClinic?.id || selectedClinic?.clinicId;

  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { clientMap, petMap } = useMemo(() => buildClientPetMaps(clients), [clients]);

  const fetchDashboardData = async () => {
    if (!clinicId) {
      toast.error("No clinic selected");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [profileRes, appointmentsRes, clientsRes, inboxRes] = await Promise.allSettled([
        api.get("/account/profile"),
        api.get(`/appointment/clinic/${clinicId}`),
        api.get(`/clinic/${clinicId}/clients/full`),
        api.get("/inbox"),
      ]);

      if (profileRes.status === "fulfilled")
        setProfile(profileRes.value.data?.data ?? profileRes.value.data);

      if (appointmentsRes.status === "fulfilled")
        setAppointments(normalizeArray(appointmentsRes.value.data, ["appointments"]));
      else toast.error("Failed to load dashboard appointments");

      if (clientsRes.status === "fulfilled")
        setClients(normalizeArray(clientsRes.value.data, ["clients"]));

      if (inboxRes.status === "fulfilled")
        setInbox(normalizeArray(inboxRes.value.data, ["inbox"]));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, [clinicId]);

  const todayAppointments = useMemo(() =>
    appointments
      .filter((a) => isToday(a.startTime))
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime)),
    [appointments]
  );

const todayVideoCalls = useMemo(() => {
  return todayAppointments.filter(isVideoAppointment);
}, [todayAppointments]);

const activeVideoCalls = useMemo(() => {
  return appointments.filter((appointment) => {
    return isVideoAppointment(appointment) && isActiveAppointment(appointment);
  });
}, [appointments]);

const confirmedVideoCalls = useMemo(() => {
  return activeVideoCalls.filter(isConfirmedAppointment);
}, [activeVideoCalls]);
console.log("DASHBOARD TODAY VIDEO CALLS:", todayVideoCalls);
  const unreadMessages = useMemo(() =>
    inbox.reduce((total, item) => total + (item.unreadCount || 0), 0),
    [inbox]
  );

  const appointmentItems = todayAppointments.slice(0, 5).map((appointment) => {
    const client = clientMap[appointment.clientId];
    const pet = petMap[appointment.petId];
    return {
      id: appointment.id,
      name: getClientName(client) || appointment.clientName || appointment.clientId || "Client",
      pet: getPetLabel(pet) || appointment.petName || appointment.petId || "Pet appointment",
      time: formatTime(appointment.startTime),
      status: getAppointmentStatus(appointment),
      type: isVideoAppointment(appointment) ? 1 : 0,
    };
  });

  const ownerName = `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim();

  // Today's date, formatted nicely
  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-base-200 p-6 space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-base-content">
            Dashboard Overview
          </h1>
          <p className="text-sm text-base-content/50 mt-0.5">
            {todayLabel}
            {ownerName && (
              <>
                {" · "}
                <span className="text-base-content/70">
                  Welcome back, {ownerName}
                </span>
              </>
            )}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-sm btn-outline rounded-lg flex items-center gap-1.5 font-normal"
          onClick={fetchDashboardData}
          disabled={isLoading}
        >
          <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <DashboardCard
          title="Today's Appointments"
          value={isLoading ? "—" : todayAppointments.length}
          change={`${todayAppointments.filter((a) => a.status === 0).length} pending`}
          icon={Calendar}
          color="primary"
        />
        <DashboardCard
          title="Video Calls"
          value={isLoading ? "—" : activeVideoCalls.length}
          change={`${confirmedVideoCalls.length} confirmed`}
          icon={Video}
          color="secondary"
        />
        <DashboardCard
          title="Unread Messages"
          value={isLoading ? "—" : unreadMessages}
          change={unreadMessages > 0 ? "Needs attention" : "All caught up"}
          icon={MessageSquare}
          color="accent"
        />
        <DashboardCard
          title="Total Clients"
          value={isLoading ? "—" : clients.length}
          change="Active clinic clients"
          icon={Users}
          color="neutral"
        />
      </div>

      {/* Appointments table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-base-content/40">
            Today's Appointments
          </h2>
          <p className="text-xs text-base-content/40">
            Showing {appointmentItems.length} of {todayAppointments.length}
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-3">
          <span className="flex items-center gap-1.5 text-[11px] text-base-content/50">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> In-person
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-base-content/50">
            <span className="w-2 h-2 rounded-full bg-violet-500" /> Video call
          </span>
        </div>

        <div className="space-y-2">
          {isLoading ? (
            <div className="bg-base-100 border border-base-300 rounded-xl flex justify-center py-12">
              <span className="loading loading-spinner loading-md text-primary" />
            </div>
          ) : appointmentItems.length > 0 ? (
            appointmentItems.map((appointment) => (
              <AppointmentItem key={appointment.id} {...appointment} />
            ))
          ) : (
            <div className="bg-base-100 border border-base-300 rounded-xl py-12 text-center">
              <p className="text-sm text-base-content/40">No appointments scheduled for today.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;