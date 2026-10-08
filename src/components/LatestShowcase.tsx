import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { optimizeImage } from '@/lib/optimizeImage';

interface ShowcaseItem {
  id: string;
  title: string | null;
  image_url: string;
  product_link: string;
  display_order: number;
  is_active: boolean;
}

export const LatestShowcase = () => {
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchShowcase();
  }, []);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
      setIsMobile(window.innerWidth < 768);
    };
    update();
    window.addEventListener('resize', update);

    let observer: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(update);
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', update);
      observer?.disconnect();
    };
  }, [loading, items.length]);

  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [items.length]);

  const fetchShowcase = async () => {
    try {
      const { data, error } = await supabase
        .from('latest_showcase')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching showcase:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-4 md:py-8 bg-secondary/30">
        <div className="container mx-auto px-3 md:px-4">
          <div className="h-8 w-48 bg-secondary rounded-lg mx-auto mb-8 animate-pulse" />
          <div className="flex gap-4 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-52 md:w-64 aspect-[4/5] bg-secondary rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  // Card sizing
  const cardWidth = isMobile ? 176 : 256; // w-44 / w-64
  const gap = isMobile ? 12 : 20; // gap-3 / gap-5
  const step = cardWidth + gap;

  // Triple list for infinite illusion
  const displayItems = [...items, ...items, ...items];
  const centerOffset = items.length;

  // Translate so active card is centered in container
  const activeAbsoluteIndex = currentIndex + centerOffset;
  const translateX = containerWidth / 2 - cardWidth / 2 - activeAbsoluteIndex * step;

  return (
    <section className="py-4 md:py-8 bg-secondary/30 overflow-hidden">
      <div className="container mx-auto px-3 md:px-4">
        {/* Section Header */}
        <motion.div
          className="text-center mb-6 md:mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-red/10 rounded-full mb-3">
            <Sparkles size={14} className="text-primary" />
            <span className="text-xs font-medium text-primary">Editorial Picks</span>
          </div>
          <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground mb-2">
            Latest Showcase
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
            Curated looks handpicked for you
          </p>
        </motion.div>

        {/* Carousel */}
        <div className="relative overflow-hidden" ref={containerRef}>
          <motion.div
            className="flex"
            style={{ gap: `${gap}px` }}
            initial={false}
            animate={{ x: translateX }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {displayItems.map((item, index) => {
              const realIndex = index % items.length;
              const isCurrent = realIndex === currentIndex;

              return (
                <Link
                  key={`${item.id}-${index}`}
                  to={item.product_link}
                  className="flex-shrink-0 group"
                  style={{ width: `${cardWidth}px` }}
                >
                  <motion.div
                    className="relative aspect-[4/5] rounded-2xl overflow-hidden"
                    animate={{
                      scale: isCurrent ? 1 : 0.9,
                      opacity: isCurrent ? 1 : 0.65,
                    }}
                    transition={{ duration: 0.5 }}
                    style={{
                      boxShadow: isCurrent
                        ? '0 12px 30px rgba(0,0,0,0.18)'
                        : '0 4px 12px rgba(0,0,0,0.08)',
                    }}
                  >
                    <img
                      src={optimizeImage(item.image_url, 500)}
                      alt={item.title || 'Showcase'}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                      decoding="async"
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 md:p-5">
                      {item.title && (
                        <h3 className="text-white font-bold text-sm md:text-lg mb-1 drop-shadow-lg">
                          {item.title}
                        </h3>
                      )}
                      <div className="flex items-center gap-1 text-white/90 text-xs md:text-sm font-medium opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        Shop Now <ArrowRight size={14} />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </motion.div>

          {/* Dots */}
          {items.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-6">
              {items.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`transition-all duration-300 rounded-full ${
                    index === currentIndex
                      ? 'w-6 h-2 bg-primary'
                      : 'w-2 h-2 bg-brand-red/30 hover:bg-brand-red/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
