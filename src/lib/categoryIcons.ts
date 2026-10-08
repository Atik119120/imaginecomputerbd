import type { LucideIcon } from 'lucide-react';
import {
  Smartphone,
  Cable,
  Zap,
  Ear,
  Gamepad2,
  Headphones,
  BatteryCharging,
  Watch,
  Speaker,
  Package,
  Laptop,
  Monitor,
  Keyboard,
  Mouse,
  Camera,
  Tv,
  Printer,
  HardDrive,
  Cpu,
  MemoryStick,
  Router,
  Tablet,
  Mic,
  Lightbulb,
  Fan,
  Car,
  Plug,
  Usb,
  Wifi,
  Joystick,
} from 'lucide-react';

/** Icons an admin can pick for a category. Key is stored in categories.icon_key. */
export const CATEGORY_ICON_OPTIONS: { key: string; label: string; Icon: LucideIcon }[] = [
  { key: 'smartphone', label: 'Mobile', Icon: Smartphone },
  { key: 'tablet', label: 'Tablet', Icon: Tablet },
  { key: 'laptop', label: 'Laptop', Icon: Laptop },
  { key: 'monitor', label: 'Monitor / PC', Icon: Monitor },
  { key: 'keyboard', label: 'Keyboard', Icon: Keyboard },
  { key: 'mouse', label: 'Mouse', Icon: Mouse },
  { key: 'headphones', label: 'Headphones', Icon: Headphones },
  { key: 'earbuds', label: 'Earbuds', Icon: Ear },
  { key: 'speaker', label: 'Speaker', Icon: Speaker },
  { key: 'mic', label: 'Microphone', Icon: Mic },
  { key: 'watch', label: 'Smart Watch', Icon: Watch },
  { key: 'gaming', label: 'Gaming', Icon: Gamepad2 },
  { key: 'joystick', label: 'Console', Icon: Joystick },
  { key: 'camera', label: 'Camera', Icon: Camera },
  { key: 'tv', label: 'TV', Icon: Tv },
  { key: 'printer', label: 'Printer', Icon: Printer },
  { key: 'powerbank', label: 'Power Bank', Icon: BatteryCharging },
  { key: 'charger', label: 'Charger', Icon: Zap },
  { key: 'cable', label: 'Cable', Icon: Cable },
  { key: 'usb', label: 'USB / Drive', Icon: Usb },
  { key: 'storage', label: 'Storage', Icon: HardDrive },
  { key: 'memory', label: 'RAM / Memory', Icon: MemoryStick },
  { key: 'cpu', label: 'Processor', Icon: Cpu },
  { key: 'router', label: 'Router', Icon: Router },
  { key: 'wifi', label: 'Network', Icon: Wifi },
  { key: 'light', label: 'Light', Icon: Lightbulb },
  { key: 'fan', label: 'Fan / Cooling', Icon: Fan },
  { key: 'car', label: 'Car Gadget', Icon: Car },
  { key: 'plug', label: 'Adapter', Icon: Plug },
  { key: 'package', label: 'Other', Icon: Package },
];

const BY_KEY: Record<string, LucideIcon> = CATEGORY_ICON_OPTIONS.reduce(
  (acc, o) => ({ ...acc, [o.key]: o.Icon }),
  {} as Record<string, LucideIcon>
);

/** Fallback guesses from the slug so old categories keep a sensible icon. */
const BY_SLUG: Record<string, LucideIcon> = {
  'mobile-phones': Smartphone,
  cable: Cable,
  charger: Zap,
  earbuds: Ear,
  gaming: Gamepad2,
  headphones: Headphones,
  'power-bank': BatteryCharging,
  'smart-watch': Watch,
  speaker: Speaker,
};

export const getCategoryIcon = (iconKey?: string | null, slug?: string): LucideIcon =>
  (iconKey && BY_KEY[iconKey]) || (slug && BY_SLUG[slug]) || Package;
