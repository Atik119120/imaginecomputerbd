import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Heart, Minus, Plus, Star, ShoppingCart, ZoomIn, X, ChevronLeft, ChevronRight, Expand } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/product';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartSidebar } from '@/components/CartSidebar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { ReviewSection } from '@/components/ReviewSection';
import { ProductCard } from '@/components/ProductCard';
import { SizeChartModal } from '@/components/SizeChartModal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useProducts } from '@/hooks/useProducts';
import { SEO } from '@/components/SEO';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SpecificationsTable } from '@/components/SpecificationsTable';
import { RichText } from '@/components/RichText';
import { normalizeVariants, defaultVariantSelection, variantPriceDelta } from '@/lib/variants';
import { normalizeSpecifications, SpecGroup } from '@/lib/specifications';


// ─── Lightbox Component ──────────────────────────────────────────────────────
const Lightbox = ({
  images,
  initialIndex,
  onClose,
}: {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}) => {
  const [current, setCurrent] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + images.length) % images.length);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [images.length]);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % images.length);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [images.length]);

  const toggleZoom = () => {
    if (zoom > 1) { setZoom(1); setPan({ x: 0, y: 0 }); }
    else setZoom(2.5);
  };

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose, prev, next]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/95 backdrop-blur-md"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-10">
          <span className="text-primary-foreground/70 text-sm font-medium">
            {current + 1} / {images.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleZoom}
              className={`p-2 rounded-xl text-sm font-medium transition-all ${zoom > 1 ? 'bg-primary text-primary-foreground' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              <ZoomIn size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 text-white hover:bg-destructive hover:text-destructive-foreground transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Main image */}
        <div
          className={`relative w-full h-full flex items-center justify-center overflow-hidden ${zoom > 1 ? 'cursor-grab' : 'cursor-zoom-in'} ${isDragging ? 'cursor-grabbing' : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={zoom <= 1 ? toggleZoom : undefined}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={current}
              src={images[current]}
              alt={`View ${current + 1}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.2 }}
              style={{
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                transition: isDragging ? 'none' : 'transform 0.3s ease',
                maxHeight: '85vh',
                maxWidth: '90vw',
                objectFit: 'contain',
                userSelect: 'none',
              }}
              draggable={false}
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
            />
          </AnimatePresence>
        </div>

        {/* Navigation */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/25 text-white rounded-full transition-all backdrop-blur-sm"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/25 text-white rounded-full transition-all backdrop-blur-sm"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-2xl">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => { setCurrent(i); setZoom(1); setPan({ x: 0, y: 0 }); }}
                className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === current ? 'border-primary scale-110' : 'border-white/20 opacity-60 hover:opacity-100'}`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" draggable={false} />
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [allImages, setAllImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedPackage, setSelectedPackage] = useState('');
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [reviewStats, setReviewStats] = useState({ average: 0, count: 0 });
  const [payOption, setPayOption] = useState('cash');

  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { user } = useAuth();
  const { toast } = useToast();
  const { products: allProducts } = useProducts();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const { data: productData, error } = await supabase
          .from('products')
          .select('*, categories(name)')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        if (productData) {
          const rawPackages = (productData as any).packages;
          const packages = Array.isArray(rawPackages)
            ? rawPackages
                .map((p: any) => ({
                  name: String(p?.name ?? '').trim(),
                  price: Number(p?.price),
                  weight: p?.weight ? String(p.weight) : undefined,
                }))
                .filter((p: any) => p.name && !Number.isNaN(p.price))
            : [];
          const transformed: Product = {
            id: productData.id,
            name: productData.name,
            price: productData.price,
            originalPrice: productData.original_price ?? undefined,
            discount: productData.discount ?? undefined,
            image: productData.image_url || '/placeholder.svg',
            supplementaryImages: productData.supplementary_images ?? undefined,
            category: (productData.categories as any)?.name || 'Uncategorized',
            colors: productData.colors ?? undefined,
            colorImages: ((productData as any).color_images && typeof (productData as any).color_images === 'object')
              ? (productData as any).color_images as Record<string, string>
              : undefined,
            sizes: productData.sizes ?? undefined,
            sku: productData.sku ?? undefined,
            inStock: productData.in_stock ?? true,
            description: productData.description ?? undefined,
            fabric: productData.fabric ?? undefined,
            sizeChart: (productData as any).size_chart ?? null,
            returnPolicy: (productData as any).return_policy ?? undefined,
            moreInfo: (productData as any).more_info ?? null,
            packages: packages.length > 0 ? packages : undefined,
            brand: (productData as any).brand ?? undefined,
            model: (productData as any).model ?? undefined,
            warranty: (productData as any).warranty ?? undefined,
            specifications: normalizeSpecifications((productData as any).specifications),
            variants: normalizeVariants((productData as any).variants),
          };
          setProduct(transformed);
          setSelectedSize(transformed.sizes?.[0] || '');
          setSelectedColor(transformed.colors?.[0] || '');
          setSelectedPackage(transformed.packages?.[0]?.name || '');
          setSelectedVariants(defaultVariantSelection(transformed.variants || []));
          const imgs = [transformed.image];
          if (transformed.supplementaryImages) imgs.push(...transformed.supplementaryImages);
          setAllImages(imgs);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // When user picks a color, switch hero image to that color's image (if admin uploaded one)
  useEffect(() => {
    if (!product || !selectedColor) return;
    const colorImg = product.colorImages?.[selectedColor];
    if (!colorImg) return;
    const idx = allImages.indexOf(colorImg);
    if (idx >= 0) {
      setSelectedImage(idx);
    } else {
      const next = [colorImg, ...allImages.filter((i) => i !== colorImg)];
      setAllImages(next);
      setSelectedImage(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedColor, product]);

  // When user picks a variation value that has its own photo, show it
  useEffect(() => {
    if (!product?.variants?.length) return;
    let img: string | undefined;
    for (const opt of product.variants) {
      const v = opt.values.find((x) => x.value === selectedVariants[opt.name]);
      if (v?.image) img = v.image;
    }
    if (!img) return;
    const idx = allImages.indexOf(img);
    if (idx >= 0) {
      setSelectedImage(idx);
    } else {
      setAllImages([img, ...allImages.filter((i) => i !== img)]);
      setSelectedImage(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVariants, product]);

  const activePackage = product?.packages?.find((p) => p.name === selectedPackage) || null;
  const variantDelta = variantPriceDelta(product?.variants || [], selectedVariants);
  const effectivePrice = (activePackage?.price ?? product?.price ?? 0) + variantDelta;

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity, selectedSize, selectedColor, true, activePackage ? { ...activePackage, price: activePackage.price + variantDelta } : (variantDelta ? { name: '', price: (product.price || 0) + variantDelta } : null), selectedVariants);
      toast({ title: 'Added to cart', description: `${product.name} added successfully.` });
    }
  };

  const handleOrderNow = () => {
    if (product) {
      addToCart(product, quantity, selectedSize, selectedColor, true, activePackage ? { ...activePackage, price: activePackage.price + variantDelta } : (variantDelta ? { name: '', price: (product.price || 0) + variantDelta } : null), selectedVariants);
      navigate('/checkout');
    }
  };

  const handleWishlistToggle = () => {
    if (!user) {
      toast({ title: 'Login required', description: 'Please login to use wishlist.', variant: 'destructive' });
      return;
    }
    if (product) {
      if (isInWishlist(product.id)) {
        removeFromWishlist(product.id);
        toast({ title: 'Removed from wishlist' });
      } else {
        addToWishlist(product.id);
        toast({ title: 'Added to wishlist' });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  const relatedProducts = allProducts
    .filter(p => p.category === product?.category && p.id !== product?.id)
    .sort((a, b) => Number(!!b.subcategoryName && b.subcategoryName === product?.subcategoryName) - Number(!!a.subcategoryName && a.subcategoryName === product?.subcategoryName))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-secondary/30">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto bg-background rounded-xl p-6 md:p-8 shadow-sm">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <div className="aspect-square bg-secondary rounded-xl animate-pulse" />
                  <div className="flex gap-2">
                    {[...Array(4)].map((_, i) => <div key={i} className="w-16 h-16 bg-secondary rounded-lg animate-pulse" />)}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-8 bg-secondary rounded animate-pulse w-3/4" />
                  <div className="h-6 bg-secondary rounded animate-pulse w-1/4" />
                  <div className="h-4 bg-secondary rounded animate-pulse w-full" />
                  <div className="h-4 bg-secondary rounded animate-pulse w-5/6" />
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
        <MobileBottomNav />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground text-lg mb-4">Product not found</p>
          <Link to="/shop" className="text-primary hover:underline">Back to shop</Link>
        </div>
      </div>
    );
  }

  const isWishlisted = isInWishlist(product.id);

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title={`${product.name} — Imagine Computer`}
        description={(product.description || `${product.name} available at Imagine Computer. Order online with cash on delivery.`).slice(0, 155)}
        path={`/product/${product.id}`}
        type="product"
        image={product.image}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          image: product.image,
          description: product.description || product.name,
          offers: {
            '@type': 'Offer',
            price: product.price,
            priceCurrency: 'BDT',
            availability: 'https://schema.org/InStock',
            url: `/product/${product.id}`,
          },
        }}
      />
      {/* Lightbox */}

      {lightboxOpen && (
        <Lightbox
          images={allImages}
          initialIndex={selectedImage}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      <Header />
      <main className="flex-1 bg-secondary/30">
        <div className="container mx-auto px-4 py-6 md:py-8">
          {/* Breadcrumb */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6 text-sm"
          >
            <ArrowLeft size={16} />
            Back to Shop
          </Link>

          <div className="max-w-6xl mx-auto">
            <div className="bg-background rounded-2xl p-4 md:p-8 shadow-sm border border-border/30 overflow-hidden">
              <div className="grid md:grid-cols-2 gap-6 md:gap-12 min-w-0">

                {/* ─── Image Gallery ─── */}
                <div className="space-y-3 min-w-0 w-full max-w-full overflow-hidden">
                  {/* Main image with zoom */}
                  <div
                    className="relative aspect-square bg-secondary rounded-xl overflow-hidden cursor-zoom-in group"
                    onMouseMove={handleMouseMove}
                    onMouseEnter={() => setIsZoomed(true)}
                    onMouseLeave={() => setIsZoomed(false)}
                    onClick={() => setLightboxOpen(true)}
                  >
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={selectedImage}
                        src={allImages[selectedImage] || product.image}
                        alt={product.name}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="w-full h-full object-cover transition-transform duration-200"
                        style={
                          isZoomed
                            ? {
                                transform: 'scale(1.8)',
                                transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                              }
                            : {}
                        }
                        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                        draggable={false}
                      />
                    </AnimatePresence>

                    {/* Overlay hints */}
                    {product.discount && (
                      <div className="absolute top-3 left-3 z-10 bg-accent text-accent-foreground text-xs font-bold px-2.5 py-1 rounded-full shadow-sm pointer-events-none">
                        -{product.discount}%
                      </div>
                    )}
                    <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="bg-background/80 backdrop-blur-sm p-1.5 rounded-lg shadow-sm">
                        <Expand size={16} className="text-foreground" />
                      </div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="bg-foreground/10 backdrop-blur-sm rounded-full p-3 border border-white/20">
                        <ZoomIn size={20} className="text-white drop-shadow" />
                      </div>
                    </div>
                    {allImages.length > 1 && (
                      <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm text-xs px-2 py-1 rounded-full border border-border/50 text-muted-foreground pointer-events-none">
                        {selectedImage + 1} / {allImages.length}
                      </div>
                    )}
                  </div>

                  {/* Thumbnails */}
                  {allImages.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 min-w-0 w-full max-w-full snap-x scrollbar-thin">
                      {allImages.map((img, i) => (
                        <motion.button
                          key={i}
                          onClick={() => setSelectedImage(i)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                            selectedImage === i
                              ? 'border-primary shadow-md'
                              : 'border-transparent hover:border-primary/40 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={img}
                            alt={`${product.name} view ${i + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                          />
                        </motion.button>
                      ))}
                    </div>
                  )}

                  {/* Open lightbox hint */}
                  <button
                    onClick={() => setLightboxOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground hover:text-primary border border-border/50 rounded-lg hover:border-primary/30 hover:bg-secondary/30 transition-all"
                  >
                    <Expand size={14} />
                    Click image to view fullscreen
                  </button>
                </div>

                {/* ─── Product Info ─── */}
                <div className="space-y-5 min-w-0 w-full max-w-full">
                  <div>
                    <h1 className="text-2xl md:text-[26px] font-medium text-primary mb-3 leading-snug">
                      {product.name}
                    </h1>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="px-3 py-1.5 rounded-full bg-secondary text-muted-foreground">Price: <b className="text-foreground">{effectivePrice.toLocaleString()}৳</b>{product.originalPrice && <s className="ml-1 text-muted-foreground">{product.originalPrice.toLocaleString()}৳</s>}</span>
                      {product.originalPrice && <span className="px-3 py-1.5 rounded-full bg-secondary text-muted-foreground">Regular Price: <b className="text-foreground">{product.originalPrice.toLocaleString()}৳</b></span>}
                      <span className="px-3 py-1.5 rounded-full bg-secondary text-muted-foreground">Status: <b className="text-foreground">{product.inStock ? 'In Stock' : 'Out of Stock'}</b></span>
                      {product.sku && <span className="px-3 py-1.5 rounded-full bg-secondary text-muted-foreground">Product Code: <b className="text-foreground">{product.sku}</b></span>}
                      {product.brand && <span className="px-3 py-1.5 rounded-full bg-secondary text-muted-foreground">Brand: <b className="text-foreground">{product.brand}</b></span>}
                    </div>
                  </div>

                  {/* Key Features */}
                  {(() => {
                    const feats = [
                      ...(product.model ? [{ label: 'Model', value: product.model }] : []),
                      ...(product.specifications || []).flatMap((g) => g.items),
                    ].slice(0, 6);
                    if (!feats.length) return null;
                    return (
                      <div>
                        <h3 className="text-lg font-medium mb-2">Key Features</h3>
                        <ul className="space-y-2 text-sm text-foreground/90">
                          {feats.map((f, i) => <li key={i}>{f.label}: {f.value}</li>)}
                        </ul>
                        <a href="#product-tabs" className="inline-block mt-3 text-sm text-primary border-b border-primary">View More Info</a>
                      </div>
                    );
                  })()}

                  {/* Package selector */}
                  {product.packages && product.packages.length > 0 && (
                    <div>
                      <p className="font-medium text-sm mb-2.5">Select Package:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {product.packages.map((pkg) => {
                          const active = pkg.name === selectedPackage;
                          return (
                            <button
                              key={pkg.name}
                              onClick={() => setSelectedPackage(pkg.name)}
                              className={`px-4 py-3 border-2 rounded-xl text-left transition-all flex items-center justify-between gap-2 ${
                                active
                                  ? 'bg-primary text-primary-foreground border-primary shadow-md'
                                  : 'border-border bg-background hover:border-primary hover:bg-secondary/40'
                              }`}
                            >
                              <span className="font-medium text-sm">{pkg.name}</span>
                              <span className={`font-bold text-sm whitespace-nowrap ${active ? '' : 'text-primary'}`}>৳ {pkg.price.toLocaleString()}</span>
                            </button>
                          );
                        })}
                      </div>
                      {activePackage?.weight && (
                        <span className="inline-block mt-2 text-xs bg-secondary px-2 py-1 rounded-full text-muted-foreground">
                          📦 Weight: {activePackage.weight}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Custom variations */}
                  {product.variants && product.variants.length > 0 && (
                    <div className="space-y-4">
                      {product.variants.map((opt) => (
                        <div key={opt.name}>
                          <p className="font-medium text-sm mb-2.5">
                            {opt.name}:{' '}
                            <span className="text-primary font-semibold">{selectedVariants[opt.name]}</span>
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            {opt.values.map((val) => {
                              const active = selectedVariants[opt.name] === val.value;
                              return (
                                <button
                                  key={val.value}
                                  onClick={() =>
                                    setSelectedVariants((prev) => ({ ...prev, [opt.name]: val.value }))
                                  }
                                  className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-all font-medium text-sm ${
                                    active
                                      ? 'bg-primary text-primary-foreground border-primary shadow-md'
                                      : 'border-border hover:border-primary hover:bg-secondary/50'
                                  }`}
                                >
                                  {val.image && (
                                    <img
                                      src={val.image}
                                      alt={val.value}
                                      className="h-6 w-6 rounded object-cover"
                                    />
                                  )}
                                  <span>{val.value}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Color selector */}
                  {product.colors && product.colors.length > 0 && (
                    <div>
                      <p className="font-medium text-sm mb-2.5">
                        Color: <span className="text-primary font-semibold">{selectedColor}</span>
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {product.colors.map((color) => (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            title={color}
                            className={`w-9 h-9 rounded-lg border-2 transition-all ${
                              selectedColor === color
                                ? 'border-primary ring-2 ring-primary/30 scale-110'
                                : 'border-border hover:border-primary hover:scale-105'
                            }`}
                            style={{
                              backgroundColor:
                                color.toLowerCase() === 'olive' ? '#6b8e23'
                                : color.toLowerCase() === 'navy' ? '#1e3a5f'
                                : color.toLowerCase() === 'teal/cream' ? '#008080'
                                : color.toLowerCase(),
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Size selector */}
                  {product.sizes && product.sizes.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <p className="font-medium text-sm">
                          Size: <span className="text-primary font-semibold">{selectedSize}</span>
                        </p>
                        <SizeChartModal />
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {product.sizes.map((size) => (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={`px-4 py-2 border rounded-lg transition-all font-medium text-sm ${
                              selectedSize === size
                                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                                : 'border-border hover:border-primary hover:bg-secondary/50'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Payment Options */}
                  <div>
                    <h3 className="text-lg font-medium mb-3">Payment Options</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[
                        { key: 'cash', title: <>৳{effectivePrice.toLocaleString()}{product.originalPrice && <span className="ml-2 text-base font-normal text-muted-foreground line-through">{product.originalPrice.toLocaleString()}৳</span>}</>, l1: 'Cash Discount Price', l2: 'Online / Cash Payment' },
                        { key: 'emi', title: <>{Math.ceil((product.originalPrice || effectivePrice) / 12).toLocaleString()}৳/month</>, l1: `Regular Price: ${(product.originalPrice || effectivePrice).toLocaleString()}৳`, l2: '0% EMI for up to 12 Months***' },
                      ].map((o) => (
                        <button key={o.key} onClick={() => setPayOption(o.key)} className={`flex items-stretch text-left border rounded-sm overflow-hidden transition-colors ${payOption === o.key ? 'border-primary border-2' : 'border-border'}`}>
                          <span className="flex items-center px-3 bg-secondary/40">
                            <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${payOption === o.key ? 'border-primary' : 'border-muted-foreground/50'}`}>
                              {payOption === o.key && <span className="w-2.5 h-2.5 rounded-full bg-primary" />}
                            </span>
                          </span>
                          <span className="p-3">
                            <span className="block text-xl font-bold text-foreground">{o.title}</span>
                            <span className="block text-sm text-foreground/80">{o.l1}</span>
                            <span className="block text-xs text-muted-foreground">{o.l2}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quantity + Buy */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="inline-flex items-center border border-border">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-11 h-11 flex items-center justify-center hover:bg-secondary"><Minus size={16} /></button>
                      <span className="w-12 h-11 flex items-center justify-center border-x border-border">{quantity}</span>
                      <button onClick={() => setQuantity(quantity + 1)} className="w-11 h-11 flex items-center justify-center hover:bg-secondary"><Plus size={16} /></button>
                    </div>
                    <Button onClick={handleOrderNow} disabled={!product.inStock} className="h-11 px-16 rounded-sm font-semibold">Buy Now</Button>
                    <Button variant="outline" onClick={handleAddToCart} disabled={!product.inStock} className="h-11 rounded-sm"><ShoppingCart size={16} className="mr-2" />Add to Cart</Button>
                    <button onClick={handleWishlistToggle} className={`h-11 w-11 flex items-center justify-center border rounded-sm ${isWishlisted ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:text-primary'}`}>
                      <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Product Details Tabs */}
              {(() => {
                const specGroups: SpecGroup[] = (() => {
                  if (product.specifications && product.specifications.length > 0) return product.specifications;
                  // Backward compatible fallback: build from legacy fields
                  const items: { label: string; value: string }[] = [];
                  if (product.brand) items.push({ label: 'Brand', value: product.brand });
                  if (product.model) items.push({ label: 'Model', value: product.model });
                  if (product.sku) items.push({ label: 'SKU', value: product.sku });
                  if (product.fabric) items.push({ label: 'Origin / Source', value: product.fabric });
                  if (product.colors?.length) items.push({ label: 'Available Colors', value: product.colors.join(', ') });
                  if (product.sizes?.length) items.push({ label: 'Available Variants', value: product.sizes.join(', ') });
                  if (product.warranty) items.push({ label: 'Warranty', value: product.warranty });
                  (product.moreInfo || []).forEach((m) => items.push({ label: m.label, value: m.value }));
                  return items.length > 0 ? [{ title: null, items }] : [];
                })();

                const hasSpecs = specGroups.length > 0;
                const hasTable = !!(product.sizeChart?.headers?.length && product.sizeChart?.rows?.length);
                const hasDescription = !!product.description;
                const defaultTab = hasSpecs ? 'specifications' : hasDescription ? 'description' : 'reviews';

                return (
                  <div id="product-tabs" className="mt-10 pt-8 border-t border-border grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
                    <div className="min-w-0">
                    <Tabs defaultValue={defaultTab} className="w-full">
                      <TabsList className="w-full flex flex-wrap h-auto justify-start gap-2 bg-transparent p-0">
                        {[
                          ...(hasSpecs ? [['specifications', 'Specification']] : []),
                          ['description', 'Description'],
                          ['reviews', `Reviews (${reviewStats.count})`],
                          ['returns', 'Returns'],
                        ].map(([v, l]) => (
                          <TabsTrigger key={v} value={v} className="px-5 py-2.5 text-sm font-semibold rounded-md bg-background border border-border shadow-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary">{l}</TabsTrigger>
                        ))}
                      </TabsList>

                      {hasSpecs && (
                        <TabsContent value="specifications" className="pt-4">
                          <div className="bg-background border border-border rounded-md p-5">
                          <h3 className="text-xl font-semibold mb-4">Specification</h3>
                          <SpecificationsTable groups={specGroups} />
                          </div>
                          {hasTable && (
                            <div className="mt-6">
                              <div className="inline-block px-4 py-1.5 bg-secondary/60 rounded-t-md border border-border border-b-0 text-xs font-semibold text-foreground">
                                Detailed Table
                              </div>
                              <div className="overflow-x-auto rounded-md rounded-tl-none border border-border">
                                <table className="w-full text-xs md:text-sm">
                                  <thead className="bg-secondary/60">
                                    <tr>
                                      {product.sizeChart!.headers.map((h, i) => (
                                        <th key={i} className="px-3 py-2 text-left font-semibold border-r border-border last:border-r-0">{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {product.sizeChart!.rows.map((row, ri) => (
                                      <tr key={ri} className="border-t border-border">
                                        {row.map((cell, ci) => (
                                          <td key={ci} className={`px-3 py-2 border-r border-border last:border-r-0 ${ci === 0 ? 'font-medium' : ''}`}>{cell}</td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </TabsContent>
                      )}

                      <TabsContent value="description" className="pt-4">
                        <div className="bg-background border border-border rounded-md p-5">
                          <h3 className="text-xl font-semibold mb-4">Description</h3>
                          {hasDescription
                            ? <RichText text={product.description!} className="text-sm md:text-base text-foreground/80" />
                            : <p className="text-sm text-muted-foreground">{product.name}{product.brand ? ` by ${product.brand}` : ''}. বিস্তারিত জানতে Specification দেখুন।</p>}
                        </div>
                      </TabsContent>

                      <TabsContent value="reviews" className="pt-6">
                        <ReviewSection productId={product.id} onStats={setReviewStats} />
                      </TabsContent>

                      <TabsContent value="returns" className="pt-6">
                        <div className="text-sm text-foreground/80 leading-relaxed space-y-3 max-w-3xl">
                          {product.returnPolicy ? (
                            <RichText text={product.returnPolicy} />
                          ) : (
                            <>
                              <p>
                                We offer easy returns and exchanges within <strong>3 days</strong> of delivery. Items must be unused and in their original packaging with all accessories included.
                              </p>
                              <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
                                <li>Warranty claims are handled through the official service centre</li>
                                <li>Refunds processed within 5–7 business days after inspection</li>
                                <li>Physically damaged or water-damaged items are not covered</li>
                                <li>Return shipping cost is borne by the customer unless the item is defective</li>
                              </ul>
                            </>
                          )}
                          <p>
                            For details, please visit our{' '}
                            <Link to="/return-policy" className="text-primary font-semibold hover:underline">
                              Return Policy
                            </Link>{' '}
                            page.
                          </p>
                        </div>
                      </TabsContent>
                    </Tabs>
                    </div>
                    {relatedProducts.length > 0 && (
                      <aside className="bg-background border border-border rounded-md p-4 h-fit lg:sticky lg:top-4">
                        <h2 className="text-center text-lg font-semibold text-primary pb-3 border-b border-border">Similar Product</h2>
                        <div className="divide-y divide-border">
                          {relatedProducts.map((p) => (
                            <Link key={p.id} to={`/product/${p.id}`} className="flex gap-3 py-4 group">
                              <img src={p.image} alt={p.name} loading="lazy" className="w-20 h-20 object-contain flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                              <div className="min-w-0">
                                <p className="text-sm text-foreground line-clamp-3 group-hover:text-primary">{p.name}</p>
                                {p.price > 0 && (
                                  <p className="mt-1 text-sm">
                                    <span className="font-semibold text-primary">{p.price.toLocaleString()}৳</span>
                                    {p.originalPrice && p.originalPrice > p.price && <s className="ml-2 text-xs text-muted-foreground">{p.originalPrice.toLocaleString()}৳</s>}
                                  </p>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </aside>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </main>
      <CartSidebar />
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default ProductDetail;
