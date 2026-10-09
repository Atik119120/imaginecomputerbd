import { Header } from '@/components/Header';
import { HeroBanner } from '@/components/HeroBanner';
import { CategorySection } from '@/components/CategorySection';
import { FeatureCards } from '@/components/FeatureCards';

import { CouponBanner } from '@/components/CouponBanner';
import { LatestShowcase } from '@/components/LatestShowcase';
import { TopSellingSection } from '@/components/TopSellingSection';
import { LifestyleGallery } from '@/components/LifestyleGallery';
import { ProductGrid } from '@/components/ProductGrid';
import { CartSidebar } from '@/components/CartSidebar';
import { Footer } from '@/components/Footer';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { SEO } from '@/components/SEO';

const Index = () => {
  return (
    <>
      <SEO
        title="Imagine Computer — Gadget & Tech Shop in Bangladesh"
        description="Shop smart watches, earbuds, chargers, cables & power banks at Imagine Computer. Cash on delivery across Bangladesh."
        path="/"
      />
      <div className="min-h-screen flex flex-col">

        <Header />
        <main className="flex-1 pb-14 lg:pb-0 md:px-10 lg:px-0">
          <h1 className="sr-only">Imagine Computer — Gadgets, Smart Watches, Earbuds & Mobile Accessories in Bangladesh</h1>
          <HeroBanner />
          <FeatureCards />
          <CategorySection />

          <CouponBanner />
          <LatestShowcase />
          <TopSellingSection />
          <LifestyleGallery />
          <ProductGrid />
        </main>
        <CartSidebar />
        <Footer />
        <MobileBottomNav />
      </div>
    </>
  );
};

export default Index;
