import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchJobs } from "@/services/jobService";
import {
  Search,
  MapPin,
  Building2,
  Briefcase,
  ChevronRight,
} from "lucide-react";

export default function JobsDirectory() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [company, setCompany] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeFilters, setActiveFilters] = useState(null);

  const currentFilters = useMemo(
    () => ({ title, location, company }),
    [title, location, company]
  );

  const hasFilters = useMemo(
    () => Object.values(currentFilters).some((v) => String(v || "").trim()),
    [currentFilters]
  );

  const hasMore = useMemo(() => page * limit < total, [page, limit, total]);

  const loadJobs = async (filters) => {
    if (!filters) return;
    setLoading(true);
    try {
      const res = await fetchJobs({ ...filters, page, limit });
      setItems(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error("Failed to load jobs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasSearched || !activeFilters) return;
    loadJobs(activeFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, activeFilters, hasSearched]);

  const onSearch = (e) => {
    e.preventDefault();
    if (!hasFilters) {
      setItems([]);
      setTotal(0);
      setHasSearched(false);
      setActiveFilters(null);
      return;
    }
    setHasSearched(true);
    setPage(1);
    setActiveFilters({ ...currentFilters });
  };

  const onReset = () => {
    setTitle("");
    setLocation("");
    setCompany("");
    setPage(1);
    setItems([]);
    setTotal(0);
    setHasSearched(false);
    setActiveFilters(null);
  };

  const formatDate = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pt-6 pb-0">
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        {/* Filters */}
        <aside className="lg:sticky lg:top-6 h-fit">
          <Card className="rounded-2xl border border-white/60 bg-white/60 shadow-[0_22px_50px_-26px_rgba(15,23,42,0.4)] backdrop-blur-md">
            <div className="border-b border-white/60 px-4 py-3 text-left">
              <h2 className="text-sm font-semibold text-slate-800">
                Job Filters
              </h2>
            </div>
            <form
              onSubmit={onSearch}
              className="px-4 pt-2 pb-4 space-y-3"
            >
              <div className="space-y-1">
                <label className="block text-left text-xs font-medium text-slate-600">
                  Job Title
                </label>
                <Input
                  placeholder="e.g. Software Engineer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-left text-xs font-medium text-slate-600">
                  Location
                </label>
                <Input
                  placeholder="e.g. New York"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-left text-xs font-medium text-slate-600">
                  Company
                </label>
                <Input
                  placeholder="e.g. Acme Inc"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  type="submit"
                  className="flex-1 bg-[color:var(--brand-orange)] text-white hover:brightness-110"
                >
                  <Search className="h-4 w-4 mr-1" />
                  Search
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onReset}
                  className="flex-1"
                >
                  Reset
                </Button>
              </div>
            </form>
          </Card>
        </aside>

        {/* Results */}
        <section className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="h-32 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : items.length ? (
            <>
              <div className="grid grid-cols-1 gap-4">
                {items.map((job) => {
                  const companyData = job.company || {};
                  const companyName =
                    typeof companyData === "object"
                      ? companyData.name || "Unknown"
                      : "Unknown";
                  const companyId =
                    typeof companyData === "object"
                      ? companyData._id
                      : companyData;

                  return (
                    <Card
                      key={job._id}
                      className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-md hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-[color:var(--brand-orange)] shrink-0" />
                            <h3 className="text-base font-semibold text-slate-800 truncate">
                              {job.title}
                            </h3>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5" />
                              {companyName}
                            </span>
                            {job.location ? (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {job.location}
                              </span>
                            ) : null}
                            {job.createdAt ? (
                              <span className="text-xs text-slate-400">
                                Posted {formatDate(job.createdAt)}
                              </span>
                            ) : null}
                          </div>

                          {job.description ? (
                            <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                              {job.description}
                            </p>
                          ) : null}
                        </div>

                        {companyId ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(`/dashboard/companies/${companyId}`)
                            }
                            className="shrink-0 rounded-full border-[color:var(--brand-orange)] text-[color:var(--brand-orange)] hover:brand-orange-soft text-xs gap-1"
                          >
                            View Company
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        ) : null}
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {(page - 1) * limit + 1} -{" "}
                  {Math.min(page * limit, total)} of {total}
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
              No jobs found.
            </div>
          ) : (
            <div className="text-center text-sm text-muted-foreground py-16">
              Use filters to search for jobs.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
