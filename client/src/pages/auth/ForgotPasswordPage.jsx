import { useState } from "react";
import AppInput from "@/components/form/AppInput";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { motion } from "framer-motion";
import logo from "@/assets/logo/logo.png";
import axiosInstance from "@/utils/axiosInstance";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      const res = await axiosInstance.post("/auth/forgot-password", {
        email,
      });

      // Always returns 200 with generic msg per backend
      if (res.status !== 200) {
        throw new Error(res?.data?.message || "Failed to request reset.");
      }

      setMessage("If that email exists, we’ve sent a reset link.");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Something went wrong.");
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

          <h1 className="text-xl font-semibold text-gray-800 mb-2">
            Forgot your password?
          </h1>
          <p className="text-sm text-gray-600 mb-6 text-center">
            Enter your email and we’ll send you a link to reset it.
          </p>

          {message ? (
            <p className="text-center text-sm text-green-600 mb-4">{message}</p>
          ) : null}
          {error ? (
            <p className="text-center text-sm text-red-600 mb-4">{error}</p>
          ) : null}

          <form onSubmit={handleSubmit} className="w-full max-w-[400px] space-y-4">
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail className="w-4 h-4 text-[color:var(--brand-orange)]" />
                Email
              </label>
              <AppInput
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              aria-busy={submitting ? "true" : "false"}
              className="w-full bg-[color:var(--brand-orange)] hover:bg-[color:var(--brand-orange)] disabled:opacity-70 text-white font-semibold"
            >
              {submitting ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
