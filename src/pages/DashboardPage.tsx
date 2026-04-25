import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getOrders } from "../services/api";
import { ORDER_STATUSES, type OrderStatus } from "../types/Order";

type StatusCounts = Partial<Record<OrderStatus, number>>;

export default function DashboardPage() {
  const { user } = useAuth();
  const userName = user?.name ?? "User";
  const userRole = user?.role?.toUpperCase() ?? "USER";

  const [counts, setCounts] = useState<StatusCounts>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchCounts() {
      setLoading(true);
      try {
        const results = await Promise.all(
          ORDER_STATUSES.map((status) =>
            getOrders({ status, page: 1, limit: 1 }).then((r) => ({
              status,
              total: r.meta.total,
            })),
          ),
        );
        if (!cancelled) {
          const map: StatusCounts = {};
          for (const { status, total } of results) {
            map[status] = total;
          }
          setCounts(map);
        }
      } catch {
        // ignore — counts just won't show
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCounts();
    return () => {
      cancelled = true;
    };
  }, []);

  const total = Object.values(counts).reduce((s, n) => s + (n ?? 0), 0);

  return (
    <div className="page">
      <header className="page-header">
        <h1>Dashboard</h1>
      </header>
      <main className="page-main">
        <div className="state-left state-empty">
          <p>
            Welcome, <strong>{userName}</strong>. You are signed in as{" "}
            <strong>{userRole}</strong>.
          </p>
        </div>

        <div className="dashboard-cards mt-3">
          <div className="dashboard-card">
            <span className="dashboard-card-label">Total Orders</span>
            <span className="dashboard-card-value">
              {loading ? "—" : total}
            </span>
          </div>

          {ORDER_STATUSES.map((status) => (
            <div
              key={status}
              className={`dashboard-card dashboard-card-${status.toLowerCase()}`}
            >
              <span className="dashboard-card-label">{status}</span>
              <span className="dashboard-card-value">
                {loading ? "—" : (counts[status] ?? 0)}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
