// app/(auth)/register/page.jsx  OR pages/register.jsx (wherever yours lives)
"use client";

import { useState } from "react";
import AppInput from "@/components/form/AppInput";
import { Button } from "@/components/ui/button";
import { Mail, Lock, User, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import axiosInstance from "@/utils/axiosInstance";
import { useSnackbar } from "notistack";
import OtpVerify from "@/components/auth/OtpVerify";

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

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      enqueueSnackbar("Please fill all required fields.", { variant: "warning" });
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

      // // pro message
      // enqueueSnackbar(
      //   data?.message ||
      //     "A verification code has been sent to your email address. Please check your inbox (and Spam/Junk folder if you don’t see it).",
      //   { variant: "success" }
      // );

      setLastRegisterPayload(payload);
      setOtpOpen(true); // open OTP dialog

      // keep the form filled so user can resend easily; or clear if you prefer
      // setFormData({ firstName:"", lastName:"", email:"", password:"", confirmPassword:"" });
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
    // after verification, send user to login
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
        className="z-10 w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 bg-white/60 backdrop-blur-xl shadow-xl border border-white/20 rounded-2xl overflow-hidden"
      >
        <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-purple-500/20 via-indigo-500/10 to-transparent p-6">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-extrabold text-purple-700 drop-shadow-md">
              Join the Community 🚀
            </h2>
            <p className="text-lg text-gray-700 max-w-xs">
              Register now to start building, collaborating, and leveling up.
            </p>
            <div className="w-40 h-40 rounded-full bg-gradient-radial from-purple-400/30 to-transparent blur-2xl mx-auto" />
          </div>
        </div>

        <div className="p-8">
          <div className="flex justify-center mb-6 md:hidden">
            <img src="" alt="Logo" className="h-14 w-auto" />
          </div>

          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
            Create a New Account
          </h2>

          {/* Social placeholders */}
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

          <div className="my-6 flex items-center gap-2">
            <div className="h-px bg-gray-300 flex-1" />
            <span className="text-gray-500 text-sm">or</span>
            <div className="h-px bg-gray-300 flex-1" />
          </div>

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
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold"
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

            <div className="mt-6 text-sm text-center text-gray-600">
              Already have an account?{" "}
              <span
                onClick={() => (window.location.href = "/")}
                className="text-purple-600 font-medium hover:underline cursor-pointer"
              >
                Login
              </span>
            </div>
          </form>
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
