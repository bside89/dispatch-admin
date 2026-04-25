import type { Order } from "../../types/Order";
import { formatCents, formatDate } from "../../utils/format";

interface Props {
  order: Order;
  onClose: () => void;
}

export default function OrderDetail({ order, onClose }: Props) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Order Details</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="modal-body p-4">
          <div className="detail-section">
            <h3>Order Info</h3>
            <dl className="dl">
              <dt>ID</dt>
              <dd className="mono">{order.id}</dd>

              <dt>Status</dt>
              <dd>
                <span className={`badge badge-${order.status.toLowerCase()}`}>
                  {order.status}
                </span>
              </dd>

              <dt>Total</dt>
              <dd>{formatCents(order.total)}</dd>

              <dt>Created</dt>
              <dd>{formatDate(order.createdAt)}</dd>

              <dt>Updated</dt>
              <dd>{formatDate(order.updatedAt)}</dd>

              {order.trackingNumber && (
                <>
                  <dt>Tracking #</dt>
                  <dd className="mono">{order.trackingNumber}</dd>
                </>
              )}

              {order.carrier && (
                <>
                  <dt>Carrier</dt>
                  <dd>{order.carrier}</dd>
                </>
              )}

              {order.shippedAt && (
                <>
                  <dt>Shipped At</dt>
                  <dd>{formatDate(order.shippedAt)}</dd>
                </>
              )}

              {order.deliveredAt && (
                <>
                  <dt>Delivered At</dt>
                  <dd>{formatDate(order.deliveredAt)}</dd>
                </>
              )}
            </dl>
          </div>

          <div className="detail-section">
            <h3>Payment</h3>
            <dl className="dl">
              <dt>Payment ID</dt>
              <dd className="mono">{order.paymentData.id}</dd>

              <dt>Payment Status</dt>
              <dd>{order.paymentData.status}</dd>
            </dl>
          </div>

          <div className="detail-section">
            <h3>Customer</h3>
            {order.user ? (
              <dl className="dl">
                <dt>Name</dt>
                <dd>{order.user.name}</dd>

                <dt>Email</dt>
                <dd>{order.user.email}</dd>

                <dt>Role</dt>
                <dd>{order.user.role}</dd>

                <dt>User ID</dt>
                <dd className="mono">{order.user.id}</dd>
              </dl>
            ) : (
              <p className="empty-inline">User data not available.</p>
            )}
          </div>

          <div className="detail-section">
            <h3>Items</h3>
            {order.items && order.items.length > 0 ? (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          {item.item?.name ?? (
                            <span className="td-mono">
                              {item.itemId.slice(0, 8)}…
                            </span>
                          )}
                        </td>
                        <td>{item.quantity}</td>
                        <td>
                          {item.item ? formatCents(item.item.price) : "—"}
                        </td>
                        <td>
                          {item.item
                            ? formatCents(item.item.price * item.quantity)
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-inline">No items available.</p>
            )}
          </div>
        </div>

        <div className="modal-footer p-4">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
