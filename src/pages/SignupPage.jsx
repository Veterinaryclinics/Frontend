import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import pawIcon from "../assets/paw_icon.png";
import { useAuthStore } from "../store/useAuthStore";

const SignupPage = () => {
  const navigate = useNavigate();

  const { signup, isSigningUp } = useAuthStore();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const success = await signup(formData);

    if (success) {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-4 py-8">
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
            Create Clinic Account
          </h1>

          <p className="text-sm text-base-content/70 text-center">
            Register your clinic owner dashboard account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block mb-2 text-sm text-base-content">
                First Name
              </label>

              <input
                type="text"
                name="firstName"
                placeholder="John"
                className="input input-bordered w-full mb-4"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-sm text-base-content">
                Last Name
              </label>

              <input
                type="text"
                name="lastName"
                placeholder="Smith"
                className="input input-bordered w-full mb-4"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <label className="block mb-2 text-sm text-base-content">
            Phone Number
          </label>

          <input
            type="tel"
            name="phoneNumber"
            placeholder="01018842808"
            className="input input-bordered w-full mb-4"
            value={formData.phoneNumber}
            onChange={handleChange}
            required
          />

          <label className="block mb-2 text-sm text-base-content">
            Email Address
          </label>

          <input
            type="email"
            name="email"
            placeholder="clinic@example.com"
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
            placeholder="Create a password"
            className="input input-bordered w-full mb-4"
            value={formData.password}
            onChange={handleChange}
            minLength={8}
            required
          />

          <label className="block mb-2 text-sm text-base-content">
            Confirm Password
          </label>

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm your password"
            className="input input-bordered w-full "
            value={formData.confirmPassword}
            onChange={handleChange}
            minLength={8}
            required
          />
          <div className="h-4" />
          <button type="submit" className="btn btn-primary w-full" disabled={isSigningUp}>
            {isSigningUp ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-sm text-base-content/70 mt-6 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>

        <p className="text-xs text-base-content/50 mt-8 text-center">
          © 2025 Petzy Dashboard. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default SignupPage;