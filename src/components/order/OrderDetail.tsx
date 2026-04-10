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

        <div className="modal-body">
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

                <dt>User ID</dt>
                <dd className="mono">{order.user.id}</dd>
              </dl>
            ) : (
              <p className="empty-inline">User data not available.</p>
            )}
          </div>

          <div className="detail-section">
            <h3>Items</h3>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product ID</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="td-mono">{item.productId}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCents(item.price)}</td>
                      <td>{formatCents(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
