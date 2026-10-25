import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '../components/Sidebar';
import { PlannedFeaturePage } from '../pages/PlannedFeaturePage';

describe('Sidebar and Planned Feature Page', () => {
  it('renders all core, operations, and management navigation items', () => {
    const onSelectMock = vi.fn();

    render(
      <Sidebar
        currentTab="overview"
        onSelectTab={onSelectMock}
        mobileOpen={false}
        onCloseMobile={vi.fn()}
        health={{ status: 'ok' }}
        healthLoading={false}
      />
    );

    expect(screen.getAllByText('Overview')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Products & Inventory')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Orders')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Inventory Alerts')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Fulfillment & Dispatch')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Delivery Tracking')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Customers')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Reports & Analytics')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Settings')[0]).toBeInTheDocument();

    fireEvent.click(screen.getAllByText('Orders')[0]);
    expect(onSelectMock).toHaveBeenCalledWith('orders');
  });

  it('renders planned feature page with roadmap and architectural honesty notice', () => {
    render(
      <PlannedFeaturePage featureId="inventory-alerts" onNavigate={vi.fn()} />
    );

    expect(screen.getByText(/PLANNED • NOT YET AVAILABLE/i)).toBeInTheDocument();
    expect(screen.getByText(/Inventory Threshold Alerts/i)).toBeInTheDocument();
    expect(screen.getByText(/Architectural Honesty Disclosure/i)).toBeInTheDocument();
    expect(screen.getByText('GET /api/inventory/alerts/')).toBeInTheDocument();
  });
});
