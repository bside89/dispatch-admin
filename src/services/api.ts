import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { tokenStorage } from "../utils/tokenStorage";
import type {
  Order,
  OrdersListResponse,
  CreateOrderInput,
  UpdateOrderInput,
  UpdateOrderStatusInput,
  OrderFilters,
} from "../types/Order";

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
    };

    tokenStorage.setTokens(data.accessToken, data.refreshToken);
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
      tokenStorage.clear();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

// ─── Auth ───────────────────────────────────────────────────────────────────

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const res = await api.post("/v1/auth/login", { email, password });
  const data = res.data.data as LoginResponse;
  tokenStorage.setTokens(data.accessToken, data.refreshToken);
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
  const res = await api.get("/v1/orders", { params: filters });
  return {
    data: res.data.data as Order[],
    meta: res.data.meta,
  };
}

export async function getOrderById(id: string): Promise<Order> {
  const res = await api.get(`/v1/orders/${id}`);
  return res.data.data as Order;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const idempotencyKey = crypto.randomUUID();
  const res = await api.post("/v1/orders", input, {
    headers: { "idempotency-key": idempotencyKey },
  });
  return res.data.data as Order;
}

export async function updateOrder(
  id: string,
  input: UpdateOrderInput,
): Promise<Order> {
  const res = await api.patch(`/v1/orders/${id}`, input);
  return res.data.data as Order;
}

export async function updateOrderStatus(
  id: string,
  input: UpdateOrderStatusInput,
): Promise<Order> {
  const res = await api.patch(`/v1/orders/${id}/status`, input);
  return res.data.data as Order;
}

export async function deleteOrder(id: string): Promise<void> {
  await api.delete(`/v1/orders/${id}`);
}

export default api;
