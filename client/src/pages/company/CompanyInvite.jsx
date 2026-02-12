import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  acceptInvite,
  declineInvite,
  fetchInvitePreview,
} from "@/services/companyService";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo/logo.png";

export default function CompanyInvite() {
  const { token } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/", { state: { from: location }, replace: true });
    }
  }, [loading, user, navigate, location]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const data = await fetchInvitePreview(token);
        setInvite(data);
      } catch (e) {
        setError(
          e?.response?.data?.message || "Invite expired or invalid."
        );
      }
    })();
  }, [token]);

  const onAccept = async () => {
    if (!token) return;
    setBusy(true);
    try {
      const res = await acceptInvite(token);
      const companyId = res?.companyId || invite?.companyId;
      if (companyId) {
        navigate(
          `/dashboard?section=company&companyId=${companyId}&companyTab=overview`,
          { replace: true }
        );
      }
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to accept invite.");
    } finally {
      setBusy(false);
    }
  };

  const onDecline = async () => {
    if (!token) return;
    setBusy(true);
    try {
      await declineInvite(token);
      navigate("/dashboard", { replace: true });
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to decline invite.");
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center px-4 relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(251,119,59,0.18),_transparent_55%),linear-gradient(135deg,_#fff7f1,_#ffffff_55%,_#fff)]">
        <div className="mx-auto max-w-xl w-full">
          <div className="mb-8 flex items-center justify-center">
            <img src={logo} alt="Veridate" className="h-10 w-auto" />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 text-center shadow-[0_30px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="text-lg font-semibold text-slate-800">
            Invite expired or invalid
          </div>
          <div className="mt-2 text-sm text-slate-600">{error}</div>
        </div>
      </div>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center px-4 relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(251,119,59,0.18),_transparent_55%),linear-gradient(135deg,_#fff7f1,_#ffffff_55%,_#fff)]">
        <div className="mx-auto max-w-xl w-full text-sm text-slate-600">
          <div className="mb-8 flex items-center justify-center">
            <img src={logo} alt="Veridate" className="h-10 w-auto" />
          </div>
          Loading invite...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(251,119,59,0.18),_transparent_55%),linear-gradient(135deg,_#fff7f1,_#ffffff_55%,_#fff)]">
      <div className="mx-auto max-w-xl w-full">
        <div className="mb-8 flex items-center justify-center">
          <img src={logo} alt="Veridate" className="h-10 w-auto" />
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-7 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur text-left">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-orange)]">
            Company Invite
          </div>
          <div className="mt-3 text-2xl font-semibold text-slate-900">
            {invite.companyName}
          </div>
          <div className="mt-4 grid gap-2 text-sm text-slate-700">
            <div>
              Role: <span className="font-semibold">{invite.role}</span>
            </div>
            <div>
              Invited by: <span className="font-semibold">{invite.invitedBy}</span>
            </div>
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={onAccept}
              disabled={busy}
              className="bg-[color:var(--brand-orange)] text-white hover:brightness-110"
            >
              Accept
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onDecline}
              disabled={busy}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Decline
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
