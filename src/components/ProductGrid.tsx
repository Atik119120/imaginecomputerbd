import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { ProductQuickView } from '@/components/ProductQuickView';
import { useProducts } from '@/hooks/useProducts';
import { Product } from '@/types/product';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

export const ProductGrid = () => {
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const { products, categories, loading } = useProducts();
  const isMobile = useIsMobile();

  // Mobile: 2 rows x 2 cols = 4 items, Desktop: 1 row x 5 cols = 5 items
  const itemsPerCategory = isMobile ? 4 : 5;

  // Group products by category, preserving category order
  const grouped = categories
    .map((cat) => ({
      category: cat,
      items: products.filter((p) => p.category === cat.name).slice(0, itemsPerCategory),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <section className="py-4 md:py-8 bg-gradient-to-b from-background via-secondary/20 to-background">
      <div className="container mx-auto px-3 md:px-4">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No products available yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="space-y-10 md:space-y-14">
            {grouped.map((group) => (
              <div key={group.category.id}>
                <motion.div
                  className="flex items-end justify-between mb-4 md:mb-6"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <h2 className="font-heading text-xl md:text-3xl font-bold text-foreground tracking-tight">
                    {group.category.name}
                  </h2>
                  <Link
                    to={`/shop?category=${group.category.slug}`}
                    className="text-xs md:text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
                  >
                    View All <ArrowRight size={14} />
                  </Link>
                </motion.div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
                  {group.items.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <ProductCard
                        product={product}
                        onQuickView={setQuickViewProduct}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}

            <motion.div
              className="text-center mt-4 md:mt-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Link to="/shop">
                <Button
                  size="lg"
                  className="group px-8 py-6 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  View All Products
                  <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          </div>
        )}

        <ProductQuickView
          product={quickViewProduct}
          isOpen={!!quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      </div>
    </section>
  );
};
