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
  address?: UserAddress;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserAddressInput {
  city?: string;
  country?: string;
  line1?: string;
  line2?: string;
  postalCode?: string;
  state?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  address?: UpdateUserAddressInput;
}
