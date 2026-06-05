import { useEffect, useMemo, useState } from "react";
import { Calendar, Clock, Search, Video, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../lib/axios";
import { useClinicStore } from "../store/useClinicStore";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_VALUE = { Pending: 0, Confirmed: 1, Cancelled: 2, Completed: 3 };

const normalizeAppointments = (responseData) => {
  if (!responseData) return [];
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.data)) return responseData.data;
  if (Array.isArray(responseData?.appointments)) return responseData.appointments;
  if (Array.isArray(responseData?.data?.appointments)) return responseData.data.appointments;
  if (Array.isArray(responseData?.result)) return responseData.result;
  if (Array.isArray(responseData?.data?.result)) return responseData.data.result;
  if (responseData?.id) return [responseData];
  if (responseData?.data?.id) return [responseData.data];
  return [];
};

const normalizeClients = (responseData) => {
  if (!responseData) return [];
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.data)) return responseData.data;
  if (Array.isArray(responseData?.clients)) return responseData.clients;
  if (Array.isArray(responseData?.data?.clients)) return responseData.data.clients;
  if (Array.isArray(responseData?.result)) return responseData.result;
  if (Array.isArray(responseData?.data?.result)) return responseData.data.result;
  if (responseData?.id || responseData?.email) return [responseData];
  if (responseData?.data?.id || responseData?.data?.email) return [responseData.data];
  return [];
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

const getClientName = (client) => {
  if (!client) return null;
  const fullName = `${client.firstName || ""} ${client.lastName || ""}`.trim();
  return fullName || client.userName || client.email || null;
};

const getPetLabel = (pet) => {
  if (!pet) return null;
  const details = [pet.species, pet.breed].filter(Boolean).join(" · ");
  return details ? `${pet.name || "Unnamed Pet"} (${details})` : pet.name || "Unnamed Pet";
};

const formatDate = (dateValue) => {
  if (!dateValue) return "—";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatTime = (dateValue) => {
  if (!dateValue) return "—";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};

const isVideoCallAvailable = (appointment) => {
  if (!appointment?.startTime || appointment.type !== 1 || appointment.status !== STATUS_VALUE.Confirmed) return false;
  const now = new Date();
  const start = new Date(appointment.startTime);
  const end = appointment.endTime ? new Date(appointment.endTime) : new Date(start.getTime() + 60 * 60 * 1000);
  return now >= new Date(start.getTime() - 30 * 60 * 1000) && now <= new Date(end.getTime() + 30 * 60 * 1000);
};

const getVideoButtonText = (appointment) => {
  if (appointment.status === STATUS_VALUE.Completed) return "Completed";
  if (appointment.status === STATUS_VALUE.Cancelled) return "Cancelled";
  if (appointment.status === STATUS_VALUE.Pending) return "Awaiting confirmation";
  if (appointment.status === STATUS_VALUE.Confirmed) {
    return isVideoCallAvailable(appointment) ? "Join Call" : "Available 30m before";
  }
  return "Unavailable";
};

const STATUS_CONFIG = {
  0: { label: "Pending", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50" },
  1: { label: "Confirmed", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50" },
  2: { label: "Cancelled", cls: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-700/50" },
  3: { label: "Completed", cls: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 border border-sky-200 dark:border-sky-700/50" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const VideoCallsPage = () => {
  const navigate = useNavigate();
  const selectedClinic = useClinicStore((state) => state.selectedClinic);
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [startingAppointmentId, setStartingAppointmentId] = useState(null);
  const clinicId = selectedClinic?.id || selectedClinic?.clinicId;
  const { clientMap, petMap } = useMemo(() => buildClientPetMaps(clients), [clients]);

  useEffect(() => {
    const fetchVideoAppointments = async () => {
      if (!clinicId) { setAppointments([]); setIsLoading(false); toast.error("No clinic selected"); return; }
      setIsLoading(true);
      try {
        const [appointmentsRes, clientsRes] = await Promise.allSettled([
          api.get(`/appointment/clinic/${clinicId}`),
          api.get(`/clinic/${clinicId}/clients/full`),
        ]);
        if (appointmentsRes.status === "fulfilled") {
          const all = normalizeAppointments(appointmentsRes.value.data);
          setAppointments(all.filter((a) => a.type === 1));
        } else { toast.error("Failed to load video appointments"); }
        if (clientsRes.status === "fulfilled") setClients(normalizeClients(clientsRes.value.data));
      } finally { setIsLoading(false); }
    };
    fetchVideoAppointments();
  }, [clinicId]);

  const filteredAppointments = useMemo(() => {
    const q = search.toLowerCase().trim();
    return appointments.filter((appointment) => {
      const client = clientMap[appointment.clientId];
      const pet = petMap[appointment.petId];
      const clientName = getClientName(client) || appointment.clientName || appointment.clientId || "";
      const petLabel = getPetLabel(pet) || appointment.petName || appointment.petId || "";
      return !q || clientName.toLowerCase().includes(q) || petLabel.toLowerCase().includes(q);
    }).sort((a, b) => new Date(a.startTime || 0) - new Date(b.startTime || 0));
  }, [appointments, search, clientMap, petMap]);

  const handleStartCall = async (appointment) => {
    if (!isVideoCallAvailable(appointment)) {
      toast.error("Video call is only available 30 minutes before the appointment");
      return;
    }
    setStartingAppointmentId(appointment.id);
    try {
      const res = await api.post(`/videocall/${appointment.id}/start`);
      navigate(`/video-calls/${appointment.id}`, { state: { appointment } });
    } catch (error) {
      toast.error("Failed to start video call");
    } finally {
      setStartingAppointmentId(null);
    }
  };

  return (
    <div className="min-h-screen bg-base-100 p-6 lg:p-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-base-content flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Video size={15} className="text-primary" />
            </div>
            Video Calls
          </h1>
          <p className="text-sm text-base-content/50 mt-1">
            {selectedClinic?.name || "Select a clinic"} · {appointments.length} online appointments
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2.5 mb-6 p-3.5 bg-base-200/50 border border-base-200 rounded-2xl max-w-md">
        <Search size={14} className="text-base-content/40 shrink-0" />
        <input
          type="text"
          placeholder="Search by client or pet…"
          className="flex-1 text-sm bg-transparent focus:outline-none placeholder:text-base-content/30"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button type="button" onClick={() => setSearch("")} className="text-base-content/30 hover:text-base-content">
            <X size={13} />
          </button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <span className="loading loading-spinner loading-md text-primary" />
          <p className="text-sm text-base-content/40">Loading video appointments…</p>
        </div>
      ) : filteredAppointments.length > 0 ? (
        <div className="space-y-2.5">
          {filteredAppointments.map((appointment) => {
            const client = clientMap[appointment.clientId];
            const pet = petMap[appointment.petId];
            const clientName = getClientName(client) || appointment.clientName || "Unknown Client";
            const petLabel = getPetLabel(pet) || appointment.petName || "Unknown Pet";
            const canStart = isVideoCallAvailable(appointment);
            const statusCfg = STATUS_CONFIG[appointment.status] || { label: "Unknown", cls: "bg-base-200 text-base-content/50 border border-base-200" };

            return (
              <div
                key={appointment.id}
                className={`group relative bg-base-100 border rounded-2xl transition-all duration-150 overflow-hidden
                  ${canStart ? "border-primary/30 hover:shadow-lg hover:shadow-primary/5" : "border-base-200 hover:border-base-300 hover:shadow-md"}`}
              >
                {/* Accent bar for joinable calls */}
                {canStart && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-2xl" />}

                <div className="flex flex-col md:flex-row md:items-center gap-4 p-4 pl-5">
                  {/* Icon */}
                  <div className={`p-2.5 rounded-xl shrink-0 w-fit ${canStart ? "bg-primary/15 text-primary" : "bg-base-200 text-base-content/40"}`}>
                    <Video size={18} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-sm text-base-content">{clientName}</p>
                      <span className="text-base-content/30 text-xs">·</span>
                      <p className="text-sm text-base-content/60">{petLabel}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-base-content/50">
                      <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(appointment.startTime)}</span>
                      <span className="flex items-center gap-1"><Clock size={11} />{formatTime(appointment.startTime)}</span>
                      {appointment.videoRoomId && <span className="truncate max-w-[160px]">Room: {appointment.videoRoomId}</span>}
                    </div>
                  </div>

                  {/* Status + action */}
                  <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusCfg.cls}`}>
                      {statusCfg.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStartCall({ ...appointment, clientName, petName: petLabel })}
                      disabled={!canStart || startingAppointmentId === appointment.id}
                      className={`btn btn-sm rounded-xl gap-1.5 ${
                        canStart
                          ? "bg-primary hover:bg-primary/90 text-primary-content border-none shadow-sm"
                          : "btn-ghost text-base-content/30 cursor-default"
                      }`}
                    >
                      <Video size={13} />
                      {startingAppointmentId === appointment.id ? "Starting…" : getVideoButtonText(appointment)}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-base-200 flex items-center justify-center">
            <Video size={20} className="text-base-content/30" />
          </div>
          <p className="text-sm font-medium text-base-content/50">No online appointments</p>
          <p className="text-xs text-base-content/30">Confirmed online bookings will appear here.</p>
        </div>
      )}
    </div>
  );
};

export default VideoCallsPage;