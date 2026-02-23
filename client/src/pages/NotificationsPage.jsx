import { useEffect, useState, useCallback } from "react";
import { Bell, CheckCheck, UserPlus } from "lucide-react";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/services/notificationService";

function timeAgo(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const ICON_MAP = {
  line_manager_added: UserPlus,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async (pg = 1, append = false) => {
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
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  const handleRead = async (n) => {
    if (n.read) return;
    try {
      await markNotificationRead(n._id);
      setNotifications((prev) =>
        prev.map((x) => (x._id === n._id ? { ...x, read: true } : x))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
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

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            className="flex items-center gap-1.5 text-sm font-medium text-[color:var(--brand-orange)] hover:underline"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </button>
        )}
      </div>

      {/* List */}
      <div className="bg-white rounded-xl ring-1 ring-black/5 shadow-sm overflow-hidden divide-y divide-gray-100">
        {loading && notifications.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-sm text-gray-400">
            Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <Bell className="h-12 w-12 text-gray-200 mb-4" />
            <p className="text-gray-400">No notifications yet</p>
          </div>
        ) : (
          <>
            {notifications.map((n) => {
              const Icon = ICON_MAP[n.type] || Bell;
              return (
                <button
                  key={n._id}
                  onClick={() => handleRead(n)}
                  className={`w-full flex items-start gap-4 px-5 py-4 text-left transition hover:bg-gray-50 ${
                    !n.read ? "bg-orange-50/60" : ""
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      !n.read
                        ? "bg-[color:var(--brand-orange)] text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm leading-relaxed ${
                        !n.read
                          ? "font-medium text-gray-900"
                          : "text-gray-600"
                      }`}
                    >
                      {n.message}
                    </p>
                    <span className="text-xs text-gray-400 mt-1 block">
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>

                  {/* Unread dot */}
                  {!n.read && (
                    <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[color:var(--brand-orange)]" />
                  )}
                </button>
              );
            })}

            {/* Load more */}
            {notifications.length < total && (
              <button
                onClick={loadMore}
                disabled={loading}
                className="w-full py-4 text-center text-sm font-medium text-[color:var(--brand-orange)] hover:bg-gray-50 transition"
              >
                {loading ? "Loading..." : "Show more notifications"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
