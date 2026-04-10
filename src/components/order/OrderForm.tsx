import { useState, type FormEvent } from "react";
import type { Order, OrderItemInput } from "../../types/Order";
import { createOrder, updateOrder } from "../../services/api";

interface Props {
  order?: Order;
  onSuccess: () => void;
  onClose: () => void;
}

const emptyItem = (): OrderItemInput => ({
  productId: "",
  quantity: 1,
  price: 0,
});

export default function OrderForm({ order, onSuccess, onClose }: Props) {
  const isEdit = !!order;

  const [items, setItems] = useState<OrderItemInput[]>(
    order?.items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      price: i.price,
    })) ?? [emptyItem()],
  );

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateItem(
    index: number,
    field: keyof OrderItemInput,
    value: string,
  ) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]:
                field === "productId" ? value : Math.max(0, Number(value)),
            }
          : item,
      ),
    );
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function validate(): string | null {
    if (items.length === 0) return "Add at least one item.";
    for (const [i, item] of items.entries()) {
      if (!item.productId.trim())
        return `Item ${i + 1}: Product ID is required.`;
      if (item.quantity < 1)
        return `Item ${i + 1}: Quantity must be at least 1.`;
      if (item.price < 1)
        return `Item ${i + 1}: Price must be greater than 0 cents.`;
    }
    return null;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitted) return;

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setLoading(true);
    setSubmitted(true);

    try {
      if (isEdit) {
        await updateOrder(order.id, { items });
      } else {
        await createOrder({ items });
      }
      onSuccess();
    } catch (err: unknown) {
      const msg =
        (err as any)?.response?.data?.message ??
        `Failed to ${isEdit ? "update" : "create"} order.`;
      setError(msg);
      setSubmitted(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? "Edit Order" : "New Order"}</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}

            <div className="items-list">
              {items.map((item, index) => (
                <div key={index} className="item-row">
                  <div className="field">
                    <label>Product ID</label>
                    <input
                      type="text"
                      placeholder="prod_abc123"
                      value={item.productId}
                      onChange={(e) =>
                        updateItem(index, "productId", e.target.value)
                      }
                      disabled={loading}
                    />
                  </div>

                  <div className="field field-sm">
                    <label>Qty</label>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(index, "quantity", e.target.value)
                      }
                      disabled={loading}
                    />
                  </div>

                  <div className="field field-sm">
                    <label>Price (¢)</label>
                    <input
                      type="number"
                      min={1}
                      placeholder="1999"
                      value={item.price || ""}
                      onChange={(e) =>
                        updateItem(index, "price", e.target.value)
                      }
                      disabled={loading}
                    />
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm btn-icon"
                      onClick={() => removeItem(index)}
                      disabled={loading}
                      aria-label="Remove item"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={addItem}
              disabled={loading}
            >
              + Add item
            </button>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Saving…" : isEdit ? "Save changes" : "Create order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
