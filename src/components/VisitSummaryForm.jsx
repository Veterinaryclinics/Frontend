import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, X, ClipboardList } from "lucide-react";
import toast from "react-hot-toast";

const MAIN_REASON_OPTIONS = [
  "General check-up",
  "Vaccination",
  "Illness / symptoms",
  "Injury / trauma",
  "Skin or coat problem",
  "Digestive issue",
  "Respiratory issue",
  "Eye problem",
  "Ear problem",
  "Dental problem",
  "Behavior concern",
  "Follow-up visit",
  "Post-surgery check",
  "Surgery consultation",
  "Emergency concern",
  "Lab test / sample collection",
  "Medication refill",
  "Nutrition or weight concern",
  "Other",
];

const DIAGNOSIS_STATUS_OPTIONS = [
  "Confirmed diagnosis",
  "Suspected diagnosis",
  "No diagnosis yet",
  "Healthy / normal findings",
  "Requires further testing",
];

const TREATMENT_OPTIONS = [
  "No treatment needed",
  "Medication administered",
  "Medication prescribed",
  "Vaccination given",
  "Wound cleaning / dressing",
  "Injection given",
  "Fluid therapy",
  "Dental treatment",
  "Ear cleaning",
  "Eye treatment",
  "Nail trimming",
  "Minor procedure performed",
  "Lab sample collected",
  "Dietary advice given",
  "Behavioral advice given",
  "Referred to specialist",
  "Hospitalization recommended",
  "Other",
];

const FOLLOW_UP_OPTIONS = [
  "No follow-up needed",
  "Follow-up in 3 days",
  "Follow-up in 1 week",
  "Follow-up in 2 weeks",
  "Follow-up in 1 month",
  "Return if symptoms worsen",
  "Return if no improvement",
  "Lab results follow-up required",
  "Surgery follow-up required",
  "Vaccination booster required",
  "Specialist referral recommended",
  "Other",
];

const diagnosisAllowsText = (diagnosisStatus) => {
  return (
    diagnosisStatus === "Confirmed diagnosis" ||
    diagnosisStatus === "Suspected diagnosis" ||
    diagnosisStatus === "Requires further testing"
  );
};

const VisitSummaryForm = ({
  appointment,
  isOpen = true,
  isSubmitting = false,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    mainReasonForVisit: "",
    diagnosisStatus: "",
    diagnosis: "",
    treatmentGiven: [],
    medicinesGiven: [""],
    followUpInstructions: "",
    additionalNotes: "",
  });

  const canEditDiagnosis = useMemo(() => {
    return diagnosisAllowsText(formData.diagnosisStatus);
  }, [formData.diagnosisStatus]);

  useEffect(() => {
    if (!canEditDiagnosis) {
      setFormData((prev) => ({
        ...prev,
        diagnosis: "",
      }));
    }
  }, [canEditDiagnosis]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleTreatment = (treatment) => {
    setFormData((prev) => {
      const alreadySelected = prev.treatmentGiven.includes(treatment);

      return {
        ...prev,
        treatmentGiven: alreadySelected
          ? prev.treatmentGiven.filter((item) => item !== treatment)
          : [...prev.treatmentGiven, treatment],
      };
    });
  };

  const handleMedicineChange = (index, value) => {
    setFormData((prev) => {
      const updatedMedicines = [...prev.medicinesGiven];
      updatedMedicines[index] = value;

      return {
        ...prev,
        medicinesGiven: updatedMedicines,
      };
    });
  };

  const addMedicineField = () => {
    setFormData((prev) => ({
      ...prev,
      medicinesGiven: [...prev.medicinesGiven, ""],
    }));
  };

  const removeMedicineField = (index) => {
    setFormData((prev) => {
      const updatedMedicines = prev.medicinesGiven.filter(
        (_, medicineIndex) => medicineIndex !== index
      );

      return {
        ...prev,
        medicinesGiven: updatedMedicines.length > 0 ? updatedMedicines : [""],
      };
    });
  };

  const validateForm = () => {
    if (!formData.mainReasonForVisit) {
      toast.error("Please select the main reason for the visit.");
      return false;
    }

    if (!formData.diagnosisStatus) {
      toast.error("Please select the diagnosis status.");
      return false;
    }

    if (canEditDiagnosis && !formData.diagnosis.trim()) {
      toast.error("Please enter the diagnosis or suspected diagnosis.");
      return false;
    }

    if (formData.treatmentGiven.length === 0) {
      toast.error("Please select at least one treatment option.");
      return false;
    }

    if (!formData.followUpInstructions) {
      toast.error("Please select follow-up instructions.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const payload = {
  appointmentId: appointment?.id || appointment?.appointmentId || null,
  clinicId: appointment?.clinicId || null,
  petId: appointment?.petId || null,

  mainReasonForVisit: formData.mainReasonForVisit,
  diagnosisStatus: formData.diagnosisStatus,
  diagnosis: canEditDiagnosis ? formData.diagnosis.trim() : null,

  treatment: formData.treatmentGiven.join(", "),

  medicinesGiven:
    formData.medicinesGiven
      .map((medicine) => medicine.trim())
      .filter(Boolean)
      .join(", ") || null,

  followUpInstructions: formData.followUpInstructions,
  notes: formData.additionalNotes.trim() || null,

  isCreatedByClinic: true,
};

    await onSubmit?.(payload);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-base-100 border border-base-300 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-start justify-between gap-4 p-6 border-b border-base-300">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 text-primary p-3 rounded-xl">
              <ClipboardList size={22} />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-base-content">
                Visit Summary
              </h2>
              <p className="text-sm text-base-content/70 mt-1">
                Complete this form to save the medical history and close the appointment.
              </p>
            </div>
          </div>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-ghost btn-sm btn-circle"
              disabled={isSubmitting}
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Main reason */}
            <div>
              <label className="block text-sm font-medium text-base-content mb-2">
                Main reason for today’s visit *
              </label>

              <select
                name="mainReasonForVisit"
                className="select select-bordered w-full"
                value={formData.mainReasonForVisit}
                onChange={handleChange}
                required
              >
                <option value="">Select reason</option>
                {MAIN_REASON_OPTIONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>

            {/* Diagnosis status */}
            <div>
              <label className="block text-sm font-medium text-base-content mb-2">
                Diagnosis status *
              </label>

              <select
                name="diagnosisStatus"
                className="select select-bordered w-full"
                value={formData.diagnosisStatus}
                onChange={handleChange}
                required
              >
                <option value="">Select diagnosis status</option>
                {DIAGNOSIS_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Diagnosis field */}
          <div>
            <label className="block text-sm font-medium text-base-content mb-2">
              Diagnosis / suspected diagnosis
            </label>

            <input
              type="text"
              name="diagnosis"
              className="input input-bordered w-full"
              placeholder={
                canEditDiagnosis
                  ? "Example: Skin allergy, gastroenteritis, ear infection..."
                  : "Disabled because no diagnosis is required for this status"
              }
              value={formData.diagnosis}
              onChange={handleChange}
              disabled={!canEditDiagnosis}
            />

            {!canEditDiagnosis && formData.diagnosisStatus && (
              <p className="text-xs text-base-content/50 mt-2">
                Diagnosis field is disabled for “{formData.diagnosisStatus}”.
              </p>
            )}
          </div>

          {/* Treatment given */}
          <div>
            <label className="block text-sm font-medium text-base-content mb-2">
              Treatment given *
            </label>

            <details className="dropdown w-full">
              <summary className="btn btn-outline w-full justify-between rounded-xl">
                {formData.treatmentGiven.length > 0
                  ? `${formData.treatmentGiven.length} selected`
                  : "Select treatment options"}
              </summary>

              <div className="dropdown-content z-[60] mt-2 w-full bg-base-100 border border-base-300 rounded-xl shadow-xl p-4 max-h-72 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {TREATMENT_OPTIONS.map((treatment) => (
                    <label
                      key={treatment}
                      className="flex items-center gap-2 text-sm bg-base-200 hover:bg-base-300 rounded-lg px-3 py-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm checkbox-primary"
                        checked={formData.treatmentGiven.includes(treatment)}
                        onChange={() => toggleTreatment(treatment)}
                      />
                      <span>{treatment}</span>
                    </label>
                  ))}
                </div>
              </div>
            </details>

            {formData.treatmentGiven.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.treatmentGiven.map((treatment) => (
                  <span key={treatment} className="badge badge-primary badge-outline">
                    {treatment}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Medicines */}
          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <label className="block text-sm font-medium text-base-content">
                Medicine given
              </label>

              <button
                type="button"
                onClick={addMedicineField}
                className="btn btn-sm btn-outline rounded-xl flex items-center gap-1"
                disabled={isSubmitting}
              >
                <Plus size={15} />
                Add medicine
              </button>
            </div>

            <div className="space-y-3">
              {formData.medicinesGiven.map((medicine, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder={`Medicine ${index + 1}`}
                    value={medicine}
                    onChange={(e) => handleMedicineChange(index, e.target.value)}
                  />

                  <button
                    type="button"
                    className="btn btn-outline btn-square"
                    onClick={() => removeMedicineField(index)}
                    disabled={isSubmitting}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Follow-up */}
          <div>
            <label className="block text-sm font-medium text-base-content mb-2">
              Follow-up instructions *
            </label>

            <select
              name="followUpInstructions"
              className="select select-bordered w-full"
              value={formData.followUpInstructions}
              onChange={handleChange}
              required
            >
              <option value="">Select follow-up instruction</option>
              {FOLLOW_UP_OPTIONS.map((instruction) => (
                <option key={instruction} value={instruction}>
                  {instruction}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-base-content mb-2">
              Additional notes
            </label>

            <textarea
              name="additionalNotes"
              className="textarea textarea-bordered w-full min-h-28 resize-none"
              placeholder="Add any clinical observations, owner concerns, warnings, or extra doctor notes..."
              value={formData.additionalNotes}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-base-300 bg-base-100">
          {onCancel && (
            <button
              type="button"
              className="btn btn-outline rounded-xl"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            className="btn btn-primary rounded-xl"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Medical History"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VisitSummaryForm;