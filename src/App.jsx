import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminClinicsPage from "./pages/AdminClinicsPage";
import DashboardPage from "./pages/DashboardPage";
import BookingsPage from "./pages/BookingsPage";
import VideoCallsPage from "./pages/VideoCallsPage";
import VideoCallRoomPage from "./pages/VideoCallRoomPage";
import MessagesPage from "./pages/MessagesPage";
import ClientsPage from "./pages/ClientsPage";
import SettingsPage from "./pages/SettingsPage";
import ConfirmEmailPage from "./pages/ConfirmEmailPage";
import ClinicSelectionPage from "./pages/ClinicSelectionPage";

import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const { theme } = useThemeStore();
  const location = useLocation();

  const isAdminSession =
    localStorage.getItem("petzy_admin_session") === "true" &&
    Boolean(localStorage.getItem("petzy_access_token"));

  const isAdminRoute = location.pathname.startsWith("/admin");

  useEffect(() => {
    if (!isAdminSession) {
      checkAuth();
    }
  }, [checkAuth, isAdminSession]);
const noLayoutRoutes = [
  "/login",
  "/signup",
  "/confirm-email",
  "/forgot-password",
  "/reset-password",
  "/clinics",
];

const isLayoutVisible =
  !noLayoutRoutes.includes(location.pathname) && !isAdminRoute;

  const LoadingScreen = () => (
    <div data-theme={theme} className="min-h-screen flex items-center justify-center bg-base-100">
      <span className="loading loading-spinner loading-lg text-primary" />
    </div>
  );

const ProtectedRoute = ({ children }) => {
  if (isAdminSession) {
    return <Navigate to="/admin/clinics" replace />;
  }

  if (isCheckingAuth) {
    return <LoadingScreen />;
  }

  if (!authUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  if (isAdminSession) {
    return <Navigate to="/admin/clinics" replace />;
  }

  if (isCheckingAuth) {
    return <LoadingScreen />;
  }

  if (authUser) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AdminProtectedRoute = ({ children }) => {
  if (!isAdminSession) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

const AdminPublicRoute = ({ children }) => {
  if (isAdminSession) {
    return <Navigate to="/admin/clinics" replace />;
  }

  return children;
};

  return (
    <div data-theme={theme} className="min-h-screen">
      <div
        className={`flex h-full bg-base-100 transition-colors ${
          isLayoutVisible ? "pl-72" : ""
        }`}
      >
        {isLayoutVisible && (
          <aside className="h-full">
            <Sidebar />
          </aside>
        )}

        <div className="flex flex-col flex-1 overflow-hidden">
          {isLayoutVisible && <Navbar />}

          <main
            className={`flex-1 overflow-y-auto ${
              isLayoutVisible ? "p-6 bg-base-100" : "p-0 bg-base-200"
            }`}
          >
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />

              <Route
                path="/signup"
                element={
                  <PublicRoute>
                    <SignupPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/admin/login"
                element={
                  <AdminPublicRoute>
                    <AdminLoginPage />
                  </AdminPublicRoute>
                }
              />

              <Route
                path="/admin/clinics"
                element={
                  <AdminProtectedRoute>
                    <AdminClinicsPage />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <PublicRoute>
                    <ForgotPasswordPage />
                  </PublicRoute>
                }
              />
              <Route path="/confirm-email" element={<ConfirmEmailPage />} />
              <Route
                path="/reset-password"
                element={
                  <PublicRoute>
                    <ResetPasswordPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/clinics"
                element={
                  <ProtectedRoute>
                    <ClinicSelectionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/bookings"
                element={
                  <ProtectedRoute>
                    <BookingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/video-calls"
                element={
                  <ProtectedRoute>
                    <VideoCallsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/video-calls/:appointmentId"
                element={
                  <ProtectedRoute>
                    <VideoCallRoomPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/messages"
                element={
                  <ProtectedRoute>
                    <MessagesPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/clients"
                element={
                  <ProtectedRoute>
                    <ClientsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>

        <Toaster position="top-right" />
      </div>
    </div>
  );
};

export default App;