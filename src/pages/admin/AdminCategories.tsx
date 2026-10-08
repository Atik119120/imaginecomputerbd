import { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, FolderTree, Upload, ArrowLeft, ArrowUp, ArrowDown, Eye, EyeOff, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { uploadImage } from '@/lib/uploadImage';
import { slugify } from '@/hooks/useTaxonomy';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CATEGORY_ICON_OPTIONS, getCategoryIcon } from '@/lib/categoryIcons';

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  icon_key: string | null;
  description: string | null;
  is_active: boolean;
  display_order: number;
}

interface Sub {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  image_url: string | null;
  description: string | null;
  is_active: boolean;
  display_order: number;
}

type FormState = {
  name: string;
  slug: string;
  description: string;
  image_url: string;
  icon_key: string;
  is_active: boolean;
};

const emptyForm: FormState = { name: '', slug: '', description: '', image_url: '', icon_key: '', is_active: true };

export const AdminCategories = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [subProductCounts, setSubProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [managing, setManaging] = useState<Category | null>(null);

  const [catModal, setCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [subModal, setSubModal] = useState(false);
  const [editingSub, setEditingSub] = useState<Sub | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [subParent, setSubParent] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'category' | 'subcategory'; row: Category | Sub; count: number } | null>(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [c, s, p] = await Promise.all([
        supabase.from('categories').select('*').order('display_order').order('name'),
        supabase.from('subcategories').select('*').order('display_order').order('name'),
        supabase.from('products').select('category_id, subcategory_id'),
      ]);
      if (c.error) throw c.error;
      if (s.error) throw s.error;
      setCategories((c.data || []) as Category[]);
      setSubs((s.data || []) as Sub[]);
      const cc: Record<string, number> = {};
      const sc: Record<string, number> = {};
      (p.data || []).forEach((row: any) => {
        if (row.category_id) cc[row.category_id] = (cc[row.category_id] || 0) + 1;
        if (row.subcategory_id) sc[row.subcategory_id] = (sc[row.subcategory_id] || 0) + 1;
      });
      setProductCounts(cc);
      setSubProductCounts(sc);
      // keep the live website in sync immediately
      qc.invalidateQueries({ queryKey: ['nav-categories'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['products'] });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to load categories', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const currentManaging = managing ? categories.find((c) => c.id === managing.id) || managing : null;
  const managingSubs = useMemo(
    () => (currentManaging ? subs.filter((s) => s.category_id === currentManaging.id) : []),
    [subs, currentManaging]
  );

  const filteredCats = categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  /* ---------- forms ---------- */
  const openCatModal = (cat?: Category) => {
    setEditingCat(cat || null);
    setForm(cat
      ? { name: cat.name, slug: cat.slug, description: cat.description || '', image_url: cat.image_url || '', icon_key: cat.icon_key || '', is_active: cat.is_active }
      : emptyForm);
    setCatModal(true);
  };

  const openSubModal = (sub?: Sub, parentId?: string) => {
    setEditingSub(sub || null);
    setSubParent(sub?.category_id || parentId || currentManaging?.id || categories[0]?.id || '');
    setForm(sub
      ? { name: sub.name, slug: sub.slug, description: sub.description || '', image_url: sub.image_url || '', icon_key: '', is_active: sub.is_active }
      : emptyForm);
    setSubModal(true);
  };

  const handleName = (name: string, isEditing: boolean) =>
    setForm((f) => ({ ...f, name, slug: isEditing ? f.slug : slugify(name) }));

  const handleUpload = async (file: File, folder: string) => {
    setUploading(true);
    try {
      const url = await uploadImage(file, folder);
      setForm((f) => ({ ...f, image_url: url }));
      toast({ title: 'Uploaded', description: 'Image uploaded successfully' });
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug: (form.slug || slugify(form.name)).trim(),
      description: form.description.trim() || null,
      image_url: form.image_url || null,
      icon_key: form.icon_key || null,
      is_active: form.is_active,
    };
    try {
      if (editingCat) {
        const { error } = await supabase.from('categories').update(payload).eq('id', editingCat.id);
        if (error) throw error;
      } else {
        const nextOrder = categories.length ? Math.max(...categories.map((c) => c.display_order)) + 1 : 0;
        const { error } = await supabase.from('categories').insert([{ ...payload, display_order: nextOrder }]);
        if (error) throw error;
      }
      toast({ title: 'Saved', description: `Category ${editingCat ? 'updated' : 'created'}` });
      setCatModal(false);
      await loadAll();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to save category', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const saveSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subParent) {
      toast({ title: 'Select a main category', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload = {
      category_id: subParent,
      name: form.name.trim(),
      slug: (form.slug || slugify(form.name)).trim(),
      description: form.description.trim() || null,
      image_url: form.image_url || null,
      is_active: form.is_active,
    };
    try {
      if (editingSub) {
        const { error } = await supabase.from('subcategories').update(payload).eq('id', editingSub.id);
        if (error) throw error;
      } else {
        const siblings = subs.filter((s) => s.category_id === subParent);
        const nextOrder = siblings.length ? Math.max(...siblings.map((s) => s.display_order)) + 1 : 0;
        const { error } = await supabase.from('subcategories').insert([{ ...payload, display_order: nextOrder }]);
        if (error) throw error;
      }
      toast({ title: 'Saved', description: `Subcategory ${editingSub ? 'updated' : 'created'}` });
      setSubModal(false);
      await loadAll();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to save subcategory', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (table: 'categories' | 'subcategories', row: Category | Sub) => {
    const { error } = await supabase.from(table).update({ is_active: !row.is_active }).eq('id', row.id);
    if (error) return toast({ title: 'Error', description: error.message, variant: 'destructive' });
    await loadAll();
  };

  const move = async (table: 'categories' | 'subcategories', list: (Category | Sub)[], index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    const a = list[index];
    const b = list[target];
    await Promise.all([
      supabase.from(table).update({ display_order: target }).eq('id', a.id),
      supabase.from(table).update({ display_order: index }).eq('id', b.id),
    ]);
    await loadAll();
  };

  const askDelete = (type: 'category' | 'subcategory', row: Category | Sub) => {
    const count = type === 'category' ? productCounts[row.id] || 0 : subProductCounts[row.id] || 0;
    setDeleteTarget({ type, row, count });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const table = deleteTarget.type === 'category' ? 'categories' : 'subcategories';
    const { error } = await supabase.from(table).delete().eq('id', deleteTarget.row.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: `${deleteTarget.type === 'category' ? 'Category' : 'Subcategory'} deleted` });
      if (deleteTarget.type === 'category' && managing?.id === deleteTarget.row.id) setManaging(null);
      await loadAll();
    }
    setDeleteTarget(null);
  };

  const disableInstead = async () => {
    if (!deleteTarget) return;
    const table = deleteTarget.type === 'category' ? 'categories' : 'subcategories';
    await supabase.from(table).update({ is_active: false }).eq('id', deleteTarget.row.id);
    setDeleteTarget(null);
    toast({ title: 'Disabled', description: 'Hidden from the website, products untouched' });
    await loadAll();
  };

  /* ---------- shared form fields ---------- */
  const renderFormFields = ({ isEditing, folder, showIcon = false }: { isEditing: boolean; folder: string; showIcon?: boolean }) => (
    <>
      <div>
        <Label>Name *</Label>
        <Input value={form.name} onChange={(e) => handleName(e.target.value, isEditing)} required />
      </div>
      <div>
        <Label>Slug *</Label>
        <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} required />
        <p className="text-xs text-muted-foreground mt-1">Used in the URL</p>
      </div>
      <div>
        <Label>Description</Label>
        <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div>
        <Label>Image</Label>
        <div className="flex items-center gap-3 mt-1">
          {form.image_url && <img src={form.image_url} alt="" className="w-14 h-14 rounded-lg object-cover border border-border" />}
          <label className="inline-flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm cursor-pointer hover:bg-secondary">
            <Upload size={15} />
            {uploading ? 'Uploading…' : 'Upload'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, folder); }}
            />
          </label>
          {form.image_url && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, image_url: '' })}>Remove</Button>
          )}
        </div>
      </div>
      {showIcon && (
        <div>
          <Label>Menu Icon</Label>
          <p className="text-xs text-muted-foreground mb-2">Shown in the header menu next to the category name</p>
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-48 overflow-y-auto p-2 border border-border rounded-lg">
            {CATEGORY_ICON_OPTIONS.map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                title={label}
                aria-label={label}
                onClick={() => setForm((f) => ({ ...f, icon_key: f.icon_key === key ? '' : key }))}
                className={`aspect-square flex items-center justify-center rounded-lg border transition-colors ${
                  form.icon_key === key
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-secondary text-muted-foreground'
                }`}
              >
                <Icon size={18} />
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center justify-between border border-border rounded-lg px-3 py-2">
        <div>
          <Label className="cursor-pointer">Active</Label>
          <p className="text-xs text-muted-foreground">Inactive items are hidden from the website</p>
        </div>
        <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} aria-label="Active" />
      </div>
    </>
  );

  /* ---------- subcategory manage view ---------- */
  if (currentManaging) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => setManaging(null)} aria-label="Back">
              <ArrowLeft size={18} />
            </Button>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold truncate">{currentManaging.name}</h2>
              <p className="text-xs text-muted-foreground">Subcategories · {managingSubs.length}</p>
            </div>
          </div>
          <Button onClick={() => openSubModal(undefined, currentManaging.id)}>
            <Plus size={18} className="mr-2" /> Add Subcategory
          </Button>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {managingSubs.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              No subcategories yet. Add one to show it in the header menu.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {managingSubs.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3 p-3 sm:p-4 hover:bg-secondary/40">
                  <div className="flex flex-col">
                    <button onClick={() => move('subcategories', managingSubs, i, -1)} disabled={i === 0} className="disabled:opacity-25" aria-label="Move up"><ArrowUp size={14} /></button>
                    <button onClick={() => move('subcategories', managingSubs, i, 1)} disabled={i === managingSubs.length - 1} className="disabled:opacity-25" aria-label="Move down"><ArrowDown size={14} /></button>
                  </div>
                  {s.image_url
                    ? <img src={s.image_url} alt="" className="w-10 h-10 rounded-lg object-cover border border-border" />
                    : <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground"><FolderTree size={16} /></div>}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground truncate">/{currentManaging.slug}/{s.slug} · {subProductCounts[s.id] || 0} products</p>
                  </div>
                  <Badge variant={s.is_active ? 'secondary' : 'outline'} className="hidden sm:inline-flex">
                    {s.is_active ? 'Active' : 'Hidden'}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => toggleActive('subcategories', s)} aria-label="Toggle visibility">
                    {s.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openSubModal(s)} aria-label="Edit"><Edit size={16} /></Button>
                  <Button variant="ghost" size="icon" onClick={() => askDelete('subcategory', s)} aria-label="Delete"><Trash2 size={16} className="text-destructive" /></Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {renderSubModal()}
        {renderDeleteDialog()}
      </div>
    );
  }

  function renderSubModal() {
    return (
      <Dialog open={subModal} onOpenChange={setSubModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSub ? 'Edit Subcategory' : 'Add Subcategory'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveSub} className="space-y-4">
            <div>
              <Label>Main Category *</Label>
              <select
                value={subParent}
                onChange={(e) => setSubParent(e.target.value)}
                className="w-full mt-1 h-10 px-3 rounded-md border border-input bg-background text-sm"
                required
              >
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {renderFormFields({ isEditing: !!editingSub, folder: 'subcategories' })}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSubModal(false)}>Cancel</Button>
              <Button type="submit" disabled={saving || uploading}>{saving ? 'Saving…' : 'Save'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  function renderDeleteDialog() {
    return (
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {deleteTarget?.type === 'category' ? 'category' : 'subcategory'}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {deleteTarget && deleteTarget.count > 0
              ? `This ${deleteTarget.type} contains ${deleteTarget.count} product${deleteTarget.count > 1 ? 's' : ''}. Deleting it will leave those products without a ${deleteTarget.type}. You can hide it instead.`
              : 'This action cannot be undone.'}
          </p>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            {deleteTarget && deleteTarget.count > 0 && (
              <Button variant="secondary" onClick={disableInstead}>Hide instead</Button>
            )}
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  /* ---------- categories list ---------- */
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 justify-between sm:items-center">
        <h2 className="text-2xl font-bold">Categories</h2>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Button onClick={() => openCatModal()}><Plus size={18} className="mr-2" /> Add Category</Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary" /></div>
        ) : filteredCats.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">No categories yet. Add your first category.</div>
        ) : (
          <div className="divide-y divide-border">
            <div className="hidden md:grid grid-cols-[auto_1fr_110px_110px_100px_auto] gap-3 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-secondary/50">
              <span className="w-6" />
              <span>Category</span>
              <span className="text-center">Subcategories</span>
              <span className="text-center">Products</span>
              <span className="text-center">Status</span>
              <span className="text-right pr-1">Actions</span>
            </div>
            {filteredCats.map((c, i) => {
              const subCount = subs.filter((s) => s.category_id === c.id).length;
              return (
                <div key={c.id} className="md:grid md:grid-cols-[auto_1fr_110px_110px_100px_auto] gap-3 items-center px-4 py-3 hover:bg-secondary/40 flex flex-wrap">
                  <div className="flex flex-col">
                    <button onClick={() => move('categories', filteredCats, i, -1)} disabled={i === 0} className="disabled:opacity-25" aria-label="Move up"><ArrowUp size={14} /></button>
                    <button onClick={() => move('categories', filteredCats, i, 1)} disabled={i === filteredCats.length - 1} className="disabled:opacity-25" aria-label="Move down"><ArrowDown size={14} /></button>
                  </div>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {c.image_url
                      ? <img src={c.image_url} alt="" className="w-10 h-10 rounded-lg object-cover border border-border" />
                      : (() => { const Icon = getCategoryIcon(c.icon_key, c.slug); return <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground"><Icon size={18} /></div>; })()}
                    <div className="min-w-0">
                      <p className="font-medium truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground truncate">/{c.slug}</p>
                    </div>
                  </div>
                  <span className="text-sm text-center">{subCount}</span>
                  <span className="text-sm text-center">{productCounts[c.id] || 0}</span>
                  <div className="text-center">
                    <Badge variant={c.is_active ? 'secondary' : 'outline'}>{c.is_active ? 'Active' : 'Hidden'}</Badge>
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="outline" size="sm" onClick={() => setManaging(c)}>Manage</Button>
                    <Button variant="ghost" size="icon" onClick={() => toggleActive('categories', c)} aria-label="Toggle visibility">
                      {c.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openCatModal(c)} aria-label="Edit"><Edit size={16} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => askDelete('category', c)} aria-label="Delete"><Trash2 size={16} className="text-destructive" /></Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={catModal} onOpenChange={setCatModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCat ? 'Edit Category' : 'Add Category'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveCategory} className="space-y-4">
            {renderFormFields({ isEditing: !!editingCat, folder: 'categories', showIcon: true })}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCatModal(false)}>Cancel</Button>
              <Button type="submit" disabled={saving || uploading}>{saving ? 'Saving…' : 'Save'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {renderSubModal()}
      {renderDeleteDialog()}
    </div>
  );
};
