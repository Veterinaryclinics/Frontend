import { X, UserRound, PawPrint, FileText, History, Phone, Mail, Dna, Clock, CalendarDays, RefreshCw, Video } from "lucide-react";

const APPOINTMENT_STATUS = { 0: "Pending", 1: "Confirmed", 2: "Cancelled", 3: "Completed" };
const APPOINTMENT_TYPE = { 0: "Physical", 1: "Online" };
const STATUS_VALUE = { Pending: 0, Confirmed: 1, Cancelled: 2, Completed: 3 };

const getStatusLabel = (status) => APPOINTMENT_STATUS[status] || "Unknown";
const getTypeLabel = (type) => APPOINTMENT_TYPE[type] || "Unknown";

const STATUS_CONFIG = {
  0: { badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50", dot: "bg-amber-400" },
  1: { badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50", dot: "bg-emerald-400" },
  2: { badge: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-700/50", dot: "bg-red-400" },
  3: { badge: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 border border-sky-200 dark:border-sky-700/50", dot: "bg-sky-400" },
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const getDbDateParts = (dateValue) => {
  if (!dateValue) return null;

  const value = String(dateValue);

  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/
  );

  if (!match) return null;

  return {
    year: match[1],
    month: match[2],
    day: match[3],
    hour: match[4],
    minute: match[5],
  };
};

const formatDate = (dateValue) => {
  const parts = getDbDateParts(dateValue);

  if (!parts) return dateValue || null;

  return `${MONTHS[Number(parts.month) - 1]} ${Number(parts.day)}, ${parts.year}`;
};

const formatTime = (dateValue) => {
  const parts = getDbDateParts(dateValue);

  if (!parts) return dateValue || null;

  const hour24 = Number(parts.hour);
  const minute = parts.minute;

  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;

  return `${hour12}:${minute} ${period}`;
};

const getClientName = (client) => {
  if (!client) return null;
  const fullName = `${client.firstName || ""} ${client.lastName || ""}`.trim();
  return fullName || client.userName || client.email || null;
};

const getPetLabel = (pet) => {
  if (!pet) return null;
  const petName = pet.name || "Unnamed Pet";
  const petDetails = [pet.species, pet.breed].filter(Boolean).join(" · ");
  return petDetails ? `${petName} (${petDetails})` : petName;
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const SectionHeading = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-2 mb-3">
    <div className="p-1.5 rounded-lg bg-primary/10">
      <Icon size={13} className="text-primary" />
    </div>
    <p className="text-xs font-semibold uppercase tracking-widest text-base-content/40">{label}</p>
  </div>
);

const InfoRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-center justify-between py-2 border-b border-base-200 last:border-0 gap-4">
    <p className="text-xs text-base-content/50 shrink-0">{label}</p>
    <p className={`text-sm font-medium text-base-content text-right flex items-center gap-1.5 ${!value ? "text-base-content/30" : ""}`}>
      {Icon && <Icon size={12} className="text-base-content/30 shrink-0" />}
      {value || "—"}
    </p>
  </div>
);

// ─── Main modal ───────────────────────────────────────────────────────────────

const AppointmentDetailsModal = ({
  appointment,
  client,
  pet,
  isOpen,
  onClose,
  onViewAppointmentHistory,
  onViewPetHistory,
}) => {
  if (!isOpen || !appointment) return null;

  const statusConfig = STATUS_CONFIG[appointment.status] || { badge: "bg-base-200 text-base-content/60 border border-base-300", dot: "bg-base-300" };
  const hasProposedSchedule = Boolean(appointment.proposedStartTime || appointment.proposedEndTime);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-base-100 border border-base-200 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-base-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <CalendarDays size={16} className="text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-base-content leading-tight">Appointment Details</h3>
              <p className="text-xs text-base-content/40 mt-0.5">
                {formatDate(appointment.startTime)} · {formatTime(appointment.startTime)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${statusConfig.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
              {getStatusLabel(appointment.status)}
            </span>
            <button type="button" onClick={onClose} className="btn btn-ghost btn-sm btn-circle text-base-content/40 hover:text-base-content">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Reschedule notice */}
          {hasProposedSchedule && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-900/20 px-4 py-3.5">
              <RefreshCw size={15} className="text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-1">Reschedule Pending</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-1.5 text-xs text-base-content/60">
                  <div>
                    <p className="text-base-content/40 mb-0.5">Proposed Start</p>
                    <p className="font-medium text-base-content/80">
                      {appointment.proposedStartTime
                        ? `${formatDate(appointment.proposedStartTime)} · ${formatTime(appointment.proposedStartTime)}`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-base-content/40 mb-0.5">Proposed End</p>
                    <p className="font-medium text-base-content/80">
                      {appointment.proposedEndTime
                        ? `${formatDate(appointment.proposedEndTime)} · ${formatTime(appointment.proposedEndTime)}`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-base-content/40 mb-0.5">Rescheduled By</p>
                    <p className="font-medium text-base-content/80">{appointment.rescheduledBy || "—"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Client info */}
            <div className="bg-base-200/50 rounded-2xl px-4 py-4">
              <SectionHeading icon={UserRound} label="Client" />
              <InfoRow label="Name" value={getClientName(client) || appointment.clientName} />
              <InfoRow label="Email" value={client?.email} icon={Mail} />
              <InfoRow label="Phone" value={client?.phoneNumber} icon={Phone} />
            </div>

            {/* Pet info */}
            <div className="bg-base-200/50 rounded-2xl px-4 py-4">
              <SectionHeading icon={PawPrint} label="Pet" />
              <InfoRow label="Name" value={getPetLabel(pet) || appointment.petName} />
              <InfoRow label="Species" value={pet?.species} icon={Dna} />
              <InfoRow label="Breed" value={pet?.breed} />
            </div>
          </div>

          {/* Appointment info */}
          <div className="bg-base-200/50 rounded-2xl px-4 py-4">
            <SectionHeading icon={CalendarDays} label="Appointment" />
            <div className="grid grid-cols-1 sm:grid-cols-2">
              <div className="sm:pr-4 sm:border-r border-base-200">
                <InfoRow label="Start" value={appointment.startTime ? `${formatDate(appointment.startTime)} · ${formatTime(appointment.startTime)}` : null} icon={Clock} />
                <InfoRow label="End" value={appointment.endTime ? `${formatDate(appointment.endTime)} · ${formatTime(appointment.endTime)}` : null} icon={Clock} />
              </div>
              <div className="sm:pl-4">
                <InfoRow label="Type" value={getTypeLabel(appointment.type)} icon={appointment.type === 1 ? Video : null} />
                {appointment.type === 1 && (
                  <InfoRow label="Video Room" value={appointment.videoRoomId} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-base-200">
          <button
            type="button"
            onClick={() => onViewAppointmentHistory?.(appointment, client, pet)}
            className="btn btn-sm btn-ghost rounded-xl gap-2 text-base-content/70 hover:text-base-content"
          >
            <FileText size={14} />
            Appointment History
          </button>
          <button
            type="button"
            onClick={() => onViewPetHistory?.(appointment, client, pet)}
            className="btn btn-sm btn-primary rounded-xl gap-2"
          >
            <History size={14} />
            Full Pet History
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailsModal;