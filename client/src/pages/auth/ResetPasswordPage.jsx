import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import AppInput from "@/components/form/AppInput";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { motion } from "framer-motion";
import logo from "@/assets/logo/logo.png";
import axiosInstance from "@/utils/axiosInstance";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = useMemo(() => params.get("token") || "", [params]);
  const email = useMemo(() => params.get("email") || "", [params]);

  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function verify() {
      setChecking(true);
      setError("");
      try {
        const res = await axiosInstance.get("/auth/reset-password/verify", {
          params: { token, email },
        });
        if (!ignore) setValid(!!res?.data?.valid);
      } catch (e) {
        if (!ignore) setValid(false);
      } finally {
        if (!ignore) setChecking(false);
      }
    }

    if (token && email) {
      verify();
    } else {
      setValid(false);
      setChecking(false);
    }

    return () => { ignore = true; };
  }, [token, email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await axiosInstance.post("/auth/reset-password", {
        token,
        email,
        password,
      });
      setMessage("Password reset successful. You can now sign in.");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white/60 backdrop-blur-xl shadow-xl border border-white/20 rounded-2xl overflow-hidden"
      >
        <div className="p-8 flex flex-col items-center">
          <div className="flex justify-center mb-10">
            <img src={logo} alt="Logo" className="h-14 w-auto" />
          </div>

          {checking ? (
            <p className="text-sm text-gray-600">Checking your link…</p>
          ) : valid ? (
            <>
              <h1 className="text-xl font-semibold text-gray-800 mb-2">
                Set a new password
              </h1>
              <p className="text-sm text-gray-600 mb-6 text-center">
                Choose a strong password you haven’t used before.
              </p>

              {message ? (
                <div className="w-full max-w-[400px]">
                  <p className="text-center text-sm text-green-600 mb-4">{message}</p>
                  <Link to="/" className="block text-center text-[color:var(--brand-orange)] hover:underline">
                    Go to login
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="w-full max-w-[400px] space-y-4">
                  <div className="flex flex-col space-y-1">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[color:var(--brand-orange)]" />
                      New Password
                    </label>
                    <AppInput
                      type="password"
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[color:var(--brand-orange)]" />
                      Confirm Password
                    </label>
                    <AppInput
                      type="password"
                      placeholder="Re-enter new password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                  </div>

                  {error ? (
                    <p className="text-center text-sm text-red-600">{error}</p>
                  ) : null}

                  <Button
                    type="submit"
                    disabled={submitting}
                    aria-busy={submitting ? "true" : "false"}
                    className="w-full bg-[color:var(--brand-orange)] hover:bg-[color:var(--brand-orange)] disabled:opacity-70 text-white font-semibold"
                  >
                    {submitting ? "Saving…" : "Reset Password"}
                  </Button>
                </form>
              )}
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-gray-800 mb-2">
                Link invalid or expired
              </h1>
              <p className="text-sm text-gray-600 mb-6 text-center">
                Please request a new reset link.
              </p>
              <Link to="/forgot-password" className="text-[color:var(--brand-orange)] hover:underline">
                Request a new link
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
