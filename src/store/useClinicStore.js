import { create } from "zustand";
import api from "../lib/axios";
import toast from "react-hot-toast";

const getStoredSelectedClinic = () => {
  try {
    return JSON.parse(localStorage.getItem("petzy_selected_clinic") || "null");
  } catch {
    localStorage.removeItem("petzy_selected_clinic");
    return null;
  }
};

const getErrorMessage = (error, fallback) => {
  const data = error.response?.data;

  if (typeof data === "string") return data;
  if (data?.message) return data.message;
  if (data?.title) return data.title;

  if (Array.isArray(data?.errors)) {
    return data.errors.join(", ");
  }

  if (data?.errors && typeof data.errors === "object") {
    return Object.values(data.errors).flat().join(", ");
  }

  return fallback;
};

const normalizeClinics = (responseData) => {
  console.log("RAW CLINICS RESPONSE:", responseData);

  if (!responseData) return [];

  if (Array.isArray(responseData)) return responseData;

  if (Array.isArray(responseData?.data)) return responseData.data;

  if (Array.isArray(responseData?.clinics)) return responseData.clinics;

  if (Array.isArray(responseData?.data?.clinics)) {
    return responseData.data.clinics;
  }

  if (Array.isArray(responseData?.result)) return responseData.result;

  if (Array.isArray(responseData?.data?.result)) {
    return responseData.data.result;
  }

  if (responseData?.id || responseData?.clinicId) {
    return [responseData];
  }

  if (responseData?.data?.id || responseData?.data?.clinicId) {
    return [responseData.data];
  }

  return [];
};

export const useClinicStore = create((set, get) => ({
  clinics: [],
  selectedClinic: getStoredSelectedClinic(),

  isLoadingClinics: false,
  isCreatingClinic: false,
  isUpdatingClinic: false,
fetchMyClinics: async () => {
  set({ isLoadingClinics: true });

  try {
    const profileRes = await api.get("/account/profile");
    const profile = profileRes.data?.data ?? profileRes.data;

    console.log("PROFILE FOR CLINIC FILTER:", profile);

    const fullClinicsRes = await api.get("/clinic/getallclinicsfull");
    const allClinics = normalizeClinics(fullClinicsRes.data);

    console.log("RAW FULL CLINICS RESPONSE:", allClinics);

    const ownerId = profile?.id || profile?.userId;

    const getClinicId = (clinic) => clinic?.id || clinic?.clinicId;

    const getClinicOwnerId = (clinic) => {
      return (
        clinic?.ownerId ||
        clinic?.clinicOwnerId ||
        clinic?.userId ||
        clinic?.createdBy ||
        clinic?.owner?.id ||
        clinic?.owner?.userId
      );
    };

    const resolveApprovalStatus = (detailedClinic) => {
      const approvalValue =
        detailedClinic?.isApproved ??
        detailedClinic?.approvalStatus ??
        detailedClinic?.approved ??
        detailedClinic?.requestStatus ??
        detailedClinic?.clinicStatus;

      if (approvalValue === true) return "Approved";
      if (approvalValue === false) return "Pending";

      const normalized = String(approvalValue ?? "")
        .trim()
        .toLowerCase()
        .replaceAll("_", " ")
        .replaceAll("-", " ");

      if (["approved", "active", "accepted"].includes(normalized)) {
        return "Approved";
      }

      if (["rejected", "declined", "denied"].includes(normalized)) {
        return "Rejected";
      }

      return "Pending";
    };

    const possibleMyClinics = allClinics.filter((clinic) => {
      const clinicOwnerId = getClinicOwnerId(clinic);

      if (!ownerId) return true;
      if (!clinicOwnerId) return true;

      return clinicOwnerId === ownerId;
    });

    const clinicsWithIds = possibleMyClinics.filter((clinic) =>
      Boolean(getClinicId(clinic))
    );

    const detailedResults = await Promise.allSettled(
      clinicsWithIds.map((clinic) =>
        api.get(`/clinic/getclinic/${getClinicId(clinic)}`)
      )
    );

    const detailedClinicMap = {};

    detailedResults.forEach((result, index) => {
      const originalClinic = clinicsWithIds[index];
      const clinicId = getClinicId(originalClinic);

      if (result.status === "fulfilled") {
        const detailedClinic = result.value.data?.data ?? result.value.data;

        console.log("GET CLINIC DETAILS RESPONSE:", clinicId, detailedClinic);

        detailedClinicMap[clinicId] = detailedClinic;
      } else {
        console.log(
          "GET CLINIC DETAILS ERROR:",
          clinicId,
          result.reason?.response?.data || result.reason?.message
        );
      }
    });

    const myClinics = possibleMyClinics.map((clinic) => {
      const clinicId = getClinicId(clinic);
      const detailedClinic = detailedClinicMap[clinicId];

      const mergedClinic = {
        ...clinic,
        ...detailedClinic,
        id: clinicId,
      };

      return {
        ...mergedClinic,

        // Important:
        // This approvalStatus comes ONLY from /clinic/getclinic/{clinicId}
        // Do not trust numeric status from getallclinicsfull.
        approvalStatus: resolveApprovalStatus(detailedClinic),
      };
    });

    console.log("FILTERED MY CLINICS WITH REAL APPROVAL:", myClinics);

    set((state) => {
      const selectedClinicId =
        state.selectedClinic?.id || state.selectedClinic?.clinicId;

      const updatedSelectedClinic = selectedClinicId
        ? myClinics.find((clinic) => {
            const clinicId = clinic.id || clinic.clinicId;
            return clinicId === selectedClinicId;
          }) || state.selectedClinic
        : state.selectedClinic;

      if (updatedSelectedClinic) {
        localStorage.setItem(
          "petzy_selected_clinic",
          JSON.stringify(updatedSelectedClinic)
        );
      }

      return {
        clinics: myClinics,
        selectedClinic: updatedSelectedClinic,
      };
    });

    return myClinics;
  } catch (error) {
    console.log(
      "FETCH MY CLINICS ERROR:",
      error.response?.data || error.message
    );

    set({ clinics: [] });

    return [];
  } finally {
    set({ isLoadingClinics: false });
  }
},

createClinic: async (payload) => {
  set({ isCreatingClinic: true });

  try {
    const isFormData = payload instanceof FormData;

    let createdClinic;

    if (isFormData) {
      const baseUrl = api.defaults.baseURL || "";
      const token = localStorage.getItem("petzy_access_token");

      const response = await fetch(`${baseUrl}/clinic/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      });

      const contentType = response.headers.get("content-type") || "";

      const responseBody = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        console.log("CREATE CLINIC REQUEST STATUS:", response.status);
        console.log("CREATE CLINIC REQUEST DATA:", responseBody);

        throw {
          response: {
            status: response.status,
            data: responseBody,
          },
        };
      }

      createdClinic = responseBody?.data ?? responseBody;
    } else {
      const res = await api.post("/clinic/create", payload);
      createdClinic = res.data?.data ?? res.data;
    }

    toast.success("Clinic created successfully.");

    await get().fetchMyClinics();

    return createdClinic || true;
  } catch (error) {
    console.log(
      "CREATE CLINIC REQUEST ERROR:",
      error.response?.data || error.message || error
    );

    toast.error(getErrorMessage(error, "Failed to create clinic"));
    return null;
  } finally {
    set({ isCreatingClinic: false });
  }
},

  selectClinic: (clinic) => {
    localStorage.setItem("petzy_selected_clinic", JSON.stringify(clinic));
    set({ selectedClinic: clinic });
  },
updateClinic: async (clinicId, payload) => {
  set({ isUpdatingClinic: true });

  try {
    const isFormData = payload instanceof FormData;

    let updatedClinic;

    if (isFormData) {
      const baseUrl = api.defaults.baseURL || "";
      const token = localStorage.getItem("petzy_access_token");

      const response = await fetch(`${baseUrl}/clinic/update/${clinicId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          // Do not set Content-Type for FormData.
          // Browser adds multipart/form-data boundary automatically.
        },
        body: payload,
      });

      const contentType = response.headers.get("content-type") || "";

      const responseBody = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        throw {
          response: {
            status: response.status,
            data: responseBody,
          },
        };
      }

      updatedClinic = responseBody?.data ?? responseBody;
    } else {
      const res = await api.put(`/clinic/update/${clinicId}`, payload);
      updatedClinic = res.data?.data ?? res.data;
    }

    toast.success("Clinic updated successfully.");

    set((state) => {
      const updatedClinics = state.clinics.map((clinic) => {
        const currentClinicId = clinic.id || clinic.clinicId;

        if (currentClinicId === clinicId) {
          return {
            ...clinic,
            ...(typeof updatedClinic === "object" ? updatedClinic : {}),
          };
        }

        return clinic;
      });

      const selectedClinicId =
        state.selectedClinic?.id || state.selectedClinic?.clinicId;

      const shouldUpdateSelectedClinic = selectedClinicId === clinicId;

      const nextSelectedClinic = shouldUpdateSelectedClinic
        ? {
            ...state.selectedClinic,
            ...(typeof updatedClinic === "object" ? updatedClinic : {}),
          }
        : state.selectedClinic;

      if (shouldUpdateSelectedClinic) {
        localStorage.setItem(
          "petzy_selected_clinic",
          JSON.stringify(nextSelectedClinic)
        );
      }

      return {
        clinics: updatedClinics,
        selectedClinic: nextSelectedClinic,
      };
    });

    await get().fetchMyClinics();

    return true;
  } catch (error) {
    console.log("UPDATE CLINIC ERROR:", error.response?.data || error.message);
    toast.error(getErrorMessage(error, "Failed to update clinic"));
    return false;
  } finally {
    set({ isUpdatingClinic: false });
  }
},
  deleteClinic: async (clinicId) => {
  try {
    await api.delete(`/clinic/delete/${clinicId}`);

    localStorage.removeItem("petzy_selected_clinic");

    set((state) => ({
      clinics: state.clinics.filter(
        (clinic) => clinic.id !== clinicId && clinic.clinicId !== clinicId
      ),
      selectedClinic: null,
    }));

    toast.success("Clinic deleted successfully.");
    return true;
  } catch (error) {
    console.log("DELETE CLINIC ERROR:", error.response?.data || error.message);
    toast.error(getErrorMessage(error, "Failed to delete clinic"));
    return false;
  }
},
  clearSelectedClinic: () => {
    localStorage.removeItem("petzy_selected_clinic");
    set({ selectedClinic: null });
  },
}));