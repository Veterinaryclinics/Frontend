import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import pawIcon from "../assets/paw_icon.png";
import { useAuthStore } from "../store/useAuthStore";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { resetPassword, isResettingPassword } = useAuthStore();

  const emailFromUrl = useMemo(() => {
    return searchParams.get("email") || searchParams.get("Email") || "";
  }, [searchParams]);

  const tokenFromUrl = useMemo(() => {
    const token = searchParams.get("token") || searchParams.get("Token") || "";

    return token.replaceAll(" ", "+");
  }, [searchParams]);

  const [formData, setFormData] = useState({
    email: emailFromUrl,
    token: tokenFromUrl,
    newPassword: "",
    confirmNewPassword: "",
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

    if (!formData.email || !formData.token) {
      toast.error("Reset link is missing email or token");
      return;
    }

    if (formData.newPassword !== formData.confirmNewPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const success = await resetPassword(formData);

    if (success) {
      navigate("/login");
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
            Reset Password
          </h1>

          <p className="text-sm text-base-content/70 text-center">
            Enter your new password to regain access
          </p>
        </div>

        <form onSubmit={handleSubmit} className="text-left">
          {!emailFromUrl && (
            <>
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
            </>
          )}

          <label className="block mb-2 text-sm text-base-content">
            New Password
          </label>

          <input
            type="password"
            name="newPassword"
            placeholder="Enter new password"
            className="input input-bordered w-full mb-4"
            value={formData.newPassword}
            onChange={handleChange}
            minLength={8}
            required
          />

          <label className="block mb-2 text-sm text-base-content">
            Confirm New Password
          </label>

          <input
            type="password"
            name="confirmNewPassword"
            placeholder="Confirm new password"
            className="input input-bordered w-full mb-6"
            value={formData.confirmNewPassword}
            onChange={handleChange}
            minLength={8}
            required
          />

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isResettingPassword}
          >
            {isResettingPassword ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <p className="text-sm text-base-content/70 mt-6 text-center">
          Back to{" "}
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

export default ResetPasswordPage;