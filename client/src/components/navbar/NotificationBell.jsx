import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCheck, UserPlus } from "lucide-react";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/services/notificationService";

/* Route to navigate to when a notification type is clicked */
function resolveNotificationRoute(n) {
  if (n.type === "line_manager_added") {
    const { fromUserId, experienceId } = n.metadata || {};
    const params = new URLSearchParams({ section: "experience" });
    if (experienceId) params.set("experienceId", experienceId);
    if (fromUserId) return `/dashboard/profile/${fromUserId}?${params}`;
    return `/dashboard/profile?section=experience`;
  }
  return null;
}

/* ── helpers ── */
function timeAgo(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d`;
  return new Date(dateStr).toLocaleDateString();
}

const ICON_MAP = {
  line_manager_added: UserPlus,
};

/* ── component ── */
export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const panelRef = useRef(null);
  const btnRef = useRef(null);

  /* ── fetch ── */
  const load = useCallback(
    async (pg = 1, append = false) => {
      try {
        setLoading(true);
        const res = await fetchNotifications({ page: pg, limit: 20 });
        const list = res?.data?.notifications ?? res?.notifications ?? [];
        const unread = res?.data?.unreadCount ?? res?.unreadCount ?? 0;
        const tot = res?.data?.total ?? res?.total ?? 0;
        setNotifications((prev) => (append ? [...prev, ...list] : list));
        setUnreadCount(unread);
        setTotal(tot);
        setPage(pg);
      } catch (err) {
        console.error("Failed to load notifications", err);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /* poll every 30s for badge count */
  useEffect(() => {
    load(1);
    const id = setInterval(() => load(1), 30_000);
    return () => clearInterval(id);
  }, [load]);

  /* re-fetch when panel opens */
  useEffect(() => {
    if (open) load(1);
  }, [open, load]);

  /* close on click-outside / Escape */
  useEffect(() => {
    function onDoc(e) {
      if (
        open &&
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      )
        setOpen(false);
    }
    function onEsc(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  /* ── actions ── */
  const handleRead = async (n) => {
    try {
      if (!n.read) {
        await markNotificationRead(n._id);
        setNotifications((prev) =>
          prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)),
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error(err);
    }
    const route = resolveNotificationRoute(n);
    if (route) {
      setOpen(false);
      navigate(route);
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMore = () => {
    if (notifications.length < total) load(page + 1, true);
  };

  /* ── render ── */
  return (
    <div className="relative">
      {/* Bell trigger */}
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative p-2 rounded-full hover:bg-gray-100 transition"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 top-12 w-[380px] max-h-[520px] bg-white shadow-2xl rounded-xl ring-1 ring-black/5 overflow-hidden z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="flex items-center gap-1 text-xs font-medium text-[color:var(--brand-orange)] hover:underline"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all as read
                </button>
              )}
            </div>

            {/* Notification list */}
            <div className="flex-1 overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-sm text-gray-400">
                  Loading...
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <Bell className="h-10 w-10 text-gray-200 mb-3" />
                  <p className="text-sm text-gray-400">No notifications yet</p>
                </div>
              ) : (
                <>
                  {notifications.map((n) => {
                    const Icon = ICON_MAP[n.type] || Bell;
                    return (
                      <button
                        key={n._id}
                        onClick={() => handleRead(n)}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-left transition hover:bg-gray-50 ${
                          !n.read ? "bg-orange-50/60" : ""
                        }`}
                      >
                        {/* Icon */}
                        <div
                          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                            !n.read
                              ? "bg-[color:var(--brand-orange)] text-white"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm leading-snug ${
                              !n.read
                                ? "font-medium text-gray-900"
                                : "text-gray-600"
                            }`}
                          >
                            {n.message}
                          </p>
                          <span className="text-xs text-gray-400 mt-0.5 block">
                            {timeAgo(n.createdAt)}
                          </span>
                        </div>

                        {/* Unread dot */}
                        {!n.read && (
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[color:var(--brand-orange)]" />
                        )}
                      </button>
                    );
                  })}

                  {/* Load more */}
                  {notifications.length < total && (
                    <button
                      onClick={loadMore}
                      disabled={loading}
                      className="w-full py-3 text-center text-sm font-medium text-[color:var(--brand-orange)] hover:bg-gray-50 transition border-t border-gray-100"
                    >
                      {loading ? "Loading..." : "Show more"}
                    </button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
