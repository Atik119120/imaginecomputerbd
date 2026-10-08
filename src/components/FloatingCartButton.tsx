import { ShoppingBag } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useCart } from '@/context/CartContext';

export const FloatingCartButton = () => {
  const { totalItems, setIsCartOpen } = useCart();
  const { pathname } = useLocation();

  if (pathname.startsWith('/admin')) return null;

  return (
    <button
      onClick={() => setIsCartOpen(true)}
      aria-label="Open cart"
      className="fixed right-3 bottom-16 md:bottom-4 lg:bottom-4 z-40 flex flex-col items-center justify-center w-12 h-12 md:w-12 md:h-12 rounded-lg bg-ink text-ink-foreground shadow-xl shadow-ink/20 hover:bg-ink/90 transition-all duration-200 hover:scale-105 active:scale-95"
    >
      <span className="relative flex items-center justify-center">
        <ShoppingBag size={18} className="md:w-5 md:h-5" />
        {totalItems > 0 && (
          <span className="absolute -top-2 -right-2 min-w-[16px] h-[16px] px-0.5 flex items-center justify-center rounded-full bg-[hsl(var(--brand-red))] text-white text-[9px] font-bold border-2 border-ink">
            {totalItems}
          </span>
        )}
      </span>
      <span className="text-[8px] md:text-[9px] font-semibold leading-none mt-0.5">
        CART
      </span>
    </button>
  );
};
