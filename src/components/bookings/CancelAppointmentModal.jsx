import { X } from "lucide-react";

const CancelAppointmentModal = ({
  appointment,
  isOpen,
  isCancelling,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !appointment) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <div className="bg-base-100 border border-base-300 rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="text-lg font-semibold text-error">
              Cancel Appointment?
            </h3>
            <p className="text-sm text-base-content/70 mt-1">
              This will mark the appointment as cancelled. Use this only when
              the booking is no longer valid.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
            disabled={isCancelling}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="btn btn-outline rounded-xl"
            onClick={onClose}
            disabled={isCancelling}
          >
            Keep Appointment
          </button>

          <button
            type="button"
            className="btn btn-error rounded-xl"
            onClick={() => onConfirm(appointment)}
            disabled={isCancelling}
          >
            {isCancelling ? "Cancelling..." : "Cancel Appointment"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelAppointmentModal;