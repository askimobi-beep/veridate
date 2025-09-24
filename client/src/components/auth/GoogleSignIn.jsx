import { GoogleLogin } from "@react-oauth/google";
import { useRef, useLayoutEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function GoogleSignIn({ onError }) {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();

  const wrapRef = useRef(null);
  const [w, setW] = useState(0);

  useLayoutEffect(() => {
    const update = () => setW(wrapRef.current?.offsetWidth || 0);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div ref={wrapRef} className="w-full">
      <GoogleLogin
        ux_mode="popup"
        theme="filled_blue"
        text="continue_with"
        shape="rectangular"
        size="large"
        width={w || undefined} // when 0 on first render, let Google choose; updates right after
        onSuccess={async (resp) => {
          try {
            const token = resp?.credential;
            if (!token) throw new Error("No Google credential");

            const r = await googleLogin(token);
            const u = r?.data?.user;

            // ✅ always redirect to dashboard on success
            navigate("/dashboard", { replace: true });
          } catch (e) {
            onError?.(
              e?.response?.data?.message ||
                e?.message ||
                "Google sign-in failed"
            );
          }
        }}
        onError={() => onError?.("Google sign-in failed")}
      />
    </div>
  );
}
