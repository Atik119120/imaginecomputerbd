import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Search, Home } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { optimizeImage } from '@/lib/optimizeImage';
import { normalizeSpecifications } from '@/lib/specifications';
import { slotByKey, loadBuild, saveBuild, compatible } from '@/lib/pcBuilder';

type Row = { id: string; name: string; price: number; original_price: number | null; image_url: string | null; brand: string | null; specifications: any };

export default function PCBuilderChoose() {
  const { slot: key } = useParams();
  const slot = slotByKey(key);
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('low');
  const [brands, setBrands] = useState<string[]>([]);
  const [range, setRange] = useState<[number, number] | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ['pc-choose', slot?.cat, slot?.sub],
    enabled: !!slot,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data: cat } = await supabase.from('categories').select('id').eq('slug', slot!.cat).maybeSingle();
      if (!cat) return [];
      const { data: sub } = await supabase.from('subcategories').select('id').eq('category_id', cat.id).eq('slug', slot!.sub).maybeSingle();
      if (!sub) return [];
      const { data, error } = await supabase.from('products').select('id,name,price,original_price,image_url,brand,specifications').eq('subcategory_id', sub.id).eq('in_stock', true).gt('price', 0);
      if (error) throw error;
      return (data || []) as Row[];
    },
  });

  const build = loadBuild();
  const compat = data.filter((p) => compatible(slot!.key, p.name, build));
  const max = Math.max(0, ...compat.map((p) => Number(p.price)));
  const [lo, hi] = range ?? [0, max];
  const brandList = useMemo(() => [...new Set(compat.map((p) => p.brand).filter(Boolean))].sort() as string[], [data]);

  const list = compat
    .filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
    .filter((p) => Number(p.price) >= lo && Number(p.price) <= hi)
    .filter((p) => !brands.length || brands.includes(p.brand || ''))
    .sort((a, b) => (sort === 'low' ? a.price - b.price : b.price - a.price));

  if (!slot) return <div className="p-10 text-center">Not found</div>;

  const add = (p: Row) => {
    const b = loadBuild();
    const part = { id: p.id, name: p.name, price: Number(p.price), image_url: p.image_url };
    b[slot.key] = slot.multi ? [...(b[slot.key] || []), part] : [part];
    saveBuild(b);
    navigate('/pc-builder');
  };

  return (
    <div className="min-h-screen bg-secondary/40">
      <Header />
      <div className="bg-background border-b border-border">
        <nav className="container mx-auto px-4 py-3 text-xs text-muted-foreground flex items-center gap-2">
          <Link to="/"><Home className="w-3.5 h-3.5" /></Link> / <Link to="/pc-builder" className="hover:text-primary">PC Builder</Link> / Choose A {slot.label}
        </nav>
      </div>
      <main className="container mx-auto px-3 md:px-4 py-6 grid md:grid-cols-[260px_1fr] gap-4 items-start">
        <aside className="space-y-4">
          <div className="bg-background rounded-lg border border-border">
            <div className="p-4 border-b border-border font-semibold">Price Range</div>
            <div className="p-4 space-y-4">
              <Slider min={0} max={max || 1} step={100} value={[lo, hi]} onValueChange={(v) => setRange([v[0], v[1]])} />
              <div className="flex justify-between gap-2">
                <Input type="number" value={lo} onChange={(e) => setRange([Number(e.target.value), hi])} className="h-8 text-center" />
                <Input type="number" value={hi} onChange={(e) => setRange([lo, Number(e.target.value)])} className="h-8 text-center" />
              </div>
            </div>
          </div>
          {brandList.length > 0 && (
            <div className="bg-background rounded-lg border border-border">
              <div className="p-4 border-b border-border font-semibold">Brand</div>
              <div className="p-4 space-y-2 max-h-72 overflow-y-auto">
                {brandList.map((b) => (
                  <label key={b} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={brands.includes(b)} onChange={(e) => setBrands((s) => (e.target.checked ? [...s, b] : s.filter((x) => x !== b)))} />{b}
                  </label>
                ))}
              </div>
            </div>
          )}
        </aside>

        <section className="space-y-3">
          <div className="bg-background rounded-lg border border-border p-3 flex flex-wrap items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/pc-builder')} aria-label="Back"><ArrowLeft className="w-5 h-5" /></Button>
            <div className="relative flex-1 min-w-[180px] max-w-sm">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="pr-9" />
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
            <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
              Sort
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="border border-border rounded-md bg-background px-2 py-1.5 text-foreground">
                <option value="low">Price (Low &gt; High)</option>
                <option value="high">Price (High &gt; Low)</option>
              </select>
            </div>
          </div>

          {isLoading && <p className="p-8 text-center text-sm text-muted-foreground">Loading...</p>}
          {!isLoading && !list.length && <p className="p-8 text-center text-sm text-muted-foreground bg-background rounded-lg">কোনো পণ্য পাওয়া যায়নি</p>}
          {list.map((p) => {
            const save = p.original_price && p.original_price > p.price ? p.original_price - p.price : 0;
            const feats = normalizeSpecifications(p.specifications).flatMap((g) => g.items).slice(0, 4);
            return (
              <div key={p.id} className="relative bg-background rounded-lg border border-border p-4 flex flex-col sm:flex-row gap-4 sm:items-center">
                {save > 0 && <span className="absolute top-3 left-0 bg-primary text-primary-foreground text-xs font-semibold px-2.5 py-0.5 rounded-r-full">Save: {save.toLocaleString()}৳</span>}
                <Link to={`/product/${p.id}`} className="shrink-0 w-full sm:w-44 h-36 flex items-center justify-center">
                  <img src={optimizeImage(p.image_url || '/placeholder.svg', 300)} alt={p.name} loading="lazy" className="max-h-full max-w-full object-contain" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${p.id}`} className="font-semibold text-sm text-foreground hover:text-primary">{p.name}</Link>
                  {feats.length > 0 && (
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground list-disc pl-4">
                      {feats.map((f) => <li key={f.label}>{f.label}: {f.value}</li>)}
                    </ul>
                  )}
                </div>
                <div className="sm:w-36 text-center space-y-2">
                  <div className="text-xl font-bold text-primary">{Number(p.price).toLocaleString()}৳</div>
                  {save > 0 && <div className="text-sm line-through text-muted-foreground">{Number(p.original_price).toLocaleString()}৳</div>}
                  <Button className="w-full" onClick={() => add(p)}>Add</Button>
                </div>
              </div>
            );
          })}
        </section>
      </main>
      <Footer />
    </div>
  );
}
