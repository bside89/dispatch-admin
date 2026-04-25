import { useState, useEffect, useCallback, type FormEvent } from "react";
import { getItems, createItem, updateItem, deleteItem } from "../services/api";
import type {
  Item,
  ItemFilters,
  ItemsMeta,
  CreateItemInput,
  UpdateItemInput,
} from "../types/Item";
import { formatCents, formatDate } from "../utils/format";

type Modal = { type: "create" } | { type: "edit"; item: Item } | null;

type Toast = { kind: "success" | "error"; message: string } | null;

const PAGE_SIZE = 10;

interface ItemFormState {
  name: string;
  description: string;
  stock: string;
  price: string; // displayed in BRL, stored in cents
  pricePaymentId: string;
}

const emptyForm = (): ItemFormState => ({
  name: "",
  description: "",
  stock: "",
  price: "",
  pricePaymentId: "",
});

function formFromItem(item: Item): ItemFormState {
  return {
    name: item.name,
    description: item.description,
    stock: String(item.stock),
    price: (item.price / 100).toFixed(2),
    pricePaymentId: item.pricePaymentId ?? "",
  };
}

function validateForm(form: ItemFormState, isCreate: boolean): string | null {
  if (isCreate || form.name) {
    if (form.name.length < 2 || form.name.length > 100)
      return "Name must be between 2 and 100 characters.";
  }
  if (isCreate && !form.description.trim()) return "Description is required.";
  if (isCreate || form.stock) {
    const stock = Number(form.stock);
    if (!Number.isInteger(stock) || stock < 0)
      return "Stock must be a non-negative integer.";
  }
  if (isCreate || form.price) {
    const price = Math.round(parseFloat(form.price) * 100);
    if (isNaN(price) || price < 1) return "Price must be greater than R$ 0.";
  }
  return null;
}

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [meta, setMeta] = useState<ItemsMeta>({
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<ItemFilters>({
    page: 1,
    limit: PAGE_SIZE,
  });
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [modal, setModal] = useState<Modal>(null);
  const [form, setForm] = useState<ItemFormState>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [toast, setToast] = useState<Toast>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const result = await getItems(filters);
      setItems(result.data);
      setMeta(result.meta);
    } catch {
      setFetchError("Failed to load items.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  function showToast(kind: "success" | "error", message: string) {
    setToast({ kind, message });
    setTimeout(() => setToast(null), 4000);
  }

  function openCreate() {
    setForm(emptyForm());
    setFormError(null);
    setModal({ type: "create" });
  }

  function openEdit(item: Item) {
    setForm(formFromItem(item));
    setFormError(null);
    setModal({ type: "edit", item });
  }

  function handleFieldChange(field: keyof ItemFormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const isCreate = modal?.type === "create";
    const error = validateForm(form, isCreate);
    if (error) {
      setFormError(error);
      return;
    }
    setFormError(null);
    setFormLoading(true);
    try {
      if (isCreate) {
        const input: CreateItemInput = {
          name: form.name,
          description: form.description,
          stock: Number(form.stock),
          price: Math.round(parseFloat(form.price) * 100),
          pricePaymentId: form.pricePaymentId || undefined,
        };
        await createItem(input);
        showToast("success", "Item created.");
      } else if (modal?.type === "edit") {
        const input: UpdateItemInput = {};
        if (form.name) input.name = form.name;
        if (form.description) input.description = form.description;
        if (form.stock !== "") input.stock = Number(form.stock);
        if (form.price !== "")
          input.price = Math.round(parseFloat(form.price) * 100);
        if (form.pricePaymentId !== "")
          input.pricePaymentId = form.pricePaymentId;
        await updateItem(modal.item.id, input);
        showToast("success", "Item updated.");
      }
      setModal(null);
      loadItems();
    } catch (err: unknown) {
      const raw = (err as { response?: { data?: { message?: unknown } } })
        ?.response?.data?.message;
      const msg = Array.isArray(raw)
        ? raw.join(" ")
        : typeof raw === "string"
          ? raw
          : `Failed to ${isCreate ? "create" : "update"} item.`;
      setFormError(msg);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteItem(id);
      showToast("success", "Item deleted.");
      if (items.length === 1 && (filters.page ?? 1) > 1) {
        setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }));
      } else {
        loadItems();
      }
    } catch {
      showToast("error", "Failed to delete item.");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  function applyFilter(key: keyof ItemFilters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value || undefined, page: 1 }));
  }

  const isCreate = modal?.type === "create";

  return (
    <div className="page px-0">
      {toast && (
        <div className={`toast toast-${toast.kind}`}>{toast.message}</div>
      )}

      <header className="page-header">
        <h1>Items</h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={openCreate}>
            New Item
          </button>
        </div>
      </header>

      <main className="page-main">
        <div className="filters-bar">
          <input
            type="text"
            placeholder="Filter by name…"
            value={filters.name ?? ""}
            onChange={(e) => applyFilter("name", e.target.value)}
          />
          <input
            type="text"
            placeholder="Filter by description…"
            value={filters.description ?? ""}
            onChange={(e) => applyFilter("description", e.target.value)}
          />
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setFilters({ page: 1, limit: PAGE_SIZE })}
          >
            Clear
          </button>
        </div>

        {loading && <div className="state-center">Loading…</div>}

        {!loading && fetchError && (
          <div className="alert alert-error">
            {fetchError}{" "}
            <button className="btn btn-ghost btn-sm" onClick={loadItems}>
              Retry
            </button>
          </div>
        )}

        {!loading && !fetchError && items.length === 0 && (
          <div className="state-center state-empty">No items found.</div>
        )}

        {!loading && !fetchError && items.length > 0 && (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Stock</th>
                  <th>Price</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className="td-mono" title={item.id}>
                        {item.id.slice(0, 8)}…
                      </span>
                    </td>
                    <td>{item.name}</td>
                    <td className="td-truncate" title={item.description}>
                      {item.description.length > 60
                        ? item.description.slice(0, 60) + "…"
                        : item.description}
                    </td>
                    <td>{item.stock}</td>
                    <td>{formatCents(item.price)}</td>
                    <td>{formatDate(item.createdAt)}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => openEdit(item)}
                        >
                          Edit
                        </button>

                        {confirmDeleteId === item.id ? (
                          <>
                            <button
                              className="btn btn-danger btn-sm"
                              disabled={deletingId === item.id}
                              onClick={() => handleDelete(item.id)}
                            >
                              {deletingId === item.id ? "…" : "Confirm"}
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
                            onClick={() => setConfirmDeleteId(item.id)}
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
              Page {meta.page} of {meta.totalPages} · {meta.total} items
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

      {/* ── Create/Edit Modal ── */}
      {modal !== null && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isCreate ? "New Item" : "Edit Item"}</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setModal(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="modal-body p-4">
                {formError && (
                  <div className="alert alert-error">{formError}</div>
                )}

                <div className="field">
                  <label htmlFor="item-name">
                    Name {isCreate && <span className="req">*</span>}
                  </label>
                  <input
                    id="item-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    disabled={formLoading}
                    minLength={2}
                    maxLength={100}
                    required={isCreate}
                  />
                </div>

                <div className="field">
                  <label htmlFor="item-desc">
                    Description {isCreate && <span className="req">*</span>}
                  </label>
                  <textarea
                    id="item-desc"
                    value={form.description}
                    onChange={(e) =>
                      handleFieldChange("description", e.target.value)
                    }
                    disabled={formLoading}
                    rows={3}
                    required={isCreate}
                  />
                </div>

                <div className="fields-row">
                  <div className="field">
                    <label htmlFor="item-stock">
                      Stock {isCreate && <span className="req">*</span>}
                    </label>
                    <input
                      id="item-stock"
                      type="number"
                      min={0}
                      step={1}
                      value={form.stock}
                      onChange={(e) =>
                        handleFieldChange("stock", e.target.value)
                      }
                      disabled={formLoading}
                      required={isCreate}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="item-price">
                      Price (R$) {isCreate && <span className="req">*</span>}
                    </label>
                    <input
                      id="item-price"
                      type="number"
                      min={0.01}
                      step={0.01}
                      placeholder="0.00"
                      value={form.price}
                      onChange={(e) =>
                        handleFieldChange("price", e.target.value)
                      }
                      disabled={formLoading}
                      required={isCreate}
                    />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="item-ppid">Price Payment ID</label>
                  <input
                    id="item-ppid"
                    type="text"
                    placeholder="price_... (optional)"
                    value={form.pricePaymentId}
                    onChange={(e) =>
                      handleFieldChange("pricePaymentId", e.target.value)
                    }
                    disabled={formLoading}
                  />
                </div>
              </div>

              <div className="modal-footer p-4">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setModal(null)}
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={formLoading}
                >
                  {formLoading
                    ? "Saving…"
                    : isCreate
                      ? "Create Item"
                      : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
