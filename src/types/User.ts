export type UserRole =
  | "superadmin"
  | "admin"
  | "financial"
  | "shipper"
  | "delivery"
  | "user";

export const USER_ROLES: UserRole[] = [
  "superadmin",
  "admin",
  "financial",
  "shipper",
  "delivery",
  "user",
];

export interface UserAddress {
  city?: string;
  country?: string;
  line1?: string;
  line2?: string;
  postalCode?: string;
  state?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  language: string;
  address?: UserAddress;
  createdAt: string;
  updatedAt: string;
}

export interface UsersMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UsersListResponse {
  data: User[];
  meta: UsersMeta;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  language?: string;
  role?: UserRole;
  address?: UserAddress;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  currentPassword?: string;
  language?: string;
  role?: UserRole;
  address?: UserAddress;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  name?: string;
  email?: string;
}
