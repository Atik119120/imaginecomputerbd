import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { Product } from '@/types/product';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { optimizeImage } from '@/lib/optimizeImage';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

export const ProductCard = ({ product, onQuickView }: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { user } = useAuth();
  const { toast } = useToast();

  const isWishlisted = isInWishlist(product.id);
  const hasOptions = (product.sizes && product.sizes.length > 0) || (product.colors && product.colors.length > 0);

  const handleAddToCart = () => {
    if (hasOptions) {
      onQuickView(product);
    } else {
      addToCart(product, 1);
      toast({
        title: 'Added to cart',
        description: `${product.name} has been added to your cart.`,
      });
    }
  };

  const handleOrderNow = () => {
    if (hasOptions) {
      onQuickView(product);
    } else {
      // Add to cart first, then navigate after a small delay to ensure state updates
      addToCart(product, 1);
      setTimeout(() => {
        navigate('/checkout');
      }, 100);
    }
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
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
    <motion.div
      className="card-product group relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image container */}
      <Link to={`/product/${product.id}`}>
        <div className="relative aspect-square overflow-hidden bg-secondary/50 rounded-t-xl">
          {/* Primary image */}
          <motion.img
            src={optimizeImage(product.image, 500)}
            alt={product.name}
            loading="lazy"
            decoding="async"
            animate={{
              opacity: isHovered && product.supplementaryImages?.[0] ? 0 : 1,
              scale: isHovered ? 1.08 : 1,
            }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />

          {/* Secondary image (revealed on hover) */}
          {product.supplementaryImages?.[0] && (
            <motion.img
              src={optimizeImage(product.supplementaryImages[0], 500)}
              alt={`${product.name} alternate`}
              loading="lazy"
              decoding="async"
              initial={{ opacity: 0, scale: 1.12 }}
              animate={{
                opacity: isHovered ? 1 : 0,
                scale: isHovered ? 1 : 1.12,
              }}
              transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}

          {/* Soft shine sweep on hover */}
          <motion.div
            initial={{ x: '-120%' }}
            animate={{ x: isHovered ? '120%' : '-120%' }}
            transition={{ duration: 0.9, ease: 'easeInOut' }}
            className="pointer-events-none absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
          />

          {/* Discount badge */}
          {product.discount && (
            <span className="absolute top-2 left-2 z-10 bg-destructive text-destructive-foreground text-[10px] md:text-xs font-bold px-2 py-0.5 md:px-2.5 md:py-1 rounded-full shadow-lg">
              {product.discount}%
            </span>
          )}

          {/* Pre-order badge */}
          {product.isPreorder && (
            <span className="absolute top-2 left-2 z-10 bg-gradient-to-r from-primary to-[hsl(44_100%_46%)] text-primary-foreground text-[10px] md:text-xs font-bold px-2 py-0.5 md:px-2.5 md:py-1 rounded-full shadow-lg uppercase tracking-wide">
              Pre-Order
            </span>
          )}

          {/* Hover actions */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 10 }}
            className="absolute top-2 right-2 z-10 flex flex-col gap-1.5"
          >
            <motion.button
              onClick={handleWishlistToggle}
              className={`p-1.5 md:p-2 rounded-full shadow-lg backdrop-blur-sm transition-all duration-300 ${
                isWishlisted 
                  ? 'bg-destructive text-destructive-foreground' 
                  : 'bg-background/90 hover:bg-background hover:scale-110'
              }`}
              whileTap={{ scale: 0.9 }}
            >
              <Heart size={14} className="md:w-4 md:h-4" fill={isWishlisted ? 'currentColor' : 'none'} />
            </motion.button>
            <motion.button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView(product);
              }}
              className="p-1.5 md:p-2 bg-background/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-background hover:scale-110 transition-all duration-300"
              whileTap={{ scale: 0.9 }}
            >
              <Eye size={14} className="md:w-4 md:h-4" />
            </motion.button>
          </motion.div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-2 md:p-4">
        <Link to={`/product/${product.id}`}>
          <h3 className="font-medium text-foreground line-clamp-2 mb-1 text-xs md:text-sm hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-3">
          <span className="price-sale text-sm md:text-lg font-bold">৳ {product.price}</span>
          {product.originalPrice && (
            <span className="price-original text-xs md:text-sm">৳ {product.originalPrice}</span>
          )}
        </div>

        {/* Add To Cart only */}
        <div className="flex flex-col gap-1.5">
          <Button
            onClick={handleAddToCart}
            className="w-full btn-primary text-[10px] md:text-sm py-1.5 md:py-2 h-auto px-2"
          >
            {product.isPreorder ? 'Reserve' : 'Add To Cart'}
          </Button>
        </div>

      </div>
    </motion.div>
  );
};
