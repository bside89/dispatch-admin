import { useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext";
import Login from "./components/Login";
import OrderList from "./components/OrderList";
import { getOrders, logout } from "./services/api";
import type { Order } from "./types/Order";
import CreateOrder from "./components/CreateOrder";

function App() {
  const { isAuthenticated, logoutUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
    }
  }, [isAuthenticated]);

  const loadOrders = async () => {
    const data = await getOrders();
    setOrders(data);
  };

  const handleNewOrder = (order: Order) => {
    setOrders((prev) => [...prev, order]);
  };

  const handleLogout = async () => {
    await logout();
    logoutUser();
  };

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div>
      <h1>Order Flow App</h1>

      <button onClick={handleLogout}>Logout</button>

      <CreateOrder onCreate={handleNewOrder} />
      <OrderList orders={orders} />
    </div>
  );
}

export default App;
