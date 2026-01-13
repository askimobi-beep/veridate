import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import DirectoryCard from "@/components/directory/DirectoryCard";
import SearchFilters from "@/components/directory/SearchFilters";
import { fetchProfiles } from "@/services/profileService";

export default function Directory() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [experience, setExperience] = useState("");
  const [university, setUniversity] = useState("");
  const [gender, setGender] = useState("");
  const [country, setCountry] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(9);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const prevFiltersRef = useRef({
    q: "",
    experience: "",
    university: "",
    gender: "",
    country: "",
  });

  const hasFilters = useMemo(
    () =>
      [q, experience, university, gender, country].some((val) =>
        String(val || "").trim()
      ),
    [q, experience, university, gender, country]
  );
  const hasMore = useMemo(() => page * limit < total, [page, limit, total]);

  useEffect(() => {
    if (hasFilters) {
      if (!hasSearched) setHasSearched(true);
      return;
    }
    if (hasSearched) {
      setItems([]);
      setTotal(0);
      setHasSearched(false);
      setLoading(false);
    }
  }, [hasFilters, hasSearched]);

  const loadProfiles = async (opts = {}) => {
    setLoading(true);
    try {
      const { data, total } = await fetchProfiles({
        page,
        limit,
        q,
        experience,
        university,
        gender,
        country,
        ...opts,
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
    if (!hasSearched) {
      prevFiltersRef.current = {
        q,
        experience,
        university,
        gender,
        country,
      };
      return;
    }

    const prev = prevFiltersRef.current;
    const current = { q, experience, university, gender, country };
    const filtersChanged = Object.keys(current).some(
      (key) => prev[key] !== current[key]
    );

    if (filtersChanged && page !== 1) {
      prevFiltersRef.current = current;
      setPage(1);
      return;
    }

    loadProfiles();
    prevFiltersRef.current = current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, q, experience, university, gender, country, hasSearched]);

  const onSearch = async (e) => {
    e.preventDefault();
    if (!hasFilters) {
      setItems([]);
      setTotal(0);
      setHasSearched(false);
      setLoading(false);
      return;
    }
    setHasSearched(true);
    setPage(1);
  };

  const onReset = () => {
    setQ("");
    setExperience("");
    setUniversity("");
    setGender("");
    setCountry("");
    setPage(1);
    setItems([]);
    setTotal(0);
    setHasSearched(false);
    setLoading(false);
  };

  return (
    <div className=" mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <aside className="lg:sticky lg:top-6 h-fit">
          <Card className="rounded-xl border border-gray-200">
            <div className="border-b border-gray-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-800">Filters</h2>
            </div>
            <div className="p-4">
              <SearchFilters
                q={q}
                setQ={setQ}
                experience={experience}
                setExperience={setExperience}
                university={university}
                setUniversity={setUniversity}
                gender={gender}
                setGender={setGender}
                country={country}
                setCountry={setCountry}
                onSearch={onSearch}
                onReset={onReset}
              />
            </div>
          </Card>
        </aside>

        <section className="space-y-6">
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

              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((n) => Math.max(1, n - 1))}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="default"
                    disabled={!hasMore}
                    onClick={() => setPage((n) => n + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : hasSearched ? (
            <div className="text-center text-sm text-muted-foreground py-16">
              No profiles found.
            </div>
          ) : (
            <div className="text-center text-sm text-muted-foreground py-16">
              Choose filters to see candidates.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
