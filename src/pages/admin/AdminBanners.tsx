import { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, Upload, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { uploadImage } from '@/lib/uploadImage';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Placement = 'main';

interface Banner {
  id: string;
  image_url: string | null;
  button_link: string | null;
  is_active: boolean;
  display_order: number | null;
  created_at: string;
  placement: Placement;
}

const PLACEMENT_META: Record<Placement, { label: string; subtitle: string; size: string; aspect: string }> = {
  main: {
    label: 'Main Banner (Wide / Left)',
    subtitle: 'Large hero banner shown on the left of the homepage.',
    size: '1500 × 500 px (3:1)',
    aspect: 'aspect-[3/1]',
  },
};

export const AdminBanners = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogPlacement, setDialogPlacement] = useState<Placement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    image_url: '',
    button_link: '/shop',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('id, image_url, button_link, is_active, display_order, created_at, placement')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setBanners((data || []) as Banner[]);
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast({ title: 'Error', description: 'Failed to fetch banners', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, 'banners');
      setFormData({ ...formData, image_url: url });
      toast({ title: 'Success', description: 'Image uploaded successfully' });
    } catch (error: any) {
      toast({ title: 'Upload Error', description: error.message || 'Failed to upload image', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleAddBanner = async () => {
    if (!formData.image_url || !dialogPlacement) {
      toast({ title: 'Error', description: 'Please upload a banner image', variant: 'destructive' });
      return;
    }
    try {
      const sameType = banners.filter((b) => b.placement === dialogPlacement);
      const { error } = await supabase.from('banners').insert({
        title: 'Banner',
        image_url: formData.image_url,
        button_link: formData.button_link || '/shop',
        is_active: true,
        display_order: sameType.length,
        placement: dialogPlacement,
      });
      if (error) throw error;
      toast({ title: 'Success', description: 'Banner added successfully' });
      setDialogPlacement(null);
      setFormData({ image_url: '', button_link: '/shop' });
      fetchBanners();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to add banner', variant: 'destructive' });
    }
  };

  const toggleBannerStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('banners').update({ is_active: !currentStatus }).eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: `Banner ${!currentStatus ? 'activated' : 'deactivated'}` });
      fetchBanners();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const deleteBanner = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    try {
      const { error } = await supabase.from('banners').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Banner deleted successfully' });
      fetchBanners();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderSection = (placement: Placement) => {
    const meta = PLACEMENT_META[placement];
    const list = banners.filter((b) => b.placement === placement);
    return (
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-lg font-semibold">{meta.label}</h3>
            <p className="text-sm text-muted-foreground">{meta.subtitle}</p>
            <p className="text-xs text-accent-foreground/80 mt-1">Recommended size: <strong>{meta.size}</strong></p>
          </div>
          <Button
            onClick={() => {
              setFormData({ image_url: '', button_link: '/shop' });
              setDialogPlacement(placement);
            }}
            className="btn-shine"
            size="sm"
          >
            <Plus size={16} className="mr-1.5" />
            Add Main Banner
          </Button>
        </div>

        <div className="grid gap-3">
          <AnimatePresence>
            {list.map((banner, index) => (
              <motion.div
                key={banner.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ delay: index * 0.04 }}
                className={`bg-card border rounded-xl overflow-hidden ${banner.is_active ? 'border-accent' : 'border-border opacity-60'}`}
              >
                <div className="flex flex-col md:flex-row">
                  <div className={`relative ${placement === 'main' ? 'md:w-80 aspect-[3/1]' : 'md:w-48 aspect-square'} w-full bg-secondary`}>
                    <img src={banner.image_url || '/placeholder.svg'} alt="Banner" className="w-full h-full object-cover" />
                    {!banner.is_active && (
                      <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                        <span className="text-sm font-medium text-muted-foreground">Inactive</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <GripVertical size={20} className="text-muted-foreground cursor-grab hidden md:block" />
                      <div>
                        <p className="font-medium">{meta.label.split(' (')[0]} #{index + 1}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <ExternalLink size={12} />
                          {banner.button_link || 'No link'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {banner.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                        </span>
                        <Switch checked={banner.is_active} onCheckedChange={() => toggleBannerStatus(banner.id, banner.is_active)} />
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => deleteBanner(banner.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {list.length === 0 && (
            <div className="text-center py-8 bg-card rounded-xl border border-dashed border-border">
              <Upload size={36} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No {placement} banner yet — recommended size {meta.size}.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Hero Banners</h2>
        <p className="text-muted-foreground">Wide hero banner shown on the homepage.</p>
      </div>

      {renderSection('main')}

      {/* Add Banner Dialog */}
      <Dialog open={!!dialogPlacement} onOpenChange={(open) => !open && setDialogPlacement(null)}>
        <DialogContent className="sm:max-w-lg bg-background">
          <DialogHeader>
            <DialogTitle>
              Add {dialogPlacement && PLACEMENT_META[dialogPlacement].label}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label>Banner Image</Label>
              {formData.image_url ? (
                <div className={`relative ${dialogPlacement ? PLACEMENT_META[dialogPlacement].aspect : 'aspect-[3/1]'} rounded-lg overflow-hidden bg-secondary`}>
                  <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                  <Button variant="secondary" size="sm" className="absolute bottom-2 right-2" onClick={() => setFormData({ ...formData, image_url: '' })}>
                    Change
                  </Button>
                </div>
              ) : (
                <label className={`flex flex-col items-center justify-center w-full ${dialogPlacement ? PLACEMENT_META[dialogPlacement].aspect : 'aspect-[3/1]'} border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors`}>
                  <div className="flex flex-col items-center justify-center py-6 text-center px-4">
                    {uploading ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    ) : (
                      <>
                        <Upload size={32} className="text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Click to upload banner image</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Recommended: <strong>{dialogPlacement && PLACEMENT_META[dialogPlacement].size}</strong>
                        </p>
                      </>
                    )}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="button_link">Link (Optional)</Label>
              <Input
                id="button_link"
                value={formData.button_link}
                onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                placeholder="/shop or https://..."
              />
              <p className="text-xs text-muted-foreground">Where should clicking the banner take users?</p>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={() => setDialogPlacement(null)}>Cancel</Button>
              <Button onClick={handleAddBanner} disabled={!formData.image_url || uploading}>Add Banner</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
