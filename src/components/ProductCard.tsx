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

  const saveAmount = product.originalPrice && product.originalPrice > product.price ? product.originalPrice - product.price : 0;
  const savePct = saveAmount ? Math.round((saveAmount / product.originalPrice!) * 100) : 0;

  return (
    <div
      className="group relative flex flex-col h-full bg-background rounded-md shadow-sm hover:shadow-lg transition-shadow overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {saveAmount > 0 && (
        <span className="absolute top-2 left-0 z-10 bg-primary text-primary-foreground text-[10px] md:text-xs font-semibold px-2 md:px-3 py-0.5 md:py-1 rounded-r-full">
          Save: {saveAmount.toLocaleString()}৳ (-{savePct}%)
        </span>
      )}
      {product.isPreorder && !saveAmount && (
        <span className="absolute top-2 left-0 z-10 bg-primary text-primary-foreground text-[10px] md:text-xs font-semibold px-3 py-1 rounded-r-full">Pre-Order</span>
      )}

      <div className={`absolute top-2 right-2 z-10 flex flex-col gap-1.5 transition-opacity ${isHovered || isWishlisted ? 'opacity-100' : 'opacity-0'}`}>
        <button onClick={handleWishlistToggle} aria-label="Wishlist" className={`p-1.5 rounded-full shadow ${isWishlisted ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground hover:text-primary'}`}>
          <Heart size={14} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>
        <button onClick={(e) => { e.preventDefault(); onQuickView(product); }} aria-label="Quick view" className="p-1.5 rounded-full shadow bg-background text-foreground hover:text-primary">
          <Eye size={14} />
        </button>
      </div>

      <Link to={`/product/${product.id}`} className="flex flex-col flex-1">
        <div className="aspect-square p-4 md:p-6 border-b border-border/60">
          <img
            src={optimizeImage(product.image, 400)}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
            onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
          />
        </div>
        <div className="flex flex-col flex-1 p-3 md:p-4">
          <h3 className="text-xs md:text-sm text-foreground line-clamp-2 group-hover:text-primary group-hover:underline">
            {product.name}
          </h3>
          <div className="mt-auto pt-4 flex items-baseline gap-2 flex-wrap">
            {product.price > 0 ? (
              <>
                <span className="text-base md:text-lg font-bold text-primary">{product.price.toLocaleString()}৳</span>
                {saveAmount > 0 && <s className="text-xs md:text-sm text-muted-foreground">{product.originalPrice!.toLocaleString()}৳</s>}
              </>
            ) : (
              <span className="text-sm font-semibold text-muted-foreground">Call for Price</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};
