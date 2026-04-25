import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { logout } from "../../services/api";
import { canManageAdmin, canAccessFinancial } from "../../utils/permissions";
import type { UserRole } from "../../types/User";

export default function Sidebar() {
  const navigate = useNavigate();
  const { logoutUser, user } = useAuth();
  const role = user?.role as UserRole | undefined;

  async function handleLogout() {
    try {
      await logout();
    } finally {
      logoutUser();
      navigate("/login", { replace: true });
    }
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon">◈</span>
        <NavLink to="/" className="sidebar-logo-text">
          <span>Dispatch Admin</span>
        </NavLink>
      </div>

      <nav className="sidebar-nav">
        {canAccessFinancial(role) && (
          <NavLink
            to="/orders"
            className={({ isActive }) =>
              `sidebar-nav-item${isActive ? " active" : ""}`
            }
          >
            <span className="sidebar-nav-icon">≡</span>
            Orders
          </NavLink>
        )}

        {canManageAdmin(role) && (
          <NavLink
            to="/items"
            className={({ isActive }) =>
              `sidebar-nav-item${isActive ? " active" : ""}`
            }
          >
            <span className="sidebar-nav-icon">◻</span>
            Items
          </NavLink>
        )}

        {canManageAdmin(role) && (
          <NavLink
            to="/users"
            className={({ isActive }) =>
              `sidebar-nav-item${isActive ? " active" : ""}`
            }
          >
            <span className="sidebar-nav-icon">◎</span>
            Users
          </NavLink>
        )}
      </nav>

      <div className="sidebar-bottom">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `sidebar-nav-item${isActive ? " active" : ""}`
          }
        >
          <span className="sidebar-nav-icon">⚙</span>
          Settings
        </NavLink>

        <button
          className="btn btn-ghost btn-sm sidebar-logout"
          onClick={handleLogout}
        >
          <span className="sidebar-nav-icon">→</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
