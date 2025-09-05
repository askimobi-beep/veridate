import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function GoogleSignIn({ onError }) {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // tiny delay for skeleton effects if you want; safe to set to true immediately
    const t = setTimeout(() => setReady(true), 200);
    return () => clearTimeout(t);
  }, []);

  if (!ready) {
    return (
      <div className="w-full h-10 rounded-md bg-gray-200 animate-pulse" />
    );
  }

  return (
    <GoogleLogin
      ux_mode="popup" // keeps flow smooth in most setups
      onSuccess={async (credentialResponse) => {
        try {
          const token = credentialResponse?.credential;
          if (!token) throw new Error("No Google credential");
          const res = await googleLogin(token);
          const user = res?.data?.user;

          // Optional: smart redirect if profile incomplete
          if (!user?.cnic || !user?.address || !user?.contact) {
            navigate("/auth/complete-profile");
          } else {
            navigate("/dashboard", { replace: true });
          }
        } catch (err) {
          const msg =
            err?.response?.data?.message ||
            err?.message ||
            "Google sign-in failed";
          onError?.(msg);
        }
      }}
      onError={() => onError?.("Google sign-in failed")}
    />
  );
}
