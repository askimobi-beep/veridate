// components/auth/OtpVerify.jsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import axiosInstance from "@/utils/axiosInstance";
import { useSnackbar } from "notistack";

const DIGITS = 6;
const EXPIRY_SECS = 600; // 10 minutes

export default function OtpVerify({
  open,
  onOpenChange,
  email,
  onSuccess, // callback when OTP verified
  resendPayload, // { firstName, lastName, email, password }
}) {
  const { enqueueSnackbar } = useSnackbar();
  const [values, setValues] = useState(Array(DIGITS).fill(""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(EXPIRY_SECS);

  const inputsRef = useRef([]);

  const code = useMemo(() => values.join(""), [values]);

  // countdown
  useEffect(() => {
    if (!open) return;
    setSecondsLeft(EXPIRY_SECS);
    const t = setInterval(
      () => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)),
      1000
    );
    return () => clearInterval(t);
  }, [open]);

  // reset values when dialog opens
  useEffect(() => {
    if (open) setValues(Array(DIGITS).fill(""));
  }, [open]);

  const handleChange = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...values];
    next[i] = v;
    setValues(next);
    if (v && i < DIGITS - 1) {
      inputsRef.current[i + 1]?.focus();
    }
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !values[i] && i > 0) {
      const prev = i - 1;
      inputsRef.current[prev]?.focus();
    }
    if (e.key === "ArrowLeft" && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
    if (e.key === "ArrowRight" && i < DIGITS - 1) {
      inputsRef.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const text = (e.clipboardData.getData("text") || "")
      .replace(/\D/g, "")
      .slice(0, DIGITS);
    if (!text) return;
    const next = Array(DIGITS).fill("");
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setValues(next);
    const focusIdx = Math.min(text.length, DIGITS - 1);
    inputsRef.current[focusIdx]?.focus();
  };

  const verify = async () => {
    if (code.length !== DIGITS) {
      enqueueSnackbar("Enter the 6-digit code.", { variant: "warning" });
      return;
    }
    try {
      setLoading(true);
      const { data } = await axiosInstance.post("/auth/verify-otp", {
        email,
        otp: code,
      });
      enqueueSnackbar(data?.message || "Email verified successfully.", {
        variant: "success",
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      const apiMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Invalid or expired code.";
      enqueueSnackbar(apiMsg, { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!resendPayload?.email) {
      enqueueSnackbar("Missing email to resend code.", { variant: "error" });
      return;
    }
    try {
      setResending(true);
      // hit register again to regenerate OTP for unverified user
      await axiosInstance.post("/auth/register-user", resendPayload);
      enqueueSnackbar(
        "A new verification code has been sent to your email. Check your inbox (and Spam/Junk).",
        { variant: "info" }
      );
      setSecondsLeft(EXPIRY_SECS);
      setValues(Array(DIGITS).fill(""));
      inputsRef.current[0]?.focus();
    } catch (err) {
      const apiMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to resend code.";
      enqueueSnackbar(apiMsg, { variant: "error" });
    } finally {
      setResending(false);
    }
  };

  const m = Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, "0");
  const s = (secondsLeft % 60).toString().padStart(2, "0");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md bg-white/90"
        onInteractOutside={(e) => e.preventDefault()} // block closing on click outside
        onEscapeKeyDown={(e) => e.preventDefault()} // block closing on ESC
      >
        <DialogHeader>
          <DialogTitle className="text-xl">Verify your email</DialogTitle>
          <p className="text-sm text-muted-foreground">
            We sent a 6-digit code to{" "}
            <span className="font-medium">{email}</span>. If it’s not in your
            inbox, check your <b>Spam/Junk</b> folder.
          </p>
        </DialogHeader>

        <div className="flex gap-2 justify-center mt-2" onPaste={handlePaste}>
          {Array.from({ length: DIGITS }).map((_, i) => (
            <Input
              key={i}
              ref={(el) => (inputsRef.current[i] = el)}
              inputMode="numeric"
              maxLength={1}
              value={values[i]}
              onChange={(e) =>
                handleChange(i, e.target.value.replace(/\D/g, ""))
              }
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-12 h-12 text-center text-lg font-semibold tracking-widest"
            />
          ))}
        </div>

        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-muted-foreground">
            Code expires in {m}:{s}
          </span>
          <Button
            variant="ghost"
            disabled={resending}
            onClick={resend}
            className="px-2"
            title="Resend code"
          >
            {resending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Resend code"
            )}
          </Button>
        </div>

        <Button
          className="w-full mt-2"
          onClick={verify}
          disabled={loading || code.length !== DIGITS}
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying…
            </span>
          ) : (
            "Verify"
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
