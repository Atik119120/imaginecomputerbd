import { Cpu, CircuitBoard, MemoryStick, HardDrive, Fan, Monitor, Keyboard, Mouse, Headphones, Zap, Box, MonitorPlay, Battery } from 'lucide-react';

export type Part = { id: string; name: string; price: number; image_url: string | null };
export type Slot = { key: string; label: string; sub: string; cat: string; icon: any; required?: boolean; multi?: boolean; needs?: string };
export type Build = Record<string, Part[]>;

export const CORE: Slot[] = [
  { key: 'cpu', label: 'CPU', sub: 'processor', cat: 'component', icon: Cpu, required: true },
  { key: 'cooler', label: 'CPU Cooler', sub: 'cpu-cooler', cat: 'component', icon: Fan, needs: 'cpu' },
  { key: 'mobo', label: 'Motherboard', sub: 'motherboard', cat: 'component', icon: CircuitBoard, required: true, needs: 'cpu' },
  { key: 'ram', label: 'RAM', sub: 'ram-desktop', cat: 'component', icon: MemoryStick, required: true, multi: true, needs: 'mobo' },
  { key: 'ssd', label: 'Storage', sub: 'ssd', cat: 'component', icon: HardDrive, required: true, multi: true },
  { key: 'hdd', label: 'Hard Disk', sub: 'hard-disk-drive', cat: 'component', icon: HardDrive, multi: true },
  { key: 'gpu', label: 'Graphics Card', sub: 'graphics-card', cat: 'component', icon: MonitorPlay },
  { key: 'psu', label: 'Power Supply', sub: 'power-supply', cat: 'component', icon: Zap, required: true },
  { key: 'case', label: 'Casing', sub: 'casing', cat: 'component', icon: Box, required: true, multi: true },
];
export const PERIPHERALS: Slot[] = [
  { key: 'monitor', label: 'Monitor', sub: 'gaming-monitor', cat: 'monitor', icon: Monitor, multi: true },
  { key: 'casefan', label: 'Casing Cooler', sub: 'casing-cooler', cat: 'component', icon: Fan, multi: true },
  { key: 'keyboard', label: 'Keyboard', sub: 'keyboard', cat: 'gaming', icon: Keyboard },
  { key: 'mouse', label: 'Mouse', sub: 'mouse', cat: 'gaming', icon: Mouse },
  { key: 'headphone', label: 'Headphone', sub: 'headphone', cat: 'gaming', icon: Headphones },
  { key: 'ups', label: 'UPS', sub: 'ups', cat: 'power', icon: Battery },
];
export const ALL = [...CORE, ...PERIPHERALS];
export const slotByKey = (k?: string) => ALL.find((s) => s.key === k);
const STORAGE = 'pc_builder_v2';
export const SAVED = 'pc_builder_saved';

export const loadBuild = (): Build => {
  try {
    const shared = new URLSearchParams(window.location.search).get('b');
    const raw = shared ? JSON.parse(decodeURIComponent(atob(shared))) : JSON.parse(localStorage.getItem(STORAGE) || localStorage.getItem('pc_builder_v1') || '{}');
    const out: Build = {};
    for (const k in raw) out[k] = Array.isArray(raw[k]) ? raw[k] : [raw[k]];
    return out;
  } catch { return {}; }
};
export const saveBuild = (b: Build) => localStorage.setItem(STORAGE, JSON.stringify(b));

export const socketOf = (n: string) => {
  const s = n.toUpperCase().replace(/LGA\s(\d)/g, 'LGA$1');
  for (const k of ['AM5', 'AM4', 'LGA1851', 'LGA1700', 'LGA1200']) if (s.includes(k)) return k;
  if (/RYZEN\s?\d\s?[789]\d{3}/.test(s)) return 'AM5';
  if (/RYZEN\s?\d\s?[1-5]\d{3}/.test(s)) return 'AM4';
  if (/CORE\s?ULTRA/.test(s)) return 'LGA1851';
  if (/I[3579][\s-]?1[2-4]\d{3}/.test(s)) return 'LGA1700';
  if (/I[3579][\s-]?1[01]\d{3}/.test(s)) return 'LGA1200';
  if (/\b(B850|X870|B650|X670|A620)/.test(s)) return 'AM5';
  if (/\b(B550|X570|A520|B450|A320)/.test(s)) return 'AM4';
  if (/\b(Z890|B860|H810)/.test(s)) return 'LGA1851';
  if (/\b(Z790|B760|H770|H610|Z690|B660|H670)/.test(s)) return 'LGA1700';
  if (/\b(H510|B560|Z590|H410|B460)/.test(s)) return 'LGA1200';
  return null;
};
export const ddrOf = (n: string) => (/DDR5/i.test(n) ? 'DDR5' : /DDR4/i.test(n) ? 'DDR4' : null);

/** Whether a candidate part fits the current build. */
export const compatible = (slotKey: string, name: string, b: Build) => {
  const cpu = b.cpu?.[0], mobo = b.mobo?.[0];
  const same = (x: string | null, y: string | null) => !x || !y || x === y;
  if (slotKey === 'mobo' && cpu) return same(socketOf(cpu.name), socketOf(name));
  if (slotKey === 'cpu' && mobo) return same(socketOf(mobo.name), socketOf(name));
  if (slotKey === 'ram' && mobo) return same(ddrOf(mobo.name), ddrOf(name));
  return true;
};
