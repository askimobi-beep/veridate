"use client";

import { useState } from "react";
import AppInput from "@/components/form/AppInput";
import { Button } from "@/components/ui/button";
import { Mail, Lock, User, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import axiosInstance from "@/utils/axiosInstance";
import { useSnackbar } from "notistack";
import OtpVerify from "@/components/auth/OtpVerify";
import logo from "@/assets/logo/logo.png";
import GoogleSignIn from "@/components/auth/GoogleSignIn";

export default function RegisterPage() {
  const { enqueueSnackbar } = useSnackbar();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const { startLinkedInLogin } = useAuth();

  // OTP modal control
  const [otpOpen, setOtpOpen] = useState(false);
  const [lastRegisterPayload, setLastRegisterPayload] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.password
    ) {
      enqueueSnackbar("Please fill all required fields.", {
        variant: "warning",
      });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      enqueueSnackbar("Passwords do not match.", { variant: "error" });
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
      };

      await axiosInstance.post("/auth/register-user", payload);

      setLastRegisterPayload(payload);
      setOtpOpen(true);
    } catch (err) {
      const apiMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Registration failed. Try again.";
      enqueueSnackbar(apiMsg, { variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const onOtpSuccess = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        /* CHANGED: max-w-lg -> max-w-md to match LoginPage */
        className="z-10 w-full max-w-md bg-white/60 backdrop-blur-xl shadow-xl border border-white/20 rounded-2xl overflow-hidden p-8"
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={logo} alt="Logo" className="h-14 w-auto" />
        </div>

        {/* Register Form */}
        {/* CHANGED: cap inner width like LoginPage */}
        <form
          onSubmit={handleRegister}
          className="w-full max-w-[400px] mx-auto space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <AppInput
              name="firstName"
              placeholder="First Name"
              icon={User}
              value={formData.firstName}
              onChange={handleChange}
              required
              disabled={submitting}
            />
            <AppInput
              name="lastName"
              placeholder="Last Name"
              icon={User}
              value={formData.lastName}
              onChange={handleChange}
              required
              disabled={submitting}
            />
          </div>

          <AppInput
            name="email"
            type="email"
            placeholder="Email"
            icon={Mail}
            value={formData.email}
            onChange={handleChange}
            required
            disabled={submitting}
          />

          <AppInput
            name="password"
            type="password"
            placeholder="Password"
            icon={Lock}
            value={formData.password}
            onChange={handleChange}
            required
            disabled={submitting}
          />

          <AppInput
            name="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            icon={Lock}
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            disabled={submitting}
          />

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-[color:var(--brand-orange)] hover:bg-[color:var(--brand-orange)] text-white font-semibold"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Registering…
              </span>
            ) : (
              "Register"
            )}
          </Button>
        </form>

        {/* Real Google Sign-In (same as LoginPage) */}
        <div className="space-y-3 mt-4">
          {/* Google */}
          <div className="w-full max-w-[400px] mx-auto">
            <GoogleSignIn
              onError={(msg) =>
                enqueueSnackbar(msg || "Google sign-in failed.", {
                  variant: "error",
                })
              }
            />
          </div>

          {/* LinkedIn */}
          <div className="w-full max-w-[400px] mx-auto">
            <Button
              type="button"
              onClick={startLinkedInLogin}
              className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white font-medium flex items-center justify-start rounded shadow-sm overflow-hidden"
            >
              {/* Left white square with LinkedIn logo */}
              <div className=" flex items-center justify-center w-2">
                <i className="fa-brands fa-linkedin text-3xl mt-1"></i>
              </div>
              {/* Button text */}
              <span className="flex-1 text-center">Continue with LinkedIn</span>
            </Button>
          </div>
        </div>

        {/* Social Signup Options */}
        {/* CHANGED: constrain divider width to match LoginPage */}
        <div className="my-6 w-full max-w-[400px] mx-auto flex items-center gap-2">
          <div className="h-px bg-gray-300 flex-1" />
          <span className="text-gray-500 text-sm">or</span>
          <div className="h-px bg-gray-300 flex-1" />
        </div>

        {/* Already have account */}
        <div className="mt-6 text-sm text-center text-gray-600">
          Already have an account?{" "}
          <span
            onClick={() => (window.location.href = "/")}
            className="text-[color:var(--brand-orange)] font-medium hover:underline cursor-pointer"
          >
            Login
          </span>
        </div>
      </motion.div>

      {/* OTP Dialog */}
      <OtpVerify
        open={otpOpen}
        onOpenChange={setOtpOpen}
        email={formData.email.trim()}
        resendPayload={{
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          password: formData.password,
        }}
        onSuccess={onOtpSuccess}
      />
    </div>
  );
}
