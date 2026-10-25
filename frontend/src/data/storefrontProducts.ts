import type { StorefrontProduct } from '../types/storefront';
import type { Product as BackendProduct } from '../types/api';

export const CURATED_STOREFRONT_CATALOGUE: StorefrontProduct[] = [
  {
    id: 1,
    name: 'Floral Embroidered Anarkali Kurta Set with Dupatta',
    brand: 'Anouk Ethnic',
    category: 'women',
    categoryLabel: 'Women',
    price: '1499.00',
    originalPrice: '2999.00',
    discountPercent: 50,
    available_quantity: 12,
    rating: 4.5,
    reviewCount: 342,
    images: [
      '/images/products/anouk-kurta-1.jpg',
      '/images/products/anouk-kurta-2.jpg',
    ],
    description:
      'Crafted from breathable pure cotton, this flared Anarkali kurta features intricate zari yoke embroidery, round neck with keyhole, three-quarter sleeves, matching trousers, and a lightweight printed chiffon dupatta.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'Emerald Green', hex: '#0F5132' },
      { name: 'Rust Orange', hex: '#E96832' },
      { name: 'Ruby Pink', hex: '#BE185D' },
    ],
    details: [
      'Fabric: 100% Pure Cotton with Chiffon Dupatta',
      'Pattern: Floral Print with Zari Handwork',
      'Wash Care: Hand Wash or Gentle Machine Wash',
      'Occasion: Festive, Wedding & Family Gatherings',
    ],
    isBestSeller: true,
  },
  {
    id: 2,
    name: 'Slim Fit Washed Denim Casual Shirt with Double Pockets',
    brand: 'Roadster Urban',
    category: 'men',
    categoryLabel: 'Men',
    price: '999.00',
    originalPrice: '1999.00',
    discountPercent: 50,
    available_quantity: 18,
    rating: 4.3,
    reviewCount: 512,
    images: [
      '/images/products/roadster-denim-1.jpg',
      '/images/products/roadster-denim-2.jpg',
    ],
    description:
      'A wardrobe essential cut in a contemporary slim fit from medium-wash soft denim. Features twin flap chest pockets, spread collar, curved hemline, and contrast snap buttons.',
    sizes: ['38', '40', '42', '44'],
    colors: [
      { name: 'Indigo Blue', hex: '#1E3A8A' },
      { name: 'Washed Black', hex: '#27272A' },
      { name: 'Vintage Stone', hex: '#9CA3AF' },
    ],
    details: [
      'Fabric: 100% Breathable Denim Twill',
      'Fit: Modern Slim Fit',
      'Hemline: Curved Hem for Casual Tucked or Untucked Style',
      'Care: Machine wash cold with like colors',
    ],
    isNewArrival: true,
  },
  {
    id: 3,
    name: 'Pure Chanderi Silk Tiered Festive Maxi Dress',
    brand: 'W & Aurelia',
    category: 'women',
    categoryLabel: 'Women',
    price: '1899.00',
    originalPrice: '3499.00',
    discountPercent: 45,
    available_quantity: 8,
    rating: 4.7,
    reviewCount: 189,
    images: [
      '/images/products/silk-maxi-1.jpg',
      '/images/products/silk-maxi-2.jpg',
    ],
    description:
      'Elevate festive evenings in this lightweight Chanderi silk maxi dress with a flattering square neckline, smocked bodice, cascading tiered silhouette, and golden foil accents.',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Mustard Gold', hex: '#D97706' },
      { name: 'Burgundy Wine', hex: '#831843' },
      { name: 'Teal Blue', hex: '#0F766E' },
    ],
    details: [
      'Fabric: Chanderi Art Silk with Cotton Lining',
      'Neckline: Contemporary Square Neck with Flared Sleeves',
      'Length: Ankle-length Maxi (54 inches)',
      'Care: Dry Clean Recommended',
    ],
    isBestSeller: true,
  },
  {
    id: 4,
    name: 'Breathable Knit Cushion Running & Training Shoes',
    brand: 'HRX Athletic',
    category: 'footwear',
    categoryLabel: 'Footwear',
    price: '1699.00',
    originalPrice: '3299.00',
    discountPercent: 48,
    available_quantity: 15,
    rating: 4.4,
    reviewCount: 420,
    images: [
      '/images/products/hrx-shoes-1.jpg',
      '/images/products/hrx-shoes-2.jpg',
    ],
    description:
      'Engineered with a high-density EVA midsole for maximum impact absorption. The seamless flyknit mesh upper keeps feet ventilated during extended training sessions or everyday runs.',
    sizes: ['UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'],
    colors: [
      { name: 'Fiery Orange', hex: '#EA580C' },
      { name: 'Triple Black', hex: '#18181B' },
      { name: 'Pure White', hex: '#F4F4F5' },
    ],
    details: [
      'Sole Material: High-Traction Textured Rubber Outsole',
      'Insole: Memory Foam Cushioning Bed',
      'Closure: Lace-Up with Reinforced Eyelets',
      'Weight: 260g (Super Lightweight)',
    ],
    isBestSeller: true,
  },
  {
    id: 5,
    name: 'Structured Vegan Leather Satchel with Detachable Sling',
    brand: 'Lavie Luxe',
    category: 'accessories',
    categoryLabel: 'Accessories',
    price: '1299.00',
    originalPrice: '2599.00',
    discountPercent: 50,
    available_quantity: 10,
    rating: 4.6,
    reviewCount: 275,
    images: [
      '/images/products/lavie-bag-1.jpg',
      '/images/products/lavie-bag-2.jpg',
    ],
    description:
      'A sophisticated everyday structured handbag featuring gold-tone metallic hardware, dual rolled top handles, multiple zippered compartments, and an adjustable crossbody strap.',
    sizes: ['One Size (12" x 9" x 5")'],
    colors: [
      { name: 'Cognac Tan', hex: '#92400E' },
      { name: 'Classic Black', hex: '#1C1917' },
      { name: 'Dusty Pink', hex: '#BE185D' },
    ],
    details: [
      'Material: Premium Grain Textured PU Leather',
      'Compartments: 2 Main Compartments + 1 Center Zip Pocket',
      'Hardware: Anti-tarnish Brushed Brass',
      'Strap: Adjustable 48-inch Crossbody Strap included',
    ],
    isNewArrival: true,
  },
  {
    id: 6,
    name: 'Classic 511 Mid-Rise Stretch Cotton Slim Jeans',
    brand: "Levi's Denim",
    category: 'men',
    categoryLabel: 'Men',
    price: '2199.00',
    originalPrice: '3999.00',
    discountPercent: 45,
    available_quantity: 20,
    rating: 4.8,
    reviewCount: 890,
    images: [
      '/images/products/levis-jeans-1.jpg',
      '/images/products/levis-jeans-2.jpg',
    ],
    description:
      'The modern slim jean with room to move. Added elastane stretch delivers all-day comfort without losing shape. Authentic 5-pocket styling with arcuate stitch on back pockets.',
    sizes: ['30', '32', '34', '36', '38'],
    colors: [
      { name: 'Dark Indigo Wash', hex: '#1E293B' },
      { name: 'Light Distressed Wash', hex: '#60A5FA' },
      { name: 'Charcoal Black', hex: '#27272A' },
    ],
    details: [
      'Material: 98% Cotton, 2% Elastane Flex Stretch',
      'Rise: Mid Rise (Sits below waist)',
      'Fly: Heavy-Duty Metal Zip Fly with Button Closure',
      'Care: Machine wash cold inside out',
    ],
    isBestSeller: true,
  },
  {
    id: 7,
    name: 'Kids Pure Cotton Festive Kurta Pyjama with Nehru Jacket',
    brand: 'FabIndia Junior',
    category: 'kids',
    categoryLabel: 'Kids',
    price: '1199.00',
    originalPrice: '2199.00',
    discountPercent: 45,
    available_quantity: 14,
    rating: 4.6,
    reviewCount: 160,
    images: [
      '/images/products/fabindia-kids-1.jpg',
      '/images/products/fabindia-kids-2.jpg',
    ],
    description:
      'Comfort-first traditional 3-piece set for celebrations. Includes a breathable slub-cotton kurta, elasticated churidar pyjama, and an eye-catching brocade-weave Nehru waistcoat.',
    sizes: ['3-4Y', '5-6Y', '7-8Y', '9-10Y', '11-12Y'],
    colors: [
      { name: 'Royal Blue & Gold', hex: '#1D4ED8' },
      { name: 'Maroon & Cream', hex: '#991B1B' },
    ],
    details: [
      'Fabric: 100% Skin-Friendly Soft Cotton Kurta with Brocade Vest',
      'Waistband: Gentle Full Elasticated Waistband for All-Day Play',
      'Collar: Mandarin Bandhgala Collar',
      'Care: Gentle Machine Wash in Laundry Bag',
    ],
    isNewArrival: true,
  },
  {
    id: 8,
    name: 'Smart Fitness AMOLED Watch with Bluetooth Calling',
    brand: 'Fastrack Active',
    category: 'accessories',
    categoryLabel: 'Accessories',
    price: '1799.00',
    originalPrice: '3999.00',
    discountPercent: 55,
    available_quantity: 25,
    rating: 4.4,
    reviewCount: 630,
    images: [
      '/images/products/fastrack-watch-1.jpg',
      '/images/products/fastrack-watch-2.jpg',
    ],
    description:
      'Features a bright 1.78" AMOLED display, single-chip Bluetooth calling with noise cancellation microphone, 100+ sports modes, 24/7 heart-rate and SpO2 tracking, and 7-day battery life.',
    sizes: ['Standard Dial (44mm)'],
    colors: [
      { name: 'Midnight Black', hex: '#18181B' },
      { name: 'Rose Gold', hex: '#FB7185' },
      { name: 'Space Silver', hex: '#94A3B8' },
    ],
    details: [
      'Display: 1.78" Ultra HD AMOLED (368x448 px, 500 nits)',
      'Battery: Up to 7 days typical use, fast magnetic charger',
      'Water Resistance: IP68 Dust and Splash Proof',
      'Compatibility: Android 6.0+ and iOS 11.0+',
    ],
    isBestSeller: true,
  },
];

/**
 * Merge live backend data from GET /api/products/ into storefront catalogue.
 * Authoritative fields from backend: id, name, price, available_quantity.
 */
export function mergeBackendWithStorefront(
  backendProducts: BackendProduct[]
): StorefrontProduct[] {
  if (!backendProducts || backendProducts.length === 0) {
    return CURATED_STOREFRONT_CATALOGUE;
  }

  const backendMap = new Map<number, BackendProduct>(
    backendProducts.map((bp) => [bp.id, bp])
  );

  return CURATED_STOREFRONT_CATALOGUE.map((item) => {
    const backendItem = backendMap.get(item.id);
    if (!backendItem) {
      return item;
    }

    return {
      ...item,
      id: backendItem.id,
      name: backendItem.name || item.name,
      price: backendItem.price ? parseFloat(backendItem.price).toFixed(2) : item.price,
      available_quantity:
        typeof backendItem.available_quantity === 'number'
          ? backendItem.available_quantity
          : item.available_quantity,
    };
  });
}
