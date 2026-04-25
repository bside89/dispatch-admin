export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELED"
  | "REFUNDED";

export const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "PAID",
  "PROCESSED",
  "SHIPPED",
  "DELIVERED",
  "CANCELED",
  "REFUNDED",
];

export interface OrderUser {
  id: string;
  name: string;
  email: string;
  role: string;
  language: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemDetail {
  id: string;
  name: string;
  description: string;
  stock: number;
  price: number;
  pricePaymentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  itemId: string;
  quantity: number;
  item?: OrderItemDetail;
}

export interface PaymentData {
  id: string;
  status: string;
  clientSecret?: string;
}

export interface Order {
  id: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  updatedAt: string;
  user?: OrderUser;
  items?: OrderItem[];
  paymentData: PaymentData;
  trackingNumber?: string;
  carrier?: string;
  shippedAt?: string;
  deliveredAt?: string;
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

export interface UpdateOrderStatusInput {
  status: OrderStatus;
}

export interface ShipOrderInput {
  trackingNumber?: string;
  carrier?: string;
}

export interface OrderFilters {
  userId?: string;
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
