import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductsPage } from '../pages/ProductsPage';
import type { Product } from '../types/api';

const mockProducts: Product[] = [
  { id: 1, name: 'Test Laptop', price: '1500.00', available_quantity: 10 },
  { id: 2, name: 'Wireless Mouse', price: '25.00', available_quantity: 3 },
  { id: 3, name: 'USB Cable', price: '9.99', available_quantity: 0 },
];

describe('ProductsPage Component', () => {
  it('renders products and filters by search query', () => {
    render(
      <ProductsPage
        products={mockProducts}
        loading={false}
        error={null}
        onRetry={vi.fn()}
        cart={{}}
        onUpdateQuantity={vi.fn()}
        onNavigate={vi.fn()}
      />
    );

    expect(screen.getByText('Test Laptop')).toBeInTheDocument();
    expect(screen.getByText('Wireless Mouse')).toBeInTheDocument();
    expect(screen.getByText('USB Cable')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/Search by product name or ID/i);
    fireEvent.change(searchInput, { target: { value: 'Mouse' } });

    expect(screen.getByText('Wireless Mouse')).toBeInTheDocument();
    expect(screen.queryByText('Test Laptop')).not.toBeInTheDocument();
  });

  it('filters by stock status (Low Stock, Out of Stock)', () => {
    render(
      <ProductsPage
        products={mockProducts}
        loading={false}
        error={null}
        onRetry={vi.fn()}
        cart={{}}
        onUpdateQuantity={vi.fn()}
        onNavigate={vi.fn()}
      />
    );

    const lowStockBtn = screen.getByRole('button', { name: /Low Stock/i });
    fireEvent.click(lowStockBtn);

    expect(screen.getByText('Wireless Mouse')).toBeInTheDocument();
    expect(screen.queryByText('Test Laptop')).not.toBeInTheDocument();
  });
});
