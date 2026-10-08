import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { Filter, Search, X, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartSidebar } from '@/components/CartSidebar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { ProductCard } from '@/components/ProductCard';
import { ProductQuickView } from '@/components/ProductQuickView';
import { ProductFilter, FilterState } from '@/components/ProductFilter';
import { useProducts } from '@/hooks/useProducts';
import { useNavCategories, useBrands } from '@/hooks/useTaxonomy';
import { Product } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { SEO } from '@/components/SEO';

const Shop = () => {

  const [searchParams, setSearchParams] = useSearchParams();
  const { category: categoryParam } = useParams<{ category?: string }>();
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    colors: [],
    sizes: [],
    fabrics: [],
    priceRange: [0, 10000],
  });

  const { products, categories, loading } = useProducts();
  const { navCategories } = useNavCategories();
  const { brands } = useBrands();

  const subSlug = searchParams.get('sub');
  const brandSlug = searchParams.get('brand');

  const activeCategory = useMemo(
    () => (categoryParam ? navCategories.find((c) => c.slug === categoryParam) || null : null),
    [categoryParam, navCategories]
  );


  const activeSubcategory = useMemo(() => {
    if (!subSlug) return null;
    for (const c of navCategories) {
      const found = c.subcategories.find((s) => s.slug === subSlug);
      if (found) return found;
    }
    return null;
  }, [subSlug, navCategories]);

  const activeBrand = useMemo(
    () => (brandSlug ? brands.find((b) => b.slug === brandSlug) || null : null),
    [brandSlug, brands]
  );

  // Get unique filter options from database products
  const filterOptions = useMemo(() => {
    const categoryNames = categories.map(c => c.name);
    const allColors = new Set<string>();
    const allSizes = new Set<string>();
    const allFabrics = new Set<string>();
    let maxPrice = 2000;

    products.forEach(p => {
      if (p.colors) p.colors.forEach(c => allColors.add(c));
      if (p.sizes) p.sizes.forEach(s => allSizes.add(s));
      if (p.fabric) allFabrics.add(p.fabric);
      if (p.price > maxPrice) maxPrice = p.price;
    });

    return {
      categories: categoryNames,
      colors: Array.from(allColors),
      sizes: Array.from(allSizes),
      fabrics: Array.from(allFabrics),
      maxPrice: Math.ceil(maxPrice / 100) * 100,
    };
  }, [products, categories]);

  // Keep the price range aligned with the real catalog max until the user touches it
  const priceTouched = useRef(false);
  useEffect(() => {
    if (priceTouched.current) return;
    setFilters((prev) =>
      prev.priceRange[1] === filterOptions.maxPrice ? prev : { ...prev, priceRange: [0, filterOptions.maxPrice] }
    );
  }, [filterOptions.maxPrice]);

  const handleFiltersChange = (next: FilterState) => {
    if (next.priceRange[0] !== filters.priceRange[0] || next.priceRange[1] !== filters.priceRange[1]) {
      priceTouched.current = true;
    }
    setFilters(next);
  };

  // Sync search query and category filter from URL (path param OR query param)
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    const urlCategory = categoryParam || searchParams.get('category');
    
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
    
    if (urlCategory) {
      const matchedCategory = categories.find(
        c => c.slug === urlCategory || c.name.toLowerCase() === urlCategory.toLowerCase()
      );
      if (matchedCategory) {
        setFilters(prev => ({
          ...prev,
          categories: [matchedCategory.name]
        }));
      }
    }
  }, [searchParams, categories, categoryParam]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesCategory = product.category.toLowerCase().includes(query);
        if (!matchesName && !matchesCategory) return false;
      }
      if (filters.categories.length > 0 && !filters.categories.includes(product.category)) return false;
      if (activeSubcategory && product.subcategoryId !== activeSubcategory.id) return false;
      if (activeBrand && product.brandId !== activeBrand.id) return false;
      if (filters.colors.length > 0) {
        const hasMatchingColor = product.colors?.some((color) =>
          filters.colors.some((fc) => color.toLowerCase().includes(fc.toLowerCase()))
        );
        if (!hasMatchingColor) return false;
      }
      if (filters.sizes.length > 0) {
        const hasMatchingSize = product.sizes?.some((size) => filters.sizes.includes(size));
        if (!hasMatchingSize) return false;
      }
      if (filters.fabrics.length > 0) {
        if (!product.fabric || !filters.fabrics.includes(product.fabric)) return false;
      }
      if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) return false;
      return true;
    });
  }, [filters, searchQuery, products, activeSubcategory, activeBrand]);

  const activeFiltersCount =
    filters.categories.length +
    filters.colors.length +
    filters.sizes.length +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < filterOptions.maxPrice ? 1 : 0);

  const clearSearch = () => {
    setSearchQuery('');
    setSearchParams({});
  };

  const categoryLabel = categoryParam ? categoryParam.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : null;
  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title={categoryLabel ? `${categoryLabel} — Gadget er Dokan` : 'Shop Gadgets & Tech Accessories — Gadget er Dokan'}
        description={categoryLabel
          ? `Browse ${categoryLabel} at Gadget er Dokan. Genuine gadgets with cash on delivery in Bangladesh.`
          : 'Browse the full Gadget er Dokan catalog — smart watches, earbuds, chargers, cables and power banks.'}
        path={categoryParam ? `/shop/${categoryParam}` : '/shop'}
      />
      <Header />

      <main className="flex-1 bg-secondary/30 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <h1 className="font-heading text-3xl font-semibold">
              {searchQuery
                ? `Search: "${searchQuery}"`
                : activeBrand?.name || activeSubcategory?.name || categoryLabel || 'All Products'}
            </h1>
            
            <div className="flex items-center gap-3">
              {/* Search input */}
              <div className="relative flex-1 md:w-64">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-8"
                />
                {searchQuery && (
                  <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X size={16} />
                  </button>
                )}
              </div>
              
              {/* Filter toggle button - visible on ALL screens */}
              <Button
                variant={isFilterOpen ? 'default' : 'outline'}
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="gap-2 flex-shrink-0"
              >
                <SlidersHorizontal size={16} />
                <span className="hidden sm:inline">Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 bg-accent text-accent-foreground text-xs rounded-full flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Subcategory quick links for the active category */}
          {activeCategory && activeCategory.subcategories.length > 0 && (
            <div className="-mt-4 mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.delete('sub');
                  setSearchParams(next);
                }}
                className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap border transition-colors ${
                  !subSlug ? 'bg-foreground text-background border-foreground' : 'bg-background border-border hover:bg-secondary'
                }`}
              >
                All
              </button>
              {activeCategory.subcategories.map((s) => {
                const active = subSlug === s.slug;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      const next = new URLSearchParams(searchParams);
                      next.set('sub', s.slug);
                      setSearchParams(next);
                    }}
                    className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap border transition-colors ${
                      active ? 'bg-foreground text-background border-foreground' : 'bg-background border-border hover:bg-secondary'
                    }`}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
          )}



          <div className="flex gap-8">
            {/* Sidebar Filter - conditionally shown */}
            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 288, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="hidden lg:block flex-shrink-0 overflow-hidden"
                >
                  <ProductFilter
                    isOpen={true}
                    onClose={() => setIsFilterOpen(false)}
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    categoryOptions={filterOptions.categories}
                    colorOptions={filterOptions.colors}
                    sizeOptions={filterOptions.sizes}
                    fabricOptions={filterOptions.fabrics}
                    maxPrice={filterOptions.maxPrice}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mobile Filter */}
            <AnimatePresence>
              {isFilterOpen && (
                <div className="lg:hidden">
                  <ProductFilter
                    isOpen={isFilterOpen}
                    onClose={() => setIsFilterOpen(false)}
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    categoryOptions={filterOptions.categories}
                    colorOptions={filterOptions.colors}
                    sizeOptions={filterOptions.sizes}
                    fabricOptions={filterOptions.fabrics}
                    maxPrice={filterOptions.maxPrice}
                  />
                </div>
              )}
            </AnimatePresence>

            {/* Products Grid */}
            <div className="flex-1">
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="aspect-square w-full rounded-lg" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground text-lg">
                    {products.length === 0 ? 'No products available yet.' : 'No products match your filters.'}
                  </p>
                  {products.length > 0 && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setFilters({ categories: [], colors: [], sizes: [], fabrics: [], priceRange: [0, filterOptions.maxPrice] })}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <p className="text-muted-foreground mb-4">
                    Showing {filteredProducts.length} products
                  </p>
                  <motion.div
                    key={filteredProducts.map(p => p.id).join('-')}
                    variants={{
                      hidden: {},
                      show: { transition: { staggerChildren: 0.02 } },
                    }}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 lg:gap-6"
                  >
                    {filteredProducts.map((product) => (
                      <motion.div
                        key={product.id}
                        variants={{
                          hidden: { opacity: 0, y: 8 },
                          show: {
                            opacity: 1,
                            y: 0,
                            transition: { duration: 0.25, ease: 'easeOut' },
                          },
                        }}
                      >
                        <ProductCard
                          product={product}
                          onQuickView={setQuickViewProduct}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </div>

        <ProductQuickView
          product={quickViewProduct}
          isOpen={!!quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      </main>
      <CartSidebar />
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default Shop;
