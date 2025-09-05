import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSnackbar } from "notistack";
import axiosInstance from "@/utils/axiosInstance";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import AppInput from "@/components/form/AppInput";
import AppSelect from "@/components/form/AppSelect";
import BlockSwitch from "@/components/form/Switch";

export default function UserEditDialog({ open, onOpenChange, user, onUpdated }) {
  const { enqueueSnackbar } = useSnackbar();
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setDraft({
        _id: user._id,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        role: user.role || "user",
        isBlocked: !!user.isBlocked,
        verifyCredits: {
          education: Number(user?.verifyCredits?.education ?? 0),
          experience: Number(user?.verifyCredits?.experience ?? 0),
        },
      });
    } else {
      setDraft(null);
    }
  }, [user]);

  const close = () => onOpenChange(false);

  const setField = (key, value) => setDraft((s) => ({ ...s, [key]: value }));
  const setCredit = (key, value) =>
    setDraft((s) => ({
      ...s,
      verifyCredits: { ...s.verifyCredits, [key]: value },
    }));

  const save = async () => {
    if (!draft?._id) return;
    setSaving(true);
    try {
      const payload = {
        firstName: draft.firstName,
        lastName: draft.lastName,
        role: draft.role,
        isBlocked: draft.isBlocked,
        verifyCredits: {
          education: Number(draft.verifyCredits.education || 0),
          experience: Number(draft.verifyCredits.experience || 0),
        },
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-white">
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
        </DialogHeader>

        {draft && (
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
                options={["user", "admin"]}
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
              <AppInput
                label="Education credits"
                name="education"
                type="number"
                min="0"
                value={draft.verifyCredits.education}
                onChange={(e) => setCredit("education", e.target.value)}
              />
              <AppInput
                label="Experience credits"
                name="experience"
                type="number"
                min="0"
                value={draft.verifyCredits.experience}
                onChange={(e) => setCredit("experience", e.target.value)}
              />
            </div>
          </motion.div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={close} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
