import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Heart, Minus, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '@/types/product';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ProductQuickViewProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductQuickView = ({ product, isOpen, onClose }: ProductQuickViewProps) => {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { user } = useAuth();
  const { toast } = useToast();

  // Reset selections when product changes
  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes?.[0] || '');
      setSelectedColor(product.colors?.[0] || '');
      setQuantity(1);
    }
  }, [product]);

  if (!product) return null;

  const isWishlisted = isInWishlist(product.id);

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedSize, selectedColor);
    toast({
      title: 'Added to cart',
      description: `${product.name} has been added to your cart.`,
    });
    onClose();
  };

  const handleOrderNow = () => {
    addToCart(product, quantity, selectedSize, selectedColor);
    onClose();
    // Small delay to ensure cart state updates before navigation
    setTimeout(() => {
      navigate('/checkout');
    }, 100);
  };

  const handleWishlistToggle = () => {
    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please login to add items to your wishlist.',
        variant: 'destructive',
      });
      return;
    }

    if (isWishlisted) {
      removeFromWishlist(product.id);
      toast({
        title: 'Removed from wishlist',
        description: `${product.name} has been removed from your wishlist.`,
      });
    } else {
      addToWishlist(product.id);
      toast({
        title: 'Added to wishlist',
        description: `${product.name} has been added to your wishlist.`,
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/50 z-50"
          />

          {/* Modal Container - Full screen flex for centering */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative w-full max-w-4xl bg-background rounded-xl shadow-2xl overflow-hidden pointer-events-auto max-h-[90vh] overflow-y-auto"
            >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-secondary rounded-full transition-colors z-10"
            >
              <X size={24} />
            </button>

            <div className="grid md:grid-cols-2 gap-6 p-6">
              {/* Image gallery */}
              <div className="space-y-4">
                <div className="aspect-square bg-secondary rounded-lg overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Thumbnails */}
                <div className="flex gap-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-20 h-20 bg-secondary rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-primary transition-colors"
                    >
                      <img
                        src={product.image}
                        alt={`${product.name} view ${i}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Product details */}
              <div className="space-y-6">
                <div>
                  <h2 className="font-heading text-2xl font-semibold text-foreground mb-2">
                    {product.name}
                  </h2>

                  {/* Price */}
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-primary">৳ {product.price.toFixed(2)}</span>
                    {product.originalPrice && (
                      <>
                        <span className="price-original text-lg">৳ {product.originalPrice.toFixed(2)}</span>
                        <span className="text-destructive font-medium">({product.discount}%)</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Color */}
                {product.colors && product.colors.length > 0 && (
                  <div>
                    <p className="text-muted-foreground mb-2">Color: {selectedColor}</p>
                    <div className="flex gap-2">
                      {product.colors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`w-8 h-8 rounded border-2 transition-colors ${
                            selectedColor === color ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary'
                          }`}
                          style={{ backgroundColor: color.toLowerCase() === 'olive' ? '#6b8e23' : color.toLowerCase() }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Size selection */}
                {product.sizes && product.sizes.length > 0 && (
                  <div>
                    <p className="text-muted-foreground mb-2">Select Size: {selectedSize || product.sizes[0]}</p>
                    <div className="flex gap-2 flex-wrap">
                      {product.sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`px-4 py-2 border rounded-md transition-colors ${
                            (selectedSize || product.sizes?.[0]) === size
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'border-border hover:border-primary'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 border border-border rounded-md hover:bg-secondary transition-colors"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="text-lg font-medium w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 border border-border rounded-md hover:bg-secondary transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleAddToCart}
                    className="flex-1 btn-outline-primary py-3"
                  >
                    Add To Cart
                  </Button>
                  <Button
                    onClick={handleOrderNow}
                    className="flex-1 btn-primary py-3"
                  >
                    Order Now
                  </Button>
                  <button
                    onClick={handleWishlistToggle}
                    className={`p-3 border rounded-md transition-colors ${
                      isWishlisted ? 'bg-destructive text-destructive-foreground border-destructive' : 'border-border hover:bg-secondary'
                    }`}
                  >
                    <Heart size={20} fill={isWishlisted ? 'currentColor' : 'none'} />
                  </button>
                </div>

                {/* SKU & Category */}
                <div className="text-sm text-muted-foreground space-y-1 pt-4 border-t border-border">
                  {product.sku && <p>SKU: {product.sku}</p>}
                  <p>Category: {product.category}</p>
                </div>
              </div>
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
