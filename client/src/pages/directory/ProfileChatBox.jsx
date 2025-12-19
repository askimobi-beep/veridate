/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axiosInstance from "@/utils/axiosInstance";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea"; // if you don’t have this, replace with a styled <textarea>
import {
  Sparkles,
  Send,
  Loader2,
  ShieldAlert,
  MessageCircle,
  X,
} from "lucide-react";
import { useSnackbar } from "notistack";

const toISO = (value) => (value ? new Date(value).toISOString() : null);
const arrayOrEmpty = (value) => (Array.isArray(value) ? value : []);

// util — mirrors server side context used for profile chat
const buildAIContext = (p) => {
  if (!p) return {};

  const education = arrayOrEmpty(p.education).map((e) => ({
    degreeTitle: e.degreeTitle || null,
    institute: e.institute || null,
    startDate: toISO(e.startDate),
    endDate: toISO(e.endDate),
  }));

  const experience = arrayOrEmpty(p.experience).map((e) => ({
    jobTitle: e.jobTitle || null,
    company: e.company || null,
    industry: e.industry || null,
    jobFunctions: arrayOrEmpty(e.jobFunctions),
    startDate: toISO(e.startDate),
    endDate: toISO(e.endDate),
  }));

  return {
    name: p.name || null,
    email: p.email || null,
    fatherName: p.fatherName || null,
    mobileCountryCode: p.mobileCountryCode || null,
    mobile: p.mobile || null,
    city: p.city || null,
    country: p.country || null,
    gender: p.gender || null,
    maritalStatus: p.maritalStatus || null,
    residentStatus: p.residentStatus || null,
    nationality: p.nationality || null,
    dob: toISO(p.dob),
    shiftPreferences: arrayOrEmpty(p.shiftPreferences),
    workAuthorization: arrayOrEmpty(p.workAuthorization),
    education,
    experience,
  };
};

export default function ProfileChatBox({ userId, profile }) {
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text:
        "Ask me anything about this candidate’s profile — roles, industries, rough tenure, education years, etc. If it’s not in the profile, I’ll tell you straight up.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const ctx = useMemo(() => buildAIContext(profile), [profile]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const ask = useCallback(async () => {
    const q = input.trim();
    if (!q) return;
    if (!open) setOpen(true);
    setBusy(true);
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");

    try {
      const res = await axiosInstance.post("/profile/ai/profile-chat", {
        userId,
        question: q,
        // also send context (lets you answer even if user doesn't have permission to fetch on server)
        context: ctx,
      });
      const a = res?.data?.answer?.trim() || "No answer.";
      setMessages((m) => [...m, { role: "assistant", text: a }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text:
            "Couldn’t fetch an answer right now. Try again. If this keeps happening, ping devs.",
        },
      ]);
      enqueueSnackbar(e?.response?.data?.error || "Chat failed", {
        variant: "error",
      });
    } finally {
      setBusy(false);
      // auto-scroll down
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
  }, [input, userId, ctx, open]);

  const quickQs = [
    "What’s the latest role and company?",
    "Total years of experience?",
    "List industries worked in.",
    "Which degree is most recent and when?",
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex max-h-[90vh] flex-col items-end gap-3 max-sm:bottom-4 max-sm:right-4">
      {open ? (
        <Card className="flex w-[min(360px,calc(100vw-1.5rem))] max-h-[80vh] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl transition-all duration-300">
          <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 px-4 py-3 text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/15">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">
                    Profile Copilot
                  </p>
                  <p className="text-[11px] text-white/70">
                    Answers sourced exclusively from this candidate
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="rounded-lg bg-white/10 text-white">
                  <ShieldAlert className="h-3.5 w-3.5 mr-1" />
                  On record
                </Badge>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-5">
            {/* Quick prompts */}
            <div className="flex flex-wrap gap-2">
              {quickQs.map((q) => (
                <Button
                  key={q}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-2xl border-slate-200 bg-white/70 text-slate-700 hover:bg-orange-50 hover:text-orange-600"
                  onClick={() => {
                    setInput(q);
                    setTimeout(() => {
                      if (inputRef.current) inputRef.current.focus();
                    }, 0);
                  }}
                  disabled={busy}
                >
                  {q}
                </Button>
              ))}
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="mt-4 min-h-0 w-full flex-1 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/60 p-3 pr-1 space-y-3 shadow-inner"
            >
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={
                    m.role === "user"
                      ? "ml-auto max-w-[85%] rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-orange-500/30"
                      : "mr-auto max-w-[85%] rounded-2xl border border-slate-100 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm"
                  }
                >
                  {m.text}
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="mt-4 flex items-end gap-2 rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-sm">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about experience, education, tenure..."
                className="max-h-32 min-h-[56px] border-none bg-transparent shadow-none focus-visible:ring-0"
                disabled={busy}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    ask();
                  }
                }}
              />
              <Button
                type="button"
                onClick={ask}
                disabled={busy || !input.trim()}
                className="h-[52px] rounded-2xl px-5"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Responding…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </>
                )}
              </Button>
            </div>

            <p className="mt-3 text-center text-[11px] text-slate-400">
              Powered by OpenAI · Responses checked against this profile
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-14 items-center gap-3 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-4 text-sm font-semibold shadow-lg shadow-orange-500/40 hover:from-orange-600 hover:to-amber-600"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
          <MessageCircle className="h-5 w-5 text-white" />
        </span>
        <div className="flex flex-col items-start leading-tight text-white">
          <span>{open ? "Hide profile chat" : "Profile chat"}</span>
          <span className="text-[11px] font-normal text-white/70">
            Tap to {open ? "close" : "ask a question"}
          </span>
        </div>
      </Button>
    </div>
  );
}
