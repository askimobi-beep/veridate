import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext"; // 👈 make sure path is right
import { useNavigate } from "react-router-dom";

import AppInput from "@/components/form/AppInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const { user, login, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // if already authed, bounce to dashboard
  useEffect(() => {
    if (!authLoading && user) navigate("/dashboard", { replace: true });
  }, [authLoading, user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      // optional: persist a hint for your API layer/cookies
      if (remember) localStorage.setItem("remember", "1");
      else localStorage.removeItem("remember");

      await login({ email, password });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      // try to surface API message if present
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Login failed. Check your creds and try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // while context is resolving session on initial load
  if (authLoading) return null; // or a spinner component

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white via-[#f7f9fc] to-[#eef3ff] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Glow Layers */}
      <div className="pointer-events-none absolute -top-40 left-1/3 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.12),transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 right-[-10%] h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(167,139,250,0.12),transparent_70%)] blur-3xl" />

      {/* Wrapper */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 bg-white/60 backdrop-blur-xl shadow-xl border border-white/20 rounded-2xl overflow-hidden"
      >
        {/* Left Side */}
        <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-purple-500/20 via-indigo-500/10 to-transparent p-6">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-extrabold text-purple-700 drop-shadow-md">
              Welcome Back 👋
            </h2>
            <p className="text-lg text-gray-700 max-w-xs">
              Log in to access your dashboard, manage your projects, and stay
              productive.
            </p>
            <div className="w-40 h-40 rounded-full bg-gradient-radial from-purple-400/30 to-transparent blur-2xl mx-auto" />
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-8">
          <div className="flex justify-center mb-6 md:hidden">
            <img src="" alt="Logo" className="h-14 w-auto" />
          </div>

          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
            Login to Your Account
          </h2>
          {error ? (
            <p className="text-center text-sm text-red-600 mb-4">{error}</p>
          ) : (
            <p className="text-center text-sm text-gray-500 mb-4">
              Use your email and password to sign in.
            </p>
          )}

          {/* Fake Social Login */}
          <div className="space-y-3">
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-100 transition"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/2048px-Google_%22G%22_logo.svg.png"
                alt="Google"
                className="h-5 w-5"
              />
              Continue with Google
            </button>

            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 bg-[#3b5998] text-white py-2 rounded-md hover:bg-[#314e89] transition"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/2023_Facebook_icon.svg/2048px-2023_Facebook_icon.svg.png"
                alt="Facebook"
                className="h-5 w-5"
              />
              Continue with Facebook
            </button>
          </div>

          {/* Divider */}
          <div className="my-6 flex items-center gap-2">
            <div className="h-px bg-gray-300 flex-1" />
            <span className="text-gray-500 text-sm">or</span>
            <div className="h-px bg-gray-300 flex-1" />
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <AppInput
              icon={Mail}
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <AppInput
              icon={Lock}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between text-sm text-gray-600">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={() => setRemember(!remember)}
                  className="accent-purple-600"
                />
                Remember me
              </label>
              <a href="#" className="text-purple-600 hover:underline">
                Forgot Password?
              </a>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              aria-busy={submitting ? "true" : "false"}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-70 text-white font-semibold"
            >
              {submitting ? "Signing in…" : "Login"}
            </Button>
            <div className="mt-6 text-sm text-center text-gray-600">
              Don’t have an account?{" "}
              <span
                onClick={() => navigate("/register-user")}
                className="text-purple-600 font-medium hover:underline cursor-pointer"
              >
                Register
              </span>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
