'use client';

import { SHOP } from '@/config/shop';
import { formatNaira } from '@/lib/money';
import { RotateCcw, Check, SlidersHorizontal, X } from 'lucide-react';
import type { ProductFilters } from '@/hooks/useProducts';

interface FilterSidebarProps {
  filters: ProductFilters;
  onChange: (newFilters: ProductFilters) => void;
  onReset: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function FilterSidebar({
  filters,
  onChange,
  onReset,
  isOpenMobile,
  onCloseMobile,
}: FilterSidebarProps) {
  const currentCategory = filters.category || 'all';

  const PRICE_RANGES = [
    { label: 'All Values', min: undefined, max: undefined },
    { label: 'Under ₦500,000', min: undefined, max: 50_000_000 },
    { label: '₦500,000 – ₦1,000,000', min: 50_000_000, max: 100_000_000 },
    { label: '₦1,000,000 – ₦2,000,000', min: 100_000_000, max: 200_000_000 },
    { label: 'Over ₦2,000,000', min: 200_000_000, max: undefined },
  ];

  const handleCategorySelect = (category: string) => {
    onChange({
      ...filters,
      category: category === 'all' ? undefined : category,
      page: 1,
    });
  };

  const handlePriceSelect = (min?: number, max?: number) => {
    onChange({
      ...filters,
      minPrice: min,
      maxPrice: max,
      page: 1,
    });
  };

  const handleInStockToggle = (checked: boolean) => {
    onChange({
      ...filters,
      inStock: checked ? true : undefined,
      page: 1,
    });
  };

  const content = (
    <div className="space-y-8">
      {/* Header with Reset */}
      <div className="flex items-center justify-between border-b border-[var(--sand)]/10 pb-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--gold)] font-medium">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Refine Gallery</span>
        </div>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[var(--muted)] hover:text-[var(--gold)] transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Category Filter */}
      <div className="space-y-3">
        <h4 className="text-xs uppercase tracking-[0.2em] text-[var(--ivory)] font-medium">
          Horology Categories
        </h4>
        <div className="space-y-1">
          <button
            onClick={() => handleCategorySelect('all')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
              currentCategory === 'all'
                ? 'bg-[var(--gold)]/15 text-[var(--gold)] border border-[var(--gold)]/30 font-medium'
                : 'text-[var(--sand)]/70 hover:bg-[var(--ink)] hover:text-[var(--ivory)]'
            }`}
          >
            <span>All Complications</span>
            {currentCategory === 'all' && <Check className="w-3.5 h-3.5" />}
          </button>

          {SHOP.categories.map((cat) => {
            const isSelected = currentCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                  isSelected
                    ? 'bg-[var(--gold)]/15 text-[var(--gold)] border border-[var(--gold)]/30 font-medium'
                    : 'text-[var(--sand)]/70 hover:bg-[var(--ink)] hover:text-[var(--ivory)]'
                }`}
              >
                <span>{cat.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Presets */}
      <div className="space-y-3">
        <h4 className="text-xs uppercase tracking-[0.2em] text-[var(--ivory)] font-medium">
          Price Spectrum
        </h4>
        <div className="space-y-1">
          {PRICE_RANGES.map((range, index) => {
            const isSelected =
              filters.minPrice === range.min && filters.maxPrice === range.max;
            return (
              <button
                key={index}
                onClick={() => handlePriceSelect(range.min, range.max)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                  isSelected
                    ? 'bg-[var(--gold)]/15 text-[var(--gold)] border border-[var(--gold)]/30 font-medium'
                    : 'text-[var(--sand)]/70 hover:bg-[var(--ink)] hover:text-[var(--ivory)]'
                }`}
              >
                <span>{range.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* In-Stock Only Toggle */}
      <div className="pt-4 border-t border-[var(--sand)]/10">
        <label className="flex items-center justify-between cursor-pointer group">
          <span className="text-xs uppercase tracking-wider text-[var(--sand)]/80 group-hover:text-[var(--gold)] transition-colors">
            Vault Ready (In Stock)
          </span>
          <input
            type="checkbox"
            checked={Boolean(filters.inStock)}
            onChange={(e) => handleInStockToggle(e.target.checked)}
            className="w-4 h-4 rounded border-[var(--gold)]/40 bg-[var(--ink)] text-[var(--gold)] focus:ring-[var(--gold)] focus:ring-offset-0 cursor-pointer"
          />
        </label>
      </div>

      {/* Value statement note */}
      <div className="p-4 rounded-xl bg-[var(--ink)] border border-[var(--gold)]/10 text-[11px] text-[var(--muted)] leading-relaxed">
        <p>
          Complimentary insured shipping applies automatically to all acquisitions over{' '}
          <span className="text-[var(--gold)]">{formatNaira(SHOP.freeShippingThresholdKobo)}</span>.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 bg-[var(--charcoal)] border border-[var(--gold)]/15 rounded-2xl p-6 h-fit sticky top-28 shadow-xl">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[var(--ink)]/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative ml-auto w-full max-w-xs bg-[var(--charcoal)] border-l border-[var(--gold)]/20 p-6 h-full overflow-y-auto shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex items-center justify-between mb-6 pb-2 border-b border-[var(--sand)]/10">
                <span className="font-serif text-lg text-[var(--ivory)]">Filters</span>
                <button
                  onClick={onCloseMobile}
                  className="p-1.5 text-[var(--muted)] hover:text-[var(--ivory)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {content}
            </div>

            <button
              onClick={onCloseMobile}
              className="mt-8 w-full py-3 bg-[var(--gold)] text-[var(--ink)] text-xs uppercase tracking-widest font-semibold rounded-lg"
            >
              Apply Selection
            </button>
          </div>
        </div>
      )}
    </>
  );
}
