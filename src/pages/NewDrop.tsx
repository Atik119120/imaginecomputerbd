import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartSidebar } from '@/components/CartSidebar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { ProductCard } from '@/components/ProductCard';
import { ProductQuickView } from '@/components/ProductQuickView';
import { useProducts } from '@/hooks/useProducts';
import { Product } from '@/types/product';
import { Skeleton } from '@/components/ui/skeleton';

const NewDrop = () => {
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const { products, loading } = useProducts();

  // Products are already sorted by created_at desc in useProducts
  const newProducts = products.slice(0, 24);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-secondary/30 pb-14 lg:pb-0">
        {/* Hero */}
        <section className="relative py-10 md:py-16 overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-2xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/15 rounded-full mb-4">
                <Zap size={14} className="text-accent fill-accent" />
                <span className="text-xs font-medium text-accent uppercase tracking-widest">
                  Just Dropped
                </span>
              </div>
              <h1 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-3">
                New Drop
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
                The latest drops from Gadget er Dokan — new gadgets, genuine quality, limited stock.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Products */}
        <section className="py-8 md:py-12">
          <div className="container mx-auto px-3 md:px-4">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-[3/4] w-full rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : newProducts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">No new arrivals yet. Check back soon!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
                {newProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    <ProductCard product={product} onQuickView={setQuickViewProduct} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

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

export default NewDrop;
