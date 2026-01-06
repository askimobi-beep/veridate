import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "@/utils/axiosInstance";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString();
};

export default function OrganizationDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axiosInstance.get("/organizations/dashboard");
        if (!mounted) return;
        setData(res?.data || null);
      } catch (err) {
        if (!mounted) return;
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load dashboard"
        );
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const organization = data?.organization || {};
  const users = Array.isArray(data?.users) ? data.users : [];
  const role = String(organization.role || "").toLowerCase();
  const roleLabel = role === "company" ? "Company" : "University";

  const summary = useMemo(() => {
    return {
      name: organization.name || roleLabel,
      total: data?.totalUsers || 0,
      email: organization.email || "",
      website: organization.website || "",
      contact: organization.contact || "",
    };
  }, [organization, data, roleLabel]);

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6">
        <div className="h-10 w-56 animate-pulse rounded bg-muted mb-4" />
        <div className="rounded-lg border p-6">
          <div className="h-8 w-full animate-pulse rounded bg-muted mb-2" />
          <div className="h-8 w-full animate-pulse rounded bg-muted mb-2" />
          <div className="h-8 w-full animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {summary.name} Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Track users linked to your {roleLabel.toLowerCase()}.
          </p>
        </div>
        <Badge className="capitalize" variant="secondary">
          {roleLabel}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-muted-foreground">Total users</div>
          <div className="text-2xl font-semibold">{summary.total}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-muted-foreground">Contact</div>
          <div className="text-sm font-medium">{summary.contact || "-"}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-muted-foreground">Website</div>
          {summary.website ? (
            <a
              href={summary.website}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-orange-700 hover:underline"
            >
              {summary.website}
            </a>
          ) : (
            <div className="text-sm font-medium">-</div>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>
                {role === "company" ? "Experience" : "Education"}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  No users linked yet.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.userId || u.profileId}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email || "-"}</TableCell>
                  <TableCell>
                    {[u.city, u.country].filter(Boolean).join(", ") || "-"}
                  </TableCell>
                  <TableCell>
                    {role === "company" ? (
                      <div className="space-y-1">
                        {(u.experiences || []).map((e, idx) => (
                          <div key={idx} className="text-sm">
                            <div className="font-medium">
                              {e.jobTitle || "Role"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {[
                                e.company || summary.name,
                                formatDate(e.startDate),
                                formatDate(e.endDate),
                              ]
                                .filter(Boolean)
                                .join(" - ")}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {(u.educations || []).map((e, idx) => (
                          <div key={idx} className="text-sm">
                            <div className="font-medium">
                              {e.degreeTitle || "Degree"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {[
                                e.institute || summary.name,
                                formatDate(e.startDate),
                                formatDate(e.endDate),
                              ]
                                .filter(Boolean)
                                .join(" - ")}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
