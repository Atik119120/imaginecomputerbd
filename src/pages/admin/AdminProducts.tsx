import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Search, Upload, X, ImageIcon, Images, Package, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { uploadImage } from '@/lib/uploadImage';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SpecificationBuilder } from '@/components/admin/SpecificationBuilder';
import { SpecGroup, normalizeSpecifications } from '@/lib/specifications';
import { VariantBuilder } from '@/components/admin/VariantBuilder';
import { VariantOption, normalizeVariants } from '@/lib/variants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Product {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  discount: number | null;
  image_url: string | null;
  supplementary_images: string[] | null;
  category_id: string | null;
  subcategory_id: string | null;
  brand_id: string | null;
  colors: string[] | null;
  color_images: Record<string, string> | null;
  sizes: string[] | null;
  sku: string | null;
  in_stock: boolean | null;
  description: string | null;
  fabric: string | null;
  is_preorder: boolean | null;
  preorder_release_date: string | null;
  return_policy: string | null;
  packages: { name: string; price: number; weight?: string }[] | null;
  brand: string | null;
  model: string | null;
  warranty: string | null;
  specifications: any;
  variants?: any;
}

interface Category {
  id: string;
  name: string;
}

interface SubcategoryLite {
  id: string;
  name: string;
  category_id: string;
}

interface BrandLite {
  id: string;
  name: string;
}

export const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryLite[]>([]);
  const [brandList, setBrandList] = useState<BrandLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingSupplementary, setUploadingSupplementary] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [supplementaryPreviews, setSupplementaryPreviews] = useState<string[]>([]);
  const [isDraggingMain, setIsDraggingMain] = useState(false);
  const [isDraggingSupp, setIsDraggingSupp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supplementaryInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    original_price: '',
    discount: '',
    image_url: '',
    supplementary_images: [] as string[],
    category_id: '',
    subcategory_id: '',
    brand_id: '',
    colors: '',
    color_images: {} as Record<string, string>,
    sizes: '',
    sku: '',
    in_stock: true,
    description: '',
    fabric: '',
    is_preorder: false,
    preorder_release_date: '',
    return_policy: '',
    packages: '',
    brand: '',
    model: '',
    warranty: '',
  });
  const [specGroups, setSpecGroups] = useState<SpecGroup[]>([]);
  const [variantOptions, setVariantOptions] = useState<VariantOption[]>([]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchTaxonomy();
  }, []);

  const fetchTaxonomy = async () => {
    const [subs, brands] = await Promise.all([
      supabase.from('subcategories').select('id, name, category_id').order('display_order').order('name'),
      supabase.from('brands').select('id, name').order('display_order').order('name'),
    ]);
    if (subs.data) setSubcategories(subs.data as SubcategoryLite[]);
    if (brands.data) setBrandList(brands.data as BrandLite[]);
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProducts((data || []) as unknown as Product[]);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({ title: 'Error', description: 'Failed to fetch products', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('id, name').order('name');
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const productData = {
      name: formData.name,
      price: parseFloat(formData.price),
      original_price: formData.original_price ? parseFloat(formData.original_price) : null,
      discount: formData.discount ? parseInt(formData.discount) : null,
      image_url: formData.image_url || null,
      supplementary_images: formData.supplementary_images.length > 0 ? formData.supplementary_images : null,
      category_id: formData.category_id || null,
      subcategory_id: formData.subcategory_id || null,
      brand_id: formData.brand_id || null,
      colors: formData.colors ? formData.colors.split(',').map(c => c.trim()).filter(Boolean) : null,
      color_images: (() => {
        const colorList = formData.colors ? formData.colors.split(',').map(c => c.trim()).filter(Boolean) : [];
        const filtered: Record<string, string> = {};
        for (const c of colorList) {
          if (formData.color_images[c]) filtered[c] = formData.color_images[c];
        }
        return filtered;
      })(),
      sizes: formData.sizes ? formData.sizes.split(',').map(s => s.trim()).filter(Boolean) : null,
      sku: formData.sku || null,
      in_stock: formData.in_stock,
      description: formData.description || null,
      fabric: formData.fabric || null,
      is_preorder: formData.is_preorder,
      preorder_release_date: formData.is_preorder && formData.preorder_release_date ? formData.preorder_release_date : null,
      return_policy: formData.return_policy || null,
      packages: (() => {
        const items = formData.packages.split('\n').map(line => {
          const parts = line.split('|').map(s => s.trim());
          const name = parts[0];
          const price = parseFloat(parts[1]);
          const weight = parts[2] || undefined;
          if (!name || Number.isNaN(price)) return null;
          return weight ? { name, price, weight } : { name, price };
        }).filter(Boolean) as { name: string; price: number; weight?: string }[];
        return items;
      })(),
      brand: formData.brand.trim() || null,
      model: formData.model.trim() || null,
      warranty: formData.warranty.trim() || null,
      specifications: specGroups
        .map((g) => ({
          title: g.title?.trim() ? g.title.trim() : null,
          items: g.items
            .map((i) => ({ label: i.label.trim(), value: i.value.trim() }))
            .filter((i) => i.label && i.value),
        }))
        .filter((g) => g.items.length > 0),
      variants: variantOptions
        .map((o) => ({
          name: o.name.trim(),
          values: o.values
            .map((v) => ({
              value: v.value.trim(),
              image: v.image || undefined,
              priceDelta: v.priceDelta || undefined,
            }))
            .filter((v) => v.value),
        }))
        .filter((o) => o.name && o.values.length > 0),
    };

    try {
      if (editingProduct) {
        const { error } = await supabase.from('products').update(productData).eq('id', editingProduct.id);
        if (error) throw error;
        toast({ title: 'Product updated', description: 'Changes saved successfully' });
      } else {
        const { error } = await supabase.from('products').insert([productData]);
        if (error) throw error;
        toast({ title: 'Product created', description: 'New product added to catalog' });
      }
      setIsModalOpen(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save product', variant: 'destructive' });
    }
  };

  const uploadImageFile = async (file: File, prefix: string): Promise<string | null> => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image file', variant: 'destructive' });
      return null;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Image must be smaller than 5MB', variant: 'destructive' });
      return null;
    }
    return await uploadImage(file, 'products');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImageFile(file, 'product');
      if (url) {
        setFormData(prev => ({ ...prev, image_url: url }));
        setImagePreview(url);
        toast({ title: 'Image uploaded', description: 'Main product image saved' });
      }
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleMainDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingMain(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImageFile(file, 'product');
      if (url) {
        setFormData(prev => ({ ...prev, image_url: url }));
        setImagePreview(url);
        toast({ title: 'Image uploaded', description: 'Main product image saved' });
      }
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSupplementaryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingSupplementary(true);
    const newImages: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const url = await uploadImageFile(files[i], `product-gallery`);
        if (url) newImages.push(url);
      }
      const updated = [...formData.supplementary_images, ...newImages];
      setFormData(prev => ({ ...prev, supplementary_images: updated }));
      setSupplementaryPreviews(updated);
      toast({ title: 'Gallery updated', description: `${newImages.length} image(s) added` });
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploadingSupplementary(false);
      if (supplementaryInputRef.current) supplementaryInputRef.current.value = '';
    }
  };

  const handleSuppDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingSupp(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    setUploadingSupplementary(true);
    const newImages: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const url = await uploadImageFile(files[i], `product-gallery`);
        if (url) newImages.push(url);
      }
      const updated = [...formData.supplementary_images, ...newImages];
      setFormData(prev => ({ ...prev, supplementary_images: updated }));
      setSupplementaryPreviews(updated);
      toast({ title: 'Gallery updated', description: `${newImages.length} image(s) added` });
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploadingSupplementary(false);
    }
  };

  const removeSupplementaryImage = (index: number) => {
    const updated = formData.supplementary_images.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, supplementary_images: updated }));
    setSupplementaryPreviews(updated);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      original_price: product.original_price?.toString() || '',
      discount: product.discount?.toString() || '',
      image_url: product.image_url || '',
      supplementary_images: product.supplementary_images || [],
      category_id: product.category_id || '',
      subcategory_id: product.subcategory_id || '',
      brand_id: product.brand_id || '',
      colors: product.colors?.join(', ') || '',
      color_images: (product.color_images && typeof product.color_images === 'object') ? product.color_images : {},
      sizes: product.sizes?.join(', ') || '',
      sku: product.sku || '',
      in_stock: product.in_stock ?? true,
      description: product.description || '',
      fabric: product.fabric || '',
      is_preorder: product.is_preorder ?? false,
      preorder_release_date: product.preorder_release_date || '',
      return_policy: product.return_policy || '',
      packages: product.packages?.map(p => `${p.name} | ${p.price}${p.weight ? ' | ' + p.weight : ''}`).join('\n') || '',
      brand: product.brand || '',
      model: product.model || '',
      warranty: product.warranty || '',
    });
    setSpecGroups(normalizeSpecifications(product.specifications));
    setVariantOptions(normalizeVariants((product as any).variants));
    setImagePreview(product.image_url || null);
    setSupplementaryPreviews(product.supplementary_images || []);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Product deleted' });
      fetchProducts();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({ name: '', price: '', original_price: '', discount: '', image_url: '', supplementary_images: [], category_id: '', subcategory_id: '', brand_id: '', colors: '', color_images: {}, sizes: '', sku: '', in_stock: true, description: '', fabric: '', is_preorder: false, preorder_release_date: '', return_policy: '', packages: '', brand: '', model: '', warranty: '' });
    setSpecGroups([]);
    setVariantOptions([]);
    setImagePreview(null);
    setSupplementaryPreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (supplementaryInputRef.current) supplementaryInputRef.current.value = '';
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Products</h2>
          <p className="text-muted-foreground text-sm mt-1">{products.length} items in catalog</p>
        </div>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="gap-2 shadow-sm">
          <Plus size={16} />
          Add Product
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or SKU..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-background"
        />
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-border animate-pulse">
              <div className="aspect-square bg-secondary rounded-t-xl" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-secondary rounded w-3/4" />
                <div className="h-3 bg-secondary rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border/50">
          <Package size={40} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground font-medium">
            {products.length === 0 ? 'No products yet' : 'No products match your search'}
          </p>
          {products.length === 0 && (
            <Button onClick={() => { resetForm(); setIsModalOpen(true); }} variant="outline" size="sm" className="mt-4 gap-2">
              <Plus size={14} />
              Add your first product
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence>
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.04 }}
                className="group bg-card rounded-xl border border-border/60 overflow-hidden hover:shadow-md hover:border-primary/20 transition-all duration-300"
              >
                <div className="relative aspect-square bg-secondary overflow-hidden">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={36} className="text-muted-foreground/20" />
                    </div>
                  )}
                  {/* Stock badge */}
                  <div className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-medium ${product.in_stock ? 'bg-accent/90 text-accent-foreground' : 'bg-destructive/90 text-destructive-foreground'}`}>
                    {product.in_stock ? 'In Stock' : 'Out'}
                  </div>
                  {/* Gallery count */}
                  {product.supplementary_images && product.supplementary_images.length > 0 && (
                    <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm text-foreground text-xs px-2 py-0.5 rounded-full flex items-center gap-1 border border-border/50">
                      <Images size={10} />
                      +{product.supplementary_images.length}
                    </div>
                  )}
                  {/* Action overlay */}
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 bg-background rounded-lg shadow-md hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 bg-background rounded-lg shadow-md hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm truncate">{product.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-primary font-bold text-sm">৳{product.price.toLocaleString()}</span>
                    {product.original_price && (
                      <span className="text-xs text-muted-foreground line-through">৳{product.original_price.toLocaleString()}</span>
                    )}
                    {product.discount && (
                      <span className="text-xs text-accent font-semibold">-{product.discount}%</span>
                    )}
                  </div>
                  {product.sku && <p className="text-xs text-muted-foreground mt-0.5">SKU: {product.sku}</p>}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Product Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsModalOpen(open); }}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border sticky top-0 bg-background z-10">
            <DialogTitle className="text-lg font-semibold">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
            {/* Basic Info */}
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Basic Info</p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g. Pure Sundarban Honey 500g" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sku">SKU</Label>
                  <Input id="sku" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} placeholder="e.g. GB3P-BLK" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="brand">Brand</Label>
                  <Input id="brand" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} placeholder="e.g. Samsung" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="model">Model</Label>
                  <Input id="model" value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} placeholder="e.g. Galaxy Buds 3 Pro" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="warranty">Warranty</Label>
                  <Input id="warranty" value={formData.warranty} onChange={(e) => setFormData({ ...formData, warranty: e.target.value })} placeholder="e.g. 1 Year Official Warranty" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value, subcategory_id: '' })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <Select
                    value={formData.subcategory_id || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, subcategory_id: value === 'none' ? '' : value })}
                    disabled={!formData.category_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={formData.category_id ? 'Select subcategory' : 'Select category first'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {subcategories
                        .filter((s) => s.category_id === formData.category_id)
                        .map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="brand_id">Brand (catalog)</Label>
                  <Select
                    value={formData.brand_id || 'none'}
                    onValueChange={(value) => {
                      if (value === 'none') {
                        setFormData({ ...formData, brand_id: '' });
                      } else {
                        const picked = brandList.find((b) => b.id === value);
                        setFormData({ ...formData, brand_id: value, brand: picked?.name || formData.brand });
                      }
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {brandList.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pricing</p>
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="price">Sale Price *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">৳</span>
                    <Input id="price" type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required className="pl-7" placeholder="0" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="original_price">Original Price</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">৳</span>
                    <Input id="original_price" type="number" step="0.01" value={formData.original_price} onChange={(e) => setFormData({ ...formData, original_price: e.target.value })} className="pl-7" placeholder="0" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="discount">Discount %</Label>
                  <Input id="discount" type="number" value={formData.discount} onChange={(e) => setFormData({ ...formData, discount: e.target.value })} placeholder="0" />
                </div>
              </div>
            </div>

            {/* Main Image */}
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Main Image</p>
              <div className="pt-2 space-y-3">
                {imagePreview ? (
                  <div className="relative w-full h-52 rounded-xl overflow-hidden border border-border bg-secondary/30">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <button
                      type="button"
                      onClick={() => { setImagePreview(null); setFormData({ ...formData, image_url: '' }); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="absolute top-3 right-3 p-1.5 bg-background/80 backdrop-blur-sm rounded-full hover:bg-destructive hover:text-destructive-foreground transition-colors shadow-sm"
                    >
                      <X size={14} />
                    </button>
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white text-xs">
                      <CheckCircle2 size={14} className="text-accent" />
                      Image uploaded
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingMain(true); }}
                    onDragLeave={() => setIsDraggingMain(false)}
                    onDrop={handleMainDrop}
                    className={`w-full h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${isDraggingMain ? 'border-primary bg-brand-red/5' : 'border-border hover:border-primary/50 hover:bg-secondary/30'}`}
                  >
                    {uploading ? (
                      <>
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-muted-foreground">Uploading...</p>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                          <Upload size={18} className="text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium">Drop image here or click to browse</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, WEBP — max 5MB</p>
                      </>
                    )}
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">or paste URL</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <Input
                  value={formData.image_url}
                  onChange={(e) => { setFormData({ ...formData, image_url: e.target.value }); setImagePreview(e.target.value || null); }}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            {/* Gallery Images */}
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gallery Images</p>
              <p className="text-xs text-muted-foreground">Additional angles/detail shots shown in product page gallery</p>
              <div className="pt-2 space-y-3">
                {supplementaryPreviews.length > 0 && (
                  <div className="grid grid-cols-5 gap-2">
                    <AnimatePresence>
                      {supplementaryPreviews.map((url, index) => (
                        <motion.div
                          key={url + index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="relative aspect-square rounded-lg overflow-hidden border border-border group cursor-pointer"
                        >
                          <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeSupplementaryImage(index)}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <X size={16} className="text-white" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                <div
                  onClick={() => supplementaryInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingSupp(true); }}
                  onDragLeave={() => setIsDraggingSupp(false)}
                  onDrop={handleSuppDrop}
                  className={`w-full h-28 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${isDraggingSupp ? 'border-primary bg-brand-red/5' : 'border-border hover:border-primary/50 hover:bg-secondary/30'}`}
                >
                  {uploadingSupplementary ? (
                    <>
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs text-muted-foreground">Uploading gallery images...</p>
                    </>
                  ) : (
                    <>
                      <Images size={20} className="text-muted-foreground" />
                      <p className="text-xs font-medium">Add gallery images <span className="text-muted-foreground">(multiple supported)</span></p>
                    </>
                  )}
                </div>
                <input ref={supplementaryInputRef} type="file" accept="image/*" multiple onChange={handleSupplementaryUpload} className="hidden" />
              </div>
            </div>

            {/* Variants */}
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Variants</p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="colors">Variants / Types <span className="text-muted-foreground font-normal">(comma-separated, optional)</span></Label>
                  <Input id="colors" value={formData.colors} onChange={(e) => setFormData({ ...formData, colors: e.target.value })} placeholder="Raw, Roasted, Premium" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sizes">Pack Sizes <span className="text-muted-foreground font-normal">(comma-separated, optional)</span></Label>
                  <Input id="sizes" value={formData.sizes} onChange={(e) => setFormData({ ...formData, sizes: e.target.value })} placeholder="250g, 500g, 1kg" />
                </div>
              </div>

              {/* Per-color image uploader */}
              {(() => {
                const colorList = formData.colors.split(',').map(c => c.trim()).filter(Boolean);
                if (colorList.length === 0) return null;
                return (
                  <div className="mt-4 space-y-2 p-3.5 bg-secondary/30 rounded-xl border border-border/50">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Image per Color <span className="font-normal normal-case">(optional — shown when customer picks that color)</span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {colorList.map((color) => {
                        const url = formData.color_images[color];
                        return (
                          <div key={color} className="flex items-center gap-3 p-2 bg-background rounded-lg border border-border/40">
                            <div className="w-14 h-14 rounded-md overflow-hidden bg-muted flex items-center justify-center flex-shrink-0 border border-border/40">
                              {url ? (
                                <img src={url} alt={color} className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon size={18} className="text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{color}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <label className="text-xs px-2 py-1 rounded-md bg-primary text-primary-foreground hover:opacity-90 cursor-pointer transition-opacity">
                                  {url ? 'Change' : 'Upload'}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      try {
                                        const uploaded = await uploadImageFile(file, `color-${color.toLowerCase().replace(/[^a-z0-9]/g, '')}`);
                                        if (uploaded) {
                                          setFormData(prev => ({ ...prev, color_images: { ...prev.color_images, [color]: uploaded } }));
                                          toast({ title: 'Image uploaded', description: `Image set for ${color}` });
                                        }
                                      } catch (err: any) {
                                        toast({ title: 'Upload failed', description: err.message || 'Try again', variant: 'destructive' });
                                      } finally {
                                        e.target.value = '';
                                      }
                                    }}
                                  />
                                </label>
                                {url && (
                                  <button
                                    type="button"
                                    onClick={() => setFormData(prev => {
                                      const next = { ...prev.color_images };
                                      delete next[color];
                                      return { ...prev, color_images: next };
                                    })}
                                    className="text-xs px-2 py-1 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Fabric & Pre-order */}
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Origin & Pre-order</p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="fabric">Origin / Source</Label>
                  <Input id="fabric" value={formData.fabric} onChange={(e) => setFormData({ ...formData, fabric: e.target.value })} placeholder="e.g. Sundarban, Sylhet, Imported from KSA" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="preorder_release_date">Pre-order Release Date</Label>
                  <Input
                    id="preorder_release_date"
                    type="date"
                    value={formData.preorder_release_date}
                    onChange={(e) => setFormData({ ...formData, preorder_release_date: e.target.value })}
                    disabled={!formData.is_preorder}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 p-3.5 bg-secondary/40 rounded-xl border border-border/50 mt-3">
                <Switch
                  checked={formData.is_preorder}
                  onCheckedChange={(v) => setFormData({ ...formData, is_preorder: v })}
                  aria-label="Pre-order Product"
                />

                <div>
                  <p className="text-sm font-medium">Pre-order Product</p>
                  <p className="text-xs text-muted-foreground">{formData.is_preorder ? 'Will be shown with a Pre-Order badge' : 'Standard available product'}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="packages">Package Options (Optional)</Label>
              <Textarea
                id="packages"
                value={formData.packages}
                onChange={(e) => setFormData({ ...formData, packages: e.target.value })}
                rows={4}
                className="resize-none font-mono text-xs"
                placeholder={'Medjool 0.5 kg (Medium Size) | 1050 | 0.5 KG\nMedjool 0.5 kg (Large Size) | 1150 | 0.5 KG\nMedjool 1 kg (Medium Size) | 2000 | 1 KG\nMedjool 1 kg (Large Size) | 2200 | 1 KG'}
              />
              <p className="text-xs text-muted-foreground">One package per line: <code className="text-foreground">Name | Price | Weight (optional)</code>. Customers will pick one; the chosen package's price is used.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={12}
                className="text-sm leading-relaxed"
                placeholder={'## Product Overview\nWrite a detailed overview here...\n\n## Key Features\n- Active Noise Cancellation\n- Up to 30 hours battery\n- Bluetooth 5.4'}
              />
              <p className="text-xs text-muted-foreground">
                Long-form supported. Use <code className="text-foreground">## Heading</code>, <code className="text-foreground">- bullet</code> and <code className="text-foreground">**bold**</code> — the product page renders them nicely.
              </p>
            </div>

            {/* Variations */}
            <div className="p-4 bg-secondary/20 rounded-xl border border-border/50">
              <VariantBuilder options={variantOptions} onChange={setVariantOptions} />
            </div>

            {/* Specifications */}
            <div className="p-4 bg-secondary/20 rounded-xl border border-border/50">
              <SpecificationBuilder groups={specGroups} onChange={setSpecGroups} />
            </div>

            {/* Return Policy (per-product) */}
            <div className="space-y-1.5 p-4 bg-secondary/30 rounded-xl border border-border/50">
              <Label htmlFor="return_policy">Return & Exchange Policy</Label>
              <Textarea
                id="return_policy"
                value={formData.return_policy}
                onChange={(e) => setFormData({ ...formData, return_policy: e.target.value })}
                rows={4}
                className="resize-none"
                placeholder="Product specific return / exchange terms..."
              />
              <p className="text-xs text-muted-foreground">Leave empty to show site default policy</p>
            </div>

            {/* Stock */}
            <div className="flex items-center gap-3 p-3.5 bg-secondary/40 rounded-xl border border-border/50">
              <Switch
                checked={formData.in_stock}
                onCheckedChange={(v) => setFormData({ ...formData, in_stock: v })}
                aria-label="In Stock"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium">In Stock</p>
                <p className="text-xs text-muted-foreground">{formData.in_stock ? 'Product is available for purchase' : 'Product is hidden from store'}</p>
              </div>
            </div>


            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={() => { resetForm(); setIsModalOpen(false); }} className="flex-1">Cancel</Button>
              <Button type="submit" className="flex-1 gap-2">
                {editingProduct ? 'Save Changes' : 'Create Product'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
