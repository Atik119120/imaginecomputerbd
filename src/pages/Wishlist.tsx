import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartSidebar } from '@/components/CartSidebar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { products } from '@/data/products';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Heart, Trash2, ShoppingCart, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const Wishlist = () => {
  const { wishlistIds, removeFromWishlist } = useWishlist();
  const { addToCart, items: cartItems, updateQuantity } = useCart();
  const { user } = useAuth();

  const wishlistProducts = products.filter(p => wishlistIds.includes(p.id));

  const getCartItem = (productId: string) =>
    cartItems.find((item) => item.id === productId);

  const handleAddToCart = (product: typeof products[0]) => {
    addToCart(product, 1, product.sizes?.[0], product.colors?.[0], false);
    toast.success(`${product.name} added to cart`);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center bg-secondary/30">
          <div className="text-center p-8">
            <Heart size={64} className="mx-auto mb-4 text-muted-foreground" />
            <h1 className="font-heading text-2xl font-semibold mb-2">Login Required</h1>
            <p className="text-muted-foreground mb-6">
              Please login to view your wishlist.
            </p>
            <Link to="/auth">
              <Button className="btn-primary">Login Now</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-secondary/30 py-8">
        <div className="container mx-auto px-4">
          <h1 className="font-heading text-3xl font-semibold mb-8">My Wishlist</h1>

          {wishlistProducts.length === 0 ? (
            <div className="text-center py-16">
              <Heart size={64} className="mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-medium mb-2">Your wishlist is empty</h2>
              <p className="text-muted-foreground mb-6">
                Browse products and add your favorites!
              </p>
              <Link to="/">
                <Button className="btn-primary">Continue Shopping</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {wishlistProducts.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-background rounded-lg overflow-hidden shadow-sm"
                >
                  <Link to={`/product/${product.id}`}>
                    <div className="aspect-square bg-secondary">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </Link>
                  <div className="p-4">
                    <Link to={`/product/${product.id}`}>
                      <h3 className="font-medium line-clamp-2 mb-2 hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="font-semibold text-primary">৳ {product.price}</span>
                      {product.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          ৳ {product.originalPrice}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAddToCart(product)}
                        className="flex-1 btn-primary text-sm"
                      >
                        <ShoppingCart size={16} className="mr-1" />
                        Add to Cart
                      </Button>
                      <button
                        onClick={() => removeFromWishlist(product.id)}
                        className="p-2 border border-border rounded-lg hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
      <CartSidebar />
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default Wishlist;
