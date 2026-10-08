import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tag, Percent, Truck, Copy, Check, TicketPercent } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  min_order_value: number | null;
  valid_until: string | null;
}

export const CouponBanner = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchActiveCoupons();
  }, []);

  const fetchActiveCoupons = async () => {
    const now = new Date().toISOString();
    const { data } = await supabase
      .from('coupons')
      .select('id, code, type, value, min_order_value, valid_until')
      .eq('is_active', true)
      .or(`valid_from.lte.${now},valid_from.is.null`)
      .or(`valid_until.gte.${now},valid_until.is.null`)
      .order('value', { ascending: false })
      .limit(3);

    if (data) setCoupons(data);
  };

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast({ title: `Copied: ${code}`, description: 'Use at checkout!' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const couponLabel = (c: Coupon) => {
    if (c.type === 'flat') return `৳${c.value} OFF`;
    if (c.type === 'percentage') return `${c.value}% OFF`;
    return 'FREE SHIPPING';
  };

  const couponIcon = (type: string) => {
    if (type === 'flat') return <Tag className="w-6 h-6" />;
    if (type === 'percentage') return <Percent className="w-6 h-6" />;
    return <Truck className="w-6 h-6" />;
  };

  if (coupons.length === 0) return null;

  return (
    <section className="w-full py-6 md:py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-[hsl(0_0%_13%)] to-[hsl(0_0%_5%)] rounded-3xl p-6 md:p-10 relative overflow-hidden"
        >
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-red/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-red/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 md:mb-8">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                <TicketPercent className="w-6 h-6 md:w-7 md:h-7 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl md:text-3xl font-bold text-white font-heading">
                  Exclusive Offers
                </h2>
                <p className="text-white/70 text-sm md:text-base">
                  Grab these deals before they expire!
                </p>
              </div>
            </div>

            {/* Coupons Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {coupons.map((coupon, idx) => (
                <motion.div
                  key={coupon.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 md:p-6 hover:bg-white/15 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 bg-brand-red/20 rounded-xl flex items-center justify-center text-primary">
                      {couponIcon(coupon.type)}
                    </div>
                    <span className="text-primary font-bold text-lg md:text-xl font-heading">
                      {couponLabel(coupon)}
                    </span>
                  </div>

                  <div className="mb-4">
                    <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Coupon Code</p>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-mono font-bold text-lg md:text-xl tracking-wider">
                        {coupon.code}
                      </span>
                    </div>
                  </div>

                  {coupon.min_order_value ? (
                    <p className="text-white/50 text-xs mb-4">
                      Min. order: ৳{coupon.min_order_value}
                    </p>
                  ) : (
                    <p className="text-white/50 text-xs mb-4">No minimum order</p>
                  )}

                  <button
                    onClick={() => handleCopy(coupon.code, coupon.id)}
                    className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl font-semibold text-sm md:text-base flex items-center justify-center gap-2 hover:bg-[hsl(48_100%_45%)] transition-colors active:scale-[0.98]"
                  >
                    {copiedId === coupon.id ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Code
                      </>
                    )}
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
