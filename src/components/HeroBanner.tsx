import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { optimizeImage } from '@/lib/optimizeImage';
import fallbackMainBanner from '@/assets/hero-banner.png.asset.json';

interface Banner {
  id: string;
  image_url: string | null;
  button_link: string | null;
  is_active: boolean;
  display_order: number | null;
  placement: 'main' | 'side';
}

const BannerImage = ({ banner, priority = false }: { banner: Banner; priority?: boolean }) => {
  const img = (
    <img
      src={optimizeImage(banner.image_url, 1200)}
      alt="Banner"
      draggable={false}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      className="w-full h-full object-cover pointer-events-none select-none"
    />
  );
  return banner.button_link ? (
    <Link to={banner.button_link} className="block w-full h-full" draggable={false}>
      {img}
    </Link>
  ) : (
    img
  );
};

const instantMainBanner: Banner = {
  id: 'instant-main-banner',
  image_url: fallbackMainBanner.url,
  button_link: '/shop',
  is_active: true,
  display_order: 0,
  placement: 'main',
};

export const HeroBanner = () => {
  const [mainBanners, setMainBanners] = useState<Banner[]>([]);
  const [sideBanners, setSideBanners] = useState<Banner[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [[mainIndex, mainDir], setMain] = useState<[number, number]>([0, 0]);
  const [sideIndex, setSideIndex] = useState(0);

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    if (mainBanners.length <= 1) return;
    const i = setInterval(() => {
      setMain(([prev]) => [(prev + 1) % mainBanners.length, 1]);
    }, 5000);
    return () => clearInterval(i);
  }, [mainBanners.length]);

  useEffect(() => {
    if (sideBanners.length <= 1) return;
    const i = setInterval(() => {
      setSideIndex((prev) => (prev + 1) % sideBanners.length);
    }, 6000);
    return () => clearInterval(i);
  }, [sideBanners.length]);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('id, image_url, button_link, is_active, display_order, placement')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      const all = ((data || []) as unknown as Banner[]).map((b) => ({
        ...b,
        placement: (b.placement === 'side' ? 'side' : 'main') as 'main' | 'side',
      }));
      const mains = all.filter((b) => b.placement === 'main');
      const sides = all.filter((b) => b.placement === 'side');
      setMainBanners(mains);
      setSideBanners(sides);
      // Preload all banner images so transitions don't flash white
      [...mains, ...sides].forEach((b) => {
        if (b.image_url) {
          const img = new Image();
          img.src = optimizeImage(b.image_url, 1200);
        }
      });
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoaded(true);
    }
  };

  const goToPrevious = () =>
    setMain(([prev]) => [(prev - 1 + mainBanners.length) % mainBanners.length, -1]);
  const goToNext = () =>
    setMain(([prev]) => [(prev + 1) % mainBanners.length, 1]);
  const goToIndex = (index: number) =>
    setMain(([prev]) => [index, index > prev ? 1 : -1]);

  if (mainBanners.length === 0 && sideBanners.length === 0) {
    if (!loaded) {
      return (
        <section className="pt-3 pb-2">
          <div className="container mx-auto px-3 md:px-4">
            <div className="w-full aspect-[16/9] md:aspect-[3/1] bg-secondary/50 rounded-2xl animate-pulse" />
          </div>
        </section>
      );
    }
    return null;
  }

  const mainBanner = mainBanners.length ? mainBanners[mainIndex % mainBanners.length] : null;
  const sideBanner = sideBanners.length ? sideBanners[sideIndex % sideBanners.length] : null;

  return (
    <section className="pt-3 pb-2">
      <div className="container mx-auto px-3 md:px-4">
        <div className="md:h-[320px] lg:h-[420px] xl:h-[480px]">
          {/* Main banner — full width */}
          {mainBanner && (
            <div className="relative w-full h-full overflow-hidden rounded-2xl md:rounded-3xl group bg-secondary">
              <div className="relative w-full aspect-[16/9] md:aspect-auto md:h-full touch-pan-y">
                {mainBanners.map((b, idx) => (
                  <motion.div
                    key={b.id}
                    initial={false}
                    animate={{ opacity: idx === mainIndex ? 1 : 0 }}
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                    className="absolute inset-0"
                    style={{ pointerEvents: idx === mainIndex ? 'auto' : 'none' }}
                  >
                    <BannerImage banner={b} priority={idx === 0} />
                  </motion.div>
                ))}
              </div>

              {mainBanners.length > 1 && (
                <>
                  <button
                    onClick={goToPrevious}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-card/80 backdrop-blur-sm rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-card z-10"
                  >
                    <ChevronLeft size={20} className="text-foreground" />
                  </button>
                  <button
                    onClick={goToNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-card/80 backdrop-blur-sm rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-card z-10"
                  >
                    <ChevronRight size={20} className="text-foreground" />
                  </button>

                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                    {mainBanners.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToIndex(index)}
                        className={`transition-all duration-300 rounded-full ${
                          index === mainIndex
                            ? 'w-6 h-2 bg-card'
                            : 'w-2 h-2 bg-card/50 hover:bg-card/70'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

      </div>
    </section>
  );
};
