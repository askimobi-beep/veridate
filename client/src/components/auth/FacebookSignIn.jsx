// FacebookSignIn.jsx
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function FacebookSignIn({ onError }) {
  const { facebookLogin } = useAuth();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const normalizeVersion = (raw) => {
    const v = String(raw || "").trim();
    if (/^v?\d+\.\d+$/.test(v)) return v.startsWith("v") ? v : `v${v}`;
    return "v20.0";
  };

  useEffect(() => {
    // prevent double-loading
    if (window.FB && window.__FB_SDK_LOADED__) {
      setReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";

    script.onload = () => {
      // init exactly once
      if (!window.__FB_SDK_LOADED__) {
        window.FB.init({
          appId: import.meta.env.VITE_FB_APP_ID,
          cookie: true,
          xfbml: false,
          version: normalizeVersion(import.meta.env.VITE_FB_API_VERSION),
        });
        window.__FB_SDK_LOADED__ = true;
      }
      setReady(true);
    };

    script.onerror = () => onError?.("Failed to load Facebook SDK");
    document.body.appendChild(script);
  }, [onError]);

  const handleClick = () => {
    if (!window.FB) return onError?.("Facebook SDK not ready");

    window.FB.login(
      (response) => {
        if (!response?.authResponse) return onError?.("Facebook login canceled");
        (async () => {
          try {
            const { accessToken, userID } = response.authResponse;
            const res = await facebookLogin(accessToken, userID);
            const user = res?.data?.user;
            if (!user?.address || !user?.contact) {
              navigate("/auth/complete-profile");
            } else {
              navigate("/dashboard", { replace: true });
            }
          } catch (e) {
            onError?.(e?.response?.data?.message || e?.message || "Facebook login failed");
          }
        })();
      },
      { scope: "email,public_profile", return_scopes: true }
    );
  };

  return (
    <button
      type="button"
      disabled={!ready}
      onClick={handleClick}
      className="w-full flex items-center justify-center gap-2 bg-[#3b5998] text-white py-2 rounded-md hover:bg-[#314e89] transition disabled:opacity-60"
    >
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/2023_Facebook_icon.svg/2048px-2023_Facebook_icon.svg.png"
        alt="Facebook"
        className="h-5 w-5"
      />
      Continue with Facebook
    </button>
  );
}
