import type { Order } from "../types/Order";

interface Props {
  orders: Order[];
}

export default function OrderList({ orders }: Props) {
  return (
    <div>
      <h2>Orders</h2>

      <ul>
        {orders.map((order) => (
          <li key={order.id}>
            {order.product} - R$ {order.amount}
          </li>
        ))}
      </ul>
    </div>
  );
}
