"use client";

import { useState } from "react";
import AppInput from "@/components/form/AppInput";
import { Button } from "@/components/ui/button";
import { Mail, Lock, User, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import axiosInstance from "@/utils/axiosInstance";
import { useSnackbar } from "notistack";
import OtpVerify from "@/components/auth/OtpVerify";
import logo from "@/assets/logo/logo.png";

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

      const { data } = await axiosInstance.post("/auth/register-user", payload);

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
    <div className="min-h-screen w-full bg-gradient-to-br from-white via-[#f7f9fc] to-[#eef3ff] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/3 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.12),transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 right-[-10%] h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(167,139,250,0.12),transparent_70%)] blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 w-full max-w-lg bg-white/60 backdrop-blur-xl shadow-xl border border-white/20 rounded-2xl overflow-hidden p-8"
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={logo} alt="Logo" className="h-14 w-auto" />
        </div>

        {/* Register Form */}
        <form onSubmit={handleRegister} className="space-y-4">
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
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold"
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

        {/* Social Signup Options */}
        <div className="my-6 flex items-center gap-2">
          <div className="h-px bg-gray-300 flex-1" />
          <span className="text-gray-500 text-sm">or</span>
          <div className="h-px bg-gray-300 flex-1" />
        </div>

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
            Sign up with Google
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
            Sign up with Facebook
          </button>
        </div>

        {/* Already have account */}
        <div className="mt-6 text-sm text-center text-gray-600">
          Already have an account?{" "}
          <span
            onClick={() => (window.location.href = "/")}
            className="text-orange-600 font-medium hover:underline cursor-pointer"
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
