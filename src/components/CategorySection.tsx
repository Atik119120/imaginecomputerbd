import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useCategories } from '@/hooks/useProducts';
import { getCategoryIcon } from '@/lib/categoryIcons';
import { Skeleton } from '@/components/ui/skeleton';

export const CategorySection = () => {
  const { categories, loading } = useCategories();

  return (
    <section className="py-10 md:py-14 bg-secondary/40">
      <div className="container mx-auto px-3 md:px-4">
        <div className="text-center mb-6 md:mb-8">
          <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground tracking-tight">
            Featured Category
          </h2>
          <p className="text-sm md:text-[15px] text-muted-foreground mt-1.5">
            Get Your Desired Product from Featured Category!
          </p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 md:gap-4">
          {loading
            ? [...Array(16)].map((_, i) => (
                <Skeleton key={i} className="h-[136px] rounded-xl" />
              ))
            : categories.map((category, index) => {
                const Icon = getCategoryIcon(category.icon_key, category.slug);
                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.03, duration: 0.25 }}
                  >
                    <Link
                      to={`/shop/${category.slug}`}
                      className="group flex h-[136px] flex-col items-center justify-center gap-4 rounded-xl bg-card px-2 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.10)]"
                    >
                      <Icon
                        strokeWidth={1.25}
                        className="h-9 w-9 text-foreground/85 transition-all duration-300 group-hover:scale-110 group-hover:text-brand-red"
                      />
                      <span className="text-[13px] font-medium leading-snug text-foreground/80 transition-colors group-hover:text-brand-red">
                        {category.name}
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
        </div>
      </div>
    </section>
  );
};
