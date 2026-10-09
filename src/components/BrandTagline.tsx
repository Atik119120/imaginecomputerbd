import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export const BrandTagline = () => {
  return (
    <section className="relative py-10 md:py-16 overflow-hidden bg-gradient-to-b from-background via-secondary/20 to-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-red/10 rounded-full mb-4">
            <Sparkles size={14} className="text-primary" />
            <span className="text-xs font-medium text-primary tracking-widest uppercase">
              Genuine · Warranty · Fast Delivery
            </span>
          </div>

          <h2 className="font-heading text-3xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-4">
            Tech that keeps up.{' '}
            <span className="text-primary">
              Imagine Computer.
            </span>
          </h2>

          <p className="text-muted-foreground text-sm md:text-base lg:text-lg leading-relaxed max-w-2xl mx-auto">
            Smart watches, earbuds, chargers, cables, power banks and everyday
            gadgets — hand-picked, 100% genuine and tested before it reaches you.
          </p>

          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-6 mx-auto h-[2px] w-24 bg-gradient-to-r from-transparent via-primary to-transparent"
          />
        </motion.div>
      </div>
    </section>
  );
};
