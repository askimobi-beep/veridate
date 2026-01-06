import React, { useEffect, useMemo, useState } from "react";
import { useSnackbar } from "notistack";
import axiosInstance from "@/utils/axiosInstance";
import AppInput from "@/components/form/AppInput";
import AppSelect from "@/components/form/AppSelect";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const roleOptions = ["company", "university"];
const websiteRegex = /^https:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

const emptyForm = {
  name: "",
  email: "",
  role: "company",
  contact: "",
  website: "",
};

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso || "";
  }
};

export default function Organizations() {
  const { enqueueSnackbar } = useSnackbar();
  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    return (
      form.name.trim() &&
      form.email.trim() &&
      form.role &&
      form.contact.trim() &&
      websiteRegex.test(form.website.trim())
    );
  }, [form]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get("/admin/organizations");
      setItems(res?.data?.data || []);
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Failed to load organizations"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const update = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        contact: form.contact.trim(),
        website: form.website.trim(),
      };
      const res = await axiosInstance.post("/admin/organizations", payload);
      const created = res?.data?.data;
      if (created?._id) {
        enqueueSnackbar("Organization created and invite sent", {
          variant: "success",
        });
        setForm(emptyForm);
        setItems((prev) => [created, ...prev]);
      } else {
        await load();
      }
    } catch (err) {
      enqueueSnackbar(
        err?.response?.data?.message || err?.message || "Failed to create organization",
        { variant: "error" }
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organizations</h1>
          <p className="text-sm text-muted-foreground">
            Register companies and universities. They receive a link to set their password.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border bg-white p-4 space-y-3"
        >
          <div className="text-sm font-semibold">Add organization</div>

          <AppInput
            label="Name"
            name="name"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Company or university name"
            required
          />
          <AppInput
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="org@example.com"
            required
          />
          <AppSelect
            label="Role"
            name="role"
            value={form.role}
            onChange={(e) => update("role", e.target.value)}
            options={roleOptions}
          />
          <AppInput
            label="Contact"
            name="contact"
            value={form.contact}
            onChange={(e) => update("contact", e.target.value)}
            placeholder="Primary contact number"
            required
          />
          <AppInput
            label="Website"
            name="website"
            type="url"
            value={form.website}
            onChange={(e) => update("website", e.target.value)}
            placeholder="https://example.com"
            error={
              form.website && !websiteRegex.test(form.website.trim())
                ? "Use a valid https URL"
                : ""
            }
            required
          />

          <Button
            type="submit"
            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            disabled={!canSubmit || submitting}
          >
            {submitting ? "Creating..." : "Create organization"}
          </Button>
        </form>

        <div className="lg:col-span-2 rounded-xl border bg-white p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold">All organizations</div>
            <Badge variant="secondary">{items.length}</Badge>
          </div>

          {loading ? (
            <div className="space-y-2">
              <div className="h-8 w-full bg-muted animate-pulse rounded" />
              <div className="h-8 w-full bg-muted animate-pulse rounded" />
              <div className="h-8 w-full bg-muted animate-pulse rounded" />
            </div>
          ) : error ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Password</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6">
                        No organizations yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((org) => (
                      <TableRow key={org._id}>
                        <TableCell className="font-medium">
                          {org.name}
                        </TableCell>
                        <TableCell className="capitalize">{org.role}</TableCell>
                        <TableCell>{org.email}</TableCell>
                        <TableCell>{org.contact}</TableCell>
                        <TableCell className="max-w-[180px] truncate">
                          {org.website ? (
                            <a
                              href={org.website}
                              target="_blank"
                              rel="noreferrer"
                              className="text-orange-700 hover:underline"
                            >
                              {org.website}
                            </a>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={org.hasPassword ? "default" : "secondary"}>
                            {org.hasPassword ? "Set" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(org.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
