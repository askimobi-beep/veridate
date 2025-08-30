import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import DirectoryCard from "@/components/directory/DirectoryCard";
import SearchFilters from "@/components/directory/SearchFilters";
import { fetchProfiles } from "@/services/profileService";

export default function Directory() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [gender, setGender] = useState("");
  const [country, setCountry] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(9);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const hasMore = useMemo(() => page * limit < total, [page, limit, total]);

  const loadProfiles = async (opts = {}) => {
    setLoading(true);
    try {
      const { data, total } = await fetchProfiles({
        page, limit, q, gender, country, ...opts,
      });
      setItems(data);
      setTotal(total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, gender, country]);

  const onSearch = async (e) => {
    e.preventDefault();
    setPage(1);
    await loadProfiles({ page: 1 });
  };

  const onReset = () => {
    setQ(""); setGender(""); setCountry(""); setPage(1);
    loadProfiles({ page: 1, q: "", gender: "", country: "" });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <SearchFilters
        q={q} setQ={setQ}
        gender={gender} setGender={setGender}
        country={country} setCountry={setCountry}
        onSearch={onSearch}
        onReset={onReset}
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-56 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : items.length ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((p) => <DirectoryCard key={p._id} profile={p} />)}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage((n) => Math.max(1, n - 1))}>
                Prev
              </Button>
              <Button variant="default" disabled={!hasMore} onClick={() => setPage((n) => n + 1)}>
                Next
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center text-sm text-muted-foreground py-16">
          No profiles found.
        </div>
      )}
    </div>
  );
}
