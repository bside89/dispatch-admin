import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUser, updateUser, deleteUser } from "../services/api";
import type { UpdateUserInput } from "../types/User";

type Toast = { kind: "success" | "error"; message: string } | null;

export default function UserSettingsPage() {
  const navigate = useNavigate();
  const { userId, logoutUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Profile fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Address fields
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setFetchError(null);
    getUser(userId)
      .then((u) => {
        setName(u.name ?? "");
        setEmail(u.email ?? "");
        setLine1(u.address?.line1 ?? "");
        setLine2(u.address?.line2 ?? "");
        setCity(u.address?.city ?? "");
        setState(u.address?.state ?? "");
        setPostalCode(u.address?.postalCode ?? "");
        setCountry(u.address?.country ?? "");
      })
      .catch(() => setFetchError("Failed to load user data."))
      .finally(() => setLoading(false));
  }, [userId]);

  function showToast(kind: "success" | "error", message: string) {
    setToast({ kind, message });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!userId) return;

    setSaving(true);
    setSaveError(null);

    const dto: UpdateUserInput = {
      name: name || undefined,
      email: email || undefined,
    };

    const addressValues = { city, country, line1, line2, postalCode, state };
    if (Object.values(addressValues).some(Boolean)) {
      dto.address = {
        city: city || undefined,
        country: country || undefined,
        line1: line1 || undefined,
        line2: line2 || undefined,
        postalCode: postalCode || undefined,
        state: state || undefined,
      };
    }

    try {
      const updated = await updateUser(userId, dto);
      setName(updated.name ?? "");
      setEmail(updated.email ?? "");
      setLine1(updated.address?.line1 ?? "");
      setLine2(updated.address?.line2 ?? "");
      setCity(updated.address?.city ?? "");
      setState(updated.address?.state ?? "");
      setPostalCode(updated.address?.postalCode ?? "");
      setCountry(updated.address?.country ?? "");
      showToast("success", "Settings saved.");
    } catch (err: unknown) {
      const raw = (err as { response?: { data?: { message?: unknown } } })
        ?.response?.data?.message;
      const msg = Array.isArray(raw)
        ? raw.join(" ")
        : typeof raw === "string"
          ? raw
          : "Failed to save changes.";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (!userId) return;
    setDeleting(true);
    try {
      await deleteUser(userId);
      logoutUser();
      navigate("/login", { replace: true });
    } catch {
      showToast("error", "Failed to delete account.");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  if (loading) {
    return (
      <div className="page px-0">
        <header className="page-header">
          <h1>Settings</h1>
        </header>
        <main className="page-main">
          <div className="state-center">Loading…</div>
        </main>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="page px-0">
        <header className="page-header">
          <h1>Settings</h1>
        </header>
        <main className="page-main">
          <div className="alert alert-error">{fetchError}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="page px-0">
      <header className="page-header">
        <h1>Settings</h1>
      </header>

      <main className="page-main">
        <form onSubmit={handleSave} noValidate>
          {/* ── Profile ── */}
          <div className="settings-section p-4">
            <h2 className="settings-section-title">Profile</h2>
            <div className="settings-fields">
              <div className="field">
                <label htmlFor="settings-name">Name</label>
                <input
                  id="settings-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="field">
                <label htmlFor="settings-email">Email</label>
                <input
                  id="settings-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          {/* ── Address ── */}
          <div className="settings-section mt-3 mb-3 p-4">
            <h2 className="settings-section-title">Address</h2>
            <div className="settings-fields">
              <div className="field">
                <label htmlFor="settings-line1">Address line 1</label>
                <input
                  id="settings-line1"
                  type="text"
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="field">
                <label htmlFor="settings-line2">Address line 2</label>
                <input
                  id="settings-line2"
                  type="text"
                  value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="field">
                <label htmlFor="settings-city">City</label>
                <input
                  id="settings-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="field">
                <label htmlFor="settings-state">State / Province</label>
                <input
                  id="settings-state"
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="field">
                <label htmlFor="settings-postal">Postal code</label>
                <input
                  id="settings-postal"
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="field">
                <label htmlFor="settings-country">
                  Country (ISO 3166-1 alpha-2)
                </label>
                <input
                  id="settings-country"
                  type="text"
                  maxLength={2}
                  placeholder="BR"
                  value={country}
                  onChange={(e) => setCountry(e.target.value.toUpperCase())}
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          {saveError && <div className="alert alert-error">{saveError}</div>}

          <div className="settings-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>

        {/* ── Danger Zone ── */}
        <div className="settings-section settings-danger-zone p-4">
          <h2 className="settings-section-title settings-danger-title">
            Danger Zone
          </h2>
          <p className="settings-danger-desc">
            Permanently delete your account. This action cannot be undone.
          </p>
          {confirmDelete ? (
            <div className="settings-confirm-delete">
              <span className="settings-danger-warning">
                Are you sure? This cannot be undone.
              </span>
              <button
                className="btn btn-danger btn-sm"
                disabled={deleting}
                onClick={handleDeleteAccount}
              >
                {deleting ? "Deleting…" : "Yes, delete my account"}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                disabled={deleting}
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              className="btn btn-danger btn-sm"
              onClick={() => setConfirmDelete(true)}
            >
              Delete account
            </button>
          )}
        </div>
      </main>

      {toast && (
        <div className={`toast toast-${toast.kind}`}>{toast.message}</div>
      )}
    </div>
  );
}
