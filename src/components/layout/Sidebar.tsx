import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { logout } from "../../services/api";

export default function Sidebar() {
  const navigate = useNavigate();
  const { logoutUser } = useAuth();

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
        <span>Order Flow</span>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/orders"
          className={({ isActive }) =>
            `sidebar-nav-item${isActive ? " active" : ""}`
          }
        >
          <span className="sidebar-nav-icon">≡</span>
          Orders
        </NavLink>
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
