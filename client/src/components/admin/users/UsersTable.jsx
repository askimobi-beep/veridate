import React, { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table, TableHeader, TableHead, TableRow, TableBody, TableCell,
} from "@/components/ui/table"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover" // shadcn
import UserEditDialog from "./UserEditDialog"

const formatDate = (iso) => {
  try { return new Date(iso).toLocaleString(); } catch { return iso || ""; }
};

const sumCredits = (arr = []) =>
  arr.reduce(
    (acc, c) => ({
      available: acc.available + Number(c.available || 0),
      used: acc.used + Number(c.used || 0),
      total: acc.total + Number(c.total || 0),
    }),
    { available: 0, used: 0, total: 0 }
  );

const creditSearchText = (u) => {
  const edu = (u?.verifyCredits?.education || [])
    .map((e) => `${e.institute} ${e.instituteKey}`) // names for search
    .join(" ");
  const exp = (u?.verifyCredits?.experience || [])
    .map((e) => `${e.company} ${e.companyKey}`)
    .join(" ");
  return `${edu} ${exp}`.trim();
};

const userDisplayName = (u) => {
  const orgName = String(u?.organizationName || "").trim();
  if (orgName) return orgName;
  const full = [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim();
  return full || "—";
};

export default function UsersTable({ users, onPatch }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState({ key: "createdAt", dir: "desc" });
  const [dialogUser, setDialogUser] = useState(null);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let arr = [...users];

    if (needle) {
      arr = arr.filter((u) =>
        [
          u.firstName, u.lastName, u.organizationName, u.email, u.role, u.provider,
          creditSearchText(u), // include institute/company names
        ]
          .join(" ")
          .toLowerCase()
          .includes(needle)
      );
    }

    if (sort?.key) {
      arr.sort((a, b) => {
        const A = a[sort.key], B = b[sort.key];
        if (sort.key === "createdAt" || sort.key === "updatedAt") {
          const aT = new Date(A).getTime(), bT = new Date(B).getTime();
          return sort.dir === "asc" ? aT - bT : bT - aT;
        }
        const aS = String(A ?? "").toLowerCase();
        const bS = String(B ?? "").toLowerCase();
        return sort.dir === "asc" ? aS.localeCompare(bS) : bS.localeCompare(aS);
      });
    }
    return arr;
  }, [users, q, sort]);

  const toggleSort = (key) =>
    setSort((prev) =>
      prev.key !== key ? { key, dir: "asc" } : { key, dir: prev.dir === "asc" ? "desc" : "asc" }
    );

  const openEdit = (u) => { setDialogUser(u); setOpen(true); };
  const onUpdated = (updated) => { onPatch(updated); setOpen(false); };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">All Users</h1>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, role, provider, institute, company…"
          className="w-full sm:w-96"
        />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => toggleSort("firstName")} className="cursor-pointer">
                Name {sort.key === "firstName" ? (sort.dir === "asc" ? "↑" : "↓") : ""}
              </TableHead>
              <TableHead onClick={() => toggleSort("email")} className="cursor-pointer">
                Email {sort.key === "email" ? (sort.dir === "asc" ? "↑" : "↓") : ""}
              </TableHead>
              <TableHead>Provider</TableHead>
              <TableHead onClick={() => toggleSort("role")} className="cursor-pointer">
                Role {sort.key === "role" ? (sort.dir === "asc" ? "↑" : "↓") : ""}
              </TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Blocked</TableHead>
              <TableHead onClick={() => toggleSort("createdAt")} className="cursor-pointer">
                Created {sort.key === "createdAt" ? (sort.dir === "asc" ? "↑" : "↓") : ""}
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <AnimatePresence initial={false}>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u) => {
                  const edu = sumCredits(u?.verifyCredits?.education);
                  const exp = sumCredits(u?.verifyCredits?.experience);
                  const hasPendingPhoto = Boolean(u?.profilePicPending);
                  return (
                    <motion.tr
                      key={u._id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }}
                      className={`border-b last:border-0 ${
                        hasPendingPhoto ? "bg-amber-50/70" : ""
                      }`}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>{userDisplayName(u)}</span>
                          {hasPendingPhoto ? (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                              Photo pending
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="truncate max-w-[240px]">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">{u.provider || "local"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="capitalize" variant={u.role === "admin" ? "default" : "outline"}>
                          {u.role}
                        </Badge>
                      </TableCell>

                      {/* SAFE RENDER: show totals and offer breakdown */}
                      <TableCell>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="px-2">
                              <span className="text-sm">
                                Edu: {edu.used}/{edu.total} (avail {edu.available}) •
                                {" "}Exp: {exp.used}/{exp.total} (avail {exp.available})
                              </span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 bg-white">
                            <div className="text-sm space-y-3">
                              <div>
                                <div className="font-semibold mb-1">Education</div>
                                {(u?.verifyCredits?.education || []).length === 0 ? (
                                  <div className="text-muted-foreground">None</div>
                                ) : (
                                  <ul className="list-disc pl-5 space-y-1">
                                    {u.verifyCredits.education.map((e, idx) => (
                                      <li key={idx}>
                                        {e.institute} — used {e.used}/{e.total}, avail {e.available}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                              <div>
                                <div className="font-semibold mb-1">Experience</div>
                                {(u?.verifyCredits?.experience || []).length === 0 ? (
                                  <div className="text-muted-foreground">None</div>
                                ) : (
                                  <ul className="list-disc pl-5 space-y-1">
                                    {u.verifyCredits.experience.map((e, idx) => (
                                      <li key={idx}>
                                        {e.company} — used {e.used}/{e.total}, avail {e.available}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableCell>

                      <TableCell>
                        {u.isBlocked ? (
                          <Badge variant="destructive">Blocked</Badge>
                        ) : (
                          <Badge variant="secondary">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(u.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => openEdit(u)}>Edit</Button>
                      </TableCell>
                    </motion.tr>
                  );
                })
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      <UserEditDialog
        open={open}
        onOpenChange={setOpen}
        user={dialogUser}
        onUpdated={onUpdated}
      />
    </div>
  )
}
