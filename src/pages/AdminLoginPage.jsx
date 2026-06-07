import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import pawIcon from "../assets/paw_icon.png";
import api from "../lib/axios";

const AdminLoginPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      const res = await api.post("/account/login", formData);

      const data = res.data?.data ?? res.data;

      const token =
        data?.accessToken ||
        data?.token ||
        data?.jwtToken ||
        data?.access_token;

      if (!token) {
        toast.error("Login succeeded, but no token was returned.");
        return;
      }

      localStorage.setItem("petzy_access_token", token);
      localStorage.setItem("petzy_admin_session", "true");

      toast.success("Admin logged in successfully.");
      navigate("/admin/clinics", { replace: true });
    } catch (error) {
      console.log("ADMIN LOGIN ERROR:", error.response?.data || error.message);
      toast.error("Invalid admin credentials.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-4">
      <div className="bg-base-100 shadow-xl rounded-2xl p-8 w-full max-w-md border border-base-300">
        <div className="flex flex-col items-center mb-6">
          <div className="rounded-2xl p-3 mb-2 flex items-center justify-center bg-primary/10">
            <img src={pawIcon} alt="Petzy logo" className="h-10 w-10 object-contain" />
          </div>

          <h1 className="text-xl font-semibold text-base-content">
            Admin Login
          </h1>

          <p className="text-sm text-base-content/60 text-center mt-1">
            Sign in to review clinic approval requests.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="block mb-2 text-sm text-base-content">
            Email
          </label>

          <input
            type="email"
            name="email"
            className="input input-bordered w-full mb-4"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label className="block mb-2 text-sm text-base-content">
            Password
          </label>

          <input
            type="password"
            name="password"
            className="input input-bordered w-full mb-6"
            value={formData.password}
            onChange={handleChange}
            required
          />
            <div className="h-4" />
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isLoggingIn}
          >
            {isLoggingIn ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;