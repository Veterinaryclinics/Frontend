import { useEffect, useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";

const toDateTimeLocalValue = (dateValue) => {
  if (!dateValue) return "";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "";

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

  return offsetDate.toISOString().slice(0, 16);
};

const EditAppointmentModal = ({
  appointment,
  isOpen,
  isUpdating,
  onClose,
  onSave,
}) => {
  const [startDateTime, setStartDateTime] = useState("");

  useEffect(() => {
    if (appointment && isOpen) {
      setStartDateTime(toDateTimeLocalValue(appointment.startTime));
    }
  }, [appointment, isOpen]);

  if (!isOpen || !appointment) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!startDateTime) {
      toast.error("Please select a start date and time.");
      return;
    }

    await onSave(appointment, startDateTime);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-base-100 border border-base-300 rounded-2xl shadow-2xl w-full max-w-md p-6"
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="text-lg font-semibold text-base-content">
              Propose Reschedule
            </h3>
            <p className="text-sm text-base-content/70 mt-1">
              Choose a new appointment time. The client will need to approve the proposed change.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
            disabled={isUpdating}
          >
            <X size={18} />
          </button>
        </div>

        <label className="block mb-2 text-sm text-base-content">
          Proposed Start Date & Time
        </label>

        <input
          type="datetime-local"
          className="input input-bordered w-full mb-4"
          value={startDateTime}
          onChange={(e) => setStartDateTime(e.target.value)}
          required
        />

        <div className="flex justify-end gap-2 mt-2">
          <button
            type="button"
            className="btn btn-sm btn-outline rounded-xl min-w-20"
            onClick={onClose}
            disabled={isUpdating}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="btn btn-sm btn-primary rounded-xl min-w-24"
            disabled={isUpdating}
          >
            {isUpdating ? "Sending..." : "Send Proposal"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditAppointmentModal;