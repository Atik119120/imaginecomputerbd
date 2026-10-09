import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, RefreshCw, ShoppingBasket, Save, Printer, Camera, CheckCircle2, AlertTriangle, Plus, Share2, RotateCcw } from 'lucide-react';
import { toPng } from 'html-to-image';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import logoColor from '@/assets/imagine-logo-color.png';
import { flushSync } from 'react-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartSidebar } from '@/components/CartSidebar';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { optimizeImage } from '@/lib/optimizeImage';
import { CORE, PERIPHERALS, ALL, Slot, Build, loadBuild, saveBuild, socketOf, ddrOf, slotByKey } from '@/lib/pcBuilder';

export default function PCBuilder() {
  const [build, setBuild] = useState<Build>(loadBuild);
  const [hideEmpty, setHideEmpty] = useState(false);
  const { addToCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const sheet = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [capturing, setCapturing] = useState(false);
  const [saved, setSaved] = useState<any[]>([]);
  const loadSaved = async () => {
    if (!user) return setSaved([]);
    const { data } = await supabase.from('pc_builds').select('*').order('created_at', { ascending: false });
    setSaved(data || []);
  };
  useEffect(() => { loadSaved(); }, [user]);

  useEffect(() => saveBuild(build), [build]);

  const parts = Object.values(build).flat();
  const total = parts.reduce((s, p) => s + Number(p.price), 0);
  const count = parts.length;

  const issues = useMemo(() => {
    const out: string[] = [];
    const cpu = build.cpu?.[0], mb = build.mobo?.[0];
    const a = cpu && socketOf(cpu.name), b = mb && socketOf(mb.name);
    if (a && b && a !== b) out.push(`CPU (${a}) ও Motherboard (${b}) socket মিলছে না`);
    const mr = mb && ddrOf(mb.name);
    build.ram?.forEach((r) => { const rr = ddrOf(r.name); if (mr && rr && mr !== rr) out.push(`Motherboard ${mr} সাপোর্ট করে, কিন্তু RAM ${rr}`); });
    return out;
  }, [build]);
  const missing = CORE.filter((s) => s.required && !build[s.key]?.length);

  const choose = (s: Slot) => {
    if (s.needs && !build[s.needs]?.length) {
      toast({ title: 'Warning!', description: `আগে ${slotByKey(s.needs)?.label} সিলেক্ট করুন`, variant: 'destructive' });
      return;
    }
    navigate(`/pc-builder/choose/${s.key}`);
  };
  const removeAt = (k: string, i: number) => setBuild((b) => {
    const n = { ...b, [k]: b[k].filter((_, j) => j !== i) };
    if (!n[k].length) delete n[k];
    // dependents become invalid when their parent is removed
    if (!n[k]) ALL.filter((s) => s.needs === k).forEach((s) => delete n[s.key]);
    return n;
  });

  const addAll = () => {
    if (!count) return;
    parts.forEach((p) => addToCart({ id: p.id, name: p.name, price: Number(p.price), image: p.image_url || '/placeholder.svg', category: 'PC Builder' }, 1));
    toast({ title: 'Build cart-এ যোগ হয়েছে', description: `${count}টি পার্ট` });
    navigate('/checkout');
  };
  const savePc = async () => {
    if (!count) return;
    if (!user) {
      toast({ title: 'আগে লগইন করুন', description: 'PC Build আপনার অ্যাকাউন্টে সেভ হবে' });
      navigate('/auth');
      return;
    }
    const name = window.prompt('PC Build-এর নাম দিন', 'PC Build')?.trim();
    if (name === undefined) return;
    const { error } = await supabase.from('pc_builds').insert({ user_id: user.id, name: name || 'PC Build', total, build: build as any });
    if (error) return toast({ title: 'সেভ হয়নি', description: error.message, variant: 'destructive' });
    toast({ title: 'PC Build সেভ হয়েছে', description: 'আপনার অ্যাকাউন্টে রাখা হয়েছে' });
    loadSaved();
  };
  const removeSaved = async (id: string) => {
    await supabase.from('pc_builds').delete().eq('id', id);
    loadSaved();
  };
  const toDataUrl = async (src: string) => {
    const get = async (u: string) => { const r = await fetch(u, { mode: 'cors' }); if (!r.ok) throw 0; return r.blob(); };
    try {
      const b = await get(src).catch(() => get(`https://images.weserv.nl/?url=${encodeURIComponent(src.replace(/^https?:\/\//, ''))}&w=200&output=png`));
      return await new Promise<string>((res) => { const f = new FileReader(); f.onload = () => res(f.result as string); f.readAsDataURL(b); });
    } catch { return src; }
  };
  const screenshot = async () => {
    if (!sheet.current) return;
    flushSync(() => setCapturing(true));
    try {
      const imgs = Array.from(sheet.current.querySelectorAll('img'));
      const orig = imgs.map((im) => im.src);
      await Promise.all(imgs.map(async (im) => { if (!im.src.startsWith('data:')) im.src = await toDataUrl(im.src); }));
      const url = await toPng(sheet.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
      imgs.forEach((im, k) => (im.src = orig[k]));
      const fileName = `pc-build-${Date.now()}.png`;
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], fileName, { type: 'image/png' });
      const nav: any = navigator;
      if (nav.canShare?.({ files: [file] }) && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
        await nav.share({ files: [file], title: 'PC Build' }).catch(() => {});
      } else {
        const a = document.createElement('a'); a.href = url; a.download = fileName; a.click();
      }
      toast({ title: 'Screenshot সেভ হয়েছে' });
    } catch { toast({ title: 'Screenshot নেওয়া যায়নি', variant: 'destructive' }); }
    finally { setCapturing(false); }
  };
  const share = async () => {
    const url = `${window.location.origin}/pc-builder?b=${btoa(encodeURIComponent(JSON.stringify(build)))}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    toast({ title: 'লিংক কপি হয়েছে' });
  };

  const Row = ({ s }: { s: Slot }) => {
    const list = build[s.key] || [];
    const Icon = s.icon;
    const locked = !!s.needs && !build[s.needs]?.length;
    if ((hideEmpty || capturing) && !list.length) return null;
    const Head = (
      <div className="flex items-center gap-2 text-sm font-semibold text-primary">
        {s.label}
        {s.required && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted-foreground text-background font-medium">Required</span>}
      </div>
    );
    if (!list.length)
      return (
        <div className="flex items-center gap-3 md:gap-4 px-3 md:px-4 py-3 border-b border-border print:hidden">
          <div className="w-14 h-14 shrink-0 rounded-md bg-secondary flex items-center justify-center"><Icon className="w-6 h-6 text-primary" /></div>
          <div className="flex-1 min-w-0">{Head}<div className="h-2 w-2/3 mt-2 rounded bg-muted" />
            {locked && <p className="text-[11px] text-muted-foreground mt-1">আগে {slotByKey(s.needs)?.label} সিলেক্ট করুন</p>}</div>
          <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground print:hidden" onClick={() => choose(s)}>
            Choose
          </Button>
        </div>
      );
    return (
      <div className="px-3 md:px-4 py-3 border-b border-border space-y-3">
        {list.map((p, i) => (
          <div key={p.id + i} className="flex items-center gap-3 md:gap-4">
            <div className="w-14 h-14 shrink-0 rounded-md bg-background flex items-center justify-center overflow-hidden">
              <img src={optimizeImage(p.image_url || '/placeholder.svg', 120)} alt={p.name} className="w-full h-full object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              {i === 0 && Head}
              <Link to={`/product/${p.id}`} className="text-sm text-foreground line-clamp-1 hover:text-primary">{p.name}</Link>
            </div>
            <span className="font-bold text-foreground whitespace-nowrap">{Number(p.price).toLocaleString()}৳</span>
            <div className={`flex gap-1 border-l border-border pl-2 print:hidden ${capturing ? "hidden" : ""}`}>
              <Button size="icon" variant="ghost" onClick={() => removeAt(s.key, i)} aria-label="Remove"><Trash2 className="w-4 h-4" /></Button>
              {i === 0 && <Button size="icon" variant="ghost" onClick={() => choose(s)} aria-label="Change"><RefreshCw className="w-4 h-4" /></Button>}
            </div>
          </div>
        ))}
        {s.multi && (
          <Button size="sm" className="h-7 text-xs print:hidden" onClick={() => choose(s)}><Plus className="w-3 h-3 mr-1" />Add Another {s.label}</Button>
        )}
      </div>
    );
  };

  const Action = ({ icon: I, label, onClick }: any) => (
    <button onClick={onClick} disabled={!count} className="flex flex-col items-center gap-1 px-3 md:px-5 text-xs text-foreground hover:text-primary disabled:opacity-40 border-l border-border first:border-0">
      <I className="w-5 h-5 text-primary" />{label}
    </button>
  );

  return (
    <div className="min-h-screen bg-secondary/40">
      <div className="print:hidden"><Header /></div>
      <main className="container mx-auto px-3 md:px-4 py-6 max-w-5xl">
        <nav className="text-xs text-muted-foreground mb-3 print:hidden"><Link to="/" className="hover:text-primary">Home</Link> / PC Builder</nav>
        <div ref={sheet} id="pc-print" className="bg-background rounded-lg border border-border overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border bg-secondary/50">
            <img src={logoColor} alt="Imagine Computer" className="h-12 w-auto object-contain print:h-10" />
            <div className={`flex print:hidden ${capturing ? 'hidden' : ''}`}>
              <Action icon={ShoppingBasket} label="Add to Cart" onClick={addAll} />
              <Action icon={Save} label="Save PC" onClick={savePc} />
              <Action icon={Printer} label="Print" onClick={() => window.print()} />
              <Action icon={Camera} label="Screenshot" onClick={screenshot} />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-border">
            <div>
              <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">PC Builder - Build Your Own Computer</h1>
              <label className={`flex items-center gap-2 text-sm text-muted-foreground mt-2 print:hidden ${capturing ? 'hidden' : ''}`}>
                <input type="checkbox" checked={hideEmpty} onChange={(e) => setHideEmpty(e.target.checked)} /> Hide Unconfigured Components
              </label>
              <p className="hidden print:block text-xs mt-1">Date: {new Date().toLocaleDateString()}</p>
            </div>
            <div className="rounded-lg bg-primary text-primary-foreground px-8 py-3 text-center min-w-[160px]">
              <div className="text-2xl font-bold">{total.toLocaleString()}৳</div>
              <div className="text-xs">{count} Items</div>
            </div>
          </div>
          {(issues.length > 0 || missing.length > 0) && (
            <div className={`px-4 py-3 space-y-1 text-sm border-b border-border print:hidden ${capturing ? "hidden" : ""}`}>
              {issues.map((i) => <div key={i} className="flex gap-2 text-destructive"><AlertTriangle className="w-4 h-4 mt-0.5" />{i}</div>)}
              {missing.length > 0 && <div className="text-muted-foreground text-xs">বাকি: {missing.map((m) => m.label).join(', ')}</div>}
            </div>
          )}
          {count > 0 && !issues.length && !missing.length && (
            <div className="px-4 py-3 text-sm flex gap-2 border-b border-border print:hidden"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />কোনো compatibility সমস্যা নেই</div>
          )}
          <div className="px-4 py-2 bg-muted-foreground text-background text-xs font-semibold uppercase tracking-wide">Core Components</div>
          {CORE.map((s) => <Row key={s.key} s={s} />)}
          {(!(capturing) || PERIPHERALS.some((p) => build[p.key]?.length)) && <div className={`px-4 py-2 bg-muted-foreground text-background text-xs font-semibold uppercase tracking-wide ${PERIPHERALS.some((p) => build[p.key]?.length) ? '' : 'print:hidden'}`}>Peripherals & Others</div>}
          {PERIPHERALS.map((s) => <Row key={s.key} s={s} />)}
          <div className="flex justify-between p-4 font-bold"><span>Total</span><span className="text-primary">{total.toLocaleString()}৳</span></div>
        </div>
        <div className="flex gap-2 mt-4 print:hidden">
          <Button variant="outline" disabled={!count} onClick={share}><Share2 className="w-4 h-4 mr-1" />Share</Button>
          <Button variant="outline" disabled={!count} onClick={() => setBuild({})}><RotateCcw className="w-4 h-4 mr-1" />Reset</Button>
        </div>
        {user && saved.length > 0 && (
          <div className="mt-6 bg-background rounded-lg border border-border print:hidden">
            <div className="px-4 py-3 border-b border-border font-heading font-bold">আমার সেভ করা PC Build</div>
            {saved.map((sv) => (
              <div key={sv.id} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{sv.name}</div>
                  <div className="text-xs text-muted-foreground">{new Date(sv.created_at).toLocaleDateString()} · {Object.values(sv.build || {}).flat().length} Items</div>
                </div>
                <span className="font-bold text-primary whitespace-nowrap">{Number(sv.total).toLocaleString()}৳</span>
                <Button size="sm" variant="outline" onClick={() => { setBuild(sv.build); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Load</Button>
                <Button size="icon" variant="ghost" onClick={() => removeSaved(sv.id)} aria-label="Delete"><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
          </div>
        )}
      </main>
      <CartSidebar />
      <div className="print:hidden"><Footer /></div>
    </div>
  );
}
