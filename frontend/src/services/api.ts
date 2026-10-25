import type {
  Product,
  OrderCreateRequest,
  OrderCreateResponse,
  BackendHealthResponse,
  ApiError,
} from '../types/api';

const RAW_BASE = import.meta.env.VITE_API_BASE_URL;
export const API_BASE_URL = typeof RAW_BASE === 'string' && RAW_BASE.trim() !== ''
  ? RAW_BASE.trim().replace(/\/+$/, '')
  : '';

/**
 * Check backend health status via GET /health/
 */
export async function checkBackendHealth(): Promise<BackendHealthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/health/`, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Health check returned HTTP ${res.status}`);
    }

    return await res.json();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to reach backend';
    throw {
      message,
    } as ApiError;
  }
}

/**
 * Fetch products from Django API via GET /api/products/
 * NOTE: Currently missing from backend (pending Kiro's implementation).
 * This function calls the real endpoint and throws an informative ApiError if 404 or unhandled.
 */
export async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/products/`, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (res.status === 404) {
      throw {
        message: 'Endpoint GET /api/products/ is not yet implemented on the Django backend.',
        status: 404,
      } as ApiError;
    }

    if (!res.ok) {
      const errText = await res.text();
      let errorData;
      try {
        errorData = JSON.parse(errText);
      } catch {
        // non-json response
      }

      throw {
        message: errorData?.error || `Failed to fetch products (HTTP ${res.status})`,
        status: res.status,
        details: errorData,
      } as ApiError;
    }

    return await res.json();
  } catch (err: unknown) {
    if ((err as ApiError)?.message) {
      throw err;
    }
    const message = err instanceof Error ? err.message : 'Network error fetching products';
    throw {
      message,
    } as ApiError;
  }
}

/**
 * Place an order via POST /api/orders/
 * The payload must match: { "items": [{ "product_id": number, "quantity": number }] }
 */
export async function createOrder(payload: OrderCreateRequest): Promise<OrderCreateResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/orders/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      let errorMessage = `Failed to create order (HTTP ${res.status})`;

      if (data) {
        if (typeof data.error === 'string') {
          // Business error: e.g. "Insufficient stock for product 1"
          errorMessage = data.error;
        } else if (Array.isArray(data.items)) {
          // Serializer error: e.g. ["This field is required."] or ["Each product can appear only once"]
          errorMessage = data.items.join(', ');
        } else if (typeof data.items === 'object') {
          // Field-level error: e.g. {"items": [{"product_id": ["A valid integer is required."]}]}
          errorMessage = JSON.stringify(data.items);
        } else if (typeof data.detail === 'string') {
          errorMessage = data.detail;
        }
      }

      throw {
        message: errorMessage,
        status: res.status,
        details: data,
      } as ApiError;
    }

    return data as OrderCreateResponse;
  } catch (err: unknown) {
    if ((err as ApiError)?.message) {
      throw err;
    }
    const message = err instanceof Error ? err.message : 'Network error submitting order';
    throw {
      message,
    } as ApiError;
  }
}
