import { Link } from 'react-router-dom';
import { Laptop, MessageSquareWarning, Cpu, Wrench, type LucideIcon } from 'lucide-react';

type Feature = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  to: string;
};

const FEATURES: Feature[] = [
  { icon: Laptop, title: 'Gadget Finder', subtitle: 'Find Your Gadget Easily', to: '/shop' },
  { icon: MessageSquareWarning, title: 'Raise a Complain', subtitle: 'Share your experience', to: '/contact' },
  { icon: Cpu, title: 'Spec Compare', subtitle: 'Pick the right specs', to: '/shop' },
  { icon: Wrench, title: 'Servicing Center', subtitle: 'Repair Your Device', to: '/contact' },
];

export const FeatureCards = () => (
  <section className="bg-secondary/40 pt-6 pb-2 md:pt-8">
    <div className="container mx-auto px-3 md:px-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {FEATURES.map(({ icon: Icon, title, subtitle, to }) => (
          <Link
            key={title}
            to={to}
            className="group flex items-center gap-3 rounded-xl bg-card px-3 py-3.5 md:px-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.10)]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-red text-white transition-transform duration-300 group-hover:scale-105 md:h-11 md:w-11">
              <Icon strokeWidth={1.6} className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block font-heading text-[13px] md:text-[15px] font-bold leading-tight text-foreground">
                {title}
              </span>
              <span className="block truncate text-[11px] md:text-[12.5px] text-muted-foreground">
                {subtitle}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  </section>
);
