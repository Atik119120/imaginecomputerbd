import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, Sparkles, Loader2, X, ShoppingBag } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { CartSidebar } from '@/components/CartSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCart } from '@/context/CartContext';
import { uploadImage } from '@/lib/uploadImage';
import { toast } from 'sonner';

const PRODUCT_TYPES = ['T-Shirt', 'Polo', 'Hoodie', 'Panjabi', 'Other'];
const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const COLORS = ['Black', 'White', 'Maroon', 'Navy', 'Gray', 'Beige', 'Olive'];
const BASE_PRICE = 850; // base custom design price

const Customize = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [productType, setProductType] = useState('T-Shirt');
  const [size, setSize] = useState('M');
  const [color, setColor] = useState('Black');
  const [quantity, setQuantity] = useState(1);
  const [customText, setCustomText] = useState('');
  const [notes, setNotes] = useState('');
  const [phone, setPhone] = useState('');
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [designPreview, setDesignPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10MB');
      return;
    }
    setDesignFile(file);
    setDesignPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!designFile && !customText.trim()) {
      toast.error('Please upload a design or enter custom text');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setUploading(true);
    try {
      let designUrl = '';
      if (designFile) {
        designUrl = await uploadImage(designFile, 'custom-designs');
      }

      const customId = `custom-${Date.now()}`;
      const description = [
        `Type: ${productType}`,
        customText ? `Text: "${customText}"` : '',
        notes ? `Notes: ${notes}` : '',
        `Contact: ${phone}`,
        designUrl ? `Design: ${designUrl}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      addToCart(
        {
          id: customId,
          name: `Custom ${productType}${customText ? ` - "${customText.slice(0, 20)}"` : ''}`,
          price: BASE_PRICE,
          image: designUrl || '/placeholder.svg',
          category: 'Custom Design',
          inStock: true,
          description,
          sku: customId,
        },
        quantity,
        size,
        color,
      );

      toast.success('Custom design added to cart!');
      navigate('/checkout');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pb-14 lg:pb-0 bg-background">
        <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8 md:mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-red/10 text-primary text-xs font-semibold tracking-wider uppercase mb-3">
              <Sparkles size={14} /> Custom Design
            </div>
            <h1 className="font-heading text-3xl md:text-5xl font-bold mb-3">
              Design Your Own Product
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Upload your design or write custom text — we'll bring it to life. Starting at ৳{BASE_PRICE}.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            {/* Left: Preview */}
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              className="md:sticky md:top-24 self-start"
            >
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-muted to-muted/50 border border-border overflow-hidden relative flex items-center justify-center">
                {designPreview ? (
                  <>
                    <img
                      src={designPreview}
                      alt="Your design"
                      className="max-w-[80%] max-h-[80%] object-contain drop-shadow-xl"
                    />
                    <button
                      onClick={() => {
                        setDesignFile(null);
                        setDesignPreview(null);
                      }}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-background/90 hover:bg-background flex items-center justify-center shadow-lg"
                      aria-label="Remove design"
                    >
                      <X size={18} />
                    </button>
                  </>
                ) : (
                  <div className="text-center px-6">
                    <Upload className="mx-auto mb-3 text-muted-foreground" size={48} />
                    <p className="text-sm text-muted-foreground">
                      Live preview of your design will appear here
                    </p>
                  </div>
                )}
                {customText && !designPreview && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-heading text-3xl md:text-4xl font-bold text-foreground/80 px-6 text-center">
                      {customText}
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between px-2">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Color</p>
                  <p className="font-semibold">{color}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
                  <p className="font-bold text-lg text-primary">
                    ৳{BASE_PRICE * quantity}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Right: Form */}
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              {/* Upload */}
              <div>
                <Label className="mb-2 block font-semibold">Upload Your Design</Label>
                <label className="block border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-6 text-center cursor-pointer transition-colors">
                  <input
                    type="file"
                    accept="image/*,.pdf,.ai,.psd"
                    className="hidden"
                    onChange={handleFile}
                  />
                  <Upload className="mx-auto mb-2 text-muted-foreground" size={28} />
                  <p className="text-sm font-medium">
                    {designFile ? designFile.name : 'Click to upload (JPG, PNG, PDF — max 10MB)'}
                  </p>
                </label>
              </div>

              {/* Custom text */}
              <div>
                <Label htmlFor="text" className="mb-2 block font-semibold">
                  Custom Text <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="e.g. Your name, quote, slogan"
                  maxLength={50}
                />
              </div>

              {/* Product type / Color / Size */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-2 block font-semibold">Product</Label>
                  <Select value={productType} onValueChange={setProductType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRODUCT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block font-semibold">Size</Label>
                  <Select value={size} onValueChange={setSize}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Color swatches */}
              <div>
                <Label className="mb-2 block font-semibold">Color</Label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                        color === c
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <Label className="mb-2 block font-semibold">Quantity</Label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >−</Button>
                  <span className="w-12 text-center font-semibold">{quantity}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                  >+</Button>
                </div>
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone" className="mb-2 block font-semibold">Your Phone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  required
                />
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes" className="mb-2 block font-semibold">
                  Special Instructions <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Placement, colors, any special request..."
                  rows={3}
                />
              </div>

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={uploading}
                size="lg"
                className="w-full text-base font-semibold btn-shine"
              >
                {uploading ? (
                  <><Loader2 className="mr-2 animate-spin" size={18} /> Uploading...</>
                ) : (
                  <><ShoppingBag className="mr-2" size={18} /> Confirm & Add to Cart — ৳{BASE_PRICE * quantity}</>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Our team will contact you within 24 hours to confirm your design.
              </p>
            </motion.div>
          </div>
        </div>
      </main>
      <CartSidebar />
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default Customize;
