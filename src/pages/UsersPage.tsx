import { useState, useEffect, useCallback, type FormEvent } from "react";
import { getUsers, createUser, updateUser, deleteUser } from "../services/api";
import type {
  User,
  UserFilters,
  UsersMeta,
  CreateUserInput,
  UpdateUserInput,
  UserRole,
} from "../types/User";
import { USER_ROLES } from "../types/User";
import { formatDate } from "../utils/format";

type Modal = { type: "create" } | { type: "edit"; user: User } | null;

type Toast = { kind: "success" | "error"; message: string } | null;

const PAGE_SIZE = 10;

interface UserFormState {
  name: string;
  email: string;
  password: string;
  currentPassword: string;
  language: string;
  role: string;
  // address
  addrLine1: string;
  addrLine2: string;
  addrCity: string;
  addrState: string;
  addrPostalCode: string;
  addrCountry: string;
}

const emptyForm = (): UserFormState => ({
  name: "",
  email: "",
  password: "",
  currentPassword: "",
  language: "",
  role: "",
  addrLine1: "",
  addrLine2: "",
  addrCity: "",
  addrState: "",
  addrPostalCode: "",
  addrCountry: "",
});

function formFromUser(user: User): UserFormState {
  return {
    name: user.name,
    email: user.email,
    password: "",
    currentPassword: "",
    language: user.language ?? "",
    role: user.role ?? "",
    addrLine1: user.address?.line1 ?? "",
    addrLine2: user.address?.line2 ?? "",
    addrCity: user.address?.city ?? "",
    addrState: user.address?.state ?? "",
    addrPostalCode: user.address?.postalCode ?? "",
    addrCountry: user.address?.country ?? "",
  };
}

function validateForm(form: UserFormState, isCreate: boolean): string | null {
  if (!form.name || form.name.length < 2 || form.name.length > 100)
    return "Name must be between 2 and 100 characters.";
  if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    return "Enter a valid email address.";
  if (isCreate) {
    if (!form.password || form.password.length < 6)
      return "Password must be at least 6 characters.";
  } else if (form.password) {
    if (form.password.length < 6)
      return "New password must be at least 6 characters.";
    if (!form.currentPassword)
      return "Current password is required to set a new password.";
  }
  if (form.addrCountry && form.addrCountry.length !== 2)
    return "Country must be a 2-letter ISO code (e.g. BR).";
  if (form.addrLine1 && form.addrLine1.length > 200)
    return "Address line 1 must be at most 200 characters.";
  if (form.addrLine2 && form.addrLine2.length > 200)
    return "Address line 2 must be at most 200 characters.";
  if (form.addrCity && form.addrCity.length > 100)
    return "City must be at most 100 characters.";
  if (form.addrState && form.addrState.length > 100)
    return "State must be at most 100 characters.";
  return null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<UsersMeta>({
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    limit: PAGE_SIZE,
  });
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [modal, setModal] = useState<Modal>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [toast, setToast] = useState<Toast>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const result = await getUsers(filters);
      setUsers(result.data);
      setMeta(result.meta);
    } catch {
      setFetchError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function showToast(kind: "success" | "error", message: string) {
    setToast({ kind, message });
    setTimeout(() => setToast(null), 4000);
  }

  function openCreate() {
    setForm(emptyForm());
    setFormError(null);
    setModal({ type: "create" });
  }

  function openEdit(user: User) {
    setForm(formFromUser(user));
    setFormError(null);
    setModal({ type: "edit", user });
  }

  function handleFieldChange(field: keyof UserFormState, value: string) {
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

    const hasAddress = [
      form.addrLine1,
      form.addrLine2,
      form.addrCity,
      form.addrState,
      form.addrPostalCode,
      form.addrCountry,
    ].some(Boolean);

    const address = hasAddress
      ? {
          line1: form.addrLine1 || undefined,
          line2: form.addrLine2 || undefined,
          city: form.addrCity || undefined,
          state: form.addrState || undefined,
          postalCode: form.addrPostalCode || undefined,
          country: form.addrCountry || undefined,
        }
      : undefined;

    try {
      if (isCreate) {
        const input: CreateUserInput = {
          name: form.name,
          email: form.email,
          password: form.password,
          language: form.language || undefined,
          role: (form.role as UserRole) || undefined,
          address,
        };
        await createUser(input);
        showToast("success", "User created.");
      } else if (modal?.type === "edit") {
        const input: UpdateUserInput = {
          name: form.name || undefined,
          email: form.email || undefined,
          language: form.language || undefined,
          role: (form.role as UserRole) || undefined,
          address,
        };
        if (form.password) {
          input.password = form.password;
          input.currentPassword = form.currentPassword;
        }
        await updateUser(modal.user.id, input);
        showToast("success", "User updated.");
      }
      setModal(null);
      loadUsers();
    } catch (err: unknown) {
      const raw = (err as { response?: { data?: { message?: unknown } } })
        ?.response?.data?.message;
      const msg = Array.isArray(raw)
        ? raw.join(" ")
        : typeof raw === "string"
          ? raw
          : `Failed to ${isCreate ? "create" : "update"} user.`;
      setFormError(msg);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteUser(id);
      showToast("success", "User deleted.");
      if (users.length === 1 && (filters.page ?? 1) > 1) {
        setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }));
      } else {
        loadUsers();
      }
    } catch {
      showToast("error", "Failed to delete user.");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  function applyFilter(key: keyof UserFilters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value || undefined, page: 1 }));
  }

  const isCreate = modal?.type === "create";
  const showPasswordFields = isCreate || !!form.password;

  return (
    <div className="page px-0">
      {toast && (
        <div className={`toast toast-${toast.kind}`}>{toast.message}</div>
      )}

      <header className="page-header">
        <h1>Users</h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={openCreate}>
            New User
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
            placeholder="Filter by email…"
            value={filters.email ?? ""}
            onChange={(e) => applyFilter("email", e.target.value)}
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
            <button className="btn btn-ghost btn-sm" onClick={loadUsers}>
              Retry
            </button>
          </div>
        )}

        {!loading && !fetchError && users.length === 0 && (
          <div className="state-center state-empty">No users found.</div>
        )}

        {!loading && !fetchError && users.length > 0 && (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Language</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <span className="td-mono" title={user.id}>
                        {user.id.slice(0, 8)}…
                      </span>
                    </td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge badge-role-${user.role}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>{user.language}</td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => openEdit(user)}
                        >
                          Edit
                        </button>

                        {confirmDeleteId === user.id ? (
                          <>
                            <button
                              className="btn btn-danger btn-sm"
                              disabled={deletingId === user.id}
                              onClick={() => handleDelete(user.id)}
                            >
                              {deletingId === user.id ? "…" : "Confirm"}
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
                            onClick={() => setConfirmDeleteId(user.id)}
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
              Page {meta.page} of {meta.totalPages} · {meta.total} users
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
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isCreate ? "New User" : "Edit User"}</h2>
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

                <div className="settings-section mb-3">
                  <h3 className="settings-section-title">Profile</h3>
                  <div className="fields-row">
                    <div className="field">
                      <label htmlFor="u-name">
                        Name <span className="req">*</span>
                      </label>
                      <input
                        id="u-name"
                        type="text"
                        value={form.name}
                        onChange={(e) =>
                          handleFieldChange("name", e.target.value)
                        }
                        disabled={formLoading}
                        minLength={2}
                        maxLength={100}
                        required
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="u-email">
                        Email <span className="req">*</span>
                      </label>
                      <input
                        id="u-email"
                        type="email"
                        value={form.email}
                        onChange={(e) =>
                          handleFieldChange("email", e.target.value)
                        }
                        disabled={formLoading}
                        required
                      />
                    </div>
                  </div>

                  <div className="fields-row">
                    <div className="field">
                      <label htmlFor="u-lang">Language</label>
                      <input
                        id="u-lang"
                        type="text"
                        placeholder="pt-BR"
                        value={form.language}
                        onChange={(e) =>
                          handleFieldChange("language", e.target.value)
                        }
                        disabled={formLoading}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="u-role">Role</label>
                      <select
                        id="u-role"
                        value={form.role}
                        onChange={(e) =>
                          handleFieldChange("role", e.target.value)
                        }
                        disabled={formLoading}
                      >
                        <option value="">— select role —</option>
                        {USER_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="settings-section mb-3">
                  <h3 className="settings-section-title">
                    {isCreate ? "Password" : "Change Password"}
                  </h3>
                  {!isCreate && (
                    <p className="form-hint mb-2">
                      Leave blank to keep the current password.
                    </p>
                  )}
                  <div className="fields-row">
                    <div className="field">
                      <label htmlFor="u-password">
                        {isCreate ? (
                          <>
                            Password <span className="req">*</span>
                          </>
                        ) : (
                          "New Password"
                        )}
                      </label>
                      <input
                        id="u-password"
                        type="password"
                        value={form.password}
                        onChange={(e) =>
                          handleFieldChange("password", e.target.value)
                        }
                        disabled={formLoading}
                        minLength={6}
                        required={isCreate}
                        autoComplete="new-password"
                      />
                    </div>
                    {(!isCreate || showPasswordFields) && form.password && (
                      <div className="field">
                        <label htmlFor="u-current-password">
                          Current Password <span className="req">*</span>
                        </label>
                        <input
                          id="u-current-password"
                          type="password"
                          value={form.currentPassword}
                          onChange={(e) =>
                            handleFieldChange("currentPassword", e.target.value)
                          }
                          disabled={formLoading}
                          required
                          autoComplete="current-password"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="settings-section">
                  <h3 className="settings-section-title">Address</h3>
                  <div className="settings-fields">
                    <div className="field">
                      <label htmlFor="u-line1">Address Line 1</label>
                      <input
                        id="u-line1"
                        type="text"
                        value={form.addrLine1}
                        onChange={(e) =>
                          handleFieldChange("addrLine1", e.target.value)
                        }
                        disabled={formLoading}
                        maxLength={200}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="u-line2">Address Line 2</label>
                      <input
                        id="u-line2"
                        type="text"
                        value={form.addrLine2}
                        onChange={(e) =>
                          handleFieldChange("addrLine2", e.target.value)
                        }
                        disabled={formLoading}
                        maxLength={200}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="u-city">City</label>
                      <input
                        id="u-city"
                        type="text"
                        value={form.addrCity}
                        onChange={(e) =>
                          handleFieldChange("addrCity", e.target.value)
                        }
                        disabled={formLoading}
                        maxLength={100}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="u-state">State</label>
                      <input
                        id="u-state"
                        type="text"
                        value={form.addrState}
                        onChange={(e) =>
                          handleFieldChange("addrState", e.target.value)
                        }
                        disabled={formLoading}
                        maxLength={100}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="u-postal">Postal Code</label>
                      <input
                        id="u-postal"
                        type="text"
                        value={form.addrPostalCode}
                        onChange={(e) =>
                          handleFieldChange("addrPostalCode", e.target.value)
                        }
                        disabled={formLoading}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="u-country">Country (ISO alpha-2)</label>
                      <input
                        id="u-country"
                        type="text"
                        maxLength={2}
                        placeholder="BR"
                        value={form.addrCountry}
                        onChange={(e) =>
                          handleFieldChange(
                            "addrCountry",
                            e.target.value.toUpperCase(),
                          )
                        }
                        disabled={formLoading}
                      />
                    </div>
                  </div>
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
                      ? "Create User"
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
