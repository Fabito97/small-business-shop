'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useProducts, type ProductFilters } from '@/hooks/useProducts';
import { ProductCard } from '@/components/shop/ProductCard';
import { ProductGridSkeleton } from '@/components/shop/ProductSkeleton';
import { FilterSidebar } from '@/components/shop/FilterSidebar';
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, Watch, RotateCcw } from 'lucide-react';
import { BRAND } from '@/config/brand';

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read category directly from searchParams for instant synchronization
  const categoryParam = searchParams.get('category');
  const activeCategory = categoryParam && categoryParam !== 'all' ? categoryParam : undefined;

  const [filters, setFilters] = useState<Omit<ProductFilters, 'category'>>({
    q: searchParams.get('q') || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    sort: (searchParams.get('sort') as ProductFilters['sort']) || 'newest',
    inStock: searchParams.get('inStock') === 'true',
    page: 1,
    limit: 12,
  });

  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        q: searchInput.trim() ? searchInput.trim() : undefined,
        page: 1,
      }));
    }, 350);

    return () => clearTimeout(handler);
  }, [searchInput]);

  const effectiveFilters: ProductFilters = {
    ...filters,
    category: activeCategory,
  };

  const { data, isLoading, isError } = useProducts(effectiveFilters);

  const handleResetFilters = () => {
    setSearchInput('');
    setFilters({
      page: 1,
      limit: 12,
      sort: 'newest',
    });
    router.push('/shop');
  };

  const handleSortChange = (sort: ProductFilters['sort']) => {
    setFilters((prev) => ({ ...prev, sort, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header Banner */}
      <div className="border-b border-[var(--sand)] pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="text-xs uppercase tracking-[0.3em] text-[var(--gold)] font-medium">
            Watch Collection
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl text-[var(--ink)] font-light mt-1">
            Original Watches at {BRAND.name}
          </h1>
          <p className="text-sm text-[var(--muted)] mt-2 max-w-xl">
            Explore authentic, quality wristwatches for men and women. Fast and reliable delivery across all 36 states in Nigeria.
          </p>
        </div>

        {/* Search Bar */}
        <div className="w-full md:w-80 relative">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search watch name, brand..."
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--charcoal)] border border-[var(--gold)]/20 rounded-xl text-xs text-[var(--ivory)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] transition-colors"
          />
          <Search className="w-4 h-4 text-[var(--muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Main Grid + Filter Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Filter Sidebar Component */}
        <FilterSidebar
          filters={effectiveFilters}
          onChange={(newFilters) => {
            const params = new URLSearchParams(searchParams.toString());
            if (newFilters.category && newFilters.category !== 'all') {
              params.set('category', newFilters.category);
            } else {
              params.delete('category');
            }
            router.push(`/shop${params.toString() ? `?${params.toString()}` : ''}`);
            setFilters({
              q: newFilters.q,
              minPrice: newFilters.minPrice,
              maxPrice: newFilters.maxPrice,
              sort: newFilters.sort,
              inStock: newFilters.inStock,
              page: newFilters.page,
              limit: newFilters.limit,
            });
          }}
          onReset={handleResetFilters}
          isOpenMobile={isMobileFilterOpen}
          onCloseMobile={() => setIsMobileFilterOpen(false)}
        />

        {/* Products Column */}
        <div className="flex-1 w-full space-y-6">
          {/* Controls Bar (Mobile Filter Toggle + Results Count + Sort) */}
          <div className="bg-[var(--charcoal)] border border-[var(--gold)]/15 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
            {/* Mobile Filter Button */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 text-xs uppercase tracking-wider text-[var(--gold)] font-medium p-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>

            {/* Results Count */}
            <div className="text-xs text-[var(--muted)]">
              {isLoading ? (
                <span>Loading watches...</span>
              ) : (
                <span>
                  Showing <strong className="text-[var(--ivory)]">{data?.items.length || 0}</strong> of{' '}
                  <strong className="text-[var(--gold)]">{data?.total || 0}</strong> Watches
                </span>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-xs text-[var(--muted)] uppercase tracking-wider">
                Sort:
              </span>
              <select
                value={filters.sort || 'newest'}
                onChange={(e) => handleSortChange(e.target.value as ProductFilters['sort'])}
                className="bg-[var(--ink)] border border-[var(--gold)]/20 rounded-lg px-3 py-1.5 text-xs text-[var(--sand)] focus:outline-none focus:border-[var(--gold)] cursor-pointer"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Product Grid / Loading / Empty State */}
          {isLoading ? (
            <ProductGridSkeleton count={filters.limit || 8} />
          ) : isError ? (
            <div className="bg-[var(--charcoal)] border border-[var(--danger)]/30 rounded-2xl p-12 text-center space-y-4">
              <p className="text-sm text-[var(--danger)]">
                Unable to load watches at this moment.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-[var(--gold)] text-[var(--ink)] text-xs uppercase tracking-wider rounded-lg font-semibold"
              >
                Retry
              </button>
            </div>
          ) : data?.items.length === 0 ? (
            <div className="bg-[var(--charcoal)] border border-[var(--gold)]/15 rounded-2xl p-16 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[var(--ink)] border border-[var(--gold)]/30 flex items-center justify-center text-[var(--gold)] mx-auto">
                <Watch className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl text-[var(--ivory)] font-light">
                No Watches Found
              </h3>
              <p className="text-xs text-[var(--muted)] max-w-sm mx-auto leading-relaxed">
                No watches match your active search filters. Try broadening your criteria or reset your search.
              </p>
              <div className="pt-2">
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--gold)] hover:bg-[var(--gold-deep)] text-[var(--ink)] text-xs uppercase tracking-wider font-semibold rounded-lg transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {data && data.pageCount > 1 && (
            <div className="pt-8 border-t border-[var(--sand)]/10 flex items-center justify-center gap-4">
              <button
                onClick={() => handlePageChange((filters.page || 1) - 1)}
                disabled={(filters.page || 1) <= 1}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--gold)]/20 text-xs text-[var(--sand)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--charcoal)] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <span className="text-xs text-[var(--muted)]">
                Page <strong className="text-[var(--gold)]">{filters.page || 1}</strong> of{' '}
                {data.pageCount}
              </span>

              <button
                onClick={() => handlePageChange((filters.page || 1) + 1)}
                disabled={(filters.page || 1) >= data.pageCount}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--gold)]/20 text-xs text-[var(--sand)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--charcoal)] transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-16"><ProductGridSkeleton count={8} /></div>}>
      <ShopContent />
    </Suspense>
  );
}
