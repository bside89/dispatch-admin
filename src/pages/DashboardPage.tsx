import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();
  const userName = user?.name ?? "User";
  const userRole = user?.role?.toUpperCase() ?? "USER";

  return (
    <div className="page">
      <header className="page-header">
        <h1>Dashboard</h1>
      </header>
      <main className="page-main">
        <div className="state-left state-empty">
          <p>Welcome to Order Flow App, {userName}.</p>
          <p>You are in the {userRole} mode.</p>
        </div>
      </main>
    </div>
  );
}
