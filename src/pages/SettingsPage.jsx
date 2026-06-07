import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2, LogOut, Mail, MapPin, Phone, Pencil, Trash2,
  UserRound, X, CalendarDays, Clock, Images, ImageOff, ChevronRight,
  ArrowLeftRight, ShieldAlert,
} from "lucide-react";
import toast from "react-hot-toast";

import { useThemeStore } from "../store/useThemeStore";
import { useAuthStore } from "../store/useAuthStore";
import { useClinicStore } from "../store/useClinicStore";
import { THEMES } from "../constants";
import api from "../lib/axios";

// ─── Constants ────────────────────────────────────────────────────────────────

const DESCRIPTION_MAX_LENGTH = 200;
const MAX_CLINIC_IMAGES = 5;
const DEFAULT_AVAILABILITY = [
  { dayOfWeek: 0, dayName: "Sunday",    isOpen: false, openingTime: "09:00", closingTime: "17:00" },
  { dayOfWeek: 1, dayName: "Monday",    isOpen: false, openingTime: "09:00", closingTime: "17:00" },
  { dayOfWeek: 2, dayName: "Tuesday",   isOpen: false, openingTime: "09:00", closingTime: "17:00" },
  { dayOfWeek: 3, dayName: "Wednesday", isOpen: false, openingTime: "09:00", closingTime: "17:00" },
  { dayOfWeek: 4, dayName: "Thursday",  isOpen: false, openingTime: "09:00", closingTime: "17:00" },
  { dayOfWeek: 5, dayName: "Friday",    isOpen: false, openingTime: "09:00", closingTime: "17:00" },
  { dayOfWeek: 6, dayName: "Saturday",  isOpen: false, openingTime: "09:00", closingTime: "17:00" },
];

// ─── Pure helpers (unchanged logic) ───────────────────────────────────────────

const normalizeTime = (value, fallback = "09:00") => {
  if (!value) return fallback;
  const s = String(value);
  if (/^\d{2}:\d{2}$/.test(s)) return s;
  if (/^\d{2}:\d{2}:\d{2}$/.test(s)) return s.slice(0, 5);
  return fallback;
};

const toApiTime = (time) => {
  if (!time) return "00:00:00";
  if (/^\d{2}:\d{2}:\d{2}$/.test(time)) return time;
  if (/^\d{2}:\d{2}$/.test(time)) return `${time}:00`;
  return "00:00:00";
};

const normalizeScheduleResponse = (responseData) => {
  const data = responseData?.data ?? responseData;
  const workingDays = (Array.isArray(data) && data) || data?.workingDays || data?.schedule || data?.availabilities || [];
  if (!Array.isArray(workingDays)) return DEFAULT_AVAILABILITY;
  return DEFAULT_AVAILABILITY.map((defaultDay) => {
    const matched = workingDays.find((item) => Number(item.day ?? item.dayOfWeek) === defaultDay.dayOfWeek);
    if (!matched) return defaultDay;
    return { ...defaultDay, isOpen: !Boolean(matched.isDayOff), openingTime: normalizeTime(matched.openingTime, defaultDay.openingTime), closingTime: normalizeTime(matched.closingTime, defaultDay.closingTime) };
  });
};

const buildSchedulePayload = (availability) => ({
  workingDays: availability.map((day) => ({
    day: day.dayOfWeek,
    openingTime: day.isOpen ? toApiTime(day.openingTime) : "00:00:00",
    closingTime: day.isOpen ? toApiTime(day.closingTime) : "00:00:00",
    isDayOff: !day.isOpen,
  })),
});

const parseJsonArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") { try { const p = JSON.parse(value); return Array.isArray(p) ? p : []; } catch { return []; } }
  return [];
};

const getClinicAvailability = (clinic) => {
  const raw = clinic?.availability || clinic?.availabilities || clinic?.clinicAvailabilities || clinic?.workingHours || clinic?.schedule;
  const parsed = parseJsonArray(raw);
  if (parsed.length > 0) {
    return DEFAULT_AVAILABILITY.map((defaultDay) => {
      const matched = parsed.find((item) => Number(item.dayOfWeek) === defaultDay.dayOfWeek || String(item.dayName || "").toLowerCase() === defaultDay.dayName.toLowerCase());
      if (!matched) return defaultDay;
      return { ...defaultDay, isOpen: matched.isOpen ?? true, openingTime: normalizeTime(matched.openingTime || matched.startingTime || matched.startTime, defaultDay.openingTime), closingTime: normalizeTime(matched.closingTime || matched.endingTime || matched.endTime, defaultDay.closingTime) };
    });
  }
  const startingTime = clinic?.startingTime || clinic?.StartingTime || clinic?.openingTime || clinic?.OpeningTime;
  const endingTime   = clinic?.endingTime   || clinic?.EndingTime   || clinic?.closingTime  || clinic?.ClosingTime;
  if (startingTime && endingTime) {
    return DEFAULT_AVAILABILITY.map((day) => ({ ...day, isOpen: day.dayOfWeek >= 0 && day.dayOfWeek <= 4, openingTime: normalizeTime(startingTime, "09:00"), closingTime: normalizeTime(endingTime, "17:00") }));
  }
  return DEFAULT_AVAILABILITY;
};

const getClinicImages = (clinic) => {
  const raw = clinic?.images || clinic?.clinicImages || clinic?.imageUrls || clinic?.photos || clinic?.pictures || clinic?.gallery || [];
  return (Array.isArray(raw) ? raw : []).map((img) => {
    if (typeof img === "string") return { url: img, name: "Clinic image" };
    return { url: img?.url || img?.imageUrl || img?.photoUrl || img?.fileUrl || img?.path || null, name: img?.name || img?.fileName || "Clinic image" };
  }).filter((img) => Boolean(img.url));
};

const normalizeClinics = (responseData) => {
  if (!responseData) return [];
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.data)) return responseData.data;
  if (Array.isArray(responseData?.clinics)) return responseData.clinics;
  if (Array.isArray(responseData?.data?.clinics)) return responseData.data.clinics;
  if (Array.isArray(responseData?.result)) return responseData.result;
  if (Array.isArray(responseData?.data?.result)) return responseData.data.result;
  if (responseData?.id || responseData?.clinicId) return [responseData];
  if (responseData?.data?.id || responseData?.data?.clinicId) return [responseData.data];
  return [];
};

// ─── Small UI primitives ──────────────────────────────────────────────────────

const SectionHeader = ({ title, description }) => (
  <div className="mb-5">
    <h2 className="text-base font-bold text-base-content tracking-tight">{title}</h2>
    {description && <p className="text-sm text-base-content/50 mt-0.5">{description}</p>}
  </div>
);

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-base-200 last:border-0 gap-4">
    <div className="flex items-center gap-2 text-xs text-base-content/40 shrink-0">
      {Icon && <Icon size={12} />}
      {label}
    </div>
    <p className={`text-sm font-medium text-right break-all ${value ? "text-base-content" : "text-base-content/25"}`}>
      {value || "—"}
    </p>
  </div>
);

const Card = ({ children, className = "" }) => (
  <div className={`bg-base-100 border border-base-200 rounded-2xl overflow-hidden ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ icon: Icon, title, subtitle, action }) => (
  <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-base-200">
    <div className="flex items-center gap-3">
      {Icon && (
        <div className="p-2 rounded-xl bg-primary/10 shrink-0">
          <Icon size={15} className="text-primary" />
        </div>
      )}
      <div>
        <p className="text-sm font-semibold text-base-content">{title}</p>
        {subtitle && <p className="text-xs text-base-content/40 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

// ─── Gallery ──────────────────────────────────────────────────────────────────

const GalleryImage = ({ image }) => {
  const [hasError, setHasError] = useState(false);
  if (!image?.url || hasError) {
    return (
      <div className="aspect-video rounded-xl bg-base-200 border border-base-200 flex flex-col items-center justify-center text-base-content/30">
        <ImageOff size={20} />
        <span className="text-xs mt-1.5">Unavailable</span>
      </div>
    );
  }
  return (
    <div className="aspect-video rounded-xl overflow-hidden border border-base-200">
      <img src={image.url} alt={image.name || "Clinic image"} className="w-full h-full object-cover" onError={() => setHasError(true)} />
    </div>
  );
};

const ClinicImageGallery = ({ clinic }) => {
  const images = getClinicImages(clinic);
  return (
    <div>
      {images.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {images.map((image, i) => <GalleryImage key={`${image.url}-${i}`} image={image} />)}
        </div>
      ) : (
        <div className="border border-dashed border-base-200 rounded-xl py-8 flex flex-col items-center justify-center gap-2 text-base-content/30">
          <ImageOff size={20} />
          <span className="text-xs">No images uploaded yet.</span>
        </div>
      )}
    </div>
  );
};

// ─── Schedule summary ─────────────────────────────────────────────────────────

const ClinicScheduleSummary = ({ availability, isLoading }) => {
  if (isLoading) return (
    <div className="flex items-center gap-2 text-sm text-base-content/40 py-4">
      <span className="loading loading-spinner loading-xs text-primary" />
      Loading schedule…
    </div>
  );

  const openDays = availability.filter((d) => d.isOpen);
  if (openDays.length === 0) return (
    <p className="text-sm text-base-content/40 py-2">No working days configured yet.</p>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {availability.map((day) => (
        <div
          key={day.dayOfWeek}
          className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm border transition-colors
            ${day.isOpen ? "border-primary/20 bg-primary/5" : "border-base-200 bg-base-200/40 opacity-50"}`}
        >
          <span className={`font-medium text-xs ${day.isOpen ? "text-base-content" : "text-base-content/40"}`}>
            {day.dayName}
          </span>
          {day.isOpen ? (
            <span className="text-xs text-base-content/60 flex items-center gap-1">
              <Clock size={10} />
              {day.openingTime} – {day.closingTime}
            </span>
          ) : (
            <span className="text-[11px] text-base-content/30">Closed</span>
          )}
        </div>
      ))}
    </div>
  );
};

// ─── Confirm modal ────────────────────────────────────────────────────────────

const ConfirmModal = ({ isOpen, title, description, confirmLabel, confirmClassName = "btn-primary", isLoading, onClose, onConfirm, children }) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget && !isLoading) onClose(); }}
    >
      <div className="bg-base-100 border border-base-200 rounded-3xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="text-base font-semibold text-base-content">{title}</h3>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-xs btn-circle text-base-content/40" disabled={isLoading}><X size={15} /></button>
        </div>
        <p className="text-sm text-base-content/50 mb-5">{description}</p>
        {children && <div className="mb-5">{children}</div>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-sm btn-ghost rounded-xl" onClick={onClose} disabled={isLoading}>Cancel</button>
          <button type="button" className={`btn btn-sm rounded-xl ${confirmClassName}`} onClick={onConfirm} disabled={isLoading}>
            {isLoading ? <span className="loading loading-spinner loading-xs" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Edit clinic modal ────────────────────────────────────────────────────────

const EditClinicModal = ({
  isOpen,
  clinic,
  isUpdatingClinic,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phoneNumber: "",
    description: "",
  });

  const [clinicImageFiles, setClinicImageFiles] = useState([]);
  const [clinicImagePreviews, setClinicImagePreviews] = useState([]);
  const [imageError, setImageError] = useState("");

  useEffect(() => {
    if (clinic && isOpen) {
      setFormData({
        name: clinic.name || "",
        address: clinic.address || "",
        phoneNumber: clinic.phoneNumber || "",
        description: clinic.description || "",
      });

      setClinicImageFiles([]);
      setClinicImagePreviews([]);
      setImageError("");
    }
  }, [clinic, isOpen]);

  useEffect(() => {
    return () => {
      clinicImagePreviews.forEach((image) => {
        if (image.previewUrl) URL.revokeObjectURL(image.previewUrl);
      });
    };
  }, [clinicImagePreviews]);

  if (!isOpen || !clinic) return null;

  const existingImages = getClinicImages(clinic);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "description" && value.length > DESCRIPTION_MAX_LENGTH) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImagesChange = (e) => {
    setImageError("");

    const selectedFiles = Array.from(e.target.files || []);

    if (selectedFiles.length > MAX_CLINIC_IMAGES) {
      setImageError(`You can upload a maximum of ${MAX_CLINIC_IMAGES} images.`);
      e.target.value = "";
      return;
    }

    const invalidFile = selectedFiles.find((file) => {
      return !file.type.startsWith("image/");
    });

    if (invalidFile) {
      setImageError("Please upload image files only.");
      e.target.value = "";
      return;
    }

    clinicImagePreviews.forEach((image) => {
      if (image.previewUrl) URL.revokeObjectURL(image.previewUrl);
    });

    const nextPreviews = selectedFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
    }));

    setClinicImageFiles(selectedFiles);
    setClinicImagePreviews(nextPreviews);
  };

  const handleRemoveNewImage = (indexToRemove) => {
    setClinicImagePreviews((prev) => {
      const imageToRemove = prev[indexToRemove];

      if (imageToRemove?.previewUrl) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }

      return prev.filter((_, index) => index !== indexToRemove);
    });

    setClinicImageFiles((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleClearNewImages = () => {
    clinicImagePreviews.forEach((image) => {
      if (image.previewUrl) URL.revokeObjectURL(image.previewUrl);
    });

    setClinicImageFiles([]);
    setClinicImagePreviews([]);
    setImageError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setImageError("");

    if (clinicImageFiles.length > MAX_CLINIC_IMAGES) {
      setImageError(`You can upload a maximum of ${MAX_CLINIC_IMAGES} images.`);
      return;
    }

    const clinicId = clinic.id || clinic.clinicId;

    const requestData = new FormData();

    requestData.append("Name", formData.name);
    requestData.append("Address", formData.address);
    requestData.append("PhoneNumber", formData.phoneNumber);
    requestData.append("Description", formData.description);

    clinicImageFiles.forEach((file) => {
      requestData.append("ClinicImages", file);
    });

    const localPatch = {
      name: formData.name,
      address: formData.address,
      phoneNumber: formData.phoneNumber,
      description: formData.description,
    };

    const success = await onSubmit(clinicId, requestData, localPatch);

    if (success) {
      handleClearNewImages();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(4px)",
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-base-100 border border-base-200 rounded-3xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base font-semibold text-base-content">
              Edit Clinic
            </h3>
            <p className="text-xs text-base-content/40 mt-0.5">
              Update clinic details and gallery images.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-xs btn-circle text-base-content/40"
            disabled={isUpdatingClinic}
          >
            <X size={15} />
          </button>
        </div>

        <div className="space-y-4">
          {[
            {
              label: "Clinic Name",
              name: "name",
              type: "text",
              placeholder: "Clinic name",
              required: true,
            },
            {
              label: "Address",
              name: "address",
              type: "text",
              placeholder: "Clinic address",
              required: true,
            },
            {
              label: "Phone Number",
              name: "phoneNumber",
              type: "tel",
              placeholder: "01018842808",
              required: true,
            },
          ].map(({ label, name, type, placeholder, required }) => (
            <div key={name}>
              <label className="block text-xs font-medium text-base-content/60 mb-1.5">
                {label}
              </label>
              <input
                type={type}
                name={name}
                placeholder={placeholder}
                required={required}
                className="input input-bordered input-sm w-full rounded-xl"
                value={formData[name]}
                onChange={handleChange}
                disabled={isUpdatingClinic}
              />
            </div>
          ))}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-base-content/60">
                Description
              </label>
              <span className="text-xs text-base-content/30">
                {formData.description.length}/{DESCRIPTION_MAX_LENGTH}
              </span>
            </div>

            <textarea
              name="description"
              placeholder="Briefly describe this clinic…"
              className="textarea textarea-bordered textarea-sm w-full min-h-24 resize-none rounded-xl"
              value={formData.description}
              onChange={handleChange}
              maxLength={DESCRIPTION_MAX_LENGTH}
              disabled={isUpdatingClinic}
            />
          </div>

          <div className="border border-base-200 rounded-2xl p-4 bg-base-200/30">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-xs font-semibold text-base-content/70">
                  Clinic Images
                </p>
                <p className="text-xs text-base-content/40 mt-0.5">
                  Upload up to {MAX_CLINIC_IMAGES} images. Selecting new images
                  will send them with the update request.
                </p>
              </div>

              {clinicImageFiles.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearNewImages}
                  className="btn btn-xs btn-ghost rounded-lg"
                  disabled={isUpdatingClinic}
                >
                  Clear
                </button>
              )}
            </div>

            {existingImages.length > 0 && clinicImagePreviews.length === 0 && (
              <div className="mb-4">
                <p className="text-[11px] uppercase tracking-wide text-base-content/35 mb-2">
                  Current Images
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {existingImages.slice(0, MAX_CLINIC_IMAGES).map((image, index) => (
                    <div
                      key={`${image.url}-${index}`}
                      className="aspect-video rounded-xl overflow-hidden border border-base-200 bg-base-300"
                    >
                      <img
                        src={image.url}
                        alt={image.name || "Clinic image"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {clinicImagePreviews.length > 0 && (
              <div className="mb-4">
                <p className="text-[11px] uppercase tracking-wide text-base-content/35 mb-2">
                  New Images
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {clinicImagePreviews.map((image, index) => (
                    <div
                      key={`${image.name}-${index}`}
                      className="relative aspect-video rounded-xl overflow-hidden border border-base-200 bg-base-300"
                    >
                      <img
                        src={image.previewUrl}
                        alt={image.name}
                        className="w-full h-full object-cover"
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveNewImage(index)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-error"
                        disabled={isUpdatingClinic}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              multiple
              className="file-input file-input-bordered file-input-sm w-full rounded-xl"
              onChange={handleImagesChange}
              disabled={isUpdatingClinic}
            />

            {imageError && (
              <p className="text-xs text-error mt-2">{imageError}</p>
            )}

            <p className="text-[11px] text-base-content/35 mt-2">
              Note: if the backend replaces images on update, the new selected
              images will become the clinic gallery. If the backend appends
              images, old images will remain unless backend supports image
              deletion.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            className="btn btn-sm btn-ghost rounded-xl"
            onClick={onClose}
            disabled={isUpdatingClinic}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="btn btn-sm btn-primary rounded-xl"
            disabled={isUpdatingClinic}
          >
            {isUpdatingClinic ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// ─── Edit availability modal ──────────────────────────────────────────────────

const EditAvailabilityModal = ({ isOpen, availability, isSaving, onClose, onSubmit }) => {
  const [localAvailability, setLocalAvailability] = useState(DEFAULT_AVAILABILITY);
  const [scheduleError, setScheduleError] = useState("");

  useEffect(() => { if (isOpen) { setLocalAvailability(availability || DEFAULT_AVAILABILITY); setScheduleError(""); } }, [isOpen, availability]);

  if (!isOpen) return null;

  const handleToggleDay = (dayOfWeek) => setLocalAvailability((prev) => prev.map((d) => d.dayOfWeek === dayOfWeek ? { ...d, isOpen: !d.isOpen } : d));
  const handleTimeChange = (dayOfWeek, field, value) => setLocalAvailability((prev) => prev.map((d) => d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d));

  const validate = () => {
    const open = localAvailability.filter((d) => d.isOpen);
    if (open.length === 0) return "Please select at least one working day.";
    const bad = open.find((d) => !d.openingTime || !d.closingTime || d.openingTime >= d.closingTime);
    if (bad) return `${bad.dayName}: closing time must be after opening time.`;
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setScheduleError(err); return; }
    const success = await onSubmit(localAvailability);
    if (success) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}>
      <form onSubmit={handleSubmit} className="bg-base-100 border border-base-200 rounded-3xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base font-semibold text-base-content">Edit Availability</h3>
            <p className="text-xs text-base-content/40 mt-0.5">Set working days and hours for this clinic.</p>
          </div>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-xs btn-circle text-base-content/40" disabled={isSaving}><X size={15} /></button>
        </div>

        <div className="space-y-2">
          {localAvailability.map((day) => (
            <div key={day.dayOfWeek} className={`rounded-xl border p-3 transition-colors ${day.isOpen ? "border-primary/25 bg-primary/5" : "border-base-200 bg-base-200/40"}`}>
              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" className="checkbox checkbox-primary checkbox-sm" checked={day.isOpen} onChange={() => handleToggleDay(day.dayOfWeek)} disabled={isSaving} />
                  <span className="text-sm font-medium text-base-content">{day.dayName}</span>
                </label>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${day.isOpen ? "bg-primary/10 text-primary" : "bg-base-300 text-base-content/40"}`}>
                  {day.isOpen ? "Open" : "Closed"}
                </span>
              </div>

              {day.isOpen && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {[["openingTime", "Opens"], ["closingTime", "Closes"]].map(([field, label]) => (
                    <label key={field} className="block">
                      <span className="text-xs text-base-content/40 flex items-center gap-1 mb-1"><Clock size={11} />{label}</span>
                      <input type="time" className="input input-bordered input-xs w-full rounded-lg" value={day[field]} onChange={(e) => handleTimeChange(day.dayOfWeek, field, e.target.value)} disabled={isSaving} />
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {scheduleError && <div className="alert alert-warning text-xs mt-3 py-2">{scheduleError}</div>}

        <div className="flex justify-end gap-2 mt-5">
          <button type="button" className="btn btn-sm btn-ghost rounded-xl" onClick={onClose} disabled={isSaving}>Cancel</button>
          <button type="submit" className="btn btn-sm btn-primary rounded-xl" disabled={isSaving}>
            {isSaving ? <span className="loading loading-spinner loading-xs" /> : "Save Availability"}
          </button>
        </div>
      </form>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const SettingsPage = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useThemeStore();
  const { logout, isLoggingOut } = useAuthStore();
  const selectedClinic = useClinicStore((state) => state.selectedClinic);
  const deleteClinic = useClinicStore((state) => state.deleteClinic);
  const updateClinic = useClinicStore((state) => state.updateClinic);
  const clearSelectedClinic = useClinicStore((state) => state.clearSelectedClinic);
  const isUpdatingClinic = useClinicStore((state) => state.isUpdatingClinic);

  const [profile, setProfile] = useState(null);
  const [clinicDetails, setClinicDetails] = useState(null);
  const [clinicAvailability, setClinicAvailability] = useState(DEFAULT_AVAILABILITY);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isClinicLoading, setIsClinicLoading] = useState(true);
  const [isDeletingClinic, setIsDeletingClinic] = useState(false);
  const [isUpdatingSchedule, setIsUpdatingSchedule] = useState(false);

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditClinicModalOpen, setIsEditClinicModalOpen] = useState(false);
  const [isEditAvailabilityModalOpen, setIsEditAvailabilityModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  const selectedClinicId = selectedClinic?.id || selectedClinic?.clinicId;

  // Profile fetch
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/account/profile");
        setProfile(res.data?.data ?? res.data);
      } catch (error) {
        console.log("PROFILE ERROR:", error.response?.data || error.message);
        toast.error("Failed to load profile info");
      } finally { setIsProfileLoading(false); }
    };
    fetchProfile();
  }, []);

  // Clinic details fetch
  useEffect(() => {
    const fetchClinicDetails = async () => {
      if (!selectedClinicId) { setClinicDetails(null); setIsClinicLoading(false); return; }
      setIsClinicLoading(true);
      try {
        const responses = [];
        for (const endpoint of ["/clinic/mine", "/clinic/getallclinicsforuser", "/clinic/getallclinicsfull"]) {
          try { const res = await api.get(endpoint); responses.push(...normalizeClinics(res.data)); } catch {}
        }
        const matches = responses.filter((c) => (c?.id || c?.clinicId) === selectedClinicId);
        const best = matches.reduce((a, b) => !a || Object.keys(b).length > Object.keys(a).length ? b : a, null) || selectedClinic;
        setClinicDetails(best);
        if (best) localStorage.setItem("petzy_selected_clinic", JSON.stringify(best));
      } finally { setIsClinicLoading(false); }
    };
    fetchClinicDetails();
  }, [selectedClinicId]);

  // Schedule fetch
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!selectedClinicId) { setClinicAvailability(DEFAULT_AVAILABILITY); return; }
      setIsScheduleLoading(true);
      try {
        const res = await api.get(`/clinic/${selectedClinicId}/schedule`);
        setClinicAvailability(normalizeScheduleResponse(res.data));
      } catch { setClinicAvailability(DEFAULT_AVAILABILITY); }
      finally { setIsScheduleLoading(false); }
    };
    fetchSchedule();
  }, [selectedClinicId]);

  const fullName = useMemo(() => {
    if (!profile?.firstName && !profile?.lastName) return "Clinic Owner";
    return `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim();
  }, [profile]);

  const activeClinic = clinicDetails || selectedClinic;
  const clinicId = activeClinic?.id || activeClinic?.clinicId;

  const handleSwitchClinic = () => { clearSelectedClinic(); navigate("/clinics", { replace: true }); };
  const handleConfirmLogout = async () => { await logout(); setIsLogoutModalOpen(false); navigate("/login", { replace: true }); };

  const handleUpdateClinic = async (clinicIdToUpdate, payload, localPatch = {}) => {
  const success = await updateClinic(clinicIdToUpdate, payload);

  if (success) {
    try {
      const res = await api.get(`/clinic/getclinic/${clinicIdToUpdate}`);
      const latestClinic = res.data?.data ?? res.data;

      const updated = {
        ...activeClinic,
        ...latestClinic,
        id: clinicIdToUpdate,
      };

      setClinicDetails(updated);
      localStorage.setItem("petzy_selected_clinic", JSON.stringify(updated));
    } catch {
      const updated = {
        ...activeClinic,
        ...localPatch,
        id: clinicIdToUpdate,
      };

      setClinicDetails(updated);
      localStorage.setItem("petzy_selected_clinic", JSON.stringify(updated));
    }

    return true;
  }

  return false;
};

  const handleUpdateAvailability = async (nextAvailability) => {
    if (!clinicId) { toast.error("No clinic selected"); return false; }
    setIsUpdatingSchedule(true);
    try {
      await api.put(`/clinic/${clinicId}/schedule`, buildSchedulePayload(nextAvailability));
      setClinicAvailability(nextAvailability);
      setClinicDetails((prev) => prev ? { ...prev, schedule: nextAvailability, availability: nextAvailability } : prev);
      toast.success("Availability updated.");
      return true;
    } catch (error) {
      console.log("UPDATE SCHEDULE ERROR:", error.response?.data || error.message);
      toast.error("Failed to update availability.");
      return false;
    } finally { setIsUpdatingSchedule(false); }
  };

  const handleConfirmDeleteClinic = async () => {
    if (!clinicId) { toast.error("No clinic selected"); return; }
    if (!profile?.email) { toast.error("Profile email missing."); return; }
    if (!deletePassword.trim()) { toast.error("Please enter your password."); return; }
    setIsDeletingClinic(true);
    try {
      await api.post("/account/login", { email: profile.email, password: deletePassword });
      const success = await deleteClinic(clinicId);
      if (success) { setIsDeleteModalOpen(false); setDeletePassword(""); navigate("/clinics", { replace: true }); }
    } catch (error) {
      console.log("DELETE ERROR:", error.response?.data || error.message);
      toast.error("Incorrect password or deletion failed.");
    } finally { setIsDeletingClinic(false); }
  };

  const HIDDEN_CLINIC_KEYS = new Set([
    "id", "clinicId", "ownerId", "name", "address", "phoneNumber", "description",
    "hasAppointments", "images", "clinicImages", "imageUrls", "photos", "pictures",
    "gallery", "availability", "availabilities", "clinicAvailabilities", "workingHours",
    "schedule", "startingTime", "endingTime", "StartingTime", "EndingTime",
  ]);

  const extraClinicFields = activeClinic
    ? Object.entries(activeClinic).filter(([key]) => !HIDDEN_CLINIC_KEYS.has(key))
    : [];

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-base-200/40 py-10 px-4 sm:px-8 lg:px-10">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Page title */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-base-content">Settings</h1>
          <p className="text-sm text-base-content/50 mt-1">Manage your account, clinic, and preferences.</p>
        </div>

        {/* ── 1. ACCOUNT ─────────────────────────────────────────────────── */}
        <section>
          <SectionHeader title="Account" description="Your personal profile details." />
          <Card>
            <CardHeader icon={UserRound} title="Owner Profile" subtitle="Logged-in account" />
            <div className="px-5 py-4">
              {isProfileLoading ? (
                <div className="flex items-center gap-2 text-sm text-base-content/40 py-4">
                  <span className="loading loading-spinner loading-sm text-primary" />
                  Loading profile…
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="shrink-0">
                    {profile?.profilePictureUrl ? (
                      <img src={profile.profilePictureUrl} alt="Profile" className="w-14 h-14 rounded-2xl object-cover border border-base-200" />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-lg font-bold border border-primary/20">
                        {(profile?.firstName?.[0] || "C").toUpperCase()}{(profile?.lastName?.[0] || "O").toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base-content">{fullName}</p>
                    <div className="mt-2 space-y-0">
                      <InfoRow icon={Mail} label="Email" value={profile?.email} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </section>

        {/* ── 2. CLINIC ──────────────────────────────────────────────────── */}
        <section>
          <SectionHeader title="Clinic" description="Details, schedule, and gallery for your current clinic." />

          {/* Top row: details + schedule side by side on lg+ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            {/* Clinic info card */}
            <Card>
              <CardHeader
                icon={Building2}
                title="Clinic Details"
                subtitle={activeClinic?.name || "No clinic selected"}
                action={
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditClinicModalOpen(true)}
                      disabled={!activeClinic || isClinicLoading}
                      className="btn btn-xs btn-primary rounded-xl gap-1.5"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                    <button type="button" onClick={handleSwitchClinic} className="btn btn-xs btn-ghost rounded-xl gap-1.5 border border-base-200">
                      <ArrowLeftRight size={12} /> Switch
                    </button>
                  </div>
                }
              />

              <div className="px-5 py-4">
                {isClinicLoading ? (
                  <div className="flex items-center gap-2 text-sm text-base-content/40 py-4">
                    <span className="loading loading-spinner loading-sm text-primary" /> Loading…
                  </div>
                ) : activeClinic ? (
                  <>
                    <InfoRow icon={Building2} label="Name" value={activeClinic.name} />
                    <InfoRow icon={MapPin} label="Address" value={activeClinic.address} />
                    <InfoRow icon={Phone} label="Phone" value={activeClinic.phoneNumber} />
                    {activeClinic.description && (
                      <div className="pt-2.5 mt-0.5">
                        <p className="text-xs text-base-content/40 mb-1">Description</p>
                        <p className="text-sm text-base-content/70">{activeClinic.description}</p>
                      </div>
                    )}
                    
                  </>
                ) : (
                  <div className="py-4 text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 rounded-xl px-4 border border-amber-200 dark:border-amber-700/30">
                    No clinic is currently selected.
                  </div>
                )}
              </div>
            </Card>

            {/* Availability card */}
            {activeClinic && (
              <Card>
                <CardHeader
                  icon={CalendarDays}
                  title="Working Hours"
                  subtitle="Weekly clinic schedule"
                  action={
                    <button
                      type="button"
                      onClick={() => setIsEditAvailabilityModalOpen(true)}
                      disabled={isScheduleLoading}
                      className="btn btn-xs btn-ghost rounded-xl gap-1.5 border border-base-200"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                  }
                />
                <div className="px-5 py-4">
                  <ClinicScheduleSummary availability={clinicAvailability} isLoading={isScheduleLoading} />
                </div>
              </Card>
            )}
          </div>

          {/* Gallery — full width below */}
          {activeClinic && getClinicImages(activeClinic).length > 0 && (
            <Card className="mt-4">
              <CardHeader icon={Images} title="Clinic Gallery" subtitle="Uploaded photos" />
              <div className="px-5 py-4">
                <ClinicImageGallery clinic={activeClinic} />
              </div>
            </Card>
          )}
        </section>

        {/* ── 3. APPEARANCE ─────────────────────────────────────────────── */}
        <section>
          <SectionHeader title="Appearance" description="Customize the dashboard theme." />
          <Card>
            <div className="px-5 py-4">
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2.5">
                {THEMES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all duration-150
                      ${theme === t ? "border-primary bg-primary/8 shadow-sm" : "border-base-200 hover:border-base-300 hover:bg-base-200/60"}`}
                  >
                    <div className="relative h-7 w-full rounded-lg overflow-hidden border border-base-200" data-theme={t}>
                      <div className="absolute inset-0 grid grid-cols-4 gap-px p-1">
                        <div className="rounded bg-primary" />
                        <div className="rounded bg-secondary" />
                        <div className="rounded bg-accent" />
                        <div className="rounded bg-neutral" />
                      </div>
                    </div>
                    <span className={`text-[11px] font-medium capitalize truncate w-full text-center ${theme === t ? "text-primary" : "text-base-content/50"}`}>{t}</span>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </section>

        {/* ── 4. DANGER ZONE ────────────────────────────────────────────── */}
        <section>
          <SectionHeader title="Account Actions" description="Session and destructive clinic actions." />
          <Card>
            {/* Logout row */}
            <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-base-200">
              <div>
                <p className="text-sm font-semibold text-base-content">Sign Out</p>
                <p className="text-xs text-base-content/40 mt-0.5">End your current session and return to login.</p>
              </div>
              <button type="button" onClick={() => setIsLogoutModalOpen(true)} disabled={isLoggingOut} className="btn btn-sm btn-ghost rounded-xl gap-2 border border-base-200 text-base-content/60 hover:text-base-content shrink-0">
                <LogOut size={14} /> Logout
              </button>
            </div>

            {/* Delete clinic row */}
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-error flex items-center gap-1.5">
                  <ShieldAlert size={14} /> Delete Clinic
                </p>
                <p className="text-xs text-base-content/40 mt-0.5">Permanently deletes the current clinic. Requires password.</p>
              </div>
              <button type="button" onClick={() => setIsDeleteModalOpen(true)} disabled={!activeClinic || isDeletingClinic} className="btn btn-sm btn-error rounded-xl gap-1.5 shrink-0">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </Card>
        </section>

      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={isLogoutModalOpen}
        title="Sign out?"
        description="Are you sure you want to end your current session?"
        confirmLabel="Sign out"
        isLoading={isLoggingOut}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete clinic?"
        description={`This will permanently delete "${activeClinic?.name || "the selected clinic"}". Enter your account password to confirm.`}
        confirmLabel="Delete Clinic"
        confirmClassName="btn-error"
        isLoading={isDeletingClinic}
        onClose={() => { setIsDeleteModalOpen(false); setDeletePassword(""); }}
        onConfirm={handleConfirmDeleteClinic}
      >
        <label className="block text-xs font-medium text-base-content/60 mb-1.5">Account Password</label>
        <input type="password" className="input input-bordered input-sm w-full rounded-xl" placeholder="Enter your password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} />
      </ConfirmModal>

      <EditClinicModal
        isOpen={isEditClinicModalOpen}
        clinic={activeClinic}
        isUpdatingClinic={isUpdatingClinic}
        onClose={() => setIsEditClinicModalOpen(false)}
        onSubmit={handleUpdateClinic}
      />

      <EditAvailabilityModal
        isOpen={isEditAvailabilityModalOpen}
        availability={clinicAvailability}
        isSaving={isUpdatingSchedule}
        onClose={() => setIsEditAvailabilityModalOpen(false)}
        onSubmit={handleUpdateAvailability}
      />
    </div>
  );
};

export default SettingsPage;