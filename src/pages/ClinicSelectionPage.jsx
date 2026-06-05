import React, { useEffect, useState } from "react";
import {
  Building2,
  Plus,
  MapPin,
  Phone,
  LogOut,
  X,
  ChevronRight,
  Clock3,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import pawIcon from "../assets/paw_icon.png";
import ClinicCreateForm from "../components/ClinicCreateForm";
import { useClinicStore } from "../store/useClinicStore";
import { useAuthStore } from "../store/useAuthStore";
// ─── Confirm modal ─────────────────────────────────────────────────────────────

const ConfirmModal = ({ isOpen, title, description, confirmLabel, confirmVariant = "btn-primary", isLoading, onClose, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget && !isLoading) onClose(); }}
    >
      <div className="bg-base-100 border border-base-200 rounded-3xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="text-base font-semibold text-base-content">{title}</h3>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-xs btn-circle text-base-content/40 shrink-0" disabled={isLoading}>
            <X size={15} />
          </button>
        </div>
        <p className="text-sm text-base-content/50 mb-5">{description}</p>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-sm btn-ghost rounded-xl" onClick={onClose} disabled={isLoading}>Cancel</button>
          <button type="button" className={`btn btn-sm rounded-xl ${confirmVariant}`} onClick={onConfirm} disabled={isLoading}>
            {isLoading ? <span className="loading loading-spinner loading-xs" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Approval state resolver ───────────────────────────────────────────────────

const getClinicApprovalState = (clinic) => {
  const rawStatus =
    clinic.isApproved ??
    clinic.approvalStatus ??
    clinic.approved ??
    clinic.requestStatus ??
    clinic.clinicStatus;

  if (rawStatus === true) {
    return {
      key: "approved",
      label: "Approved",
      icon: CheckCircle2,
      isClickable: true,
    };
  }

  if (rawStatus === false) {
    return {
      key: "pending",
      label: "Under Review",
      icon: Clock3,
      isClickable: false,
    };
  }

  const norm = String(rawStatus ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("_", " ")
    .replaceAll("-", " ");

  const approved = ["approved", "active", "accepted"];
  const pending = [
    "pending",
    "under review",
    "under approval",
    "waiting",
    "waiting approval",
    "waiting for approval",
    "review",
    "in review",
  ];
  const rejected = ["rejected", "declined", "denied"];

  if (approved.includes(norm)) {
    return {
      key: "approved",
      label: "Approved",
      icon: CheckCircle2,
      isClickable: true,
    };
  }

  if (rejected.includes(norm)) {
    return {
      key: "rejected",
      label: "Rejected",
      icon: XCircle,
      isClickable: false,
    };
  }

  if (pending.includes(norm)) {
    return {
      key: "pending",
      label: "Under Review",
      icon: Clock3,
      isClickable: false,
    };
  }

  return {
    key: "pending",
    label: "Under Review",
    icon: Clock3,
    isClickable: false,
  };
};

const APPROVAL_STYLES = {
  approved: {
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/40",
    card: "border-base-200 hover:border-primary/30 hover:bg-primary/5 cursor-pointer",
    icon: "bg-primary/10 text-primary",
  },
  pending: {
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-700/40",
    card: "border-amber-200/60 dark:border-amber-700/30 bg-amber-50/50 dark:bg-amber-900/10 cursor-not-allowed opacity-80",
    icon: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  },
  rejected: {
    badge: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-700/40",
    card: "border-red-200/60 dark:border-red-700/30 bg-red-50/50 dark:bg-red-900/10 cursor-not-allowed opacity-70",
    icon: "bg-red-100 dark:bg-red-900/30 text-red-500",
  },
};
// ─── Page ──────────────────────────────────────────────────────────────────────

const ClinicSelectionPage = () => {
  const navigate = useNavigate();
  const clinics = useClinicStore((state) => state.clinics);
  const fetchMyClinics = useClinicStore((state) => state.fetchMyClinics);
  const createClinic = useClinicStore((state) => state.createClinic);
  const selectClinic = useClinicStore((state) => state.selectClinic);
  const deleteClinic = useClinicStore((state) => state.deleteClinic);
  const isLoadingClinics = useClinicStore((state) => state.isLoadingClinics);
  const isCreatingClinic = useClinicStore((state) => state.isCreatingClinic);
  const logout = useAuthStore((state) => state.logout);
  const isLoggingOut = useAuthStore((state) => state.isLoggingOut);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [clinicToDelete, setClinicToDelete] = useState(null);
  const [isDeleteClinicModalOpen, setIsDeleteClinicModalOpen] = useState(false);
  const [isDeletingClinic, setIsDeletingClinic] = useState(false);
useEffect(() => {
  fetchMyClinics();
}, [fetchMyClinics]);

  const handleSelectClinic = (clinic) => {
    const state = getClinicApprovalState(clinic);
    if (!state.isClickable) {
      toast.error("This clinic is still under review and cannot be opened yet.");
      return;
    }
    selectClinic(clinic);
    navigate("/", { replace: true });
  };

  const handleOpenDeletePending = (e, clinic) => {
    e.stopPropagation();
    const state = getClinicApprovalState(clinic);
    if (state.key !== "pending") { toast.error("Only clinics under review can be removed here."); return; }
    setClinicToDelete(clinic);
    setIsDeleteClinicModalOpen(true);
  };

  const handleConfirmDeletePending = async () => {
    const clinicId = clinicToDelete?.id || clinicToDelete?.clinicId;
    if (!clinicId) { toast.error("Clinic ID is missing."); return; }
    setIsDeletingClinic(true);
    try {
      const success = await deleteClinic(clinicId);
      if (success) {
        setIsDeleteClinicModalOpen(false);
        setClinicToDelete(null);
        await useClinicStore.getState().fetchMyClinics();
      }
    } finally {
      setIsDeletingClinic(false);
    }
  };

  const handleCreateClinic = async (formData) => {
    const created = await createClinic(formData);
    if (created) { setShowCreateForm(false); return true; }
    return false;
  };

  const handleConfirmLogout = async () => {
    await logout();
    setIsLogoutModalOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="bg-base-100 border border-base-200 rounded-3xl shadow-xl overflow-hidden">

          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-base-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <img src={pawIcon} alt="Petzy" className="h-5 w-5 object-contain" />
              </div>
              <span className="text-sm font-semibold text-base-content">Petzy</span>
            </div>
            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
              className="btn btn-ghost btn-sm rounded-xl gap-1.5 text-base-content/50 hover:text-base-content"
              disabled={isLoggingOut}
            >
              <LogOut size={13} />
              Logout
            </button>
          </div>

          {/* Hero */}
          <div className="px-6 pt-8 pb-5 border-b border-base-200 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Building2 size={20} className="text-primary" />
          </div>

          <h1 className="text-xl font-bold text-base-content tracking-tight">
            Choose Your Clinic
          </h1>

          <p className="text-sm text-base-content/50 mt-1.5 max-w-md mx-auto text-center leading-relaxed">
            Select an approved clinic to manage, or submit a new clinic request.
          </p>
        </div>

          {/* Body */}
          <div className="px-6 py-6">
            {isLoadingClinics && !showCreateForm ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <span className="loading loading-spinner loading-md text-primary" />
                <p className="text-sm text-base-content/40">Loading your clinics…</p>
              </div>
            ) : (
              <>
                {clinics.length > 0 && !showCreateForm && (
                  <div className="space-y-2.5 mb-5">
                    {/* Approved clinics first, then others */}
                    {[...clinics]
                      .sort((a, b) => {
                        const order = { approved: 0, pending: 1, rejected: 2 };
                        return (order[getClinicApprovalState(a).key] ?? 1) - (order[getClinicApprovalState(b).key] ?? 1);
                      })
                      .map((clinic) => {
                        const approvalState = getClinicApprovalState(clinic);
                        const styles = APPROVAL_STYLES[approvalState.key];
                        const StatusIcon = approvalState.icon;
                        const canDelete = approvalState.key === "pending";

                        return (
                          <div
                            key={clinic.id || clinic.clinicId || clinic.name}
                            role={approvalState.isClickable ? "button" : "article"}
                            tabIndex={approvalState.isClickable ? 0 : -1}
                            onClick={() => handleSelectClinic(clinic)}
                            onKeyDown={(e) => {
                              if (approvalState.isClickable && (e.key === "Enter" || e.key === " ")) handleSelectClinic(clinic);
                            }}
                            className={`relative group border rounded-2xl p-4 transition-all duration-150 ${styles.card}`}
                          >
                            {/* Delete pending button */}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={(e) => handleOpenDeletePending(e, clinic)}
                                title="Remove pending request"
                                className="absolute top-3 right-3 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400 flex items-center justify-center transition-colors z-10"
                              >
                                <X size={12} />
                              </button>
                            )}

                            <div className="flex items-center gap-3.5 pr-6">
                              <div className={`p-2.5 rounded-xl shrink-0 ${styles.icon}`}>
                                <Building2 size={17} />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                  <p className="font-semibold text-sm text-base-content truncate">{clinic.name || "Unnamed Clinic"}</p>
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${styles.badge}`}>
                                    <StatusIcon size={10} />
                                    {approvalState.label}
                                  </span>
                                </div>

                                <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                                  {clinic.address && (
                                    <span className="text-xs text-base-content/45 flex items-center gap-1">
                                      <MapPin size={10} /> {clinic.address}
                                    </span>
                                  )}
                                  {clinic.phoneNumber && (
                                    <span className="text-xs text-base-content/45 flex items-center gap-1">
                                      <Phone size={10} /> {clinic.phoneNumber}
                                    </span>
                                  )}
                                </div>

                                {!approvalState.isClickable && approvalState.key === "pending" && (
                                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5">
                                    Awaiting admin approval — you'll be notified once reviewed.
                                  </p>
                                )}
                                {approvalState.key === "rejected" && (
                                  <p className="text-[11px] text-red-500 mt-1.5">
                                    This request was rejected by the admin.
                                  </p>
                                )}
                              </div>

                              {approvalState.isClickable && (
                                <ChevronRight size={15} className="text-base-content/20 group-hover:text-primary transition-colors shrink-0" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}

                {clinics.length === 0 && !showCreateForm && (
                  <div className="text-center bg-base-200/60 rounded-2xl p-8 mb-5 border border-base-200">
                    <div className="w-10 h-10 rounded-2xl bg-base-300 flex items-center justify-center mx-auto mb-3">
                      <Building2 size={17} className="text-base-content/30" />
                    </div>
                    <p className="text-sm font-medium text-base-content/60">No clinics yet</p>
                    <p className="text-xs text-base-content/40 mt-1">Submit your first clinic request to get started.</p>
                  </div>
                )}

                {!showCreateForm && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={fetchMyClinics}
                    className="btn btn-outline rounded-2xl flex-1"
                    disabled={isLoadingClinics}
                  >
                    {isLoadingClinics ? "Refreshing..." : "Refresh Status"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCreateForm(true)}
                    className="btn btn-primary rounded-2xl gap-2 flex-1"
                  >
                    <Plus size={15} />
                    Request New Clinic
                  </button>
                </div>
              )}

                {showCreateForm && (
                  <ClinicCreateForm
                    onCreateClinic={handleCreateClinic}
                    isCreatingClinic={isCreatingClinic}
                    onCancel={() => setShowCreateForm(false)}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

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
        isOpen={isDeleteClinicModalOpen}
        title="Remove pending clinic?"
        description={`Are you sure you want to remove "${clinicToDelete?.name || "this clinic request"}"? This cannot be undone.`}
        confirmLabel="Remove"
        confirmVariant="btn-error"
        isLoading={isDeletingClinic}
        onClose={() => { setIsDeleteClinicModalOpen(false); setClinicToDelete(null); }}
        onConfirm={handleConfirmDeletePending}
      />
    </div>
  );
};

export default ClinicSelectionPage;