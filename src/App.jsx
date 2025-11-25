import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Loader from "./components/Loader";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import BookingsPage from "./pages/BookingsPage";
import VideoCallsPage from "./pages/VideoCallsPage";
import MessagesPage from "./pages/MessagesPage";
import ClientsPage from "./pages/ClientsPage";
import SettingsPage from "./pages/SettingsPage";

import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const { theme } = useThemeStore();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Layout handling
  const noLayoutRoutes = ["/login"];
  const isLayoutVisible = !noLayoutRoutes.includes(location.pathname);

  // if (isCheckingAuth && !authUser)
  //   return (
  //     <div className="flex items-center justify-center h-screen">
  //       <Loader />
  //     </div>
  //   );

  return (
  <div data-theme={theme} className="min-h-screen">
    <div className="flex h-full bg-base-100 transition-colors">

      {isLayoutVisible && (
        <aside className="h-full">
          <Sidebar />
        </aside>
      )}

      <div className="flex flex-col flex-1 overflow-hidden">
        {isLayoutVisible && <Navbar />}

        <main
          className={`flex-1 overflow-y-auto ${
            isLayoutVisible ? "p-6 bg-base-100" : "p-0 bg-gray-300"
          }`}
        >
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/video-calls" element={<VideoCallsPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>

      <Toaster position="top-right" />
    </div>
  </div>
);


};

export default App;
