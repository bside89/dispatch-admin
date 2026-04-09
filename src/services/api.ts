import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const apiBaseUrl = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: apiBaseUrl,
});

// Request Interceptor
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");

        const res = await axios.post(`${apiBaseUrl}/v1/auth/refresh`, {
          refreshToken,
        });

        const newAccessToken = (res.data as any).accessToken;

        localStorage.setItem("accessToken", newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch {
        localStorage.clear();
        window.location.reload();
      }
    }

    return Promise.reject(error);
  },
);

//#region Auth

export const login = async (email: string, password: string) => {
  const res = await api.post("/v1/auth/login", { email, password });

  const data = res.data.data as {
    accessToken: string;
    refreshToken: string;
  };

  localStorage.setItem("accessToken", data.accessToken);
  localStorage.setItem("refreshToken", data.refreshToken);

  return data;
};

export const logout = async () => {
  await api.post("/v1/auth/logout");

  localStorage.clear();
};

//#endregion

//#region Orders

export const getOrders = async () => {
  const res = await api.get("/v1/orders");
  return res.data.data;
};

export const createOrder = async (order: {
  product: string;
  amount: number;
}) => {
  const res = await api.post("/v1/orders", order);
  return res.data.data;
};

//#endregion

export default api;
