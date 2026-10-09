import { useState, useEffect, useRef } from 'react';
import { Save, Upload, Sun, CreditCard, Phone, FileText, Share2, MapPin, Mail, X, ImageIcon, Globe, Type } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { uploadImage } from '@/lib/uploadImage';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

interface SiteSetting {
  id: string;
  key: string;
  value: any;
}

export const AdminSettings = () => {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [siteName, setSiteName] = useState('Amazing Computer');
  const [logoUrl, setLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [headerContent, setHeaderContent] = useState({
    phone: '(880) 123 456 789',
    tagline: 'standard delivery on all orders.',
  });
  const [paymentMethods, setPaymentMethods] = useState({
    bkash: true,
    nagad: true,
    roket: true,
    cod: true,
  });
  const [paymentNumbers, setPaymentNumbers] = useState({
    bkash: '01XXXXXXXXX',
    nagad: '01XXXXXXXXX',
    rocket: '01XXXXXXXXX',
  });
  const [footerContent, setFooterContent] = useState({
    tagline: 'Empowering Muslim lifestyle since 2016.',
    phone: '09617827080',
    email: 'oneummahbd@gmail.com',
    address: 'Dhaka, BD',
    copyright: 'One Ummah BD',
  });
  const [socialLinks, setSocialLinks] = useState({
    facebook: '',
    instagram: '',
    youtube: '',
    linkedin: '',
  });
  const [whatsappNumber, setWhatsappNumber] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from('site_settings').select('*');
      if (error) throw error;
      
      setSettings(data || []);
      
      data?.forEach((setting) => {
        if (setting.key === 'site_name') {
          const val = setting.value as unknown as { name?: string };
          setSiteName(val?.name || 'ONE UMMAH');
        }
        if (setting.key === 'logo') {
          const logoValue = setting.value as { url?: string } | null;
          setLogoUrl(logoValue?.url || '');
        }
        if (setting.key === 'favicon') {
          const val = setting.value as unknown as { url?: string };
          setFaviconUrl(val?.url || '');
        }
        if (setting.key === 'header_content') {
          const val = setting.value as unknown as typeof headerContent;
          if (val) {
            setHeaderContent({
              phone: val.phone || '(880) 123 456 789',
              tagline: val.tagline || 'standard delivery on all orders.',
            });
          }
        }
        if (setting.key === 'payment_methods') {
          const methods = (setting.value as string[]) || [];
          setPaymentMethods({
            bkash: methods.includes('bkash'),
            nagad: methods.includes('nagad'),
            roket: methods.includes('roket'),
            cod: methods.includes('cod'),
          });
        }
        if (setting.key === 'payment_numbers') {
          const numbers = setting.value as unknown as { bkash?: string; nagad?: string; rocket?: string };
          setPaymentNumbers({
            bkash: numbers?.bkash || '01XXXXXXXXX',
            nagad: numbers?.nagad || '01XXXXXXXXX',
            rocket: numbers?.rocket || '01XXXXXXXXX',
          });
        }
        if (setting.key === 'footer_content') {
          const content = setting.value as unknown as typeof footerContent;
          if (content) {
            setFooterContent({
              tagline: content.tagline || 'Empowering Muslim lifestyle since 2016.',
              phone: content.phone || '09617827080',
              email: content.email || 'oneummahbd@gmail.com',
              address: content.address || 'Dhaka, BD',
              copyright: content.copyright || 'One Ummah BD',
            });
          }
        }
        if (setting.key === 'social_links') {
          const links = setting.value as unknown as typeof socialLinks;
          if (links) {
            setSocialLinks({
              facebook: links.facebook || '',
              instagram: links.instagram || '',
              youtube: links.youtube || '',
              linkedin: links.linkedin || '',
            });
          }
        }
        if (setting.key === 'whatsapp_number') {
          const val = setting.value;
          setWhatsappNumber(typeof val === 'string' ? val : '');
        }
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({ title: 'Error', description: 'Failed to fetch settings', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (key: string, value: any) => {
    setSaving(true);
    try {
      const { data: existing } = await supabase.from('site_settings').select('id').eq('key', key).single();
      if (existing) {
        const { error } = await supabase.from('site_settings').update({ value }).eq('key', key);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('site_settings').insert({ key, value });
        if (error) throw error;
      }
      toast({ title: 'Success', description: 'Setting saved successfully' });
      fetchSettings();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save setting', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (
    file: File,
    bucket: string,
    prefix: string,
    onSuccess: (url: string) => void,
    setUploading: (v: boolean) => void
  ) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file type', description: 'Please upload an image file', variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please upload an image smaller than 2MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const url = await uploadImage(file, bucket);
      onSuccess(url);
      toast({ title: 'Uploaded', description: `${prefix} uploaded successfully` });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: 'Upload failed', description: error.message || 'Failed to upload', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFileUpload(file, 'banners', 'logo', async (url) => {
      setLogoUrl(url);
      await saveSetting('logo', { url, alt: 'Site Logo' });
    }, setUploadingLogo);
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFileUpload(file, 'banners', 'favicon', async (url) => {
      setFaviconUrl(url);
      await saveSetting('favicon', { url });
      // Update favicon in browser immediately
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (link) link.href = url;
    }, setUploadingFavicon);
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const handlePaymentMethodsChange = (method: string, enabled: boolean) => {
    const newMethods = { ...paymentMethods, [method]: enabled };
    setPaymentMethods(newMethods);
    const enabledMethods = Object.entries(newMethods).filter(([_, v]) => v).map(([k]) => k);
    saveSetting('payment_methods', enabledMethods);
  };

  const handlePaymentNumberChange = (method: string, number: string) => {
    setPaymentNumbers(prev => ({ ...prev, [method]: number }));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <h2 className="text-2xl font-bold">Settings</h2>

      {/* Site Name */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Type size={24} className="text-primary" />
          <h3 className="text-lg font-semibold">Website Name</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          এই নামটি সাইটের সব জায়গায় দেখাবে — header, login page, title bar ইত্যাদি
        </p>
        <div className="space-y-4">
          <div>
            <Label htmlFor="site_name">Site Name</Label>
            <Input id="site_name" value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="Your Website Name" />
          </div>
          <Button onClick={() => saveSetting('site_name', { name: siteName })} disabled={saving}>
            <Save size={16} className="mr-2" />Save Site Name
          </Button>
        </div>
      </div>

      {/* Logo Settings */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Upload size={24} className="text-primary" />
          <h3 className="text-lg font-semibold">Logo</h3>
        </div>
        <div className="space-y-4">
          {logoUrl ? (
            <div className="relative inline-block">
              <div className="p-4 bg-secondary/30 rounded-lg border border-border">
                <img src={logoUrl} alt="Logo Preview" className="max-h-24 object-contain" />
              </div>
              <button type="button" onClick={handleRemoveLogo} className="absolute -top-2 -right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 shadow-md">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div onClick={() => logoInputRef.current?.click()} className="w-full max-w-xs h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary hover:bg-secondary/50 transition-colors">
              <div className="p-2 bg-secondary rounded-full"><ImageIcon size={20} className="text-muted-foreground" /></div>
              <div className="text-center">
                <p className="text-sm font-medium">Click to upload logo</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, SVG up to 2MB</p>
              </div>
            </div>
          )}
          <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
          <Button type="button" variant="outline" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
            {uploadingLogo ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />Uploading...</>) : (<><Upload size={16} className="mr-2" />{logoUrl ? 'Change Logo' : 'Upload Logo'}</>)}
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or paste URL</span></div>
          </div>
          <div>
            <Label htmlFor="logo_url">Logo URL</Label>
            <Input id="logo_url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
          </div>
          <Button onClick={() => saveSetting('logo', { url: logoUrl, alt: 'Site Logo' })} disabled={saving || !logoUrl}>
            <Save size={16} className="mr-2" />Save Logo
          </Button>
        </div>
      </div>

      {/* Favicon */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Globe size={24} className="text-primary" />
          <h3 className="text-lg font-semibold">Favicon (Browser Icon)</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Browser tab এ এই icon দেখাবে</p>
        <div className="space-y-4">
          {faviconUrl && (
            <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg border border-border">
              <img src={faviconUrl} alt="Favicon" className="w-8 h-8 object-contain" />
              <span className="text-sm text-muted-foreground truncate">{faviconUrl}</span>
            </div>
          )}
          <input ref={faviconInputRef} type="file" accept="image/*" onChange={handleFaviconUpload} className="hidden" />
          <Button type="button" variant="outline" onClick={() => faviconInputRef.current?.click()} disabled={uploadingFavicon}>
            {uploadingFavicon ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />Uploading...</>) : (<><Upload size={16} className="mr-2" />{faviconUrl ? 'Change Favicon' : 'Upload Favicon'}</>)}
          </Button>
          <div>
            <Label htmlFor="favicon_url">Or paste Favicon URL</Label>
            <Input id="favicon_url" value={faviconUrl} onChange={(e) => setFaviconUrl(e.target.value)} placeholder="https://..." />
          </div>
          <Button onClick={() => { saveSetting('favicon', { url: faviconUrl }); const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement; if (link) link.href = faviconUrl; }} disabled={saving || !faviconUrl}>
            <Save size={16} className="mr-2" />Save Favicon
          </Button>
        </div>
      </div>

      {/* Header Content */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Phone size={24} className="text-primary" />
          <h3 className="text-lg font-semibold">Header Content</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Header এ দেখানো phone number ও tagline পরিবর্তন করুন</p>
        <div className="space-y-4">
          <div>
            <Label htmlFor="header_phone">Phone Number</Label>
            <Input id="header_phone" value={headerContent.phone} onChange={(e) => setHeaderContent(prev => ({ ...prev, phone: e.target.value }))} placeholder="(880) 123 456 789" />
          </div>
          <Button onClick={() => saveSetting('header_content', headerContent)} disabled={saving}>
            <Save size={16} className="mr-2" />Save Header Content
          </Button>
        </div>
      </div>

      {/* Footer Content */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText size={24} className="text-primary" />
          <h3 className="text-lg font-semibold">Footer Content</h3>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="tagline">Tagline (Logo এর নিচে দেখাবে)</Label>
            <Textarea id="tagline" value={footerContent.tagline} onChange={(e) => setFooterContent(prev => ({ ...prev, tagline: e.target.value }))} placeholder="Empowering Muslim lifestyle since 2016." rows={2} />
          </div>
          <div>
            <Label htmlFor="copyright">Copyright Text</Label>
            <Input id="copyright" value={footerContent.copyright} onChange={(e) => setFooterContent(prev => ({ ...prev, copyright: e.target.value }))} placeholder="One Ummah BD" />
          </div>
          <Button onClick={() => saveSetting('footer_content', footerContent)} disabled={saving}>
            <Save size={16} className="mr-2" />Save Footer Content
          </Button>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <MapPin size={24} className="text-primary" />
          <h3 className="text-lg font-semibold">Contact Information</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Footer এ এই contact information দেখাবে</p>
        <div className="space-y-4">
          <div>
            <Label htmlFor="contact_phone" className="flex items-center gap-2"><Phone size={16} className="text-accent" />Phone Number</Label>
            <Input id="contact_phone" value={footerContent.phone} onChange={(e) => setFooterContent(prev => ({ ...prev, phone: e.target.value }))} placeholder="09617827080" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="contact_email" className="flex items-center gap-2"><Mail size={16} className="text-accent" />Email Address</Label>
            <Input id="contact_email" type="email" value={footerContent.email} onChange={(e) => setFooterContent(prev => ({ ...prev, email: e.target.value }))} placeholder="oneummahbd@gmail.com" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="contact_address" className="flex items-center gap-2"><MapPin size={16} className="text-accent" />Address</Label>
            <Input id="contact_address" value={footerContent.address} onChange={(e) => setFooterContent(prev => ({ ...prev, address: e.target.value }))} placeholder="Dhaka, BD" className="mt-1" />
          </div>
          <Button onClick={() => saveSetting('footer_content', footerContent)} disabled={saving}>
            <Save size={16} className="mr-2" />Save Contact Info
          </Button>
        </div>
      </div>

      {/* WhatsApp Live Chat */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-[#25D366]"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/></svg>
          <h3 className="text-lg font-semibold">WhatsApp Number</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Customer ra direct WhatsApp e contact korte parbe. Country code soho dewa chai (e.g. +8801XXXXXXXXX).</p>
        <div className="space-y-4">
          <div>
            <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
            <Input id="whatsapp_number" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="+8801XXXXXXXXX" className="mt-1" />
          </div>
          <Button onClick={() => saveSetting('whatsapp_number', whatsappNumber)} disabled={saving}>
            <Save size={16} className="mr-2" />Save WhatsApp Number
          </Button>
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Share2 size={24} className="text-primary" />
          <h3 className="text-lg font-semibold">Social Media Links</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Footer এ social media icons এ এই links যুক্ত হবে</p>
        <div className="space-y-4">
          <div>
            <Label htmlFor="facebook" className="flex items-center gap-2"><div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">f</div>Facebook URL</Label>
            <Input id="facebook" value={socialLinks.facebook} onChange={(e) => setSocialLinks(prev => ({ ...prev, facebook: e.target.value }))} placeholder="https://facebook.com/yourpage" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="instagram" className="flex items-center gap-2"><div className="w-5 h-5 bg-gradient-to-br from-purple-600 to-pink-500 rounded flex items-center justify-center text-white text-xs font-bold">IG</div>Instagram URL</Label>
            <Input id="instagram" value={socialLinks.instagram} onChange={(e) => setSocialLinks(prev => ({ ...prev, instagram: e.target.value }))} placeholder="https://instagram.com/yourpage" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="youtube" className="flex items-center gap-2"><div className="w-5 h-5 bg-red-600 rounded flex items-center justify-center text-white text-xs font-bold">▶</div>YouTube URL</Label>
            <Input id="youtube" value={socialLinks.youtube} onChange={(e) => setSocialLinks(prev => ({ ...prev, youtube: e.target.value }))} placeholder="https://youtube.com/@yourchannel" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="linkedin" className="flex items-center gap-2"><div className="w-5 h-5 bg-blue-700 rounded flex items-center justify-center text-white text-xs font-bold">in</div>LinkedIn URL</Label>
            <Input id="linkedin" value={socialLinks.linkedin} onChange={(e) => setSocialLinks(prev => ({ ...prev, linkedin: e.target.value }))} placeholder="https://linkedin.com/company/yourcompany" className="mt-1" />
          </div>
          <Button onClick={() => saveSetting('social_links', socialLinks)} disabled={saving}>
            <Save size={16} className="mr-2" />Save Social Links
          </Button>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard size={24} className="text-primary" />
          <h3 className="text-lg font-semibold">Payment Methods</h3>
        </div>
        <div className="space-y-4">
          {[
            { key: 'bkash', label: 'bKash', color: 'bg-pink-500', icon: 'bK' },
            { key: 'nagad', label: 'Nagad', color: 'bg-orange-500', icon: 'N' },
            { key: 'roket', label: 'Roket', color: 'bg-purple-500', icon: 'R' },
            { key: 'cod', label: 'Cash on Delivery', color: 'bg-accent', icon: 'COD' },
          ].map((method) => (
            <div key={method.key} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${method.color} rounded-lg flex items-center justify-center text-white font-bold text-sm`}>{method.icon}</div>
                <span className="font-medium">{method.label}</span>
              </div>
              <Switch
                checked={paymentMethods[method.key as keyof typeof paymentMethods]}
                onCheckedChange={(checked) => handlePaymentMethodsChange(method.key, checked)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Payment Numbers */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Phone size={24} className="text-primary" />
          <h3 className="text-lg font-semibold">Payment Numbers (Send Money)</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">এই নম্বরগুলো Checkout পেজে দেখাবে যেখানে কাস্টমার Send Money করবে</p>
        <div className="space-y-4">
          {[
            { key: 'bkash', label: 'bKash Number', color: 'bg-pink-500', icon: 'bK' },
            { key: 'nagad', label: 'Nagad Number', color: 'bg-orange-500', icon: 'N' },
            { key: 'rocket', label: 'Rocket Number', color: 'bg-purple-500', icon: 'R' },
          ].map((item) => (
            <div key={item.key}>
              <Label htmlFor={`${item.key}_number`} className="flex items-center gap-2">
                <span className={`w-6 h-6 ${item.color} rounded text-white text-xs flex items-center justify-center font-bold`}>{item.icon}</span>
                {item.label}
              </Label>
              <Input id={`${item.key}_number`} value={paymentNumbers[item.key as keyof typeof paymentNumbers]} onChange={(e) => handlePaymentNumberChange(item.key, e.target.value)} placeholder="01XXXXXXXXX" className="mt-1" />
            </div>
          ))}
          <Button onClick={() => saveSetting('payment_numbers', paymentNumbers)} disabled={saving}>
            <Save size={16} className="mr-2" />Save Payment Numbers
          </Button>
        </div>
      </div>

      {/* Theme Settings Info */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Sun size={24} className="text-primary" />
          <h3 className="text-lg font-semibold">Theme</h3>
        </div>
        <p className="text-muted-foreground">
          Users can toggle between light and dark mode using the theme toggle button in the header. The theme preference is saved in their browser.
        </p>
      </div>
    </div>
  );
};
