import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { OrdersPage } from '../pages/OrdersPage';
import type { Product } from '../types/api';
import * as api from '../services/api';

const mockProducts: Product[] = [
  { id: 1, name: 'Test Laptop', price: '1500.00', available_quantity: 10 },
  { id: 2, name: 'Wireless Mouse', price: '25.00', available_quantity: 5 },
];

describe('OrdersPage — Primary Demo Slice', () => {
  const onRefreshMock = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    onRefreshMock.mockClear();
  });

  it('renders product selector with live stock limits', () => {
    render(
      <OrdersPage
        products={mockProducts}
        productsLoading={false}
        onRefreshProducts={onRefreshMock}
      />
    );

    expect(screen.getByText(/Order Dispatch & Stock Reservation/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Laptop — \$1500.00 \(10 available\)/i)).toBeInTheDocument();
  });

  it('shows validation warning when quantity exceeds available stock', async () => {
    render(
      <OrdersPage
        products={mockProducts}
        productsLoading={false}
        onRefreshProducts={onRefreshMock}
      />
    );

    const quantityInput = screen.getByDisplayValue('1');
    fireEvent.change(quantityInput, { target: { value: '999' } });

    expect(
      screen.getByText(/exceeds available warehouse stock/i)
    ).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Submit Order via Django API/i });
    expect(submitBtn).toBeDisabled();
  });

  it('submits valid order, prevents duplicate click, calls refresh, and displays confirmation', async () => {
    const createOrderSpy = vi.spyOn(api, 'createOrder').mockResolvedValueOnce({
      order_id: 101,
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
    });

    render(
      <OrdersPage
        products={mockProducts}
        productsLoading={false}
        onRefreshProducts={onRefreshMock}
      />
    );

    const quantityInput = screen.getByDisplayValue('1');
    fireEvent.change(quantityInput, { target: { value: '2' } });

    const submitBtn = screen.getByRole('button', { name: /Submit Order via Django API/i });
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);

    // Verify submission sent
    expect(createOrderSpy).toHaveBeenCalledWith({
      items: [{ product_id: 1, quantity: 2 }],
    });

    // Wait for confirmation view
    await waitFor(() => {
      expect(screen.getByText(/Order #101/i)).toBeInTheDocument();
      expect(screen.getByText(/Order Successfully Created & Stock Reserved/i)).toBeInTheDocument();
      expect(screen.getAllByText(/\$3000\.00/i).length).toBeGreaterThanOrEqual(1);
    });

    // Verify refresh was triggered
    expect(onRefreshMock).toHaveBeenCalledTimes(1);
  });

  it('renders backend business rejection error on 400', async () => {
    vi.spyOn(api, 'createOrder').mockRejectedValueOnce({
      status: 400,
      message: 'Insufficient stock for product 1.',
    });

    render(
      <OrdersPage
        products={mockProducts}
        productsLoading={false}
        onRefreshProducts={onRefreshMock}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Submit Order via Django API/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Insufficient stock for product 1./i)).toBeInTheDocument();
    });
  });
});
