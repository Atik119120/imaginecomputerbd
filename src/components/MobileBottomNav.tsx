import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Heart, ShoppingCart, MessageCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { products } from '@/data/products';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useWhatsappNumber } from '@/hooks/useWhatsappNumber';

const WhatsAppIcon = ({ size = 22 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className="fill-current">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
  </svg>
);

export const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalItems, setIsCartOpen } = useCart();
  const { wishlistCount } = useWishlist();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof products>([]);
  const whatsappNumber = useWhatsappNumber();

  const handleWhatsApp = () => {
    if (!whatsappNumber) {
      toast.error('WhatsApp number not configured yet');
      return;
    }
    const msg = encodeURIComponent('Hi! I have a question about your products.');
    window.open(`https://wa.me/${whatsappNumber.replace('+', '')}?text=${msg}`, '_blank');
  };

  const handleChat = () => {
    window.dispatchEvent(new CustomEvent('lcb:open-chat'));
  };

  const isActive = (path: string) => location.pathname === path;

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const searchTerm = query.toLowerCase();
    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
    );
    setSearchResults(filtered.slice(0, 5));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setShowSearch(false);
      setSearchResults([]);
    }
  };

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
    setSearchQuery('');
    setShowSearch(false);
    setSearchResults([]);
  };

  const navItems = [
    { icon: Home, label: 'Home', path: '/', action: () => navigate('/') },
    { icon: Search, label: 'Search', path: null, action: () => setShowSearch(true) },
    { icon: WhatsAppIcon, label: 'WhatsApp', path: null, action: handleWhatsApp, isWhatsApp: true },
    { icon: Heart, label: 'Wishlist', path: '/wishlist', action: () => navigate('/wishlist'), badge: wishlistCount },
    { icon: ShoppingCart, label: 'Cart', path: null, action: () => setIsCartOpen(true), badge: totalItems },
  ];

  return (
    <>
      {/* Search Overlay */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 lg:hidden"
          >
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-border">
                <form onSubmit={handleSearchSubmit} className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Search products..."
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      autoFocus
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSearch(false);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="px-4 py-3 text-sm font-medium text-muted-foreground"
                  >
                    Cancel
                  </button>
                </form>
              </div>

              {/* Search Results */}
              <div className="flex-1 overflow-y-auto p-4">
                {searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map((product) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => handleProductClick(product.id)}
                        className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl cursor-pointer"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-14 h-14 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                          <p className="text-primary font-semibold text-sm">৳ {product.price}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : searchQuery.length > 0 ? (
                  <p className="text-center text-muted-foreground py-8">No products found</p>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Start typing to search</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40 lg:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-14">
          {navItems.map(({ icon: Icon, label, path, action, badge, isWhatsApp }: any) => (
            <button
              key={label}
              onClick={action}
              className={`flex flex-col items-center justify-center flex-1 h-full relative transition-colors ${
                isWhatsApp
                  ? 'text-[#25D366]'
                  : path && isActive(path)
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              <div className="relative">
                <Icon size={22} />
                {badge !== undefined && badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {badge}
                  </span>
                )}
              </div>
              <span className="text-[9px] mt-0.5 font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
};
