import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Cpu, CircuitBoard, MemoryStick, HardDrive, Fan, Monitor, Keyboard, Mouse, Headphones, Zap, Box, MonitorPlay as Gpu, Battery, Search, X, Trash2, Share2, RotateCcw, ShoppingCart, CheckCircle2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartSidebar } from '@/components/CartSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { optimizeImage } from '@/lib/optimizeImage';

type Part = { id: string; name: string; price: number; image_url: string | null };
type Slot = { key: string; label: string; sub: string; cat: string; icon: any; required?: boolean };

const CORE: Slot[] = [
  { key: 'cpu', label: 'CPU', sub: 'processor', cat: 'component', icon: Cpu, required: true },
  { key: 'cooler', label: 'CPU Cooler', sub: 'cpu-cooler', cat: 'component', icon: Fan },
  { key: 'mobo', label: 'Motherboard', sub: 'motherboard', cat: 'component', icon: CircuitBoard, required: true },
  { key: 'ram', label: 'RAM', sub: 'ram-desktop', cat: 'component', icon: MemoryStick, required: true },
  { key: 'ssd', label: 'Storage (SSD)', sub: 'ssd', cat: 'component', icon: HardDrive, required: true },
  { key: 'hdd', label: 'Hard Disk', sub: 'hard-disk-drive', cat: 'component', icon: HardDrive },
  { key: 'gpu', label: 'Graphics Card', sub: 'graphics-card', cat: 'component', icon: Gpu },
  { key: 'psu', label: 'Power Supply', sub: 'power-supply', cat: 'component', icon: Zap, required: true },
  { key: 'case', label: 'Casing', sub: 'casing', cat: 'component', icon: Box, required: true },
];
const PERIPHERALS: Slot[] = [
  { key: 'monitor', label: 'Monitor', sub: 'gaming-monitor', cat: 'monitor', icon: Monitor },
  { key: 'casefan', label: 'Casing Cooler', sub: 'casing-cooler', cat: 'component', icon: Fan },
  { key: 'keyboard', label: 'Keyboard', sub: 'keyboard', cat: 'gaming', icon: Keyboard },
  { key: 'mouse', label: 'Mouse', sub: 'mouse', cat: 'gaming', icon: Mouse },
  { key: 'headphone', label: 'Headphone', sub: 'headphone', cat: 'gaming', icon: Headphones },
  { key: 'ups', label: 'UPS', sub: 'ups', cat: 'power', icon: Battery },
];
const ALL = [...CORE, ...PERIPHERALS];
const STORAGE = 'pc_builder_v1';

const socketOf = (n: string) => {
  const s = n.toUpperCase();
  for (const k of ['AM5', 'AM4', 'LGA1851', 'LGA1700', 'LGA1200', 'LGA 1700', 'LGA 1851', 'LGA 1200']) if (s.includes(k)) return k.replace(' ', '');
  if (/RYZEN\s?\d\s?[789]\d{3}/.test(s)) return 'AM5';
  if (/RYZEN\s?\d\s?[1-5]\d{3}/.test(s)) return 'AM4';
  if (/(CORE\s?ULTRA)/.test(s)) return 'LGA1851';
  if (/I[3579][\s-]?1[2-4]\d{3}/.test(s)) return 'LGA1700';
  if (/I[3579][\s-]?1[01]\d{3}/.test(s)) return 'LGA1200';
  if (/\b(B850|X870|B650|X670|A620)/.test(s)) return 'AM5';
  if (/\b(B550|X570|A520|B450|A320)/.test(s)) return 'AM4';
  if (/\b(Z890|B860|H810)/.test(s)) return 'LGA1851';
  if (/\b(Z790|B760|H770|H610|Z690|B660|H670)/.test(s)) return 'LGA1700';
  if (/\b(H510|B560|Z590|H410|B460)/.test(s)) return 'LGA1200';
  return null;
};
const ddrOf = (n: string) => (/DDR5/i.test(n) ? 'DDR5' : /DDR4/i.test(n) ? 'DDR4' : null);

const usePartList = (slot: Slot | null) =>
  useQuery({
    queryKey: ['pc-parts', slot?.cat, slot?.sub],
    enabled: !!slot,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data: cat } = await supabase.from('categories').select('id').eq('slug', slot!.cat).maybeSingle();
      if (!cat) return [];
      const { data: sub } = await supabase.from('subcategories').select('id').eq('category_id', cat.id).eq('slug', slot!.sub).maybeSingle();
      if (!sub) return [];
      const { data, error } = await supabase.from('products').select('id,name,price,image_url').eq('subcategory_id', sub.id).eq('in_stock', true).gt('price', 0).order('price');
      if (error) throw error;
      return (data || []) as Part[];
    },
  });

export default function PCBuilder() {
  const [build, setBuild] = useState<Record<string, Part>>(() => {
    try {
      const shared = new URLSearchParams(window.location.search).get('b');
      if (shared) return JSON.parse(decodeURIComponent(atob(shared)));
      return JSON.parse(localStorage.getItem(STORAGE) || '{}');
    } catch { return {}; }
  });
  const [open, setOpen] = useState<Slot | null>(null);
  const [q, setQ] = useState('');
  const { data: parts = [], isLoading } = usePartList(open);
  const { addToCart, setIsCartOpen } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => { localStorage.setItem(STORAGE, JSON.stringify(build)); }, [build]);

  const total = Object.values(build).reduce((s, p) => s + Number(p.price), 0);
  const count = Object.keys(build).length;

  const issues = useMemo(() => {
    const out: string[] = [];
    const cpu = build.cpu && socketOf(build.cpu.name);
    const mb = build.mobo && socketOf(build.mobo.name);
    if (cpu && mb && cpu !== mb) out.push(`CPU (${cpu}) ও Motherboard (${mb}) socket মিলছে না`);
    const mr = build.mobo && ddrOf(build.mobo.name);
    const rr = build.ram && ddrOf(build.ram.name);
    if (mr && rr && mr !== rr) out.push(`Motherboard ${mr} সাপোর্ট করে, কিন্তু RAM ${rr}`);
    return out;
  }, [build]);
  const missing = CORE.filter((s) => s.required && !build[s.key]);

  const filtered = parts.filter((p) => {
    if (!p.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (open?.key === 'mobo' && build.cpu) { const a = socketOf(build.cpu.name), b = socketOf(p.name); if (a && b && a !== b) return false; }
    if (open?.key === 'cpu' && build.mobo) { const a = socketOf(build.mobo.name), b = socketOf(p.name); if (a && b && a !== b) return false; }
    if (open?.key === 'ram' && build.mobo) { const a = ddrOf(build.mobo.name), b = ddrOf(p.name); if (a && b && a !== b) return false; }
    return true;
  });

  const choose = (p: Part) => { setBuild((b) => ({ ...b, [open!.key]: p })); setOpen(null); setQ(''); };
  const remove = (k: string) => setBuild((b) => { const n = { ...b }; delete n[k]; return n; });

  const addAll = () => {
    Object.values(build).forEach((p) =>
      addToCart({ id: p.id, name: p.name, price: Number(p.price), image: p.image_url || '/placeholder.svg', category: 'PC Builder' }, 1)
    );
    toast({ title: 'Build cart-এ যোগ হয়েছে', description: `${count}টি পার্ট` });
    navigate('/checkout');
  };
  const share = async () => {
    const url = `${window.location.origin}/pc-builder?b=${btoa(encodeURIComponent(JSON.stringify(build)))}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    toast({ title: 'লিংক কপি হয়েছে' });
  };

  const Row = ({ s }: { s: Slot }) => {
    const p = build[s.key];
    const Icon = s.icon;
    return (
      <div className="flex items-center gap-3 md:gap-4 px-3 md:px-4 py-3 border-b border-border last:border-0">
        <div className="w-14 h-14 shrink-0 rounded-md bg-secondary flex items-center justify-center overflow-hidden">
          {p ? <img src={optimizeImage(p.image_url || '/placeholder.svg', 120)} alt={p.name} className="w-full h-full object-contain" /> : <Icon className="w-6 h-6 text-primary" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            {s.label}
            {s.required && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">Required</span>}
          </div>
          {p ? (
            <Link to={`/product/${p.id}`} className="text-xs md:text-sm text-muted-foreground line-clamp-1 hover:text-primary">{p.name}</Link>
          ) : (
            <div className="h-2 w-2/3 mt-2 rounded bg-muted" />
          )}
        </div>
        {p && <span className="hidden sm:block font-bold text-primary whitespace-nowrap">{Number(p.price).toLocaleString()}৳</span>}
        {p ? (
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={() => setOpen(s)}>Change</Button>
            <Button size="icon" variant="ghost" onClick={() => remove(s.key)} aria-label="Remove"><Trash2 className="w-4 h-4" /></Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground" onClick={() => setOpen(s)}>Choose</Button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-secondary/40">
      <Header />
      <main className="container mx-auto px-3 md:px-4 py-6">
        <nav className="text-xs text-muted-foreground mb-3"><Link to="/" className="hover:text-primary">Home</Link> / PC Builder</nav>
        <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
          <div className="bg-background rounded-lg border border-border overflow-hidden">
            <div className="p-4 border-b border-border">
              <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">Build Your Own PC</h1>
              <p className="text-sm text-muted-foreground mt-1">পছন্দের পার্ট বেছে নিন — compatible অপশনগুলোই দেখানো হবে।</p>
            </div>
            <div className="px-4 py-2 bg-foreground text-background text-xs font-semibold uppercase tracking-wide">Core Components</div>
            {CORE.map((s) => <Row key={s.key} s={s} />)}
            <div className="px-4 py-2 bg-foreground text-background text-xs font-semibold uppercase tracking-wide">Peripherals & Others</div>
            {PERIPHERALS.map((s) => <Row key={s.key} s={s} />)}
          </div>

          <aside className="lg:sticky lg:top-24 bg-background rounded-lg border border-border p-4 space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Estimated Total</div>
                <div className="text-2xl font-bold text-primary">{total.toLocaleString()}৳</div>
              </div>
              <div className="text-sm text-muted-foreground">{count} items</div>
            </div>
            {issues.length > 0 ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive space-y-1">
                {issues.map((i) => <div key={i} className="flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />{i}</div>)}
              </div>
            ) : count > 0 ? (
              <div className="rounded-md border border-border bg-secondary p-3 text-sm flex gap-2 text-foreground"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />কোনো compatibility সমস্যা পাওয়া যায়নি</div>
            ) : null}
            {missing.length > 0 && <p className="text-xs text-muted-foreground">বাকি: {missing.map((m) => m.label).join(', ')}</p>}
            <Button className="w-full" disabled={!count || issues.length > 0} onClick={addAll}><ShoppingCart className="w-4 h-4 mr-2" />Add Build to Cart</Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" disabled={!count} onClick={share}><Share2 className="w-4 h-4 mr-1" />Share</Button>
              <Button variant="outline" disabled={!count} onClick={() => setBuild({})}><RotateCcw className="w-4 h-4 mr-1" />Reset</Button>
            </div>
            <p className="text-[11px] text-muted-foreground">Build আপনার ব্রাউজারে স্বয়ংক্রিয়ভাবে সেভ থাকে।</p>
          </aside>
        </div>
      </main>

      <Dialog open={!!open} onOpenChange={(o) => { if (!o) { setOpen(null); setQ(''); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader><DialogTitle>Choose {open?.label}</DialogTitle></DialogHeader>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="pl-9" />
            {q && <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setQ('')}><X className="w-4 h-4" /></button>}
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border -mx-2">
            {isLoading && <p className="p-6 text-center text-sm text-muted-foreground">Loading...</p>}
            {!isLoading && filtered.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">কোনো পণ্য পাওয়া যায়নি</p>}
            {filtered.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-2 py-3">
                <img src={optimizeImage(p.image_url || '/placeholder.svg', 120)} alt={p.name} loading="lazy" className="w-14 h-14 object-contain shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-foreground line-clamp-2">{p.name}</div>
                  <div className="text-sm font-bold text-primary">{Number(p.price).toLocaleString()}৳</div>
                </div>
                <Button size="sm" onClick={() => choose(p)}>Add</Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <CartSidebar />
      <Footer />
    </div>
  );
}
