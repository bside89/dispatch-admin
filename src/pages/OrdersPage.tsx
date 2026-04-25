import { useState, useEffect, useCallback, type FormEvent } from "react";
import {
  getOrders,
  deleteOrder,
  shipOrder,
  deliverOrder,
  cancelOrder,
  refundOrder,
} from "../services/api";
import type {
  Order,
  OrderFilters,
  OrderMeta,
  OrderStatus,
  ShipOrderInput,
} from "../types/Order";
import { ORDER_STATUSES } from "../types/Order";
import OrderDetail from "../components/order/OrderDetail";
import { formatCents, formatDate } from "../utils/format";
import { useAuth } from "../context/AuthContext";
import {
  canManageOrders,
  canAccessFinancial,
  canShipOrders,
  canDeliverOrders,
} from "../utils/permissions";
import type { UserRole } from "../types/User";

type ActionModal =
  | { type: "detail"; order: Order }
  | { type: "ship"; order: Order }
  | { type: "confirm"; action: "deliver" | "cancel" | "refund"; order: Order }
  | null;

type Toast = { kind: "success" | "error"; message: string } | null;

const PAGE_SIZE = 10;

const CANCELABLE: OrderStatus[] = ["PENDING", "PAID", "PROCESSED"];
const REFUNDABLE: OrderStatus[] = ["PAID", "PROCESSED", "SHIPPED", "DELIVERED"];

export default function OrdersPage() {
  const { user } = useAuth();
  const role = user?.role as UserRole | undefined;

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

  const [modal, setModal] = useState<ActionModal>(null);
  const [toast, setToast] = useState<Toast>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Ship form state
  const [shipTracking, setShipTracking] = useState("");
  const [shipCarrier, setShipCarrier] = useState("");

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

  async function handleDelete(id: string) {
    setActionLoading(true);
    try {
      await deleteOrder(id);
      showToast("success", "Order deleted.");
      if (orders.length === 1 && (filters.page ?? 1) > 1) {
        setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }));
      } else {
        loadOrders();
      }
    } catch {
      showToast("error", "Failed to delete order.");
    } finally {
      setActionLoading(false);
      setConfirmDeleteId(null);
    }
  }

  async function handleShip(e: FormEvent) {
    e.preventDefault();
    if (modal?.type !== "ship") return;
    const id = modal.order.id;
    setActionLoading(true);
    try {
      const input: ShipOrderInput = {
        trackingNumber: shipTracking || undefined,
        carrier: shipCarrier || undefined,
      };
      await shipOrder(id, input);
      showToast("success", "Order marked as shipped.");
      setModal(null);
      loadOrders();
    } catch {
      showToast("error", "Failed to ship order.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleConfirmAction() {
    if (modal?.type !== "confirm") return;
    const { action, order } = modal;
    setActionLoading(true);
    try {
      if (action === "deliver") {
        await deliverOrder(order.id);
        showToast("success", "Order marked as delivered.");
      } else if (action === "cancel") {
        await cancelOrder(order.id);
        showToast("success", "Cancellation enqueued.");
      } else if (action === "refund") {
        await refundOrder(order.id);
        showToast("success", "Refund enqueued.");
      }
      setModal(null);
      loadOrders();
    } catch {
      showToast("error", `Failed to ${action} order.`);
    } finally {
      setActionLoading(false);
    }
  }

  function openShip(order: Order) {
    setShipTracking("");
    setShipCarrier("");
    setModal({ type: "ship", order });
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

  const confirmActionLabel =
    modal?.type === "confirm"
      ? modal.action === "deliver"
        ? "Mark as Delivered"
        : modal.action === "cancel"
          ? "Cancel Order"
          : "Refund Order"
      : "";

  return (
    <div className="page px-0">
      {/* ── Toast ── */}
      {toast && (
        <div className={`toast toast-${toast.kind}`}>{toast.message}</div>
      )}

      {/* ── Header ── */}
      <header className="page-header">
        <h1>Orders</h1>
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
                      <span
                        className={`badge badge-${order.status.toLowerCase()}`}
                      >
                        {order.status}
                      </span>
                    </td>

                    <td>{formatCents(order.total)}</td>
                    <td>
                      {order.user ? order.user.name || order.user.email : "—"}
                    </td>
                    <td>{formatDate(order.createdAt)}</td>

                    <td>
                      <div className="row-actions">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setModal({ type: "detail", order })}
                        >
                          View
                        </button>

                        {order.status === "PROCESSED" &&
                          canShipOrders(role) && (
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => openShip(order)}
                            >
                              Ship
                            </button>
                          )}

                        {order.status === "SHIPPED" &&
                          canDeliverOrders(role) && (
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() =>
                                setModal({
                                  type: "confirm",
                                  action: "deliver",
                                  order,
                                })
                              }
                            >
                              Deliver
                            </button>
                          )}

                        {CANCELABLE.includes(order.status) &&
                          canAccessFinancial(role) && (
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() =>
                                setModal({
                                  type: "confirm",
                                  action: "cancel",
                                  order,
                                })
                              }
                            >
                              Cancel
                            </button>
                          )}

                        {REFUNDABLE.includes(order.status) &&
                          canAccessFinancial(role) && (
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() =>
                                setModal({
                                  type: "confirm",
                                  action: "refund",
                                  order,
                                })
                              }
                            >
                              Refund
                            </button>
                          )}

                        {canManageOrders(role) && (
                          <>
                            {confirmDeleteId === order.id ? (
                              <>
                                <button
                                  className="btn btn-danger btn-sm"
                                  disabled={actionLoading}
                                  onClick={() => handleDelete(order.id)}
                                >
                                  {actionLoading ? "…" : "Confirm"}
                                </button>
                                <button
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => setConfirmDeleteId(null)}
                                >
                                  ×
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
                          </>
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

      {/* ── Order Detail Modal ── */}
      {modal?.type === "detail" && (
        <OrderDetail order={modal.order} onClose={() => setModal(null)} />
      )}

      {/* ── Ship Modal ── */}
      {modal?.type === "ship" && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Ship Order</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setModal(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleShip}>
              <div className="modal-body p-4">
                <div className="field">
                  <label htmlFor="ship-tracking">Tracking Number</label>
                  <input
                    id="ship-tracking"
                    type="text"
                    value={shipTracking}
                    onChange={(e) => setShipTracking(e.target.value)}
                    disabled={actionLoading}
                    placeholder="Optional"
                  />
                </div>
                <div className="field">
                  <label htmlFor="ship-carrier">Carrier</label>
                  <input
                    id="ship-carrier"
                    type="text"
                    value={shipCarrier}
                    onChange={(e) => setShipCarrier(e.target.value)}
                    disabled={actionLoading}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="modal-footer p-4">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setModal(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? "Shipping…" : "Mark as Shipped"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirm Action Modal ── */}
      {modal?.type === "confirm" && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{confirmActionLabel}</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setModal(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="modal-body p-4">
              <p>
                Are you sure you want to <strong>{modal.action}</strong> order{" "}
                <span className="mono">{modal.order.id.slice(0, 8)}…</span>?
                {(modal.action === "cancel" || modal.action === "refund") && (
                  <span className="text-muted d-block mt-2">
                    This action will be processed asynchronously.
                  </span>
                )}
              </p>
            </div>
            <div className="modal-footer p-4">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setModal(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className={
                  modal.action === "deliver"
                    ? "btn btn-primary"
                    : "btn btn-danger"
                }
                disabled={actionLoading}
                onClick={handleConfirmAction}
              >
                {actionLoading ? "Processing…" : confirmActionLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
