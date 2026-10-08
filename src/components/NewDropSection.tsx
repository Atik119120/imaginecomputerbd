import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { ProductQuickView } from '@/components/ProductQuickView';
import { useProducts } from '@/hooks/useProducts';
import { Product } from '@/types/product';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export const NewDropSection = () => {
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const { products, loading } = useProducts();

  // Latest 8 products = "New Drop"
  // 1 row only: 2 on mobile, 5 on desktop
  const newDropProducts = products.slice(0, 5);

  if (!loading && newDropProducts.length === 0) return null;

  return (
    <section className="py-4 md:py-8 bg-background">
      <div className="container mx-auto px-3 md:px-4">
        <motion.div
          className="flex flex-col items-center text-center mb-4 md:mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/15 rounded-full mb-3">
            <Zap size={14} className="text-accent fill-accent" />
            <span className="text-xs font-medium text-accent uppercase tracking-wider">
              Just Dropped
            </span>
          </div>
          <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground">
            New Drop
          </h2>
          <p className="text-muted-foreground text-sm md:text-base mt-1">
            Fresh arrivals — straight from the studio
          </p>

          <Link to="/new-drop" className="hidden md:block mt-4">
            <Button variant="outline" size="sm" className="group">
              View All
              <ArrowRight size={14} className="ml-1.5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[3/4] w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
            {newDropProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className={index >= 4 ? 'hidden md:block' : ''}
              >
                <ProductCard product={product} onQuickView={setQuickViewProduct} />
              </motion.div>
            ))}
          </div>
        )}

        <div className="text-center mt-8 md:hidden">
          <Link to="/new-drop">
            <Button variant="outline" className="group">
              View All New Arrivals
              <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        <ProductQuickView
          product={quickViewProduct}
          isOpen={!!quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      </div>
    </section>
  );
};
