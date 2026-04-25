import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { tokenStorage } from "../utils/tokenStorage";
import type {
  Order,
  OrdersListResponse,
  UpdateOrderStatusInput,
  ShipOrderInput,
  OrderFilters,
} from "../types/Order";
import type {
  User,
  UsersListResponse,
  CreateUserInput,
  UpdateUserInput,
  UserFilters,
} from "../types/User";
import type {
  Item,
  ItemsListResponse,
  CreateItemInput,
  UpdateItemInput,
  ItemFilters,
} from "../types/Item";

const apiBaseUrl = import.meta.env.VITE_API_URL as string;

const api = axios.create({
  baseURL: apiBaseUrl,
});

// ─── Single-flight refresh ──────────────────────────────────────────────────

let refreshPromise: Promise<string> | null = null;

async function refreshTokens(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = tokenStorage.getRefreshToken();

    const res = await axios.post(`${apiBaseUrl}/v1/auth/refresh`, undefined, {
      headers: { Authorization: `Bearer ${refreshToken}` },
    });

    const data = res.data.data as {
      accessToken: string;
      refreshToken: string;
      userId: string;
    };

    tokenStorage.setTokens(data.accessToken, data.refreshToken);
    tokenStorage.setUserId(data.userId);
    return data.accessToken;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

// ─── Request interceptor — attach access token ──────────────────────────────

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor — auto-refresh on 401 ─────────────────────────────

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const status = error.response?.status;

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshTokens();
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch {
        tokenStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    if (status === 403) {
      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);

// ─── Auth ───────────────────────────────────────────────────────────────────

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
}

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const res = await api.post("/v1/auth/login", { email, password });
  const data = res.data.data as LoginResponse;
  tokenStorage.setTokens(data.accessToken, data.refreshToken);
  tokenStorage.setUserId(data.userId);
  return data;
}

export async function logout(): Promise<void> {
  try {
    await api.post("/v1/auth/logout");
  } finally {
    tokenStorage.clear();
  }
}

// ─── Orders ─────────────────────────────────────────────────────────────────

export async function getOrders(
  filters?: OrderFilters,
): Promise<OrdersListResponse> {
  const res = await api.get("/v1/admin/orders", { params: filters });
  return {
    data: res.data.items as Order[],
    meta: res.data.meta,
  };
}

export async function getOrderById(id: string): Promise<Order> {
  const res = await api.get(`/v1/admin/orders/${id}`);
  return res.data.data as Order;
}

export async function updateOrderStatus(
  id: string,
  input: UpdateOrderStatusInput,
): Promise<Order> {
  const res = await api.patch(`/v1/admin/orders/${id}`, input);
  return res.data.data as Order;
}

export async function deleteOrder(id: string): Promise<void> {
  await api.delete(`/v1/admin/orders/${id}`);
}

export async function shipOrder(
  id: string,
  input?: ShipOrderInput,
): Promise<Order> {
  const res = await api.patch(`/v1/admin/orders/${id}/ship`, input ?? {});
  return res.data.data as Order;
}

export async function deliverOrder(id: string): Promise<Order> {
  const res = await api.patch(`/v1/admin/orders/${id}/deliver`, {});
  return res.data.data as Order;
}

export async function cancelOrder(id: string): Promise<void> {
  await api.patch(`/v1/admin/orders/${id}/cancel`, {});
}

export async function refundOrder(id: string): Promise<void> {
  await api.patch(`/v1/admin/orders/${id}/refund`, {});
}

// ─── Users ──────────────────────────────────────────────────────────────────

export async function getUsers(
  filters?: UserFilters,
): Promise<UsersListResponse> {
  const res = await api.get("/v1/admin/users", { params: filters });
  return {
    data: res.data.items as User[],
    meta: res.data.meta,
  };
}

export async function getUser(userId: string): Promise<User> {
  const res = await api.get(`/v1/admin/users/${userId}`);
  return res.data.data as User;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const idempotencyKey = crypto.randomUUID();
  const res = await api.post("/v1/admin/users", input, {
    headers: { "idempotency-key": idempotencyKey },
  });
  return res.data.data as User;
}

export async function updateUser(
  userId: string,
  input: UpdateUserInput,
): Promise<User> {
  const res = await api.patch(`/v1/admin/users/${userId}`, input);
  return res.data.data as User;
}

export async function deleteUser(userId: string): Promise<void> {
  await api.delete(`/v1/admin/users/${userId}`);
}

// ─── Items ──────────────────────────────────────────────────────────────────

export async function getItems(
  filters?: ItemFilters,
): Promise<ItemsListResponse> {
  const res = await api.get("/v1/admin/items", { params: filters });
  return {
    data: res.data.items as Item[],
    meta: res.data.meta,
  };
}

export async function getItemById(id: string): Promise<Item> {
  const res = await api.get(`/v1/admin/items/${id}`);
  return res.data.data as Item;
}

export async function createItem(input: CreateItemInput): Promise<Item> {
  const idempotencyKey = crypto.randomUUID();
  const res = await api.post("/v1/admin/items", input, {
    headers: { "idempotency-key": idempotencyKey },
  });
  return res.data.data as Item;
}

export async function updateItem(
  id: string,
  input: UpdateItemInput,
): Promise<Item> {
  const res = await api.patch(`/v1/admin/items/${id}`, input);
  return res.data.data as Item;
}

export async function deleteItem(id: string): Promise<void> {
  await api.delete(`/v1/admin/items/${id}`);
}

export default api;
