import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import DirectoryCard from "@/components/directory/DirectoryCard";
import SearchFilters from "@/components/directory/SearchFilters";
import { fetchProfiles } from "@/services/profileService";

export default function Directory() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [degreeTitle, setDegreeTitle] = useState("");
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [institute, setInstitute] = useState("");
  const [companyOptions, setCompanyOptions] = useState([]);
  const [instituteOptions, setInstituteOptions] = useState([]);
  const [jobFunctions, setJobFunctions] = useState("");
  const [skillset, setSkillset] = useState("");
  const [location, setLocation] = useState("");
  const [locationOptions, setLocationOptions] = useState([]);
  const [experienceDuration, setExperienceDuration] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(9);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeFilters, setActiveFilters] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState("profile");
  const [panelUserId, setPanelUserId] = useState("");

  const panelUrl = useMemo(() => {
    const fallbackId = "68d94b0c5a62659a0126e800";
    const userId = panelUserId || fallbackId;
    const base = window.location.origin;
    const url = `${base}/dashboard/profiles/${userId}`;
    const params = new URLSearchParams();
    params.set("embed", "1");
    if (panelMode === "summary") {
      params.set("section", "summary");
    }
    return `${url}?${params.toString()}`;
  }, [panelMode, panelUserId]);

  const openPanel = (profile, mode) => {
    setPanelUserId(profile?.user || "");
    setPanelMode(mode);
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
  };

  const currentFilters = useMemo(
    () => ({
      q,
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

  useEffect(() => {
    let active = true;
    const loadLocations = async () => {
      try {
        const { data } = await fetchProfiles({ page: 1, limit: 500 });
        if (!active) return;
        const map = new Map();
        const companySet = new Set();
        const instituteSet = new Set();
        data.forEach((profile) => {
          const city = String(profile?.city || "").trim();
          const country = String(profile?.country || "").trim();
          if (city) {
            const label = country ? `${city}, ${country}` : city;
            map.set(`city:${label}`, { label, value: city });
          }
          if (country) {
            map.set(`country:${country}`, { label: country, value: country });
          }
          const experience = Array.isArray(profile?.experience)
            ? profile.experience
            : [];
          experience.forEach((exp) => {
            const name = String(exp?.company || "").trim();
            if (name) companySet.add(name);
          });
          const education = Array.isArray(profile?.education)
            ? profile.education
            : [];
          education.forEach((edu) => {
            const name = String(edu?.institute || "").trim();
            if (name) instituteSet.add(name);
          });
        });
        const options = Array.from(map.values()).sort((a, b) =>
          a.label.localeCompare(b.label)
        );
        setLocationOptions(options);
        setCompanyOptions(
          Array.from(companySet)
            .sort((a, b) => a.localeCompare(b))
            .map((name) => ({ label: name, value: name }))
        );
        setInstituteOptions(
          Array.from(instituteSet)
            .sort((a, b) => a.localeCompare(b))
            .map((name) => ({ label: name, value: name }))
        );
      } catch (err) {
        console.error("Failed to load location options", err);
      }
    };

    loadLocations();
    return () => {
      active = false;
    };
  }, []);

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
    <div className="max-w-6xl mx-auto px-4 pt-6 pb-0">
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        <aside className="lg:sticky lg:top-6 h-fit">
          <Card className="rounded-2xl border border-white/60 bg-white/60 shadow-[0_22px_50px_-26px_rgba(15,23,42,0.4)] backdrop-blur-md">
            <div className="border-b border-white/60 px-4 py-3 text-left">
              <h2 className="text-sm font-semibold text-slate-800">Filters</h2>
            </div>
            <div className="px-4 pt-2 pb-4 max-h-[calc(100vh-180px)] overflow-y-auto">
              <SearchFilters
                q={q}
                setQ={setQ}
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
                companyOptions={companyOptions}
                instituteOptions={instituteOptions}
                locationOptions={locationOptions}
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
            <div className="grid grid-cols-1 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="h-56 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : items.length ? (
            <>
              <div className="grid grid-cols-1 gap-5">
                {items.map((p) => (
                  <DirectoryCard
                    key={p._id}
                    profile={p}
                    onViewProfile={(profile) => openPanel(profile, "profile")}
                    onViewSummary={(profile) => openPanel(profile, "summary")}
                  />
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

      <div
        className={`fixed inset-0 z-50 transition ${
          panelOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!panelOpen}
      >
        <div
          className="absolute inset-0 bg-black/20"
          onClick={closePanel}
          role="presentation"
        />
        <div
          className={`absolute right-0 top-0 h-full w-full bg-white shadow-2xl transition-transform duration-300 ease-out sm:w-[70vw] ${
            panelOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <button
            type="button"
            onClick={closePanel}
            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-orange-300 hover:text-orange-600"
            title="Close"
          >
            ×
          </button>
          <div className="h-full w-full p-6">
            <div className="h-full w-full overflow-hidden rounded-2xl border border-slate-200">
              <iframe
                title="Candidate profile"
                src={panelUrl}
                className="h-full w-full border-0"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
