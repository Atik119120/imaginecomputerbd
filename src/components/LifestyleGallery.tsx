import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { optimizeImage } from '@/lib/optimizeImage';

interface LifestyleItem {
  id: string;
  title: string | null;
  image_url: string;
  link: string | null;
  display_order: number;
  is_active: boolean;
}

export const LifestyleGallery = () => {
  const [items, setItems] = useState<LifestyleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      const { data, error } = await supabase
        .from('lifestyle_gallery')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (!error && data) setItems(data as LifestyleItem[]);
      setLoading(false);
    };
    fetchItems();
  }, []);

  if (loading || items.length === 0) return null;

  // Masonry-like 6-cell layout for first 6 items
  const layoutClasses = [
    'md:col-span-2 md:row-span-2 aspect-square md:aspect-auto', // big
    'aspect-square',
    'aspect-square',
    'aspect-square',
    'aspect-square',
    'md:col-span-2 aspect-[2/1] md:aspect-[2/1]', // wide
  ];

  const visible = items.slice(0, 6);

  return (
    <section className="py-4 md:py-8 bg-background">
      <div className="container mx-auto px-3 md:px-4">
        <motion.div
          className="text-center mb-4 md:mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-red/10 rounded-full mb-3">
            <Camera size={14} className="text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-wider">
              From Our Kitchen
            </span>
          </div>
          <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground mb-2">
            Tasted by Families
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
            Real meals. Real goodness. Tagged with #AminOne
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 auto-rows-[140px] md:auto-rows-[180px]">
          {visible.map((item, index) => {
            const Wrapper: any = item.link ? Link : 'div';
            const props = item.link ? { to: item.link } : {};
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className={`relative overflow-hidden rounded-xl group ${layoutClasses[index] || 'aspect-square'}`}
              >
                <Wrapper {...props} className="block w-full h-full">
                  <img
                    src={optimizeImage(item.image_url, 600)}
                    alt={item.title || 'Lifestyle'}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  {item.title && (
                    <div className="absolute bottom-2 left-3 right-3 text-white text-sm font-semibold opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 drop-shadow-lg">
                      {item.title}
                    </div>
                  )}
                </Wrapper>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
