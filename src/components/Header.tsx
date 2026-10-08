import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Heart, User, Menu, X, ChevronDown, LogOut, UserCircle, Shield, Phone, Home, MapPin, HelpCircle, MessageCircle } from 'lucide-react';

import { getCategoryIcon } from '@/lib/categoryIcons';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { useCategories } from '@/hooks/useProducts';
import { useNavCategories, useCategoryBrands } from '@/hooks/useTaxonomy';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { products } from '@/data/products';
import logoAsset from '@/assets/imagine-logo.png.asset.json';
const logo = logoAsset.url;
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [expandedMobileMenu, setExpandedMobileMenu] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof products>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const { totalItems, setIsCartOpen, totalPrice } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { categories } = useCategories();
  const { navCategories } = useNavCategories();
  const { categoryBrands } = useCategoryBrands();
  const [megaOpen, setMegaOpen] = useState<string | null>(null);
  const { siteName, logoUrl, headerPhone, headerTagline, loading: settingsLoading } = useSiteSettings();
  const navigate = useNavigate();

  const navItems = useMemo(() => {
    const categoryNames = categories.map(c => c.name);
    return [
      { label: 'Home', href: '/', submenu: null },
      { label: 'Shop', href: '/shop', submenu: null },
      { label: 'New Drop', href: '/new-drop', submenu: null },
      {
        label: 'Categories',
        href: null,
        submenu: categoryNames.length > 0 ? categoryNames : ['Loading...'],
      },
      { label: 'About', href: '/about', submenu: null },
      { label: 'Contact', href: '/contact', submenu: null },
    ];
  }, [categories]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const searchTerm = searchQuery.toLowerCase();
    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
    );
    setSearchResults(filtered.slice(0, 5));
    setShowSearchResults(true);
  }, [searchQuery]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const toggleMobileSubmenu = (label: string) => {
    setExpandedMobileMenu(expandedMobileMenu === label ? null : label);
  };

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setShowSearchResults(false);
    }
  };

  const displayLogo = logo;
  const showLogo = true;

  return (
    <header className="relative z-40 shadow-lg">
      {/* ===== ROW 1: Dark navy top bar — Logo | Search | Account actions ===== */}
      <div className="bg-primary sticky top-0 z-50 lg:static">
        <div className="container mx-auto px-4">
          {/* Mobile Row 1 */}
          <div className="flex lg:hidden items-center justify-between h-14">
            <button
              className="p-2 text-primary-foreground hover:text-primary-foreground/80 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <Link to="/" className="h-12 min-w-28 flex items-center justify-center">
              {showLogo && <img src={displayLogo} alt={siteName} className="h-12 w-auto object-contain bg-background rounded-lg px-2 py-0.5 shadow-md ring-2 ring-primary-foreground/60" />}
            </Link>

            <div className="flex items-center gap-2">
              <Link to="/wishlist" className="relative p-2 text-primary-foreground hover:text-primary-foreground/80 transition-colors">
                <Heart size={20} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-orange-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-primary-foreground hover:text-primary-foreground/80 transition-colors"
              >
                <ShoppingCart size={20} />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-orange-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Desktop Row 1 */}
          <div className="hidden lg:flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="h-16 min-w-40 flex-shrink-0 flex items-center">
              {showLogo && <img src={displayLogo} alt={siteName} className="h-16 w-auto object-contain bg-background rounded-xl px-3 py-1 shadow-lg ring-2 ring-primary-foreground/60" />}
            </Link>

            {/* Centered Search */}
            <div ref={searchRef} className="flex-1 max-w-2xl mx-8">
              <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-5 pr-12 py-3.5 bg-white rounded-md text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-ink/50 transition-all"
                  />
                  <button
                    type="submit"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/60 hover:text-ink transition-colors"
                  >
                    <Search size={20} />
                  </button>
                </div>
              </form>

              {/* Search Results */}
              <AnimatePresence>
                {showSearchResults && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-100 rounded-lg shadow-xl overflow-hidden z-50"
                  >
                    {searchResults.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => handleProductClick(product.id)}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <img src={product.image} alt={product.name} className="w-10 h-10 object-cover rounded-lg" />
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-800 line-clamp-1">{product.name}</p>
                          <p className="text-orange-500 font-semibold text-xs">৳ {product.price}</p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right: Star Tech-style icon-stack actions */}
            <div className="flex items-center gap-6 flex-shrink-0">
              <Link to="/order-tracking" className="group flex flex-col items-center gap-0.5 text-primary-foreground hover:text-primary-foreground/80 transition-colors">
                <div className="relative">
                  <MapPin size={22} />
                </div>
                <span className="text-[11px] font-medium leading-tight">Order Track</span>
              </Link>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex flex-col items-center gap-0.5 text-primary-foreground hover:text-primary-foreground/80 transition-colors">
                      <UserCircle size={22} />
                      <span className="text-[11px] font-medium leading-tight truncate max-w-[60px]">Account</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-white border border-gray-100 shadow-xl z-50">
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium text-gray-800">Your Account</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer text-gray-700">
                        <UserCircle size={16} className="mr-2" /> My Profile
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer text-orange-600">
                          <Shield size={16} className="mr-2" /> Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600">
                      <LogOut size={16} className="mr-2" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/auth" className="flex flex-col items-center gap-0.5 text-primary-foreground hover:text-primary-foreground/80 transition-colors">
                  <User size={22} />
                  <span className="text-[11px] font-medium leading-tight">Sign In</span>
                </Link>
              )}

              <Link to="/wishlist" className="relative flex flex-col items-center gap-0.5 text-primary-foreground hover:text-primary-foreground/80 transition-colors">
                <div className="relative">
                  <Heart size={22} />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-orange-500 text-white text-[9px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-bold">
                      {wishlistCount}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-medium leading-tight">Wishlist</span>
              </Link>

              <button
                onClick={() => setIsCartOpen(true)}
                className="relative flex flex-col items-center gap-0.5 text-primary-foreground hover:text-primary-foreground/80 transition-colors"
              >
                <div className="relative">
                  <ShoppingCart size={22} />
                  {totalItems > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-orange-500 text-white text-[9px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-bold">
                      {totalItems}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-medium leading-tight">Cart</span>
              </button>

              <Link
                to="/shop"
                className="hidden xl:flex items-center gap-2 bg-ink hover:bg-ink/90 text-ink-foreground px-5 py-2.5 rounded-md font-semibold text-sm transition-all shadow-md"
              >
                <ShoppingCart size={16} />
                Shop Now
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ===== ROW 2: White category nav ===== */}
      {isScrolled && <div className="hidden lg:block h-12" />}
      <div
        className={`hidden lg:block bg-white border-b border-gray-200 z-50 shadow-sm ${
          isScrolled ? 'fixed top-0 left-0 right-0' : 'relative'
        }`}
      >
        <div className="container mx-auto px-4">
          <nav className="flex items-center justify-center gap-8 h-12">
            {navCategories.length > 0 ? navCategories.slice(0, 8).map((cat) => (
              <div
                key={cat.id}
                className="h-full"
                onMouseEnter={() => setMegaOpen(cat.id)}
                onMouseLeave={() => setMegaOpen((prev) => (prev === cat.id ? null : prev))}
              >
                <Link
                  to={`/shop/${cat.slug}`}
                  className="text-[13px] font-semibold whitespace-nowrap text-gray-700 hover:text-brand-red h-full flex items-center gap-1 border-b-2 border-transparent hover:border-brand-red transition-colors"
                >
                  {(() => { const Icon = getCategoryIcon(cat.icon_key, cat.slug); return <Icon size={14} className="shrink-0" />; })()}
                  {cat.name}
                  {cat.subcategories.length > 0 && <ChevronDown size={13} />}
                </Link>

                <AnimatePresence>
                  {megaOpen === cat.id && cat.subcategories.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 right-0 top-full bg-white border-b border-gray-200 shadow-xl z-50"
                    >
                      <div className="container mx-auto px-4 py-6 grid grid-cols-4 gap-6">
                        <div className={(categoryBrands[cat.id]?.length ?? 0) > 0 ? 'col-span-3' : 'col-span-4'}>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">
                            {cat.name} Categories
                          </p>
                          <div className="grid grid-cols-3 gap-x-6 gap-y-2">
                            {cat.subcategories.map((sub) => (
                              <Link
                                key={sub.id}
                                to={`/shop/${cat.slug}?sub=${sub.slug}`}
                                onClick={() => setMegaOpen(null)}
                                className="flex items-center gap-2 text-sm text-gray-700 hover:text-brand-red transition-colors"
                              >
                                {(() => { const Icon = getCategoryIcon(cat.icon_key, cat.slug); return <Icon size={14} className="shrink-0 text-gray-400" />; })()}
                                {sub.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                        {(categoryBrands[cat.id]?.length ?? 0) > 0 && (
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">
                              {cat.name} Brands
                            </p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 max-h-56 overflow-y-auto pr-1">
                              {(categoryBrands[cat.id] || []).map((b) => (
                                <Link
                                  key={b.id}
                                  to={`/shop/${cat.slug}?brand=${b.slug}`}
                                  onClick={() => setMegaOpen(null)}
                                  className="block text-sm text-gray-700 hover:text-brand-red transition-colors"
                                >
                                  {b.name}
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )) : (
              <span className="text-[13px] text-gray-400">Loading categories…</span>
            )}
            {navCategories.length > 8 && (
              <Link
                to="/shop"
                className="text-[13px] font-semibold whitespace-nowrap text-brand-red hover:text-brand-red/80 h-full flex items-center gap-1 border-b-2 border-transparent hover:border-brand-red transition-colors"
              >
                All Categories
              </Link>
            )}
          </nav>
        </div>
      </div>


      {/* ===== Mobile Menu Overlay ===== */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-[85%] max-w-sm bg-card z-50 lg:hidden shadow-2xl overflow-y-auto"
            >
              <div className="p-5">
                {/* Drawer header */}
                <div className="flex items-center justify-between mb-6">
                  <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="h-8 min-w-20 flex items-center">
                    {showLogo && <img src={displayLogo} alt={siteName} className="h-8 w-auto object-contain" />}
                  </Link>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 hover:bg-secondary rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Mobile Search */}
                <form onSubmit={handleSearchSubmit} className="mb-5">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products..."
                      className="w-full pl-9 pr-4 py-3 bg-secondary rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                </form>

                {/* Mobile Nav Links */}
                <nav className="space-y-1">
                  {navItems.map((item) => (
                    <div key={item.label}>
                      {item.submenu ? (
                        <>
                          <button
                            onClick={() => toggleMobileSubmenu(item.label)}
                            className="flex items-center justify-between w-full py-3 px-4 rounded-lg hover:bg-secondary transition-colors font-medium text-sm"
                          >
                            {item.label}
                            <motion.span animate={{ rotate: expandedMobileMenu === item.label ? 180 : 0 }}>
                              <ChevronDown size={16} />
                            </motion.span>
                          </button>
                          <AnimatePresence>
                            {expandedMobileMenu === item.label && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="pl-4 overflow-hidden"
                              >
                                {navCategories.map((cat) => (
                                  <div key={cat.id}>
                                    <Link
                                      to={`/shop/${cat.slug}`}
                                      className="flex items-center gap-2 py-2 px-4 font-medium hover:text-brand-red transition-colors text-sm"
                                      onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                      {(() => { const Icon = getCategoryIcon(cat.icon_key, cat.slug); return <Icon size={15} className="shrink-0" />; })()}
                                      {cat.name}
                                    </Link>
                                    {cat.subcategories.map((sub) => (
                                      <Link
                                        key={sub.id}
                                        to={`/shop/${cat.slug}?sub=${sub.slug}`}
                                        className="block py-1.5 pl-8 pr-4 text-muted-foreground hover:text-foreground transition-colors text-sm"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                      >
                                        {sub.name}
                                      </Link>
                                    ))}
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      ) : (
                        <Link
                          to={item.href || '/'}
                          className="block py-3 px-4 rounded-lg hover:bg-secondary transition-colors font-medium text-sm"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {item.label}
                        </Link>
                      )}
                    </div>
                  ))}
                </nav>

                {/* Quick actions */}
                <div className="mt-6 pt-6 border-t border-border space-y-2">
                  {user ? (
                    <>
                      <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-secondary text-sm">
                        <UserCircle size={18} className="text-muted-foreground" />
                        My Profile
                      </Link>
                      {isAdmin && (
                        <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-secondary text-sm text-accent">
                          <Shield size={18} />
                          Admin Panel
                        </Link>
                      )}
                      <button onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-secondary text-sm text-destructive w-full">
                        <LogOut size={18} />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 py-3 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium justify-center">
                      <User size={18} />
                      Login / Register
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};
