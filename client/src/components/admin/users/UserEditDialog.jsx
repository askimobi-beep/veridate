import React, { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { useSnackbar } from "notistack"
import axiosInstance from "@/utils/axiosInstance"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

import AppInput from "@/components/form/AppInput"
import AppSelect from "@/components/form/AppSelect"
import BlockSwitch from "@/components/form/Switch"

const sumCredits = (arr = []) =>
  arr.reduce(
    (acc, c) => ({
      available: acc.available + Number(c.available || 0),
      used: acc.used + Number(c.used || 0),
      total: acc.total + Number(c.total || 0),
    }),
    { available: 0, used: 0, total: 0 }
  );

export default function UserEditDialog({ open, onOpenChange, user, onUpdated }) {
  const { enqueueSnackbar } = useSnackbar();
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [photoStatus, setPhotoStatus] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoSaving, setPhotoSaving] = useState(false);

  const uploadBase = useMemo(() => {
    const base = import.meta.env.VITE_API_PIC_URL
      ? `${import.meta.env.VITE_API_PIC_URL}/uploads/profile`
      : "/uploads/profile";
    return base.replace(/\/$/, "");
  }, []);

  useEffect(() => {
    if (user) {
      setDraft({
        _id: user._id,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        role: user.role || "user",
        isBlocked: !!user.isBlocked,
        // keep the arrays for read-only display (don’t edit here)
        verifyCredits: {
          education: Array.isArray(user?.verifyCredits?.education) ? user.verifyCredits.education : [],
          experience: Array.isArray(user?.verifyCredits?.experience) ? user.verifyCredits.experience : [],
        },
      });
    } else {
      setDraft(null);
    }
  }, [user]);

  useEffect(() => {
    if (!open || !user?._id) {
      setPhotoStatus(null);
      return;
    }

    let active = true;
    const loadPhotoStatus = async () => {
      setPhotoLoading(true);
      try {
        const res = await axiosInstance.get(`/admin/profile-photo/${user._id}`);
        if (!active) return;
        setPhotoStatus(
          res?.data?.data || { profilePic: "", profilePicPending: "" }
        );
      } catch (e) {
        if (!active) return;
        setPhotoStatus(null);
      } finally {
        if (active) setPhotoLoading(false);
      }
    };

    loadPhotoStatus();
    return () => {
      active = false;
    };
  }, [open, user?._id]);

  const close = () => onOpenChange(false);
  const setField = (key, value) => setDraft((s) => ({ ...s, [key]: value }));

  const save = async () => {
    if (!draft?._id) return;
    setSaving(true);
    try {
      const payload = {
        firstName: draft.firstName,
        lastName: draft.lastName,
        role: draft.role,
        isBlocked: draft.isBlocked,
        // IMPORTANT: omit verifyCredits here unless your API supports the nested shape update
      };
      const res = await axiosInstance.put(`/admin/update-user/${draft._id}`, payload);
      const updated = res?.data?.data;
      if (updated?._id) {
        onUpdated(updated);
        enqueueSnackbar("User updated", { variant: "success" });
        close();
      } else {
        enqueueSnackbar("Unexpected response from server", { variant: "warning" });
      }
    } catch (e) {
      enqueueSnackbar(
        e?.response?.data?.message || e?.message || "Failed to update user",
        { variant: "error" }
      );
    } finally {
      setSaving(false);
    }
  };

  const approvePhoto = async () => {
    if (!user?._id) return;
    setPhotoSaving(true);
    try {
      const res = await axiosInstance.post(
        `/admin/profile-photo/${user._id}/approve`
      );
      setPhotoStatus(
        res?.data?.data || { profilePic: "", profilePicPending: "" }
      );
      enqueueSnackbar("Profile photo approved", { variant: "success" });
    } catch (e) {
      enqueueSnackbar(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to approve profile photo",
        { variant: "error" }
      );
    } finally {
      setPhotoSaving(false);
    }
  };

  const rejectPhoto = async () => {
    if (!user?._id) return;
    setPhotoSaving(true);
    try {
      await axiosInstance.post(`/admin/profile-photo/${user._id}/reject`);
      setPhotoStatus((prev) => ({
        ...(prev || {}),
        profilePicPending: "",
      }));
      enqueueSnackbar("Profile photo rejected", { variant: "success" });
    } catch (e) {
      enqueueSnackbar(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to reject profile photo",
        { variant: "error" }
      );
    } finally {
      setPhotoSaving(false);
    }
  };

  if (!draft) return null;

  const edu = sumCredits(draft.verifyCredits.education);
  const exp = sumCredits(draft.verifyCredits.experience);
  const approvedPhotoUrl = photoStatus?.profilePic
    ? `${uploadBase}/${photoStatus.profilePic}`
    : "";
  const pendingPhotoUrl = photoStatus?.profilePicPending
    ? `${uploadBase}/${photoStatus.profilePicPending}`
    : "";
  const hasPending = !!photoStatus?.profilePicPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-white">
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.16 }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AppInput
              label="First name"
              name="firstName"
              value={draft.firstName}
              onChange={(e) => setField("firstName", e.target.value)}
            />
            <AppInput
              label="Last name"
              name="lastName"
              value={draft.lastName}
              onChange={(e) => setField("lastName", e.target.value)}
            />
            <AppInput
              label="Email"
              name="email"
              value={draft.email}
              disabled
              className="sm:col-span-2"
            />
            <AppSelect
              label="Role"
              name="role"
              value={draft.role}
              onChange={(e) => setField("role", e.target.value)}
              options={["user", "admin", "company", "university"]}
            />
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Blocked</label>
              <div className="h-10 rounded-md border px-3 flex items-center justify-between">
                <span className="text-sm">isBlocked</span>
                <BlockSwitch
                  checked={draft.isBlocked}
                  onChange={(v) => setField("isBlocked", v)}
                />
              </div>
            </div>
          </div>

          {/* Read-only credit totals so admins still see context */}
          <div className="rounded-md border p-3 bg-muted/30">
            <div className="text-sm font-medium mb-2">Credits (read-only)</div>
            <div className="text-sm space-y-1 text-muted-foreground">
              <div>Education — used {edu.used}/{edu.total}, available {edu.available}</div>
              <div>Experience — used {exp.used}/{exp.total}, available {exp.available}</div>
            </div>
          </div>

          <div className="rounded-md border p-3 bg-muted/30 space-y-3">
            <div className="text-sm font-medium">Profile photo approval</div>
            {photoLoading ? (
              <div className="text-sm text-muted-foreground">Loading photo status...</div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Current
                  </div>
                  {approvedPhotoUrl ? (
                    <img
                      src={approvedPhotoUrl}
                      alt="Approved profile"
                      className="h-12 w-12 rounded-full border object-cover"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">None</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Pending
                  </div>
                  {pendingPhotoUrl ? (
                    <img
                      src={pendingPhotoUrl}
                      alt="Pending profile"
                      className="h-12 w-12 rounded-full border object-cover"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">None</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={approvePhoto} disabled={!hasPending || photoSaving}>
                    {photoSaving ? "Saving..." : "Approve"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={rejectPhoto}
                    disabled={!hasPending || photoSaving}
                  >
                    Reject
                  </Button>
                </div>
              </>
            )}
          </div>
        </motion.div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={close} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
