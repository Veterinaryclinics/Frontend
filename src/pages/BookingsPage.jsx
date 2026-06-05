import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, CalendarDays, Clock, History, LayoutGrid, SlidersHorizontal } from "lucide-react";
import toast from "react-hot-toast";
import VisitSummaryForm from "../components/VisitSummaryForm";
import MedicalHistoryModal from "../components/MedicalHistoryModal";
import AppointmentDayDivider from "../components/bookings/AppointmentDayDivider";
import AppointmentDetailsModal from "../components/bookings/AppointmentDetailsModal";
import EditAppointmentModal from "../components/bookings/EditAppointmentModal";
import CancelAppointmentModal from "../components/bookings/CancelAppointmentModal";
import AppointmentCard from "../components/bookings/AppointmentCard";
import api from "../lib/axios";
import { useClinicStore } from "../store/useClinicStore";

// ─── Constants ────────────────────────────────────────────────────────────────

const APPOINTMENT_STATUS = {
  0: "Pending",
  1: "Confirmed",
  2: "Cancelled",
  3: "Completed",
  4: "Reschedule Requested",
};

const STATUS_VALUE = {
  Pending: 0,
  Confirmed: 1,
  Cancelled: 2,
  Completed: 3,
  RescheduleRequested: 4,
};
const APPOINTMENT_TYPE = { 0: "Physical", 1: "Online" };

// ─── Normalizers ─────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getStatusLabel = (status) => APPOINTMENT_STATUS[status] || "Unknown";
const getTypeLabel = (type) => APPOINTMENT_TYPE[type] || "Unknown";

const toLocalBackendDateTime = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  const pad = (num) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const getClientName = (client) => {
  if (!client) return null;
  const fullName = `${client.firstName || ""} ${client.lastName || ""}`.trim();
  return fullName || client.userName || client.email || null;
};

const getPetLabel = (pet) => {
  if (!pet) return null;
  const petName = pet.name || "Unnamed Pet";
  const petDetails = [pet.species, pet.breed].filter(Boolean).join(" • ");
  return petDetails ? `${petName} (${petDetails})` : petName;
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

const getLocalDateKey = (dateValue) => {
  const date = parseDbDateAsLocal(dateValue);
  if (!date) return "unknown-date";

  const pad = (num) => String(num).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const hasProposedSchedule = (appointment) =>
  Boolean(appointment?.proposedStartTime || appointment?.proposedEndTime);

const isRescheduleRequested = (appointment) =>
  appointment?.status === STATUS_VALUE.RescheduleRequested ||
  hasProposedSchedule(appointment);

const isClinicRescheduleProposal = (appointment) =>
  String(appointment?.rescheduledBy || "").toLowerCase().includes("clinic");

const isClientRescheduleProposal = (appointment) =>
  appointment?.status === STATUS_VALUE.RescheduleRequested &&
  !isClinicRescheduleProposal(appointment);

// ─── Sorting & filtering ──────────────────────────────────────────────────────
const parseDbDateAsLocal = (dateValue) => {
  if (!dateValue) return null;

  const value = String(dateValue);

  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/
  );

  if (!match) {
    const fallbackDate = new Date(dateValue);
    return Number.isNaN(fallbackDate.getTime()) ? null : fallbackDate;
  }

  const [, year, month, day, hour, minute, second = "00"] = match;

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  );
};
const PAGE_SIZE = 12;

const TIMELINE_VIEWS = { Active: "Active", Today: "Today", Upcoming: "Upcoming", Past: "Past", All: "All" };

const startOfLocalDay = (dateValue) => {
  const date = parseDbDateAsLocal(dateValue);
  if (!date) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const getDateBucket = (appointment) => {
  const appointmentDay = startOfLocalDay(appointment.startTime);
  const today = startOfLocalDay(new Date());
  if (!appointmentDay || !today) return "unknown";
  if (appointmentDay.getTime() === today.getTime()) return "today";
  if (appointmentDay.getTime() > today.getTime()) return "upcoming";
  return "past";
};

const getTimelineRank = (appointment) => {
  const bucket = getDateBucket(appointment);
  if (bucket === "today") return 0;
  if (bucket === "upcoming") return 1;
  if (bucket === "past") return 2;
  return 3;
};

const getAppointmentTimeMs = (appointment) => {
  const date = parseDbDateAsLocal(appointment.startTime);
  return date ? date.getTime() : 0;
};

const getStatusSortRank = (appointment) => {
  if (appointment.status === STATUS_VALUE.RescheduleRequested) return 0;

const hasReschedule = Boolean(
  appointment.proposedStartTime || appointment.proposedEndTime
);

if (hasReschedule) return 0;
  if (appointment.status === STATUS_VALUE.Pending) return 1;
  if (appointment.status === STATUS_VALUE.Confirmed) return 2;
  if (appointment.status === STATUS_VALUE.Completed) return 3;
  if (appointment.status === STATUS_VALUE.Cancelled) return 4;
  return 5;
};

const sortAppointmentsForTimeline = (appointments) => {
  return [...appointments].sort((a, b) => {
    const timelineRankA = getTimelineRank(a);
    const timelineRankB = getTimelineRank(b);
    if (timelineRankA !== timelineRankB) return timelineRankA - timelineRankB;

    const bucketA = getDateBucket(a);
    const bucketB = getDateBucket(b);
    const timeA = getAppointmentTimeMs(a);
    const timeB = getAppointmentTimeMs(b);
    const dayA = startOfLocalDay(a.startTime)?.getTime() || 0;
    const dayB = startOfLocalDay(b.startTime)?.getTime() || 0;

    if (dayA !== dayB) {
      if (bucketA === "past" && bucketB === "past") return dayB - dayA;
      return dayA - dayB;
    }

    const statusRankA = getStatusSortRank(a);
    const statusRankB = getStatusSortRank(b);
    if (statusRankA !== statusRankB) return statusRankA - statusRankB;

    if (bucketA === "past") return timeB - timeA;
    return timeA - timeB;
  });
};

// ─── Stat card ────────────────────────────────────────────────────────────────

const StatCard = ({ label, sublabel, value, icon: Icon, accent, isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative rounded-2xl border p-4 text-left transition-all duration-200 group overflow-hidden
      ${isActive
        ? "border-primary/40 bg-primary/8 shadow-sm shadow-primary/10"
        : "border-base-200 bg-base-100 hover:border-base-300 hover:bg-base-200/50"
      }`}
  >
    <div className={`absolute top-0 right-0 w-16 h-16 rounded-full opacity-10 blur-2xl -mr-4 -mt-4 ${accent}`} />
    <div className="flex items-start justify-between mb-3">
      <div className={`p-2 rounded-xl ${isActive ? "bg-primary/15" : "bg-base-200"}`}>
        <Icon size={14} className={isActive ? "text-primary" : "text-base-content/40"} />
      </div>
      {value !== undefined && (
        <span className={`text-xl font-bold tabular-nums ${isActive ? "text-primary" : "text-base-content"}`}>
          {value}
        </span>
      )}
    </div>
    <p className={`text-xs font-semibold ${isActive ? "text-primary" : "text-base-content/70"}`}>{label}</p>
    {sublabel && <p className="text-xs text-base-content/40 mt-0.5">{sublabel}</p>}
  </button>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const BookingsPage = () => {
  const navigate = useNavigate();
  const [startingVideoCallId, setStartingVideoCallId] = useState(null);
  const selectedClinic = useClinicStore((state) => state.selectedClinic);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [isConfirmingAppointment, setIsConfirmingAppointment] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [isVisitSummaryOpen, setIsVisitSummaryOpen] = useState(false);
  const [isSavingVisitSummary, setIsSavingVisitSummary] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [timelineView, setTimelineView] = useState(TIMELINE_VIEWS.Active);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [isUpdatingAppointment, setIsUpdatingAppointment] = useState(false);
  const [isCancellingAppointment, setIsCancellingAppointment] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isMedicalHistoryOpen, setIsMedicalHistoryOpen] = useState(false);
  const [isLoadingMedicalHistory, setIsLoadingMedicalHistory] = useState(false);
  const [medicalHistory, setMedicalHistory] = useState(null);
  const [medicalHistoryTitle, setMedicalHistoryTitle] = useState("Medical History");
  const [medicalHistoryContext, setMedicalHistoryContext] = useState({ appointment: null, client: null, pet: null });

  const clinicId = selectedClinic?.id || selectedClinic?.clinicId;

  const { clientMap, petMap } = useMemo(() => buildClientPetMaps(clients), [clients]);

  const appointmentCounts = useMemo(() => {
    return appointments.reduce(
      (acc, appointment) => {
        const bucket = getDateBucket(appointment);
        if (bucket === "today") acc.today += 1;
        if (bucket === "upcoming") acc.upcoming += 1;
        if (bucket === "past") acc.past += 1;
        acc.all += 1;
        return acc;
      },
      { today: 0, upcoming: 0, past: 0, all: 0 }
    );
  }, [appointments]);

  const fetchAppointments = async () => {
    if (!clinicId) {
      setAppointments([]);
      setIsLoadingAppointments(false);
      toast.error("No clinic selected");
      return;
    }
    setIsLoadingAppointments(true);
    try {
      const [appointmentsRes, clientsRes] = await Promise.allSettled([
        api.get(`/appointment/clinic/${clinicId}`),
        api.get(`/clinic/${clinicId}/clients/full`),
      ]);
      if (appointmentsRes.status === "fulfilled") {
        setAppointments(normalizeAppointments(appointmentsRes.value.data));
      } else {
        toast.error("Failed to load appointments");
      }
      if (clientsRes.status === "fulfilled") {
        setClients(normalizeClients(clientsRes.value.data));
      } else {
        setClients([]);
      }
    } finally {
      setIsLoadingAppointments(false);
    }
  };

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [search, statusFilter, typeFilter, timelineView]);
  useEffect(() => { fetchAppointments(); }, [clinicId]);

  const filteredAppointments = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();
    return appointments.filter((appointment) => {
      const client = clientMap[appointment.clientId];
      const pet = petMap[appointment.petId];
      const clientName = getClientName(client) || appointment.clientName || appointment.clientId || "";
      const petLabel = getPetLabel(pet) || appointment.petName || appointment.petId || "";
      const matchesSearch =
        !normalizedSearch ||
        clientName.toLowerCase().includes(normalizedSearch) ||
        petLabel.toLowerCase().includes(normalizedSearch) ||
        String(appointment.id || "").toLowerCase().includes(normalizedSearch);
      const statusLabel = getStatusLabel(appointment.status);
      const typeLabel = getTypeLabel(appointment.type);
      const matchesStatus =
      statusFilter === "All" ||
      statusLabel === statusFilter ||
      (statusFilter === "Reschedule Requested" &&
        appointment.status === STATUS_VALUE.RescheduleRequested);
      const matchesType = typeFilter === "All" || typeLabel === typeFilter;
      const bucket = getDateBucket(appointment);
      const matchesTimeline =
        timelineView === TIMELINE_VIEWS.All ||
        (timelineView === TIMELINE_VIEWS.Active && (bucket === "today" || bucket === "upcoming")) ||
        (timelineView === TIMELINE_VIEWS.Today && bucket === "today") ||
        (timelineView === TIMELINE_VIEWS.Upcoming && bucket === "upcoming") ||
        (timelineView === TIMELINE_VIEWS.Past && bucket === "past");
      return matchesSearch && matchesStatus && matchesType && matchesTimeline;
    });
  }, [appointments, search, statusFilter, typeFilter, timelineView, clientMap, petMap]);

  const sortedAppointments = useMemo(() => sortAppointmentsForTimeline(filteredAppointments), [filteredAppointments]);
  const visibleAppointments = useMemo(() => sortedAppointments.slice(0, visibleCount), [sortedAppointments, visibleCount]);

  const groupedAppointments = useMemo(() => {
    const groups = [];
    visibleAppointments.forEach((appointment) => {
      const key = getLocalDateKey(appointment.startTime);
      const existingGroup = groups.find((group) => group.key === key);
      if (existingGroup) {
        existingGroup.appointments.push(appointment);
      } else {
        groups.push({ key, dateValue: appointment.startTime, appointments: [appointment] });
      }
    });
    return groups;
  }, [visibleAppointments]);

  const hasMoreAppointments = visibleCount < sortedAppointments.length;

  const handleOpenDetails = async (appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailsModalOpen(true);
    try {
      const res = await api.get(`/appointment/${appointment.id}`);
      setSelectedAppointment(res.data?.data ?? res.data);
    } catch (error) {
      console.log("FETCH SINGLE APPOINTMENT ERROR:", error.response?.data || error.message);
    }
  };

 const handleSaveAppointmentDate = async (appointment, startDateTime) => {
  setIsUpdatingAppointment(true);

  try {
    const oldStart = new Date(appointment.startTime);
    const oldEnd = new Date(appointment.endTime);

    const oldDurationMs =
      !Number.isNaN(oldStart.getTime()) && !Number.isNaN(oldEnd.getTime())
        ? oldEnd.getTime() - oldStart.getTime()
        : 30 * 60 * 1000;

    const newStart = new Date(startDateTime);
    const newEnd = new Date(newStart.getTime() + oldDurationMs);

    const payload = {
      newStartTime: toLocalBackendDateTime(newStart),
      newEndTime: toLocalBackendDateTime(newEnd),
    };

    console.log("REQUEST RESCHEDULE PAYLOAD:", payload);

    const res = await api.put(
      `/appointment/${appointment.id}/request-reschedule`,
      payload
    );

    console.log("REQUEST RESCHEDULE RESPONSE:", res.data);

    toast.success("Reschedule request sent.");

    setIsEditModalOpen(false);
    setSelectedAppointment(null);

    await fetchAppointments();
  } catch (error) {
    console.log(
      "REQUEST RESCHEDULE ERROR:",
      error.response?.data || error.message
    );

    toast.error("Failed to request reschedule");
  } finally {
    setIsUpdatingAppointment(false);
  }
};

  const handleCancelAppointment = async (appointment, reason) => {
    setIsCancellingAppointment(true);
    try {
      const res = await api.put(`/appointment/${appointment.id}/status`, { status: STATUS_VALUE.Cancelled });
      console.log("CANCEL APPOINTMENT RESPONSE:", res.data);
      toast.success("Appointment cancelled.");
      setIsCancelModalOpen(false);
      setSelectedAppointment(null);
      await fetchAppointments();
    } catch (error) {
      console.log("CANCEL APPOINTMENT ERROR:", error.response?.data || error.message);
      toast.error("Failed to cancel appointment");
    } finally {
      setIsCancellingAppointment(false);
    }
  };

const handleConfirmAppointment = async (appointment) => {
  setIsConfirmingAppointment(true);

  try {
    if (appointment.status === STATUS_VALUE.RescheduleRequested) {
      const res = await api.put(
        `/appointment/${appointment.id}/respond-reschedule`,
        null,
        {
          params: {
            accept: true,
          },
        }
      );

      console.log("ACCEPT RESCHEDULE RESPONSE:", res.data);

      toast.success("Reschedule request accepted.");
    } else if (appointment.status === STATUS_VALUE.Pending) {
      const res = await api.put(`/appointment/${appointment.id}/status`, {
        status: STATUS_VALUE.Confirmed,
      });

      console.log("CONFIRM APPOINTMENT RESPONSE:", res.data);

      toast.success("Appointment confirmed successfully.");
    } else {
      toast.error("This appointment cannot be confirmed.");
      return;
    }

    setOpenActionMenuId(null);
    await fetchAppointments();
  } catch (error) {
    console.log(
      "CONFIRM / ACCEPT APPOINTMENT ERROR:",
      error.response?.data || error.message
    );

    toast.error("Failed to confirm appointment");
  } finally {
    setIsConfirmingAppointment(false);
  }
};

  const isVideoCallAvailable = (appointment) => {
    if (!appointment?.startTime) return false;
    if (appointment.type !== 1) return false;
    if (appointment.status !== STATUS_VALUE.Confirmed) return false;
    const now = new Date();
    const start = parseDbDateAsLocal(appointment.startTime);
    if (!start) return false;

    const end = appointment.endTime
      ? parseDbDateAsLocal(appointment.endTime)
      : new Date(start.getTime() + 60 * 60 * 1000);
    return now >= new Date(start.getTime() - 30 * 60 * 1000) && now <= new Date(end.getTime() + 30 * 60 * 1000);
  };

  const canCompletePhysicalAppointment = (appointment) => {
    if (!appointment) return false;
    if (appointment.type !== 0) return false;
    if (appointment.status !== STATUS_VALUE.Confirmed) return false;
    if (!appointment.startTime) return false;
    const startTime = parseDbDateAsLocal(appointment.startTime);
    if (!startTime) return false;
    return new Date() >= startTime;
  };

  const handleStartVideoCall = async (appointment) => {
    if (!isVideoCallAvailable(appointment)) {
      toast.error("Video call is only available 30 minutes before the appointment");
      return;
    }
    setStartingVideoCallId(appointment.id);
    try {
      const res = await api.post(`/videocall/${appointment.id}/start`);
      navigate(`/video-calls/${appointment.id}`, { state: { appointment, videoCallData: res.data } });
    } catch (error) {
      toast.error("Failed to start video call");
    } finally {
      setStartingVideoCallId(null);
    }
  };

  const handleSubmitVisitSummary = async (payload) => {
    setIsSavingVisitSummary(true);
    try {
      if (!payload.petId || !payload.clinicId || !payload.appointmentId) {
        toast.error("Missing appointment, clinic, or pet information.");
        return;
      }
      await api.post("/medical-history", payload);
      await api.put(`/appointment/${payload.appointmentId}/status`, { status: STATUS_VALUE.Completed });
      toast.success("Medical history saved. Appointment completed.");
      setIsVisitSummaryOpen(false);
      setSelectedAppointment(null);
      await fetchAppointments();
    } catch (error) {
      toast.error("Medical history was not saved. Appointment was not completed.");
    } finally {
      setIsSavingVisitSummary(false);
    }
  };

  const handleViewAppointmentMedicalHistory = async (appointment, client, pet) => {
    if (!appointment?.id) { toast.error("Appointment ID is missing."); return; }
    setMedicalHistoryTitle("Appointment Medical History");
    setMedicalHistoryContext({ appointment, client, pet });
    setMedicalHistory(null);
    setIsMedicalHistoryOpen(true);
    setIsLoadingMedicalHistory(true);
    try {
      const res = await api.get(`/medical-history/appointment/${appointment.id}`);
      setMedicalHistory(res.data?.data ?? res.data);
    } catch (error) {
      toast.error("Failed to load appointment medical history.");
    } finally {
      setIsLoadingMedicalHistory(false);
    }
  };

  const handleViewPetMedicalHistory = async (appointment, client, pet) => {
    const petId = pet?.id || appointment?.petId;
    if (!petId) { toast.error("Pet ID is missing."); return; }
    setMedicalHistoryTitle("Full Pet Medical History");
    setMedicalHistoryContext({ appointment, client, pet });
    setMedicalHistory(null);
    setIsMedicalHistoryOpen(true);
    setIsLoadingMedicalHistory(true);
    try {
      const res = await api.get(`/medical-history/pet/${petId}`);
      setMedicalHistory(res.data?.data ?? res.data);
    } catch (error) {
      toast.error("Failed to load pet medical history.");
    } finally {
      setIsLoadingMedicalHistory(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-base-100 p-6 lg:p-8 text-base-content">

      {/* Page header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-base-content">Bookings</h1>
          <p className="text-sm text-base-content/50 mt-1">
            {selectedClinic?.name || "Select a clinic"} · {appointmentCounts.all} total appointments
          </p>
        </div>
      </div>

      {/* Stat cards / timeline view switcher */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Active"
          sublabel="Today + upcoming"
          icon={LayoutGrid}
          accent="bg-primary"
          isActive={timelineView === TIMELINE_VIEWS.Active}
          onClick={() => setTimelineView(TIMELINE_VIEWS.Active)}
        />
        <StatCard
          label="Today"
          sublabel="Prioritized at top"
          value={appointmentCounts.today}
          icon={CalendarDays}
          accent="bg-emerald-500"
          isActive={timelineView === TIMELINE_VIEWS.Today}
          onClick={() => setTimelineView(TIMELINE_VIEWS.Today)}
        />
        <StatCard
          label="Upcoming"
          sublabel="Future bookings"
          value={appointmentCounts.upcoming}
          icon={Clock}
          accent="bg-sky-500"
          isActive={timelineView === TIMELINE_VIEWS.Upcoming}
          onClick={() => setTimelineView(TIMELINE_VIEWS.Upcoming)}
        />
        <StatCard
          label="History"
          sublabel="Past records"
          value={appointmentCounts.past}
          icon={History}
          accent="bg-base-content"
          isActive={timelineView === TIMELINE_VIEWS.Past}
          onClick={() => setTimelineView(TIMELINE_VIEWS.Past)}
        />
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-2.5 mb-6 p-4 bg-base-200/50 rounded-2xl border border-base-200">
        {/* Search */}
        <div className="flex items-center gap-2 bg-base-100 border border-base-200 rounded-xl px-3.5 py-2.5 flex-1 min-w-[200px] max-w-sm shadow-sm">
          <Search size={14} className="text-base-content/40 shrink-0" />
          <input
            type="text"
            placeholder="Search client, pet, or ID…"
            className="w-full text-sm bg-transparent focus:outline-none placeholder:text-base-content/30"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-base-content/40">
            <SlidersHorizontal size={13} />
            <span className="text-xs font-medium">Filters:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select select-sm bg-base-100 border border-base-200 rounded-xl text-sm min-w-[130px]"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Completed">Completed</option>
            <option value="Reschedule Requested">Reschedule Requested</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="select select-sm bg-base-100 border border-base-200 rounded-xl text-sm min-w-[120px]"
          >
            <option value="All">All Types</option>
            <option value="Physical">Physical</option>
            <option value="Online">Online / Video</option>
          </select>

          <select
            value={timelineView}
            onChange={(e) => setTimelineView(e.target.value)}
            className="select select-sm bg-base-100 border border-base-200 rounded-xl text-sm min-w-[110px]"
          >
            <option value={TIMELINE_VIEWS.Active}>Active</option>
            <option value={TIMELINE_VIEWS.Today}>Today</option>
            <option value={TIMELINE_VIEWS.Upcoming}>Upcoming</option>
            <option value={TIMELINE_VIEWS.Past}>Past</option>
            <option value={TIMELINE_VIEWS.All}>All</option>
          </select>
        </div>
      </div>

      {/* Appointment list */}
      {isLoadingAppointments ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <span className="loading loading-spinner loading-md text-primary" />
          <p className="text-sm text-base-content/40">Loading appointments…</p>
        </div>
      ) : visibleAppointments.length > 0 ? (
        <>
          <div className="space-y-2">
            {groupedAppointments.map((group) => (
              <div key={group.key}>
                <AppointmentDayDivider dateValue={group.dateValue} />
                <div className="space-y-2 mt-1">
                  {group.appointments.map((appointment) => {
                    const client = clientMap[appointment.clientId];
                    const pet = petMap[appointment.petId];
                    return (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        client={client}
                        pet={pet}
                        isMenuOpen={openActionMenuId === appointment.id}
                        isConfirmingAppointment={isConfirmingAppointment}
                        startingVideoCallId={startingVideoCallId}
                        canStartVideoCall={isVideoCallAvailable(appointment)}
                        canCompleteVisit={canCompletePhysicalAppointment(appointment)}
                        onToggleMenu={(appointmentId) =>
                          setOpenActionMenuId((currentId) =>
                            currentId === appointmentId ? null : appointmentId
                          )
                        }
                        onConfirmAppointment={handleConfirmAppointment}
                        onStartVideoCall={handleStartVideoCall}
                        onCompleteVisit={(appointmentWithNames) => {
                          setSelectedAppointment(appointmentWithNames);
                          setIsVisitSummaryOpen(true);
                        }}
                        onOpenDetails={(appointmentToOpen) => {
                          setOpenActionMenuId(null);
                          handleOpenDetails(appointmentToOpen);
                        }}
                        onOpenEdit={(appointmentToEdit) => {
                          setOpenActionMenuId(null);
                          setSelectedAppointment(appointmentToEdit);
                          setIsEditModalOpen(true);
                        }}
                        onOpenCancel={(appointmentToCancel) => {
                          setOpenActionMenuId(null);
                          setSelectedAppointment(appointmentToCancel);
                          setIsCancelModalOpen(true);
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {hasMoreAppointments && (
            <div className="flex justify-center pt-8">
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                className="btn btn-sm btn-ghost rounded-xl border border-base-200 text-base-content/60 hover:text-base-content hover:bg-base-200"
              >
                Load more · {sortedAppointments.length - visibleCount} remaining
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-base-200 flex items-center justify-center">
            <CalendarDays size={20} className="text-base-content/30" />
          </div>
          <p className="text-sm font-medium text-base-content/50">No appointments found</p>
          <p className="text-xs text-base-content/30">Try adjusting your filters or timeline view</p>
        </div>
      )}

      {/* Modals */}
      <AppointmentDetailsModal
        isOpen={isDetailsModalOpen}
        appointment={selectedAppointment}
        client={clientMap[selectedAppointment?.clientId]}
        pet={petMap[selectedAppointment?.petId]}
        onViewAppointmentHistory={handleViewAppointmentMedicalHistory}
        onViewPetHistory={handleViewPetMedicalHistory}
        onClose={() => { setIsDetailsModalOpen(false); setSelectedAppointment(null); }}
      />
      <EditAppointmentModal
        isOpen={isEditModalOpen}
        appointment={selectedAppointment}
        isUpdating={isUpdatingAppointment}
        onClose={() => { setIsEditModalOpen(false); setSelectedAppointment(null); }}
        onSave={handleSaveAppointmentDate}
      />
      <VisitSummaryForm
        isOpen={isVisitSummaryOpen}
        appointment={selectedAppointment}
        isSubmitting={isSavingVisitSummary}
        onSubmit={handleSubmitVisitSummary}
        onCancel={() => { setIsVisitSummaryOpen(false); setSelectedAppointment(null); }}
      />
      <CancelAppointmentModal
        isOpen={isCancelModalOpen}
        appointment={selectedAppointment}
        isCancelling={isCancellingAppointment}
        onClose={() => { setIsCancelModalOpen(false); setSelectedAppointment(null); }}
        onConfirm={handleCancelAppointment}
      />
      <MedicalHistoryModal
        isOpen={isMedicalHistoryOpen}
        title={medicalHistoryTitle}
        history={medicalHistory}
        appointment={medicalHistoryContext.appointment}
        clinic={selectedClinic}
        client={medicalHistoryContext.client}
        pet={medicalHistoryContext.pet}
        isLoading={isLoadingMedicalHistory}
        onClose={() => {
          setIsMedicalHistoryOpen(false);
          setMedicalHistory(null);
          setMedicalHistoryContext({ appointment: null, client: null, pet: null });
        }}
      />
    </div>
  );
};

export default BookingsPage;