import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getOrders,
  deleteOrder,
  updateOrderStatus,
  logout,
} from "../services/api";
import type {
  Order,
  OrderFilters,
  OrderMeta,
  OrderStatus,
} from "../types/Order";
import { ORDER_STATUSES } from "../types/Order";
import OrderForm from "../components/order/OrderForm";
import OrderDetail from "../components/order/OrderDetail";
import { formatCents, formatDate } from "../utils/format";

type Modal =
  | { type: "create" }
  | { type: "edit"; order: Order }
  | { type: "detail"; order: Order }
  | null;

type Toast = { kind: "success" | "error"; message: string } | null;

const PAGE_SIZE = 10;

export default function OrdersPage() {
  const navigate = useNavigate();
  const { logoutUser } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState<OrderMeta>({
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<OrderFilters>({
    page: 1,
    limit: PAGE_SIZE,
  });
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [modal, setModal] = useState<Modal>(null);
  const [toast, setToast] = useState<Toast>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const result = await getOrders(filters);
      setOrders(result.data);
      setMeta(result.meta);
    } catch {
      setFetchError("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  function showToast(kind: "success" | "error", message: string) {
    setToast({ kind, message });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleLogout() {
    try {
      await logout();
    } finally {
      logoutUser();
      navigate("/login", { replace: true });
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteOrder(id);
      showToast("success", "Order deleted.");
      // Go to previous page if we deleted the last item on a non-first page
      if (orders.length === 1 && (filters.page ?? 1) > 1) {
        setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }));
      } else {
        loadOrders();
      }
    } catch {
      showToast("error", "Failed to delete order.");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  async function handleStatusChange(id: string, status: OrderStatus) {
    // Optimistic update
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    try {
      const updated = await updateOrderStatus(id, { status });
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
    } catch {
      showToast("error", "Failed to update status.");
      loadOrders(); // revert by reloading
    }
  }

  function applyFilter(key: keyof OrderFilters, value: string) {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
      page: 1,
    }));
  }

  function clearFilters() {
    setFilters({ page: 1, limit: PAGE_SIZE });
  }

  return (
    <div className="page">
      {/* ── Header ── */}
      <header className="page-header">
        <h1>Orders</h1>
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => setModal({ type: "create" })}
          >
            New Order
          </button>
          <button className="btn btn-ghost" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="page-main">
        {/* ── Filters ── */}
        <div className="filters-bar">
          <select
            value={filters.status ?? ""}
            onChange={(e) => applyFilter("status", e.target.value)}
            title="Filter by status"
          >
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="User ID"
            value={filters.userId ?? ""}
            onChange={(e) => applyFilter("userId", e.target.value)}
          />

          <input
            type="date"
            title="Start date"
            value={filters.startDate ?? ""}
            onChange={(e) => applyFilter("startDate", e.target.value)}
          />

          <input
            type="date"
            title="End date"
            value={filters.endDate ?? ""}
            onChange={(e) => applyFilter("endDate", e.target.value)}
          />

          <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
            Clear
          </button>
        </div>

        {/* ── Loading ── */}
        {loading && <div className="state-center">Loading…</div>}

        {/* ── Error ── */}
        {!loading && fetchError && (
          <div className="alert alert-error">
            {fetchError}{" "}
            <button className="btn btn-ghost btn-sm" onClick={loadOrders}>
              Retry
            </button>
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && !fetchError && orders.length === 0 && (
          <div className="state-center state-empty">No orders found.</div>
        )}

        {/* ── Table ── */}
        {!loading && !fetchError && orders.length > 0 && (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>User</th>
                  <th>Created</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <span className="td-mono" title={order.id}>
                        {order.id.slice(0, 8)}…
                      </span>
                    </td>

                    <td>
                      <select
                        className={`status-badge-select status-badge-${order.status.toLowerCase()}`}
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(
                            order.id,
                            e.target.value as OrderStatus,
                          )
                        }
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>{formatCents(order.total)}</td>
                    <td>
                      {order.user ? order.user.name || order.user.email : "—"}
                    </td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>{formatDate(order.updatedAt)}</td>

                    <td>
                      <div className="row-actions">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setModal({ type: "detail", order })}
                        >
                          View
                        </button>

                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setModal({ type: "edit", order })}
                        >
                          Edit
                        </button>

                        {confirmDeleteId === order.id ? (
                          <>
                            <button
                              className="btn btn-danger btn-sm"
                              disabled={deletingId === order.id}
                              onClick={() => handleDelete(order.id)}
                            >
                              {deletingId === order.id
                                ? "Deleting…"
                                : "Confirm"}
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setConfirmDeleteId(order.id)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {meta.totalPages > 1 && (
          <div className="pagination">
            <button
              className="btn btn-ghost btn-sm"
              disabled={meta.page <= 1}
              onClick={() =>
                setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))
              }
            >
              ← Previous
            </button>

            <span className="pagination-info">
              Page {meta.page} of {meta.totalPages} · {meta.total} orders
            </span>

            <button
              className="btn btn-ghost btn-sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() =>
                setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))
              }
            >
              Next →
            </button>
          </div>
        )}
      </main>

      {/* ── Modals ── */}
      {modal?.type === "detail" && (
        <OrderDetail order={modal.order} onClose={() => setModal(null)} />
      )}

      {modal?.type === "create" && (
        <OrderForm
          onSuccess={() => {
            setModal(null);
            showToast("success", "Order created successfully.");
            loadOrders();
          }}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === "edit" && (
        <OrderForm
          order={modal.order}
          onSuccess={() => {
            setModal(null);
            showToast("success", "Order updated successfully.");
            loadOrders();
          }}
          onClose={() => setModal(null)}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`toast toast-${toast.kind}`}>{toast.message}</div>
      )}
    </div>
  );
}
