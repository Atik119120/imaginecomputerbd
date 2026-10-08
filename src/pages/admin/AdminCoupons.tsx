import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Tag, Percent, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Coupon {
  id: string;
  code: string;
  type: 'flat' | 'percentage' | 'free_shipping';
  value: number;
  min_order_value: number;
  max_uses: number | null;
  used_count: number;
  per_user_limit: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  applies_to: 'all' | 'products' | 'categories';
  product_ids: string[];
  category_ids: string[];
}

interface SimpleItem { id: string; name: string; }

export const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    code: '',
    type: 'flat' as 'flat' | 'percentage' | 'free_shipping',
    value: 0,
    min_order_value: 0,
    max_uses: '',
    per_user_limit: 1,
    valid_until: '',
    is_active: true,
    applies_to: 'all' as 'all' | 'products' | 'categories',
    product_ids: [] as string[],
    category_ids: [] as string[],
  });

  const [products, setProducts] = useState<SimpleItem[]>([]);
  const [categories, setCategories] = useState<SimpleItem[]>([]);
  const [scopeSearch, setScopeSearch] = useState('');

  useEffect(() => { fetchCoupons(); fetchScopeData(); }, []);

  const fetchScopeData = async () => {
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('products').select('id, name').order('name'),
      supabase.from('categories').select('id, name').order('name'),
    ]);
    setProducts((prods || []) as SimpleItem[]);
    setCategories((cats || []) as SimpleItem[]);
  };

  const fetchCoupons = async () => {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setCoupons(data as Coupon[]);
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({ code: '', type: 'flat', value: 0, min_order_value: 0, max_uses: '', per_user_limit: 1, valid_until: '', is_active: true, applies_to: 'all', product_ids: [], category_ids: [] });
    setScopeSearch('');
    setEditingCoupon(null);
    setShowForm(false);
  };

  const handleEdit = (coupon: Coupon) => {
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      min_order_value: coupon.min_order_value,
      max_uses: coupon.max_uses?.toString() || '',
      per_user_limit: coupon.per_user_limit,
      valid_until: coupon.valid_until ? coupon.valid_until.split('T')[0] : '',
      is_active: coupon.is_active,
      applies_to: coupon.applies_to || 'all',
      product_ids: coupon.product_ids || [],
      category_ids: coupon.category_ids || [],
    });
    setScopeSearch('');
    setEditingCoupon(coupon);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      code: formData.code.toUpperCase().trim(),
      type: formData.type,
      value: formData.value,
      min_order_value: formData.min_order_value,
      max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
      per_user_limit: formData.per_user_limit,
      valid_until: formData.valid_until || null,
      is_active: formData.is_active,
      applies_to: formData.applies_to,
      product_ids: formData.applies_to === 'products' ? formData.product_ids : [],
      category_ids: formData.applies_to === 'categories' ? formData.category_ids : [],
    };

    if (formData.applies_to === 'products' && formData.product_ids.length === 0) {
      toast({ title: 'Select at least one product', variant: 'destructive' });
      return;
    }
    if (formData.applies_to === 'categories' && formData.category_ids.length === 0) {
      toast({ title: 'Select at least one category', variant: 'destructive' });
      return;
    }

    if (editingCoupon) {
      const { error } = await supabase.from('coupons').update(payload).eq('id', editingCoupon.id);
      if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Coupon updated!' });
    } else {
      const { error } = await supabase.from('coupons').insert(payload);
      if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Coupon created!' });
    }
    resetForm();
    fetchCoupons();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    await supabase.from('coupons').delete().eq('id', id);
    fetchCoupons();
    toast({ title: 'Coupon deleted' });
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from('coupons').update({ is_active: !active }).eq('id', id);
    fetchCoupons();
  };

  const typeIcon = (type: string) => {
    if (type === 'flat') return <Tag size={16} className="text-primary" />;
    if (type === 'percentage') return <Percent size={16} className="text-accent" />;
    return <Truck size={16} className="text-green-600" />;
  };

  const typeLabel = (coupon: Coupon) => {
    if (coupon.type === 'flat') return `৳${coupon.value} off`;
    if (coupon.type === 'percentage') return `${coupon.value}% off`;
    return 'Free Shipping';
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Coupons</h2>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2">
          <Plus size={18} /> Add Coupon
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editingCoupon ? 'Edit' : 'Create'} Coupon</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Code *</Label>
                <Input value={formData.code} onChange={e => setFormData(p => ({ ...p, code: e.target.value }))} placeholder="SAVE20" required className="uppercase" />
              </div>
              <div>
                <Label>Type *</Label>
                <Select value={formData.type} onValueChange={(v: any) => setFormData(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">Flat Discount (৳)</SelectItem>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="free_shipping">Free Shipping</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.type !== 'free_shipping' && (
                <div>
                  <Label>Value *</Label>
                  <Input type="number" value={formData.value} onChange={e => setFormData(p => ({ ...p, value: parseFloat(e.target.value) || 0 }))} min={0} />
                </div>
              )}
              <div>
                <Label>Min Order Value (৳)</Label>
                <Input type="number" value={formData.min_order_value} onChange={e => setFormData(p => ({ ...p, min_order_value: parseFloat(e.target.value) || 0 }))} min={0} />
              </div>
              <div>
                <Label>Max Uses (leave empty = unlimited)</Label>
                <Input type="number" value={formData.max_uses} onChange={e => setFormData(p => ({ ...p, max_uses: e.target.value }))} min={1} />
              </div>
              <div>
                <Label>Per User Limit</Label>
                <Input type="number" value={formData.per_user_limit} onChange={e => setFormData(p => ({ ...p, per_user_limit: parseInt(e.target.value) || 1 }))} min={1} />
              </div>
              <div>
                <Label>Valid Until (optional)</Label>
                <Input type="date" value={formData.valid_until} onChange={e => setFormData(p => ({ ...p, valid_until: e.target.value }))} />
              </div>
              <div className="md:col-span-2 space-y-3 p-4 rounded-xl border border-border bg-secondary/30">
                <div>
                  <Label>Coupon Applies To *</Label>
                  <Select value={formData.applies_to} onValueChange={(v: any) => setFormData(p => ({ ...p, applies_to: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Whole Store (all products)</SelectItem>
                      <SelectItem value="products">Specific Products</SelectItem>
                      <SelectItem value="categories">Specific Categories</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.applies_to === 'all'
                      ? 'Discount is calculated on the full cart.'
                      : 'Discount is calculated only on the matching items in the cart.'}
                  </p>
                </div>

                {formData.applies_to !== 'all' && (
                  <div className="space-y-2">
                    {formData.applies_to === 'products' && (
                      <Input
                        placeholder="Search products..."
                        value={scopeSearch}
                        onChange={e => setScopeSearch(e.target.value)}
                      />
                    )}
                    <div className="max-h-56 overflow-y-auto rounded-lg border border-border bg-background divide-y divide-border">
                      {(formData.applies_to === 'products'
                        ? products.filter(i => i.name.toLowerCase().includes(scopeSearch.toLowerCase()))
                        : categories
                      ).map(item => {
                        const key = formData.applies_to === 'products' ? 'product_ids' : 'category_ids';
                        const selected = (formData[key] as string[]).includes(item.id);
                        return (
                          <label key={item.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-secondary/50 text-sm">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => setFormData(p => {
                                const list = p[key] as string[];
                                return { ...p, [key]: selected ? list.filter(x => x !== item.id) : [...list, item.id] };
                              })}
                              className="w-4 h-4 accent-primary"
                            />
                            <span className="truncate">{item.name}</span>
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {(formData.applies_to === 'products' ? formData.product_ids.length : formData.category_ids.length)} selected
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-6">
                <Switch checked={formData.is_active} onCheckedChange={v => setFormData(p => ({ ...p, is_active: v }))} />
                <Label>Active</Label>
              </div>
              <div className="md:col-span-2 flex gap-3">
                <Button type="submit">{editingCoupon ? 'Update' : 'Create'}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {coupons.length === 0 && <p className="text-center text-muted-foreground py-8">No coupons yet</p>}
        {coupons.map(coupon => (
          <Card key={coupon.id} className={`${!coupon.is_active ? 'opacity-50' : ''}`}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-red/10 rounded-lg flex items-center justify-center">
                  {typeIcon(coupon.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg">{coupon.code}</span>
                    <span className="text-sm bg-secondary px-2 py-0.5 rounded">{typeLabel(coupon)}</span>
                    <span className="text-xs bg-primary/15 text-foreground px-2 py-0.5 rounded font-medium">
                      {coupon.applies_to === 'products'
                        ? `${coupon.product_ids?.length || 0} product(s)`
                        : coupon.applies_to === 'categories'
                        ? `${coupon.category_ids?.length || 0} category(s)`
                        : 'Whole store'}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground flex gap-3 mt-1">
                    <span>Min: ৳{coupon.min_order_value}</span>
                    <span>Used: {coupon.used_count}{coupon.max_uses ? `/${coupon.max_uses}` : ''}</span>
                    {coupon.valid_until && <span>Expires: {format(new Date(coupon.valid_until), 'MMM dd, yyyy')}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={coupon.is_active} onCheckedChange={() => toggleActive(coupon.id, coupon.is_active)} />
                <Button variant="ghost" size="icon" onClick={() => handleEdit(coupon)}><Edit size={16} /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(coupon.id)} className="text-destructive"><Trash2 size={16} /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
