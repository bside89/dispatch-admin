export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PAID"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PAID",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

export interface OrderUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  user: OrderUser;
  status: OrderStatus;
  total: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface OrderMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OrdersListResponse {
  data: Order[];
  meta: OrderMeta;
}

export interface OrderItemInput {
  productId: string;
  quantity: number;
  price: number;
}

export interface CreateOrderInput {
  items: OrderItemInput[];
}

export interface UpdateOrderInput {
  items?: OrderItemInput[];
}

export interface UpdateOrderStatusInput {
  status: OrderStatus;
}

export interface OrderFilters {
  userId?: string;
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
