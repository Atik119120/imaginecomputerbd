import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Loader2, Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { uploadImage } from '@/lib/uploadImage';
import { slugify, Brand } from '@/hooks/useTaxonomy';

interface FormState {
  id?: string;
  name: string;
  slug: string;
  description: string;
  logo_url: string;
  is_active: boolean;
  display_order: number;
}

const emptyForm: FormState = {
  name: '',
  slug: '',
  description: '',
  logo_url: '',
  is_active: true,
  display_order: 0,
};

export const AdminBrands = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const { toast } = useToast();

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const [brandsRes, productsRes] = await Promise.all([
      supabase.from('brands').select('*').order('display_order').order('name'),
      supabase.from('products').select('brand_id'),
    ]);
    if (brandsRes.error) {
      toast({ title: 'Error', description: 'Failed to load brands', variant: 'destructive' });
    } else {
      setBrands((brandsRes.data || []) as Brand[]);
    }
    const map: Record<string, number> = {};
    (productsRes.data || []).forEach((p: any) => {
      if (p.brand_id) map[p.brand_id] = (map[p.brand_id] || 0) + 1;
    });
    setCounts(map);
    setLoading(false);
  };

  const openNew = () => {
    setForm({ ...emptyForm, display_order: brands.length });
    setOpen(true);
  };

  const openEdit = (b: Brand) => {
    setForm({
      id: b.id,
      name: b.name,
      slug: b.slug,
      description: b.description || '',
      logo_url: b.logo_url || '',
      is_active: b.is_active,
      display_order: b.display_order,
    });
    setOpen(true);
  };

  const handleLogo = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadImage(file, 'brands');
      setForm((f) => ({ ...f, logo_url: url }));
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Name required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug: (form.slug.trim() || slugify(form.name)),
      description: form.description.trim() || null,
      logo_url: form.logo_url || null,
      is_active: form.is_active,
      display_order: Number(form.display_order) || 0,
    };
    const res = form.id
      ? await supabase.from('brands').update(payload).eq('id', form.id)
      : await supabase.from('brands').insert(payload);
    setSaving(false);
    if (res.error) {
      toast({ title: 'Error', description: res.error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Saved', description: `Brand ${form.id ? 'updated' : 'created'}` });
    setOpen(false);
    setForm(emptyForm);
    load();
  };

  const remove = async (b: Brand) => {
    const used = counts[b.id] || 0;
    if (used > 0) {
      if (!confirm(`${used} product(s) use "${b.name}". Hide this brand instead of deleting?`)) return;
      const { error } = await supabase.from('brands').update({ is_active: false }).eq('id', b.id);
      if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
      else toast({ title: 'Hidden', description: `${b.name} is now inactive` });
      load();
      return;
    }
    if (!confirm(`Delete brand "${b.name}"?`)) return;
    const { error } = await supabase.from('brands').delete().eq('id', b.id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else toast({ title: 'Deleted', description: `${b.name} removed` });
    load();
  };

  const toggleActive = async (b: Brand) => {
    const { error } = await supabase.from('brands').update({ is_active: !b.is_active }).eq('id', b.id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    load();
  };

  const filtered = brands.filter((b) => !search || b.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search brands..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus size={16} /> Add Brand
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">No brands yet</div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((b) => (
              <div key={b.id} className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                  {b.logo_url ? (
                    <img src={b.logo_url} alt={b.name} className="w-full h-full object-contain" />
                  ) : (
                    <span className="font-bold text-muted-foreground">{b.name.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium truncate">{b.name}</p>
                    {!b.is_active && <Badge variant="secondary" className="text-[10px]">HIDDEN</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">/{b.slug} · {counts[b.id] || 0} products</p>
                </div>
                <Switch checked={b.is_active} onCheckedChange={() => toggleActive(b)} aria-label={`Toggle ${b.name}`} />
                <Button size="icon" variant="ghost" onClick={() => openEdit(b)} aria-label="Edit brand">
                  <Pencil size={16} />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove(b)} aria-label="Delete brand">
                  <Trash2 size={16} className="text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Edit Brand' : 'Add Brand'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="brand-name">Name</Label>
              <Input
                id="brand-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: f.id ? f.slug : slugify(e.target.value) }))}
                placeholder="e.g. Xiaomi"
              />
            </div>
            <div>
              <Label htmlFor="brand-slug">Slug</Label>
              <Input id="brand-slug" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))} />
            </div>
            <div>
              <Label htmlFor="brand-desc">Description</Label>
              <Textarea id="brand-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div>
              <Label>Logo</Label>
              <div className="flex items-center gap-3 mt-1">
                {form.logo_url ? (
                  <div className="relative w-16 h-16 rounded-lg border border-border overflow-hidden">
                    <img src={form.logo_url} alt="Brand logo preview" className="w-full h-full object-contain" />
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, logo_url: '' }))}
                      className="absolute top-0 right-0 bg-destructive text-destructive-foreground p-0.5 rounded-bl"
                      aria-label="Remove logo"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : null}
                <label className="inline-flex items-center gap-2 px-3 py-2 border border-border rounded-lg cursor-pointer text-sm">
                  {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                  <span>Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleLogo(e.target.files[0])}
                  />
                </label>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <Label htmlFor="brand-order">Display order</Label>
                <Input
                  id="brand-order"
                  type="number"
                  value={form.display_order}
                  onChange={(e) => setForm((f) => ({ ...f, display_order: Number(e.target.value) }))}
                />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <Switch id="brand-active" checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
                <Label htmlFor="brand-active">Active</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving}>
                {saving && <Loader2 size={15} className="animate-spin mr-2" />}Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
