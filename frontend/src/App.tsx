import { useState, useEffect, useCallback, useMemo } from 'react';
// Storefront Components & Pages
import { StoreHeader } from './components/storefront/StoreHeader';
import { StoreFooter } from './components/storefront/StoreFooter';
import { StoreHomePage } from './pages/storefront/StoreHomePage';
import { StoreListingPage } from './pages/storefront/StoreListingPage';
import { StoreDetailPage } from './pages/storefront/StoreDetailPage';
import { StoreCartPage } from './pages/storefront/StoreCartPage';
import { StoreCheckoutPage } from './pages/storefront/StoreCheckoutPage';

// Operations Dashboard Components & Pages (Preserved for Warehouse Management)
import { Sidebar, type NavTabId } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { OverviewPage } from './pages/OverviewPage';
import { ProductsPage } from './pages/ProductsPage';
import { OrdersPage } from './pages/OrdersPage';
import { PlannedFeaturePage } from './pages/PlannedFeaturePage';

// Services & Types
import { checkBackendHealth, fetchProducts } from './services/api';
import type { Product, BackendHealthResponse, ApiError, OrderCreateResponse } from './types/api';
import type {
  StorefrontProduct,
  CartItem,
  FashionCategory,
} from './types/storefront';
import {
  CURATED_STOREFRONT_CATALOGUE,
  mergeBackendWithStorefront,
} from './data/storefrontProducts';

export type AppViewMode =
  | 'home'
  | 'products'
  | 'detail'
  | 'cart'
  | 'checkout'
  | 'operations';

export function App() {
  // Query param detection for direct links (e.g. ?view=operations or ?view=cart)
  const initialParams = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search)
    : null;
  const initialView = (initialParams?.get('view') as AppViewMode | null) || 'home';
  const initialTab = (initialParams?.get('tab') as NavTabId | null) || 'products';

  // Primary Navigation View State
  const [viewMode, setViewMode] = useState<AppViewMode>(initialView);

  // Storefront Filtering & State
  const [selectedCategory, setSelectedCategory] = useState<FashionCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeProduct, setActiveProduct] = useState<StorefrontProduct>(
    CURATED_STOREFRONT_CATALOGUE[0]
  );
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Operations Dashboard State
  const [operationsTab, setOperationsTab] = useState<NavTabId>(initialTab);
  const [mobileOpsOpen, setMobileOpsOpen] = useState<boolean>(false);

  // Backend Health & Products Data
  const [health, setHealth] = useState<BackendHealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);
  const [backendProducts, setBackendProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState<boolean>(true);
  const [productsError, setProductsError] = useState<ApiError | null>(null);

  // Operations cart map
  const [opsCart, setOpsCart] = useState<Record<number, number>>({});

  // Sync Storefront catalogue with backend inventory
  const storefrontProducts = useMemo(() => {
    return mergeBackendWithStorefront(backendProducts);
  }, [backendProducts]);

  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      const data = await fetchProducts();
      setBackendProducts(data);
    } catch (err: unknown) {
      setProductsError(err as ApiError);
    } finally {
      setProductsLoading(false);
    }
  }, []);

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
        if (active) setBackendProducts(data);
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

  // Storefront Cart Actions
  const handleAddToCart = (
    product: StorefrontProduct,
    size: string,
    color: string,
    quantity = 1
  ) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedSize === size &&
          item.selectedColor === color
      );

      if (existingIndex >= 0) {
        const next = [...prev];
        const newQty = Math.min(
          product.available_quantity,
          next[existingIndex].quantity + quantity
        );
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: newQty,
        };
        return next;
      }

      return [
        ...prev,
        {
          product,
          quantity: Math.min(product.available_quantity, Math.max(1, quantity)),
          selectedSize: size,
          selectedColor: color,
        },
      ];
    });

    // Also sync to ops cart map for consistency
    setOpsCart((prev) => ({
      ...prev,
      [product.id]: (prev[product.id] || 0) + quantity,
    }));
  };

  const handleBuyNow = (
    product: StorefrontProduct,
    size: string,
    color: string,
    quantity = 1
  ) => {
    handleAddToCart(product, size, color, quantity);
    setViewMode('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateCartQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(productId);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          return {
            ...item,
            quantity: Math.min(item.product.available_quantity, quantity),
          };
        }
        return item;
      })
    );

    setOpsCart((prev) => ({
      ...prev,
      [productId]: quantity,
    }));
  };

  const handleRemoveCartItem = (productId: number) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
    setOpsCart((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const handleOrderSuccess = (_order: OrderCreateResponse) => {
    // Clear cart upon successful database commit
    setCartItems([]);
    setOpsCart({});
    // Re-fetch products to reflect updated inventory in warehouse
    loadProducts();
  };

  const handleOpenDetail = (product: StorefrontProduct) => {
    setActiveProduct(product);
    setViewMode('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalCartCount = useMemo(() => {
    return cartItems.reduce((acc, it) => acc + it.quantity, 0);
  }, [cartItems]);

  const cartProductIds = useMemo(() => {
    return new Set(cartItems.map((i) => i.product.id));
  }, [cartItems]);

  // If Warehouse Operations mode is active, render the Operations Dashboard layout
  if (viewMode === 'operations') {
    return (
      <div className="min-h-screen bg-[#F8F7F4] text-[#242424] flex flex-row">
        {/* Operations Sidebar Navigation */}
        <Sidebar
          currentTab={operationsTab}
          onSelectTab={setOperationsTab}
          mobileOpen={mobileOpsOpen}
          onCloseMobile={() => setMobileOpsOpen(false)}
          health={health}
          healthLoading={healthLoading}
        />

        {/* Operations Content Area */}
        <div className="flex-1 flex flex-col min-w-0 max-w-full min-h-screen overflow-x-hidden">
          <TopNav
            currentTab={operationsTab}
            onSelectTab={setOperationsTab}
            onOpenMobile={() => setMobileOpsOpen(true)}
          />

          {/* Quick Return to Storefront Pill Bar */}
          <div className="bg-[#242424] text-white px-6 py-2 flex items-center justify-between text-xs">
            <span className="text-[#A1A1AA]">
              Currently in: <strong>Warehouse Logistics Console</strong>
            </span>
            <button
              type="button"
              onClick={() => {
                setViewMode('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="bg-[#E96832] hover:bg-[#D55722] text-white font-semibold px-3 py-1 rounded text-xs transition-colors cursor-pointer"
            >
              ← Back to Customer Storefront
            </button>
          </div>

          <main className="flex-1 p-4 sm:p-6 max-w-6xl w-full mx-auto min-w-0">
            {operationsTab === 'products' && (
              <ProductsPage
                products={backendProducts}
                loading={productsLoading}
                error={productsError}
                onRetry={loadProducts}
                cart={opsCart}
                onUpdateQuantity={(pid, qty) => {
                  setOpsCart((prev) => {
                    const next = { ...prev };
                    if (qty <= 0) delete next[pid];
                    else next[pid] = qty;
                    return next;
                  });
                }}
                onNavigate={setOperationsTab}
              />
            )}

            {operationsTab === 'orders' && (
              <OrdersPage
                products={backendProducts}
                productsLoading={productsLoading}
                onRefreshProducts={loadProducts}
              />
            )}

            {operationsTab === 'overview' && (
              <OverviewPage
                products={backendProducts}
                productsLoading={productsLoading}
                productsError={productsError}
                health={health}
                onNavigate={setOperationsTab}
                onRefreshProducts={loadProducts}
              />
            )}

            {operationsTab !== 'overview' &&
              operationsTab !== 'products' &&
              operationsTab !== 'orders' && (
                <PlannedFeaturePage
                  featureId={operationsTab}
                  onNavigate={setOperationsTab}
                />
              )}
          </main>

          <footer className="border-t border-[#E5E5E2] px-6 py-3.5 text-center text-xs text-[#71717A] bg-white">
            <p>
              Logistics Operations Console • Real-Time Inventory &amp; Order Fulfillment
            </p>
          </footer>
        </div>
      </div>
    );
  }

  // PRIMARY CUSTOMER STOREFRONT LAYOUT
  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#242424] flex flex-col font-sans">
      {/* Top E-Commerce Header with Brand, Search, Department Links & Cart */}
      <StoreHeader
        currentCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setViewMode('products');
        }}
        cartCount={totalCartCount}
        onOpenCart={() => {
          setViewMode('cart');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateHome={() => {
          setViewMode('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateProducts={() => {
          setViewMode('products');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenOperations={() => {
          setViewMode('operations');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={() => {
          setViewMode('products');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Main Storefront View Routing */}
      <main className="flex-1">
        {viewMode === 'home' && (
          <StoreHomePage
            products={storefrontProducts}
            loading={productsLoading}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setViewMode('products');
            }}
            onOpenDetail={handleOpenDetail}
            onAddToCart={(p, s, c) => handleAddToCart(p, s, c, 1)}
            onViewAllProducts={() => {
              setSelectedCategory('all');
              setViewMode('products');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            cartProductIds={cartProductIds}
          />
        )}

        {viewMode === 'products' && (
          <StoreListingPage
            products={storefrontProducts}
            loading={productsLoading}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onOpenDetail={handleOpenDetail}
            onAddToCart={(p, s, c) => handleAddToCart(p, s, c, 1)}
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery('')}
            cartProductIds={cartProductIds}
          />
        )}

        {viewMode === 'detail' && (
          <StoreDetailPage
            product={activeProduct}
            onBack={() => setViewMode('products')}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            inCart={cartProductIds.has(activeProduct.id)}
          />
        )}

        {viewMode === 'cart' && (
          <StoreCartPage
            items={cartItems}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveCartItem}
            onContinueShopping={() => {
              setViewMode('products');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onProceedToCheckout={() => {
              setViewMode('checkout');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {viewMode === 'checkout' && (
          <StoreCheckoutPage
            items={cartItems}
            onOrderSuccess={handleOrderSuccess}
            onBackToCart={() => setViewMode('cart')}
            onContinueShopping={() => {
              setViewMode('products');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenOperations={() => {
              setViewMode('operations');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </main>

      {/* Modern E-Commerce Storefront Footer */}
      <StoreFooter
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setViewMode('products');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenOperations={() => {
          setViewMode('operations');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}

export default App;
