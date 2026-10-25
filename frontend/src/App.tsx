import { useState, useEffect, useCallback } from 'react';
import { Sidebar, type NavTabId } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { OverviewPage } from './pages/OverviewPage';
import { ProductsPage } from './pages/ProductsPage';
import { OrdersPage } from './pages/OrdersPage';
import { PlannedFeaturePage } from './pages/PlannedFeaturePage';
import { checkBackendHealth, fetchProducts } from './services/api';
import type { Product, BackendHealthResponse, ApiError } from './types/api';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTabId>('overview');
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  // Backend Health State
  const [health, setHealth] = useState<BackendHealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);

  // Products Catalogue State
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState<boolean>(true);
  const [productsError, setProductsError] = useState<ApiError | null>(null);

  // Cart state shared across Products & Orders
  const [cart, setCart] = useState<Record<number, number>>({});

  // Health check callback
  const loadHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const res = await checkBackendHealth();
      setHealth(res);
    } catch {
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  // Products catalogue callback
  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch (err: unknown) {
      setProductsError(err as ApiError);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  // Initial queries
  useEffect(() => {
    let active = true;

    checkBackendHealth()
      .then((res) => {
        if (active) setHealth(res);
      })
      .catch(() => {
        if (active) setHealth(null);
      })
      .finally(() => {
        if (active) setHealthLoading(false);
      });

    fetchProducts()
      .then((data) => {
        if (active) setProducts(data);
      })
      .catch((err) => {
        if (active) setProductsError(err as ApiError);
      })
      .finally(() => {
        if (active) setProductsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleUpdateQuantity = (productId: number, quantity: number) => {
    setCart((prev) => {
      const next = { ...prev };
      if (quantity <= 0) {
        delete next[productId];
      } else {
        next[productId] = quantity;
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-row selection:bg-indigo-500 selection:text-white">
      {/* Persistent Enterprise Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        health={health}
        healthLoading={healthLoading}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Bar */}
        <TopNav
          currentTab={currentTab}
          onOpenMobile={() => setMobileOpen(true)}
          health={health}
          healthLoading={healthLoading}
          onRefreshHealth={loadHealth}
        />

        {/* Tab Content Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'overview' && (
            <OverviewPage
              products={products}
              productsLoading={productsLoading}
              productsError={productsError}
              health={health}
              onNavigate={setCurrentTab}
              onRefreshProducts={loadProducts}
            />
          )}

          {currentTab === 'products' && (
            <ProductsPage
              products={products}
              loading={productsLoading}
              error={productsError}
              onRetry={loadProducts}
              cart={cart}
              onUpdateQuantity={handleUpdateQuantity}
              onNavigate={setCurrentTab}
            />
          )}

          {currentTab === 'orders' && (
            <OrdersPage
              products={products}
              productsLoading={productsLoading}
              onRefreshProducts={loadProducts}
            />
          )}

          {currentTab !== 'overview' &&
            currentTab !== 'products' &&
            currentTab !== 'orders' && (
              <PlannedFeaturePage
                featureId={currentTab}
                onNavigate={setCurrentTab}
              />
            )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-900/80 px-6 py-4 text-center text-xs text-slate-500">
          <p>
            Django E-Commerce Logistics Engine • Vertical Slice Architecture •
            Safe Stock Reservation with MySQL InnoDB Locks
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
