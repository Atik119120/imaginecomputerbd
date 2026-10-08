import { useRef, useState } from 'react';
import { Plus, Trash2, Upload, X, ChevronUp, ChevronDown, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadImage } from '@/lib/uploadImage';
import { useToast } from '@/hooks/use-toast';
import { VariantOption } from '@/lib/variants';

interface Props {
  options: VariantOption[];
  onChange: (options: VariantOption[]) => void;
}

const PRESETS = ['Color', 'Storage', 'RAM', 'Model', 'Capacity', 'Size'];

export const VariantBuilder = ({ options, onChange }: Props) => {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [target, setTarget] = useState<{ o: number; v: number } | null>(null);
  const [uploading, setUploading] = useState(false);

  const update = (next: VariantOption[]) => onChange(next);

  const addOption = (name = '') => update([...options, { name, values: [{ value: '' }] }]);

  const setOption = (i: number, patch: Partial<VariantOption>) =>
    update(options.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));

  const removeOption = (i: number) => update(options.filter((_, idx) => idx !== i));

  const moveOption = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= options.length) return;
    const next = [...options];
    [next[i], next[j]] = [next[j], next[i]];
    update(next);
  };

  const setValue = (o: number, v: number, patch: Partial<VariantOption['values'][number]>) =>
    setOption(o, {
      values: options[o].values.map((val, idx) => (idx === v ? { ...val, ...patch } : val)),
    });

  const addValue = (o: number) => setOption(o, { values: [...options[o].values, { value: '' }] });

  const removeValue = (o: number, v: number) =>
    setOption(o, { values: options[o].values.filter((_, idx) => idx !== v) });

  const pickImage = (o: number, v: number) => {
    setTarget({ o, v });
    fileRef.current?.click();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !target) return;
    try {
      setUploading(true);
      const url = await uploadImage(file, 'products');
      setValue(target.o, target.v, { image: url });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      setTarget(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Label className="text-base">Product Variations</Label>
          <p className="text-xs text-muted-foreground">
            e.g. Storage: 128GB / 256GB, Color: Black / Yellow. Add an image to a value to switch the
            product photo when a customer selects it.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <Button key={p} type="button" size="sm" variant="outline" onClick={() => addOption(p)}>
              + {p}
            </Button>
          ))}
          <Button type="button" size="sm" onClick={() => addOption()}>
            <Plus className="h-4 w-4 mr-1" /> Custom
          </Button>
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {options.length === 0 && (
        <p className="text-sm text-muted-foreground">No variations added.</p>
      )}

      {options.map((opt, o) => (
        <div key={o} className="space-y-3 rounded-md border border-border/70 p-3">
          <div className="flex items-center gap-2">
            <Input
              value={opt.name}
              onChange={(e) => setOption(o, { name: e.target.value })}
              placeholder="Variation name (Storage, Color, Model...)"
              className="flex-1"
            />
            <Button type="button" size="icon" variant="ghost" onClick={() => moveOption(o, -1)}>
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button type="button" size="icon" variant="ghost" onClick={() => moveOption(o, 1)}>
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button type="button" size="icon" variant="ghost" onClick={() => removeOption(o)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>

          <div className="space-y-2">
            {opt.values.map((val, v) => (
              <div key={v} className="flex flex-wrap items-center gap-2">
                <Input
                  value={val.value}
                  onChange={(e) => setValue(o, v, { value: e.target.value })}
                  placeholder="Value (128GB, Black...)"
                  className="flex-1 min-w-[140px]"
                />
                <Input
                  type="number"
                  value={val.priceDelta ?? ''}
                  onChange={(e) =>
                    setValue(o, v, {
                      priceDelta: e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                  placeholder="+/- price"
                  className="w-28"
                />
                {val.image ? (
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded border border-border">
                    <img src={val.image} alt={val.value} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setValue(o, v, { image: undefined })}
                      className="absolute right-0 top-0 bg-destructive text-destructive-foreground"
                      aria-label="Remove image"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={uploading}
                    onClick={() => pickImage(o, v)}
                  >
                    {uploading && target?.o === o && target?.v === v ? (
                      <ImageIcon className="h-4 w-4" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                )}
                <Button type="button" size="icon" variant="ghost" onClick={() => removeValue(o, v)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button type="button" size="sm" variant="outline" onClick={() => addValue(o)}>
              <Plus className="h-4 w-4 mr-1" /> Add value
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
