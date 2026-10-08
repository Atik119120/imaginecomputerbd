import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import { Product } from '@/types/product';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/context/CartContext';
import { optimizeImage } from '@/lib/optimizeImage';
import { toast } from 'sonner';

export const TopSellingSection = () => {
  const [topProductIds, setTopProductIds] = useState<string[]>([]);
  const { products, loading } = useProducts();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTopSelling = async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select('product_id, quantity');
      if (error || !data) return;
      const counts = new Map<string, number>();
      data.forEach((item: any) => {
        counts.set(item.product_id, (counts.get(item.product_id) || 0) + (item.quantity || 1));
      });
      const sorted = Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([id]) => id);
      setTopProductIds(sorted);
    };
    fetchTopSelling();
  }, []);

  const topProducts: Product[] = topProductIds.length > 0
    ? (topProductIds.map((id) => products.find((p) => p.id === id)).filter(Boolean) as Product[])
    : products.slice(0, 4);

  if (!loading && topProducts.length === 0) return null;

  const handleAdd = (p: Product) => {
    addToCart(p, 1);
    toast.success(`${p.name} added to cart`);
  };
  const handleBuy = (p: Product) => {
    addToCart(p, 1);
    navigate('/checkout');
  };

  return (
    <section className="py-6 md:py-10 bg-secondary/30">
      <div className="container mx-auto px-3 md:px-4">
        <motion.div
          className="text-center mb-5 md:mb-8"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            Top Selling Products
          </h2>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {topProducts.map((product, index) => {
              const save = product.originalPrice ? product.originalPrice - product.price : 0;
              return (
                <motion.article
                  key={product.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="relative bg-card rounded-xl shadow-sm hover:shadow-md transition-shadow ring-1 ring-border overflow-hidden"
                >
                  {/* Best Selling badge */}
                  <div className="absolute top-0 right-0 z-10 flex items-center gap-1 px-2.5 py-1 bg-accent text-accent-foreground text-[10px] md:text-xs font-semibold rounded-bl-lg">
                    <Flame size={12} className="fill-current" />
                    Best Selling
                  </div>

                  <div className="flex items-center gap-3 md:gap-5 p-3 md:p-5">
                    {/* Image */}
                    <button
                      onClick={() => navigate(`/product/${product.id}`)}
                      className="flex-shrink-0 w-28 h-28 md:w-40 md:h-40 bg-background rounded-lg overflow-hidden flex items-center justify-center group"
                      aria-label={product.name}
                    >
                      <img
                        src={optimizeImage(product.image, 400)}
                        alt={product.name}
                        loading="lazy"
                        className="max-w-full max-h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                      />
                    </button>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                      <h3
                        className="font-heading text-base md:text-lg font-semibold text-foreground leading-snug line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                        onClick={() => navigate(`/product/${product.id}`)}
                      >
                        {product.name}
                      </h3>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-accent font-bold text-base md:text-lg">৳{product.price.toLocaleString()}</span>
                        {product.originalPrice && (
                          <span className="text-muted-foreground line-through text-sm">৳{product.originalPrice.toLocaleString()}</span>
                        )}
                      </div>

                      {save > 0 && (
                        <span className="inline-block self-start bg-brand-red/10 text-primary text-[11px] md:text-xs font-semibold px-2 py-0.5 rounded">
                          Save ৳{save.toLocaleString()}
                        </span>
                      )}

                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <button
                          onClick={() => handleAdd(product)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs md:text-sm font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
                        >
                          <ShoppingCart size={14} />
                          Add To Cart
                        </button>
                        <button
                          onClick={() => handleBuy(product)}
                          className="px-3 py-1.5 text-xs md:text-sm font-medium bg-accent text-accent-foreground rounded-md hover:opacity-90 transition-opacity"
                        >
                          Order Now
                        </button>
                      </div>

                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
