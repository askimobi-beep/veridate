import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import DirectoryCard from "@/components/directory/DirectoryCard";
import SearchFilters from "@/components/directory/SearchFilters";
import { fetchProfiles } from "@/services/profileService";

export default function Directory() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [userId, setUserId] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [degreeTitle, setDegreeTitle] = useState("");
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [institute, setInstitute] = useState("");
  const [jobFunctions, setJobFunctions] = useState("");
  const [skillset, setSkillset] = useState("");
  const [location, setLocation] = useState("");
  const [experienceDuration, setExperienceDuration] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(9);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeFilters, setActiveFilters] = useState(null);

  const currentFilters = useMemo(
    () => ({
      q,
      email,
      mobile,
      userId,
      jobTitle,
      degreeTitle,
      company,
      industry,
      institute,
      jobFunctions,
      skillset,
      location,
      experienceDuration,
    }),
    [
      q,
      email,
      mobile,
      userId,
      jobTitle,
      degreeTitle,
      company,
      industry,
      institute,
      jobFunctions,
      skillset,
      location,
      experienceDuration,
    ]
  );

  const hasFilters = useMemo(
    () =>
      Object.values(currentFilters).some((val) => String(val || "").trim()),
    [currentFilters]
  );
  const hasMore = useMemo(() => page * limit < total, [page, limit, total]);

  const loadProfiles = async (filters) => {
    if (!filters) return;
    setLoading(true);
    try {
      const { data, total } = await fetchProfiles({
        page,
        limit,
        ...filters,
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
    if (!hasSearched || !activeFilters) return;
    loadProfiles(activeFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, activeFilters, hasSearched]);

  const onSearch = (e) => {
    e.preventDefault();
    if (!hasFilters) {
      setItems([]);
      setTotal(0);
      setHasSearched(false);
      setActiveFilters(null);
      setLoading(false);
      return;
    }
    setHasSearched(true);
    setPage(1);
    setActiveFilters({ ...currentFilters });
  };

  const onReset = () => {
    setQ("");
    setEmail("");
    setMobile("");
    setUserId("");
    setJobTitle("");
    setDegreeTitle("");
    setCompany("");
    setIndustry("");
    setInstitute("");
    setJobFunctions("");
    setSkillset("");
    setLocation("");
    setExperienceDuration("");
    setPage(1);
    setItems([]);
    setTotal(0);
    setHasSearched(false);
    setActiveFilters(null);
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <aside className="lg:sticky lg:top-6 h-fit">
          <Card className="rounded-2xl border border-white/60 bg-white/60 shadow-[0_22px_50px_-26px_rgba(15,23,42,0.4)] backdrop-blur-md">
            <div className="border-b border-white/60 px-4 py-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600/80">
                Filters
              </h2>
            </div>
            <div className="p-4">
              <SearchFilters
                q={q}
                setQ={setQ}
                email={email}
                setEmail={setEmail}
                mobile={mobile}
                setMobile={setMobile}
                userId={userId}
                setUserId={setUserId}
                jobTitle={jobTitle}
                setJobTitle={setJobTitle}
                degreeTitle={degreeTitle}
                setDegreeTitle={setDegreeTitle}
                company={company}
                setCompany={setCompany}
                industry={industry}
                setIndustry={setIndustry}
                institute={institute}
                setInstitute={setInstitute}
                jobFunctions={jobFunctions}
                setJobFunctions={setJobFunctions}
                skillset={skillset}
                setSkillset={setSkillset}
                location={location}
                setLocation={setLocation}
                experienceDuration={experienceDuration}
                setExperienceDuration={setExperienceDuration}
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
                {items.map((p) => (
                  <DirectoryCard key={p._id} profile={p} />
                ))}
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
