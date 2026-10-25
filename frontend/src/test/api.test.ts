import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkBackendHealth, fetchProducts, createOrder } from '../services/api';

describe('API Client (services/api.ts)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('checkBackendHealth returns status ok when server responds 200', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok' }),
    } as Response);

    const result = await checkBackendHealth();
    expect(result).toEqual({ status: 'ok' });
  });

  it('fetchProducts returns list of products on 200 OK', async () => {
    const mockProducts = [
      { id: 1, name: 'Test Laptop', price: '1500.00', available_quantity: 100 },
      { id: 2, name: 'Wireless Mouse', price: '25.50', available_quantity: 50 },
    ];

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockProducts,
    } as Response);

    const products = await fetchProducts();
    expect(products).toHaveLength(2);
    expect(products[0].name).toBe('Test Laptop');
    expect(products[0].available_quantity).toBe(100);
  });

  it('fetchProducts throws structured ApiError on 404', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({}),
      text: async () => 'Not Found',
    } as Response);

    await expect(fetchProducts()).rejects.toMatchObject({
      status: 404,
    });
  });

  it('createOrder returns 201 Created payload on success', async () => {
    const mockResponse = {
      order_id: 42,
      status: 'pending',
      items: [
        {
          product_id: 1,
          quantity: 2,
          unit_price: '1500.00',
          line_total: '3000.00',
        },
      ],
      total: '3000.00',
      created_at: '2026-10-25T14:30:00Z',
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => mockResponse,
    } as Response);

    const result = await createOrder({
      items: [{ product_id: 1, quantity: 2 }],
    });

    expect(result.order_id).toBe(42);
    expect(result.status).toBe('pending');
    expect(result.total).toBe('3000.00');
  });

  it('createOrder parses backend business error message (HTTP 400)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Insufficient stock for product 1.' }),
    } as unknown as Response);

    await expect(
      createOrder({ items: [{ product_id: 1, quantity: 999 }] })
    ).rejects.toMatchObject({
      status: 400,
      message: 'Insufficient stock for product 1.',
    });
  });

  it('createOrder parses DRF serializer validation errors (HTTP 400)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ items: ['Each product can appear only once'] }),
    } as unknown as Response);

    await expect(
      createOrder({
        items: [
          { product_id: 1, quantity: 1 },
          { product_id: 1, quantity: 2 },
        ],
      })
    ).rejects.toMatchObject({
      status: 400,
      message: 'Each product can appear only once',
    });
  });
});
