import React, { useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle2, XCircle, LogOut, RefreshCw, MapPin, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../lib/axios";

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

const getClinicId = (clinic) => clinic?.id || clinic?.clinicId;

const isClinicApproved = (clinic) => {
  const value =
    clinic?.isApproved ??
    clinic?.approvalStatus ??
    clinic?.approved ??
    clinic?.clinicStatus;

  if (value === true) return true;
  if (value === false) return false;

  const normalized = String(value ?? "").trim().toLowerCase();

  return ["approved", "active", "accepted"].includes(normalized);
};

const AdminClinicsPage = () => {
  const navigate = useNavigate();

  const [clinics, setClinics] = useState([]);
  const [pendingClinicIds, setPendingClinicIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [actionClinicId, setActionClinicId] = useState(null);

  const fetchClinics = async () => {
    setIsLoading(true);

    try {
      const [allRes, pendingRes] = await Promise.allSettled([
        api.get("/clinic/getallclinicsfull"),
        api.get("/admin/clinic/clinics", {
          params: {
            isApproved: false,
          },
        }),
      ]);

      let allClinics = [];
      let pendingClinics = [];

      if (allRes.status === "fulfilled") {
        allClinics = normalizeClinics(allRes.value.data);
      } else {
        console.log("FETCH ALL CLINICS ERROR:", allRes.reason?.response?.data || allRes.reason?.message);
      }

      if (pendingRes.status === "fulfilled") {
        pendingClinics = normalizeClinics(pendingRes.value.data);
      } else {
        console.log("FETCH PENDING CLINICS ERROR:", pendingRes.reason?.response?.data || pendingRes.reason?.message);
      }

      const pendingIds = new Set(
        pendingClinics.map((clinic) => getClinicId(clinic)).filter(Boolean)
      );

      setPendingClinicIds(pendingIds);

      const mergedClinics = allClinics.map((clinic) => {
        const clinicId = getClinicId(clinic);

        return {
          ...clinic,
          adminApprovalState: pendingIds.has(clinicId)
            ? "Pending"
            : isClinicApproved(clinic)
              ? "Approved"
              : "Approved",
        };
      });

      setClinics(mergedClinics);
    } catch (error) {
      console.log("ADMIN FETCH CLINICS ERROR:", error.response?.data || error.message);
      toast.error("Failed to load clinics.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const isAdmin = localStorage.getItem("petzy_admin_session") === "true";

    if (!isAdmin) {
      navigate("/admin/login", { replace: true });
      return;
    }

    fetchClinics();
  }, []);

  const sortedClinics = useMemo(() => {
    return [...clinics].sort((a, b) => {
      const aPending = pendingClinicIds.has(getClinicId(a));
      const bPending = pendingClinicIds.has(getClinicId(b));

      if (aPending && !bPending) return -1;
      if (!aPending && bPending) return 1;

      return String(a.name || "").localeCompare(String(b.name || ""));
    });
  }, [clinics, pendingClinicIds]);

  const handleApproveClinic = async (clinic) => {
    const clinicId = getClinicId(clinic);

    if (!clinicId) {
      toast.error("Clinic ID is missing.");
      return;
    }

    setActionClinicId(clinicId);

    try {
      await api.post(`/admin/clinic/clinics/${clinicId}/approve`);

      toast.success("Clinic approved successfully.");
      await fetchClinics();
    } catch (error) {
      console.log("APPROVE CLINIC ERROR:", error.response?.data || error.message);
      toast.error("Failed to approve clinic.");
    } finally {
      setActionClinicId(null);
    }
  };

  const handleRejectClinic = async (clinic) => {
    const clinicId = getClinicId(clinic);

    if (!clinicId) {
      toast.error("Clinic ID is missing.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to reject and delete "${clinic.name || "this clinic"}"?`
    );

    if (!confirmed) return;

    setActionClinicId(clinicId);

    try {
      await api.delete(`/clinic/delete/${clinicId}`);

      toast.success("Clinic rejected and deleted.");
      await fetchClinics();
    } catch (error) {
      console.log("REJECT CLINIC ERROR:", error.response?.data || error.message);
      toast.error("Failed to reject clinic. Backend may need an admin reject endpoint.");
    } finally {
      setActionClinicId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("petzy_access_token");
    localStorage.removeItem("petzy_admin_session");
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-base-200 p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-base-100 border border-base-300 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-base-content">
              Admin Clinic Approvals
            </h1>
            <p className="text-sm text-base-content/60 mt-1">
              Review clinics, approve valid requests, or reject pending clinics.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchClinics}
              className="btn btn-outline btn-sm rounded-xl gap-2"
              disabled={isLoading}
            >
              <RefreshCw size={14} />
              Refresh
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-ghost btn-sm rounded-xl gap-2"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>

        <div className="bg-base-100 border border-base-300 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <span className="loading loading-spinner loading-md text-primary" />
              <p className="text-sm text-base-content/50">Loading clinics...</p>
            </div>
          ) : sortedClinics.length > 0 ? (
            <div className="divide-y divide-base-200">
              {sortedClinics.map((clinic) => {
                const clinicId = getClinicId(clinic);
                const isPending = pendingClinicIds.has(clinicId);
                const isBusy = actionClinicId === clinicId;

                return (
                  <div
                    key={clinicId || clinic.name}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      <div
                        className={`p-3 rounded-2xl shrink-0 ${
                          isPending
                            ? "bg-warning/10 text-warning"
                            : "bg-success/10 text-success"
                        }`}
                      >
                        <Building2 size={20} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="font-semibold text-base-content">
                            {clinic.name || "Unnamed Clinic"}
                          </h2>

                          <span
                            className={`badge badge-sm ${
                              isPending ? "badge-warning" : "badge-success"
                            }`}
                          >
                            {isPending ? "Needs Approval" : "Approved"}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-base-content/50">
                          {clinic.address && (
                            <span className="flex items-center gap-1">
                              <MapPin size={12} />
                              {clinic.address}
                            </span>
                          )}

                          {clinic.phoneNumber && (
                            <span className="flex items-center gap-1">
                              <Phone size={12} />
                              {clinic.phoneNumber}
                            </span>
                          )}
                        </div>

                        {clinic.description && (
                          <p className="text-sm text-base-content/50 mt-2 max-w-2xl">
                            {clinic.description}
                          </p>
                        )}

                        {clinic.ownerName && (
                          <p className="text-xs text-base-content/40 mt-1">
                            Owner: {clinic.ownerName}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isPending ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApproveClinic(clinic)}
                            className="btn btn-sm btn-success rounded-xl gap-2"
                            disabled={isBusy}
                          >
                            <CheckCircle2 size={14} />
                            {isBusy ? "Approving..." : "Approve"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRejectClinic(clinic)}
                            className="btn btn-sm btn-error rounded-xl gap-2"
                            disabled={isBusy}
                          >
                            <XCircle size={14} />
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-sm text-success font-medium flex items-center gap-1">
                          <CheckCircle2 size={15} />
                          Approved
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <Building2 size={30} className="text-base-content/20" />
              <p className="text-sm font-medium text-base-content/60">
                No clinics found
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminClinicsPage;