import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  acceptInvite,
  declineInvite,
  fetchInvitePreview,
} from "@/services/companyService";
import { Button } from "@/components/ui/button";

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
        navigate(`/dashboard/companies/${companyId}`, { replace: true });
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
      <div className="max-w-xl mx-auto p-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
          <div className="text-lg font-semibold text-slate-800">
            Invite expired or invalid
          </div>
          <div className="mt-2 text-sm text-slate-600">{error}</div>
        </div>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="max-w-xl mx-auto p-6 text-sm text-slate-600">
        Loading invite...
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-left">
        <div className="text-lg font-semibold text-slate-800">
          {invite.companyName}
        </div>
        <div className="mt-2 text-sm text-slate-600">
          Role: <span className="font-semibold">{invite.role}</span>
        </div>
        <div className="mt-1 text-sm text-slate-600">
          Invited by: <span className="font-semibold">{invite.invitedBy}</span>
        </div>
        <div className="mt-6 flex items-center gap-3">
          <Button
            type="button"
            onClick={onAccept}
            disabled={busy}
            className="bg-[color:var(--brand-orange)] text-white hover:brightness-110"
          >
            Accept
          </Button>
          <Button type="button" variant="outline" onClick={onDecline} disabled={busy}>
            Decline
          </Button>
        </div>
      </div>
    </div>
  );
}
