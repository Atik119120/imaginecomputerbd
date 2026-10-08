import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logoAsset from '@/assets/imagine-logo.png.asset.json';
const logo = logoAsset.url;

export const Preloader = () => {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 3;
      });
    }, 30);

    const timer = setTimeout(() => setLoading(false), 1800);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-primary overflow-hidden"
        >
          {/* Rich layered background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-[hsl(var(--primary)/0.6)]" />
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 30%, hsl(var(--accent)) 0%, transparent 40%), radial-gradient(circle at 80% 70%, white 0%, transparent 40%)',
            }}
          />

          {/* Animated gold orbits */}
          <motion.div
            className="absolute w-[480px] h-[480px] rounded-full border border-accent/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent shadow-[0_0_12px_hsl(var(--accent))]" />
          </motion.div>
          <motion.div
            className="absolute w-[340px] h-[340px] rounded-full border border-white/15"
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/80 shadow-[0_0_10px_white]" />
          </motion.div>

          <div className="relative flex flex-col items-center gap-7">
            {/* Logo with rotating arc + glow */}
            <div className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
              {/* Spinning gradient arc */}
              <motion.svg
                viewBox="0 0 100 100"
                className="absolute inset-0 w-full h-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
              >
                <defs>
                  <linearGradient id="preloader-arc" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="1" />
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="url(#preloader-arc)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeDasharray="180 100"
                />
              </motion.svg>

              {/* Static thin ring */}
              <div className="absolute inset-2 rounded-full border border-white/10" />

              {/* Glow halo */}
              <motion.div
                className="absolute inset-0 rounded-full bg-accent/30 blur-2xl"
                animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.9, 1.05, 0.9] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Logo */}
              <motion.img
                src={logo}
                alt="Logo"
                className="relative w-16 h-16 md:w-20 md:h-20 object-contain"
                initial={{ opacity: 0, scale: 0.6, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>

            {/* Brand wordmark with shimmer */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="relative"
            >
              <div className="font-heading text-white text-lg md:text-xl tracking-[0.4em] uppercase relative">
                Amin
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-accent to-transparent bg-clip-text text-transparent"
                  initial={{ backgroundPosition: '-200% 0' }}
                  animate={{ backgroundPosition: '200% 0' }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  style={{ backgroundSize: '200% 100%' }}
                >
                  Amin
                </motion.span>
              </div>
              <div className="text-center text-[10px] tracking-[0.5em] text-white/50 mt-1.5 uppercase">
                One
              </div>

            </motion.div>

            {/* Progress with percent + dots */}
            <div className="flex flex-col items-center gap-2.5 w-52 md:w-60">
              <div className="relative h-[2px] w-full bg-white/15 rounded-full overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent via-white to-accent rounded-full"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
                <motion.div
                  className="absolute inset-y-0 w-12 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                  animate={{ x: ['-50%', '600%'] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
              <div className="flex items-center justify-between w-full text-[10px] tracking-[0.2em] uppercase text-white/60">
                <span>Loading</span>
                <span className="font-mono tabular-nums">{progress.toString().padStart(3, '0')}%</span>
              </div>
            </div>
          </div>

          {/* Corner ornaments */}
          {[
            'top-6 left-6 border-t border-l',
            'top-6 right-6 border-t border-r',
            'bottom-6 left-6 border-b border-l',
            'bottom-6 right-6 border-b border-r',
          ].map((pos) => (
            <motion.div
              key={pos}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className={`absolute w-8 h-8 border-accent/40 ${pos}`}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
