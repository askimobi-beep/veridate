import React, { useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosInstance";
import UsersTable from "@/components/admin/users/UsersTable";

export default function AllUsers() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/admin/get-allusers");
        if (!mounted) return;
        setUsers(res?.data?.data || []);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e?.message || "Failed to load users.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handlePatch = (updated) => {
    setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
  };

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6">
        <div className="h-10 w-48 animate-pulse rounded bg-muted mb-4" />
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
    <div className="w-full max-w-7xl mx-auto p-6">
      <UsersTable users={users} onPatch={handlePatch} />
    </div>
  );
}
