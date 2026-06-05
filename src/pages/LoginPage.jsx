import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import pawIcon from "../assets/paw_icon.png";
import { useAuthStore } from "../store/useAuthStore";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { login, isLoggingIn } = useAuthStore();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const from = location.state?.from?.pathname || "/";

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const success = await login(formData);

    if (success) {
      navigate("/clinics", { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-4">
      <div className="bg-base-100 shadow-xl rounded-2xl p-8 w-full max-w-md border border-base-300">
        <div className="flex flex-col items-center mb-6">
          <div className="rounded-2xl p-3 mb-2 flex items-center justify-center bg-primary/10">
            <img
              src={pawIcon}
              alt="Petzy logo"
              className="h-10 w-10 object-contain"
            />
          </div>

          <h1 className="text-xl font-semibold text-base-content">
            Petzy Dashboard
          </h1>

          <p className="text-sm text-base-content/70 text-center">
            Veterinary practice management system
          </p>
        </div>

        <h2 className="text-lg font-medium text-base-content mb-4">
          Welcome Back
        </h2>

        <p className="text-sm text-base-content/70 mb-6">
          Sign in to access your clinic dashboard
        </p>

        <form onSubmit={handleSubmit} className="text-left">
          <label className="block mb-2 text-sm text-base-content">
            Email Address
          </label>

          <input
            type="email"
            name="email"
            placeholder="dr.smith@petclinic.com"
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
            placeholder="Enter your password"
            className="input input-bordered w-full mb-2"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <div className="flex justify-between items-center mb-6">
            <Link
              to="/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={isLoggingIn}>
            {isLoggingIn ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-sm text-base-content/70 mt-6 text-center">
          New clinic owner?{" "}
          <Link to="/signup" className="text-primary hover:underline font-medium">
            Create an account
          </Link>
        </p>

        <p className="text-xs text-base-content/50 mt-8 text-center">
          © 2025 Petzy Dashboard. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;