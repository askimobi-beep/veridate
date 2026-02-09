import React, { useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosInstance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function CompanyVerifications() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notesById, setNotesById] = useState({});
  const [filter, setFilter] = useState("pending");
  const [query, setQuery] = useState("");

  const load = async (status = filter) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/admin/companies/pending", {
        params: { status },
      });
      setRows(res?.data?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(filter);
  }, [filter]);

  const onApprove = async (id) => {
    await axiosInstance.post("/admin/companies/" + id + "/approve", {
      notes: notesById[id] || "",
    });
    load();
  };

  const onReject = async (id) => {
    await axiosInstance.post("/admin/companies/" + id + "/reject", {
      notes: notesById[id] || "",
    });
    load();
  };

  const q = query.trim().toLowerCase();
  const filtered = q
    ? rows.filter((c) =>
        [c.name, c.website, c.phone, c.address, c.role]
          .filter(Boolean)
          .some((val) => String(val).toLowerCase().includes(q))
      )
    : rows;

  return (
    <div className="space-y-6">
      <div className="text-lg font-semibold">Company Verifications</div>
      <div className="flex flex-wrap items-center gap-3">
        {["pending", "rejected", "approved", "all"].map((key) => (
          <Button
            key={key}
            type="button"
            variant={filter === key ? "default" : "outline"}
            onClick={() => setFilter(key)}
          >
            {key.toUpperCase()}
          </Button>
        ))}
        <div className="min-w-[240px]">
          <Input
            placeholder="Search company..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-slate-600">Loading...</div>
      ) : filtered.length ? (
        <div className="space-y-4">
          {filtered.map((c) => (
            <div
              key={c._id}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold text-slate-800">{c.name}</div>
                <span
                  className={`text-xs font-semibold ${
                    c.status === "approved"
                      ? "text-green-600"
                      : c.status === "rejected"
                      ? "text-red-600"
                      : "text-amber-600"
                  }`}
                >
                  {String(c.status || "pending").toUpperCase()}
                </span>
              </div>
              <div className="text-sm text-slate-600 mt-1">
                {c.website} · {c.phone}
              </div>
              <div className="text-sm text-slate-600">{c.address}</div>

              <div className="mt-3 text-sm text-slate-700">Role: {c.role}</div>

              <div className="mt-3 text-sm">
                Docs:
                <div className="mt-1 flex flex-wrap gap-2">
                  {(c.docs || []).map((d) => (
                    <a
                      key={d.filename}
                      className="text-[color:var(--brand-orange)] underline"
                      href={
                        import.meta.env.VITE_API_PIC_URL +
                        "/uploads/company-docs/" +
                        d.filename
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      {d.originalName || d.filename}
                    </a>
                  ))}
                </div>
              </div>

              <div className="mt-3">
                <div className="text-sm font-medium text-slate-700 mb-1">
                  Notes (optional)
                </div>
                <Textarea
                  value={notesById[c._id] || ""}
                  onChange={(e) =>
                    setNotesById((prev) => ({
                      ...prev,
                      [c._id]: e.target.value,
                    }))
                  }
                  className="min-h-[80px]"
                  placeholder="Internal notes"
                />
              </div>

              <div className="mt-4 flex items-center gap-3">
                <Button
                  type="button"
                  className="bg-[color:var(--brand-orange)] text-white hover:bg-[color:var(--brand-orange)]"
                  onClick={() => onApprove(c._id)}
                >
                  Approve
                </Button>
                <Button type="button" variant="outline" onClick={() => onReject(c._id)}>
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-slate-600">No companies found.</div>
      )}
    </div>
  );
}
