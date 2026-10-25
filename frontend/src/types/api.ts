export interface Product {
  id: number;
  name: string;
  price: string;
  available_quantity: number;
  sku?: string;
  is_active?: boolean;
}

export interface OrderItemInput {
  product_id: number;
  quantity: number;
}

export interface OrderCreateRequest {
  items: OrderItemInput[];
}

export interface OrderItemResponse {
  product_id: number;
  quantity: number;
  unit_price: string;
  line_total: string;
}

export interface OrderCreateResponse {
  order_id: number;
  status: 'pending' | 'confirmed' | 'cancelled' | string;
  items: OrderItemResponse[];
  total: string;
  created_at: string;
}

export interface BackendHealthResponse {
  status: string;
}

export interface ApiError {
  message: string;
  status?: number;
  details?: Record<string, unknown> | string[];
}
