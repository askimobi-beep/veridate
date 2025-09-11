import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import AppInput from "@/components/form/AppInput";
import { Button } from "@/components/ui/button";
import { Mail, Lock } from "lucide-react";
import { motion } from "framer-motion";
import GoogleSignIn from "@/components/auth/GoogleSignIn";
import FacebookSignIn from "@/components/auth/FacebookSignIn";
import logo from "@/assets/logo/logo.png";

export default function LoginPage() {
  const { user, login, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // console.log("Location state 👉", location.state);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // If user was redirected here by PrivateRoute, this holds their original URL
  const fromLocation = location.state?.from;
  const fromPath =
    (fromLocation?.pathname || "") +
    (fromLocation?.search || "") +
    (fromLocation?.hash || "");

  useEffect(() => {
    if (!authLoading && user) {
      // If there was a saved destination, go back there
      if (fromPath) {
        navigate(fromPath, { replace: true });
        return;
      }
      // Otherwise, role-based default
      const role = String(user.role || "")
        .toLowerCase()
        .trim();
      if (role === "admin") navigate("/admin", { replace: true });
      else navigate("/dashboard", { replace: true });
    }
  }, [authLoading, user, fromPath, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (remember) localStorage.setItem("remember", "1");
      else localStorage.removeItem("remember");

      await login({ email, password });
      // no navigate here — useEffect handles redirect correctly
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Login failed. Check your creds and try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 relative overflow-hidden">
      {/* Glow Layers */}

      {/* Card: Only Right Side */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 w-full max-w-md bg-white/60 backdrop-blur-xl shadow-xl border border-white/20 rounded-2xl overflow-hidden"
      >
        <div className="p-8 flex flex-col items-center">
          
          <div className="flex justify-center mb-6">
          <img src={logo} alt="Logo" className="h-14 w-auto" />
          </div>

          {/* <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
            Login to Your Account
          </h2> */}

          {/* Only show error if exists */}
          {error ? (
            <p className="text-center text-sm text-red-600 mb-4">{error}</p>
          ) : null}

          {/* Email/Password Form */}
          <form
            onSubmit={handleLogin}
            className="w-full max-w-[400px] space-y-4"
          >
            {/* Email field */}
            <div className="flex flex-col space-y-1">
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-700 flex items-center gap-2"
              >
                <Mail className="w-4 h-4 text-orange-600" />
                Email
              </label>
              <AppInput
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {/* Password field */}
            <div className="flex flex-col space-y-1">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700 flex items-center gap-2"
              >
                <Lock className="w-4 h-4 text-orange-600" />
                Password
              </label>
              <AppInput
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={() => setRemember(!remember)}
                  className="accent-orange-600"
                />
                Remember me
              </label>
              <a href="#" className="text-orange-600 hover:underline">
                Forgot Password?
              </a>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={submitting}
              aria-busy={submitting ? "true" : "false"}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-70 text-white font-semibold"
            >
              {submitting ? "Signing in…" : "Login"}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 w-full max-w-[400px] flex items-center gap-2">
            <div className="h-px bg-gray-300 flex-1" />
            <span className="text-gray-500 text-sm">or</span>
            <div className="h-px bg-gray-300 flex-1" />
          </div>

          {/* Social Login */}
          <div className="w-full flex justify-center">
            <div className="w-full max-w-[400px]">
              <GoogleSignIn onError={setError} />
            </div>
          </div>

          {/* Register CTA */}
          <div className="mt-6 text-center text-sm text-gray-600">
            Don’t have an account?{" "}
            <Link
              to="/register-user"
              className="text-orange-600 font-medium hover:underline"
            >
              Register
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
