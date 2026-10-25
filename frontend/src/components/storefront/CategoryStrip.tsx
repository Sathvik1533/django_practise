import React from 'react';
import type { FashionCategory } from '../../types/storefront';

interface CategoryStripProps {
  selectedCategory: FashionCategory;
  onSelectCategory: (category: FashionCategory) => void;
}

const CATEGORY_ITEMS: {
  id: FashionCategory;
  name: string;
  image: string;
  offerText: string;
}[] = [
  {
    id: 'women',
    name: 'Ethnic & Western',
    image: '/images/categories/women.jpg',
    offerText: 'Up to 60% Off',
  },
  {
    id: 'men',
    name: 'Casual & Denim',
    image: '/images/categories/men.jpg',
    offerText: 'Min 40% Off',
  },
  {
    id: 'kids',
    name: 'Junior Fashion',
    image: '/images/categories/kids.jpg',
    offerText: 'From ₹499',
  },
  {
    id: 'footwear',
    name: 'Shoes & Sneakers',
    image: '/images/categories/footwear.jpg',
    offerText: 'Flat 45% Off',
  },
  {
    id: 'accessories',
    name: 'Bags & Watches',
    image: '/images/categories/accessories.jpg',
    offerText: 'Up to 55% Off',
  },
];

export const CategoryStrip: React.FC<CategoryStripProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-bold text-[#242424] tracking-tight">
          Shop by Department
        </h2>
        <span className="text-xs text-[#71717A]">Curated Indian Fashion Catalogue</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {CATEGORY_ITEMS.map((item) => {
          const isSelected = selectedCategory === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectCategory(item.id)}
              className={`group flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-[#E96832] bg-[#E96832]/5 ring-1 ring-[#E96832]'
                  : 'border-[#E5E5E2] bg-white hover:border-[#D4D4D8] hover:shadow-xs'
              }`}
            >
              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-[#F4F4F5] border border-[#E5E5E2]">
                <img
                  src={item.image}
                  alt={item.name}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== '/images/placeholder-product.svg') {
                      target.src = '/images/placeholder-product.svg';
                    }
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="eager"
                />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#242424] truncate group-hover:text-[#E96832]">
                  {item.name}
                </div>
                <div className="text-[11px] font-semibold text-[#E96832] truncate">
                  {item.offerText}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
