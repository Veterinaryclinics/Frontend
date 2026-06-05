import React, { useState } from "react";
import { Link } from "react-router-dom";
import pawIcon from "../assets/paw_icon.png";
import { useAuthStore } from "../store/useAuthStore";

const ForgotPasswordPage = () => {
  const { forgotPassword, isSendingForgotPassword } = useAuthStore();

  const [email, setEmail] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const success = await forgotPassword(email);

    if (success) {
      setIsEmailSent(true);
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
            Forgot Password
          </h1>

          <p className="text-sm text-base-content/70 text-center">
            Enter your email and we’ll send you a reset link
          </p>
        </div>

        {isEmailSent ? (
          <div className="text-center">
            <div className="bg-success/10 text-success rounded-xl p-4 text-sm mb-6">
              If this email exists, a password reset link has been sent.
            </div>

            <Link to="/login" className="btn btn-primary w-full">
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="text-left">
            <label className="block mb-2 text-sm text-base-content">
              Email Address
            </label>

            <input
              type="email"
              placeholder="clinic@example.com"
              className="input input-bordered w-full mb-6"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isSendingForgotPassword}
            >
              {isSendingForgotPassword ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <p className="text-sm text-base-content/70 mt-6 text-center">
          Remembered your password?{" "}
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

export default ForgotPasswordPage;