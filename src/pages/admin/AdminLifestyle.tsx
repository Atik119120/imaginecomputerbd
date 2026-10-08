import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Upload, X, ImageIcon, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { uploadImage } from '@/lib/uploadImage';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface LifestyleItem {
  id: string;
  title: string | null;
  image_url: string;
  link: string | null;
  display_order: number;
  is_active: boolean;
}

export const AdminLifestyle = () => {
  const [items, setItems] = useState<LifestyleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<LifestyleItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    link: '',
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('lifestyle_gallery')
      .select('*')
      .order('display_order', { ascending: true });
    if (error) {
      toast({ title: 'Error', description: 'Failed to load items', variant: 'destructive' });
    } else {
      setItems((data as LifestyleItem[]) || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setEditing(null);
    setFormData({ title: '', image_url: '', link: '', display_order: items.length, is_active: true });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 5MB', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const url = await uploadImage(file, 'lifestyle');
      setFormData(prev => ({ ...prev, image_url: url }));
      toast({ title: 'Image uploaded' });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image_url) {
      toast({ title: 'Image required', variant: 'destructive' });
      return;
    }
    const payload = {
      title: formData.title || null,
      image_url: formData.image_url,
      link: formData.link || null,
      display_order: formData.display_order,
      is_active: formData.is_active,
    };
    try {
      if (editing) {
        const { error } = await supabase.from('lifestyle_gallery').update(payload).eq('id', editing.id);
        if (error) throw error;
        toast({ title: 'Updated' });
      } else {
        const { error } = await supabase.from('lifestyle_gallery').insert([payload]);
        if (error) throw error;
        toast({ title: 'Added' });
      }
      setIsModalOpen(false);
      resetForm();
      fetchItems();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleEdit = (item: LifestyleItem) => {
    setEditing(item);
    setFormData({
      title: item.title || '',
      image_url: item.image_url,
      link: item.link || '',
      display_order: item.display_order,
      is_active: item.is_active,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    const { error } = await supabase.from('lifestyle_gallery').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Deleted' });
      fetchItems();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Camera size={22} /> Lifestyle Gallery
          </h2>
          <p className="text-muted-foreground text-sm mt-1">{items.length} items — first 6 active items show on homepage</p>
        </div>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="gap-2">
          <Plus size={16} /> Add Item
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-square bg-secondary rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border/50">
          <Camera size={40} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground font-medium">No lifestyle photos yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence>
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.04 }}
                className="group relative aspect-square bg-card rounded-xl border border-border/60 overflow-hidden"
              >
                <img src={item.image_url} alt={item.title || 'Lifestyle'} className="w-full h-full object-cover" />
                {!item.is_active && (
                  <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">Inactive</div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button onClick={() => handleEdit(item)} className="p-2 bg-background rounded-lg shadow-md hover:bg-primary hover:text-primary-foreground">
                    <Edit size={14} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 bg-background rounded-lg shadow-md hover:bg-destructive hover:text-destructive-foreground">
                    <Trash2 size={14} />
                  </button>
                </div>
                {item.title && (
                  <div className="absolute bottom-2 left-2 right-2 bg-background/80 backdrop-blur-sm text-foreground text-xs px-2 py-1 rounded">
                    {item.title}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsModalOpen(open); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Item' : 'Add Lifestyle Item'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Image *</Label>
              {formData.image_url ? (
                <div className="relative w-full h-48 rounded-xl overflow-hidden border border-border">
                  <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))} className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-full hover:bg-destructive hover:text-destructive-foreground">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div onClick={() => fileInputRef.current?.click()} className="w-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-secondary/30">
                  {uploading ? (
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Upload size={18} className="text-muted-foreground" />
                      <p className="text-xs">Click to upload (max 5MB)</p>
                    </>
                  )}
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <Input value={formData.image_url} onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))} placeholder="Or paste URL" className="mt-2" />
            </div>
            <div className="space-y-1.5">
              <Label>Title (optional)</Label>
              <Input value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g. Street Style" />
            </div>
            <div className="space-y-1.5">
              <Label>Link (optional)</Label>
              <Input value={formData.link} onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))} placeholder="/shop or /product/abc" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Display Order</Label>
                <Input type="number" value={formData.display_order} onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))} className="w-4 h-4" />
                  <span className="text-sm font-medium">Active</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={() => { resetForm(); setIsModalOpen(false); }} className="flex-1">Cancel</Button>
              <Button type="submit" className="flex-1">{editing ? 'Save Changes' : 'Add Item'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
