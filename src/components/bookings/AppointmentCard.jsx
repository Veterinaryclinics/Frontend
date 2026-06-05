import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Pencil,
  Ban,
  MoreVertical,
  CheckCircle2,
  Eye,
  RefreshCw,
  User,
  PawPrint,
} from "lucide-react";

const STATUS_VALUE = {
  Pending: 0,
  Confirmed: 1,
  Cancelled: 2,
  Completed: 3,
  RescheduleRequested: 4,
};

const APPOINTMENT_STATUS = {
  0: "Pending",
  1: "Confirmed",
  2: "Cancelled",
  3: "Completed",
  4: "Reschedule Requested",
};

const APPOINTMENT_TYPE = {
  0: "Physical",
  1: "Online",
};

const getStatusLabel = (status) => APPOINTMENT_STATUS[status] || "Unknown";
const getTypeLabel = (type) => APPOINTMENT_TYPE[type] || "Unknown";

const STATUS_CONFIG = {
  0: { badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50", dot: "bg-amber-400" },
  1: { badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50", dot: "bg-emerald-400" },
  2: { badge: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-700/50", dot: "bg-red-400" },
  3: { badge: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 border border-sky-200 dark:border-sky-700/50", dot: "bg-sky-400" },
  4: {
  badge:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border border-violet-200 dark:border-violet-700/50",
  dot: "bg-violet-400",
},
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

  if (!parts) return dateValue || "—";

  return `${MONTHS[Number(parts.month) - 1]} ${Number(parts.day)}, ${parts.year}`;
};

const formatTime = (dateValue) => {
  const parts = getDbDateParts(dateValue);

  if (!parts) return dateValue || "—";

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

const AppointmentCard = ({
  appointment,
  client,
  pet,
  isMenuOpen,
  isConfirmingAppointment,
  startingVideoCallId,
  canStartVideoCall,
  canCompleteVisit,
  onToggleMenu,
  onConfirmAppointment,
  onStartVideoCall,
  onCompleteVisit,
  onOpenDetails,
  onOpenEdit,
  onOpenCancel,
}) => {
  const clientName = getClientName(client) || appointment.clientName || "Unknown Client";
  const petLabel = getPetLabel(pet) || appointment.petName || "Unknown Pet";

  const isCancelled = appointment.status === STATUS_VALUE.Cancelled;
  const isCompleted = appointment.status === STATUS_VALUE.Completed;
  const isInactive = isCancelled || isCompleted;
  const isOnlineAppointment = appointment.type === 1;

const hasProposedSchedule = Boolean(
  appointment.proposedStartTime || appointment.proposedEndTime
);

const proposedBy = String(appointment.rescheduledBy || "").toLowerCase();

const proposedByClinic = proposedBy.includes("clinic");

const isInitialPendingRequest =
  appointment.status === STATUS_VALUE.Pending && !hasProposedSchedule;

const isIncomingRescheduleRequest =
  appointment.status === STATUS_VALUE.RescheduleRequested && !proposedByClinic;

const isOutgoingRescheduleRequest =
  appointment.status === STATUS_VALUE.RescheduleRequested && proposedByClinic;

const shouldShowConfirmButton =
  isInitialPendingRequest || isIncomingRescheduleRequest;

const shouldShowAwaitingApproval = isOutgoingRescheduleRequest;

  const statusConfig = STATUS_CONFIG[appointment.status] || { badge: "bg-base-200 text-base-content/60 border border-base-300", dot: "bg-base-400" };

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-200 overflow-visible
        ${isMenuOpen ? "z-50" : "z-0"}
        ${isInactive
          ? "border-base-200 bg-base-50 dark:bg-base-200/20 opacity-60"
          : "border-base-200 bg-base-100 hover:border-base-300 hover:shadow-lg hover:shadow-base-content/5"
        }`}
    >
      {/* Accent bar */}
      {!isInactive && (
        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${
          appointment.status === STATUS_VALUE.Confirmed ? "bg-emerald-400" :
          appointment.status === STATUS_VALUE.Pending ? "bg-amber-400" : "bg-base-300"
        }`} />
      )}

      <div className="flex flex-col xl:flex-row xl:items-center gap-0 pl-3">
        {/* Date/Time column */}
        <div className="flex xl:flex-col items-center xl:items-start gap-3 xl:gap-1 px-4 py-4 xl:py-5 xl:min-w-[140px] xl:border-r border-base-200">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-base-content">
            <Calendar size={13} className="text-primary opacity-70" />
            {formatDate(appointment.startTime)}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-base-content/50">
            <Clock size={13} />
            {formatTime(appointment.startTime)}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 px-4 py-4 xl:py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="font-semibold text-base-content text-sm leading-tight">{clientName}</span>
                <span className="text-base-content/30">·</span>
                <span className="text-sm text-base-content/60 flex items-center gap-1">
                  <PawPrint size={12} className="shrink-0" />
                  {petLabel}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${statusConfig.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                  {getStatusLabel(appointment.status)}
                </span>

                <span className="inline-flex items-center gap-1 text-xs text-base-content/50 bg-base-200 px-2.5 py-1 rounded-full">
                  {isOnlineAppointment ? <Video size={11} /> : <MapPin size={11} />}
                  {getTypeLabel(appointment.type)}
                </span>

                {isOnlineAppointment && appointment.videoRoomId && (
                  <span className="text-xs text-base-content/40 truncate max-w-[160px]">
                    Room: {appointment.videoRoomId}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Reschedule notice */}
          {(hasProposedSchedule || appointment.status === STATUS_VALUE.RescheduleRequested) && (
            <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-200 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-900/20 px-3 py-2.5">
              <RefreshCw size={13} className="text-amber-500 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-0.5">Reschedule Pending</p>
                <p className="text-xs text-base-content/60">
                  <span className="font-medium text-base-content/80">
                    {appointment.proposedStartTime
                      ? `${formatDate(appointment.proposedStartTime)} · ${formatTime(appointment.proposedStartTime)}`
                      : "—"}
                  </span>
                  {appointment.proposedEndTime && (
                    <> → <span className="font-medium text-base-content/80">{formatTime(appointment.proposedEndTime)}</span></>
                  )}
                </p>
                <p className="text-[11px] text-base-content/40 mt-0.5">
                  {proposedByClinic ? "Awaiting client approval" : "Awaiting your approval"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions column */}
        <div className="relative flex items-center justify-end gap-2 px-4 py-4 xl:py-5 xl:min-w-fit xl:border-l border-base-200 flex-wrap xl:flex-nowrap">
          {shouldShowConfirmButton && (
            <button
              type="button"
              onClick={() => onConfirmAppointment(appointment)}
              disabled={isConfirmingAppointment}
              className="btn btn-sm bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-xl gap-1.5 shadow-sm"
            >
              <CheckCircle2 size={13} />
              {isConfirmingAppointment
            ? "Confirming…"
            : isIncomingRescheduleRequest
                ? "Accept"
                : "Confirm"}
            </button>
          )}

          {shouldShowAwaitingApproval && (
            <button type="button" className="btn btn-sm btn-ghost rounded-xl text-base-content/40 cursor-default" disabled>
              Awaiting Client
            </button>
          )}

          {isOnlineAppointment && appointment.status === STATUS_VALUE.Confirmed && (
            <button
              type="button"
              onClick={() => onStartVideoCall({ ...appointment, clientName, petName: petLabel })}
              disabled={!canStartVideoCall || startingVideoCallId === appointment.id}
              className={`btn btn-sm rounded-xl gap-1.5 shadow-sm ${
                canStartVideoCall
                  ? "bg-primary hover:bg-primary/90 text-primary-content border-none"
                  : "btn-ghost text-base-content/40"
              }`}
            >
              <Video size={13} />
              {startingVideoCallId === appointment.id ? "Starting…" : canStartVideoCall ? "Start Call" : "30m before"}
            </button>
          )}

          {canCompleteVisit && (
            <button
              type="button"
              onClick={() => onCompleteVisit({ ...appointment, clientName, petName: petLabel })}
              className="btn btn-sm btn-primary rounded-xl gap-1.5 shadow-sm"
            >
              Complete Visit
            </button>
          )}

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => onToggleMenu(appointment.id)}
              className="btn btn-sm btn-ghost btn-circle text-base-content/50 hover:text-base-content hover:bg-base-200"
            >
              <MoreVertical size={16} />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-11 z-[9999] w-56 rounded-2xl border border-base-200 bg-base-100 shadow-2xl shadow-base-content/10 p-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                <button
                  type="button"
                  onClick={() => onOpenDetails(appointment)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-base-content hover:bg-base-200 transition-colors"
                >
                  <Eye size={14} className="text-base-content/50" />
                  View Details
                </button>
                <button
                  type="button"
                  onClick={() => onOpenEdit(appointment)}
                  disabled={isCancelled || isCompleted}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-base-content hover:bg-base-200 transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
                >
                  <Pencil size={14} className="text-base-content/50" />
                  Propose Reschedule
                </button>
                <div className="my-1 h-px bg-base-200" />
                <button
                  type="button"
                  onClick={() => onOpenCancel(appointment)}
                  disabled={isCancelled || isCompleted}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-error hover:bg-error/8 transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
                >
                  <Ban size={14} />
                  Cancel Appointment
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentCard;