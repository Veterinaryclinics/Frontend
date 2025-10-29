  import React from "react";  
  import pawIcon from "../assets/paw_icon.png"; 

  const LoginPage = () => {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-300">
        <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl p-8 w-full max-w-md text-center border border-gray-200">
          <div className="flex flex-col items-center mb-6">
            <div className="rounded-2xl p-3 mb-2 flex items-center justify-center">
              <img
                src={pawIcon}
                alt="Petzy logo"
                className="h-10 w-10 object-contain"
              />
            </div>
            <h1 className="text-xl font-semibold text-gray-800">
              Petzy Dashboard
            </h1>
            <p className="text-sm text-gray-500">
              Veterinary practice management system
            </p>
          </div>

          <h2 className="text-lg font-medium text-gray-700 mb-4">Welcome Back</h2>
          <p className="text-sm text-gray-500 mb-6">
            Sign in to access your clinic dashboard
          </p>

          <form className="text-left">
            <label className="block mb-2 text-sm text-gray-700">Email Address</label>
            <input
              type="email"
              placeholder="dr.smith@petclinic.com"
              className="w-full px-4 py-2 mb-4 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
            />

            <label className="block mb-2 text-sm text-gray-700">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full px-4 py-2 mb-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
            />

            <div className="flex justify-between items-center mb-6">
              <a href="#" className="text-sm text-indigo-500 hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="w-full bg-gray-900 text-white py-2 rounded-md hover:bg-gray-800 transition"
            >
              Sign In
            </button>
          </form>

          <p className="text-xs text-gray-400 mt-8">
            © 2025 Petzy Dashboard. All rights reserved.
          </p>
        </div>
      </div>
    );
  };

  export default LoginPage;
