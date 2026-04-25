export interface Item {
  id: string;
  name: string;
  description: string;
  stock: number;
  price: number;
  pricePaymentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ItemsMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ItemsListResponse {
  data: Item[];
  meta: ItemsMeta;
}

export interface CreateItemInput {
  name: string;
  description: string;
  stock: number;
  price: number;
  pricePaymentId?: string;
}

export interface UpdateItemInput {
  name?: string;
  description?: string;
  stock?: number;
  price?: number;
  pricePaymentId?: string;
}

export interface ItemFilters {
  page?: number;
  limit?: number;
  name?: string;
  description?: string;
}
