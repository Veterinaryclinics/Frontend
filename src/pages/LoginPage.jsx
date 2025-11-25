import React from "react";
import pawIcon from "../assets/paw_icon.png";

const LoginPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="bg-base-100 shadow-xl rounded-2xl p-8 w-full max-w-md border border-base-300">
        
        {/* Logo + App Title */}
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
          <p className="text-sm text-base-content/70">
            Veterinary practice management system
          </p>
        </div>

        {/* Welcome Text */}
        <h2 className="text-lg font-medium text-base-content mb-4">
          Welcome Back
        </h2>
        <p className="text-sm text-base-content/70 mb-6">
          Sign in to access your clinic dashboard
        </p>

        {/* Login Form */}
        <form className="text-left">

          <label className="block mb-2 text-sm text-base-content">
            Email Address
          </label>
          <input
            type="email"
            placeholder="dr.smith@petclinic.com"
            className="input input-bordered w-full mb-4"
          />

          <label className="block mb-2 text-sm text-base-content">
            Password
          </label>
          <input
            type="password"
            placeholder="Enter your password"
            className="input input-bordered w-full mb-2"
          />

          <div className="flex justify-between items-center mb-6">
            <a href="#" className="text-sm text-primary hover:underline">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
          >
            Sign In
          </button>
        </form>

        {/* Footer */}
        <p className="text-xs text-base-content/50 mt-8 text-center">
          © 2025 Petzy Dashboard. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
