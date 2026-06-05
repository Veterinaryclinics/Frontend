import { create } from "zustand";
import api from "../lib/axios";
import toast from "react-hot-toast";

const CLINIC_OWNER_USER_TYPE_ID = 5;

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

const extractAuthPayload = (responseData) => {
  const payload = responseData?.data ?? responseData ?? {};

  return {
    accessToken:
      payload.accessToken ||
      payload.token ||
      payload.jwtToken ||
      payload.jwt ||
      payload?.tokens?.accessToken ||
      null,

    refreshToken:
      payload.refreshToken ||
      payload?.tokens?.refreshToken ||
      null,

    user:
      payload.user ||
      payload.account ||
      payload.clinicOwner ||
      null,
  };
};

const saveAuthData = ({ accessToken, refreshToken, user }, fallbackUser) => {
  if (accessToken) {
    localStorage.setItem("petzy_access_token", accessToken);
  }

  if (refreshToken) {
    localStorage.setItem("petzy_refresh_token", refreshToken);
  }

  const authUser = user || fallbackUser;

  if (authUser) {
    localStorage.setItem("petzy_auth_user", JSON.stringify(authUser));
  }

  return authUser;
};

const clearAuthData = () => {
  localStorage.removeItem("petzy_access_token");
  localStorage.removeItem("petzy_refresh_token");
  localStorage.removeItem("petzy_auth_user");
  localStorage.removeItem("petzy_selected_clinic");
};

export const useAuthStore = create((set) => ({
  authUser: null,

  isCheckingAuth: true,
  isLoggingIn: false,
  isSigningUp: false,
  isLoggingOut: false,
  isSendingForgotPassword: false,
  isResettingPassword: false,
  isConfirmingEmail: false,
  checkAuth: async () => {
    try {
      const token = localStorage.getItem("petzy_access_token");
      const storedUser = localStorage.getItem("petzy_auth_user");

      if (token && storedUser) {
        set({
          authUser: JSON.parse(storedUser),
          isCheckingAuth: false,
        });
        return;
      }

      if (token) {
        set({
          authUser: { isAuthenticated: true },
          isCheckingAuth: false,
        });
        return;
      }

      set({
        authUser: null,
        isCheckingAuth: false,
      });
    } catch (error) {
      clearAuthData();
      set({
        authUser: null,
        isCheckingAuth: false,
      });
    }
  },

  signup: async (formData) => {
    set({ isSigningUp: true });

    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        userType: CLINIC_OWNER_USER_TYPE_ID,
      };

      await api.post("/account/register", payload);

      toast.success("Account created. Please check your email to confirm it.");
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, "Signup failed"));
      return false;
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (credentials) => {
    set({ isLoggingIn: true });

    try {
      const res = await api.post("/account/login", {
        email: credentials.email,
        password: credentials.password,
      });

      const authPayload = extractAuthPayload(res.data);

      const authUser = saveAuthData(authPayload, {
        email: credentials.email,
      });

      set({ authUser });

      toast.success("Welcome back 👋");
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, "Invalid email or password"));
      return false;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  forgotPassword: async (email) => {
    set({ isSendingForgotPassword: true });

    try {
      await api.post("/account/forgot-password", { email });

      toast.success("Password reset email sent.");
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to send reset email"));
      return false;
    } finally {
      set({ isSendingForgotPassword: false });
    }
  },

  resetPassword: async ({ email, token, newPassword, confirmNewPassword }) => {
    set({ isResettingPassword: true });

    try {
      await api.post("/account/reset-password", {
        email,
        token,
        newPassword,
        confirmNewPassword,
      });

      toast.success("Password reset successfully. You can now sign in.");
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to reset password"));
      return false;
    } finally {
      set({ isResettingPassword: false });
    }
  },
confirmEmail: async ({ userId, token }) => {
  set({ isConfirmingEmail: true });

  try {
      const res = await api.post(
      "/account/confirm-email",
      { token },
      {
        params: { userId },
      }
    );
    toast.success("Email confirmed successfully.");
    return true;
  } catch (error) {
    toast.error(getErrorMessage(error, "Failed to confirm email"));
    return false;
  } finally {
    set({ isConfirmingEmail: false });
  }
},
  logout: () => {
    set({ isLoggingOut: true });

    clearAuthData();

    set({
      authUser: null,
      isLoggingOut: false,
    });

    toast.success("Logged out successfully");
  },
}));