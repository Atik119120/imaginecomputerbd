import { Link } from 'react-router-dom';
import { Facebook, Instagram, Youtube, Linkedin, Twitter, Phone, MapPin } from 'lucide-react';
import paymentMethods from '@/assets/payment-methods.png';
import astropixelLogo from '@/assets/astropixel-logo-white.png';
import { useFooterSettings } from '@/hooks/useFooterSettings';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const aboutLinks = [
  [
    { label: 'Shop All', href: '/shop' },
    { label: 'New Arrivals', href: '/shop' },
    { label: 'Return Policy', href: '/return-policy' },
    { label: 'Order Tracking', href: '/order-tracking' },
  ],
  [
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms and Conditions', href: '/terms-conditions' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Support', href: '/contact' },
  ],
  [
    { label: 'About Us', href: '/about' },
    { label: 'Gadget Deals', href: '/shop' },
    { label: 'Wishlist', href: '/wishlist' },
    { label: 'My Profile', href: '/profile' },
  ],
];

export const Footer = () => {
  const { footerContent, socialLinks } = useFooterSettings();
  const { siteName } = useSiteSettings();

  const activeSocialLinks = [
    ...(socialLinks.facebook ? [{ icon: Facebook, href: socialLinks.facebook, label: 'Facebook' }] : []),
    ...(socialLinks.instagram ? [{ icon: Instagram, href: socialLinks.instagram, label: 'Instagram' }] : []),
    ...(socialLinks.youtube ? [{ icon: Youtube, href: socialLinks.youtube, label: 'Youtube' }] : []),
    ...(socialLinks.linkedin ? [{ icon: Linkedin, href: socialLinks.linkedin, label: 'Linkedin' }] : []),
  ];

  const displaySocialLinks = activeSocialLinks.length > 0 ? activeSocialLinks : [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
  ];

  const headingClass = 'text-[11px] md:text-[12px] font-bold uppercase tracking-[0.28em] text-ink-foreground';

  return (
    <footer className="relative bg-ink text-ink-foreground pb-20 lg:pb-0 overflow-hidden">

      <div className="container mx-auto px-5 md:px-10 pt-10 md:pt-14 pb-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
          {/* Support */}
          <div className="lg:col-span-3 space-y-5">
            <h4 className={headingClass}>Support</h4>

            <a
              href={`tel:${footerContent.phone}`}
              className="flex items-center gap-3 rounded-2xl bg-ink-foreground/5 px-4 py-3 hover:bg-ink-foreground/10 transition-colors"
            >
              <span className="w-9 h-9 rounded-full bg-ink-foreground/10 flex items-center justify-center flex-shrink-0">
                <Phone className="w-4 h-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-[10.5px] text-ink-foreground/65 tracking-wide">9 AM - 9 PM</span>
                <span className="block font-bold text-ink-foreground text-[16px] md:text-[18px] break-all leading-tight">
                  {footerContent.phone}
                </span>
              </span>
            </a>

            <Link
              to="/contact"
              className="flex items-center gap-3 rounded-2xl bg-ink-foreground/5 px-4 py-3 hover:bg-ink-foreground/10 transition-colors"
            >
              <span className="w-9 h-9 rounded-full bg-ink-foreground/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-[10.5px] text-ink-foreground/65 tracking-wide">Store Locator</span>
                <span className="block font-bold text-ink-foreground text-[15px] md:text-[17px] leading-tight">Find Our Store</span>
              </span>
            </Link>
          </div>

          {/* About Us */}
          <div className="lg:col-span-6 space-y-5">
            <h4 className={headingClass}>About Us</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
              {aboutLinks.map((column, i) => (
                <ul key={i} className="space-y-3 text-[12.5px] md:text-[13.5px] font-medium">
                  {column.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.href}
                        className="text-ink-foreground/80 hover:text-ink-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>

          {/* Stay Connected */}
          <div className="lg:col-span-3 space-y-4 min-w-0">
            <h4 className={headingClass}>Stay Connected</h4>
            <p className="font-semibold text-[14px]">{siteName}</p>
            <p className="text-[12.5px] md:text-[13.5px] text-ink-foreground/75 leading-relaxed break-words">
              {footerContent.address}
            </p>
            <div className="space-y-1">
              <p className="font-semibold text-[12.5px]">Email:</p>
              <a
                href={`mailto:${footerContent.email}`}
                className="text-ink-foreground text-[12.5px] md:text-[13.5px] hover:underline break-all"
              >
                {footerContent.email}
              </a>
            </div>
          </div>
        </div>

        {/* payment + social strip */}
        <div className="mt-10 pt-6 border-t border-ink-foreground/10 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span className="text-[10.5px] md:text-[11px] font-bold tracking-[0.22em] text-ink-foreground/70 uppercase text-center sm:text-left">
              Payment With Us
            </span>
            <img
              src={paymentMethods}
              alt="Accepted payment methods"
              className="h-6 md:h-7 w-auto max-w-full opacity-95 object-contain mx-auto sm:mx-0"
              loading="lazy"
            />
          </div>

          <div className="flex items-center gap-3">
            {displaySocialLinks.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-10 h-10 rounded-full bg-ink-foreground/10 flex items-center justify-center hover:bg-ink-foreground/20 transition-colors"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        {/* bottom bar */}
        <div className="mt-6 pt-5 border-t border-ink-foreground/10 flex flex-col md:flex-row justify-between items-center gap-3 text-center md:text-left">
          <p className="font-heading text-[11px] md:text-[12.5px] text-ink-foreground/60">
            © {new Date().getFullYear()}{' '}
            <span className="text-ink-foreground/90 font-semibold">{footerContent.copyright}</span>
            <span className="hidden md:inline text-ink-foreground/40"> | All rights reserved</span>
          </p>
          <a
            href="https://astropixel.tech/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <span className="text-[11px] md:text-[12.5px] text-ink-foreground/60">Powered by</span>
            <img
              src={astropixelLogo}
              alt="Astropixel"
              className="h-4 md:h-5 w-auto"
              loading="lazy"
            />
          </a>
        </div>
      </div>
    </footer>
  );
};
