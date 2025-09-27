import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

export default function OAuthCallback() {
  const { checkAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    (async () => {
      try {
        await checkAuth(); // will pick up JWT cookie set by backend
        const params = new URLSearchParams(location.search);
        const next = params.get("next") || "/dashboard";
        navigate(next, { replace: true });
      } catch {
        navigate("/login?error=oauth_failed", { replace: true });
      }
    })();
  }, [checkAuth, navigate, location.search]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <p className="text-gray-600">Finishing sign-in…</p>
    </div>
  );
}
