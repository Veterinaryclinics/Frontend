import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import pawIcon from "../assets/paw_icon.png";
import { useAuthStore } from "../store/useAuthStore";

const ConfirmEmailPage = () => {
  const [searchParams] = useSearchParams();
  const hasConfirmedRef = useRef(false);

  const { confirmEmail } = useAuthStore();

  const [status, setStatus] = useState("loading");

  const userId = useMemo(() => {
    return searchParams.get("userId") || searchParams.get("UserId") || "";
  }, [searchParams]);

  const token = useMemo(() => {
    const rawToken =
      searchParams.get("token") || searchParams.get("Token") || "";

    return rawToken.replaceAll(" ", "+");
  }, [searchParams]);

 useEffect(() => {
  const handleConfirmEmail = async () => {
    if (hasConfirmedRef.current) return;
    hasConfirmedRef.current = true;

    console.log("CONFIRM PAGE LOADED");
    console.log("FULL URL:", window.location.href);
    console.log("USER ID:", userId);
    console.log("TOKEN:", token);

    if (!userId || !token) {
      console.log("MISSING USER ID OR TOKEN");
      setStatus("error");
      return;
    }

    setStatus("loading");

    const success = await confirmEmail({
      userId,
      token,
    });

    console.log("CONFIRM EMAIL RESULT:", success);

    setStatus(success ? "success" : "error");
  };

  handleConfirmEmail();
}, [userId, token, confirmEmail]);

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
            Email Confirmation
          </h1>

          <p className="text-sm text-base-content/70 text-center">
            Confirming your clinic dashboard email
          </p>
        </div>

        {status === "loading" && (
          <div className="text-center">
            <span className="loading loading-spinner loading-lg text-primary mb-4" />

            <p className="text-sm text-base-content/70">
              Please wait while we confirm your email...
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center">
            <div className="bg-success/10 text-success rounded-xl p-4 text-sm mb-6">
              Your email has been confirmed successfully. You can now sign in.
            </div>

            <Link to="/login" className="btn btn-primary w-full">
              Go to Sign In
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="text-center">
            <div className="bg-error/10 text-error rounded-xl p-4 text-sm mb-6">
              Email confirmation failed. The link may be invalid, expired, or missing required data.
            </div>

            <Link to="/login" className="btn btn-primary w-full">
              Back to Sign In
            </Link>
          </div>
        )}

        <p className="text-xs text-base-content/50 mt-8 text-center">
          © 2025 Petzy Dashboard. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default ConfirmEmailPage;