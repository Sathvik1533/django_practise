import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from '../App';
import * as api from '../services/api';

vi.mock('../services/api', () => ({
  checkBackendHealth: vi.fn(),
  fetchProducts: vi.fn(),
  createOrder: vi.fn(),
}));

describe('Storefront - Customer E-Commerce Experience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.scrollTo = vi.fn();
    vi.mocked(api.checkBackendHealth).mockResolvedValue({ status: 'ok' });
    vi.mocked(api.fetchProducts).mockResolvedValue([
      { id: 1, name: 'Anouk Kurta Set', price: '1499.00', available_quantity: 12 },
      { id: 2, name: 'Roadster Denim Shirt', price: '999.00', available_quantity: 18 },
    ]);
  });

  it('renders primary customer storefront homepage with brand, search and hero banner', async () => {
    render(<App />);

    // Brand and tagline
    expect(screen.getAllByText(/AURA/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Festive Super Sale is Live!/i)).toBeInTheDocument();

    // Search bar
    expect(
      screen.getByPlaceholderText(/Search for Kurtas, Denim, Shirts, Shoes, Bags/i)
    ).toBeInTheDocument();

    // Department navigation
    expect(screen.getByRole('button', { name: /^All Products/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Women$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Men$/i })).toBeInTheDocument();

    // Hero banner text
    expect(
      screen.getByText(/Timeless Indian Elegance & Modern Urban Style/i)
    ).toBeInTheDocument();
  });

  it('allows switching to Warehouse Operations dashboard and back to Storefront', async () => {
    render(<App />);

    // Click Warehouse Ops button
    const opsButtons = screen.getAllByRole('button', { name: /Warehouse Ops/i });
    fireEvent.click(opsButtons[0]);

    // Should now display the operations navigation
    await waitFor(() => {
      expect(screen.getAllByText(/Logistics Flow/i).length).toBeGreaterThan(0);
      expect(screen.getByRole('button', { name: /Back to Customer Storefront/i })).toBeInTheDocument();
    });

    // Return back to Storefront
    const backButton = screen.getByRole('button', {
      name: /Back to Customer Storefront/i,
    });
    fireEvent.click(backButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Timeless Indian Elegance & Modern Urban Style/i)
      ).toBeInTheDocument();
    });
  });

  it('navigates to product listing, filters products, and opens cart', async () => {
    render(<App />);

    // Wait for initial products fetch to settle
    await waitFor(() => {
      expect(api.fetchProducts).toHaveBeenCalled();
    });

    // Click "All Products" to open listing
    const allProductsBtn = screen.getByRole('button', { name: /^All Products/i });
    fireEvent.click(allProductsBtn);

    await waitFor(() => {
      expect(screen.getByText(/Indian Fashion Catalogue/i)).toBeInTheDocument();
    });

    // Wait for product cards to render
    await waitFor(() => {
      const addButtons = screen.getAllByRole('button', { name: /Add to Cart/i });
      expect(addButtons.length).toBeGreaterThan(0);
    });

    const addButtons = screen.getAllByRole('button', { name: /Add to Cart/i });
    fireEvent.click(addButtons[0]);

    // Cart badge should increment
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    // Open cart
    const cartButton = screen.getByRole('button', { name: /Shopping cart/i });
    fireEvent.click(cartButton);

    await waitFor(() => {
      expect(screen.getByText(/Shopping Cart \(1 item\)/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Proceed to Checkout/i })).toBeInTheDocument();
    });
  });

  it('proceeds through checkout and creates order via Django POST /api/orders/', async () => {
    vi.mocked(api.createOrder).mockResolvedValueOnce({
      order_id: 108,
      status: 'confirmed',
      items: [
        {
          product_id: 1,
          quantity: 1,
          unit_price: '1499.00',
          line_total: '1499.00',
        },
      ],
      total: '1499.00',
      created_at: '2026-10-25T11:30:00Z',
    });

    render(<App />);

    // Wait for initial products fetch to settle
    await waitFor(() => {
      expect(api.fetchProducts).toHaveBeenCalled();
    });

    // Navigate to products and add to cart
    const allProductsBtn = screen.getByRole('button', { name: /^All Products/i });
    fireEvent.click(allProductsBtn);

    await waitFor(() => {
      const addButtons = screen.getAllByRole('button', { name: /Add to Cart/i });
      expect(addButtons.length).toBeGreaterThan(0);
    });

    const addButtons = screen.getAllByRole('button', { name: /Add to Cart/i });
    fireEvent.click(addButtons[0]);

    // Open Cart
    const cartButton = screen.getByRole('button', { name: /Shopping cart/i });
    fireEvent.click(cartButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Proceed to Checkout/i })).toBeInTheDocument();
    });

    // Proceed to checkout
    const checkoutBtn = screen.getByRole('button', { name: /Proceed to Checkout/i });
    fireEvent.click(checkoutBtn);

    await waitFor(() => {
      expect(screen.getByText(/Checkout & Place Order/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Place Your Order/i })).toBeInTheDocument();
    });

    // Place Order
    const placeOrderBtn = screen.getByRole('button', { name: /Place Your Order/i });
    fireEvent.click(placeOrderBtn);

    await waitFor(() => {
      expect(api.createOrder).toHaveBeenCalledWith({
        items: [{ product_id: 1, quantity: 1 }],
      });
      expect(screen.getByText(/Order Confirmed & Stock Reserved/i)).toBeInTheDocument();
      expect(screen.getByText(/#108/i)).toBeInTheDocument();
    });
  });
});
