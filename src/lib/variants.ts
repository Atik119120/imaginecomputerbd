export interface VariantValue {
  value: string;
  image?: string;
  priceDelta?: number;
}

export interface VariantOption {
  name: string;
  values: VariantValue[];
}

export const normalizeVariants = (raw: unknown): VariantOption[] => {
  if (!Array.isArray(raw)) return [];
  const out: VariantOption[] = [];
  for (const opt of raw as any[]) {
    const name = String(opt?.name ?? '').trim();
    const rawValues = Array.isArray(opt?.values) ? opt.values : [];
    const values: VariantValue[] = [];
    for (const v of rawValues) {
      if (typeof v === 'string') {
        const value = v.trim();
        if (value) values.push({ value });
        continue;
      }
      const value = String(v?.value ?? '').trim();
      if (!value) continue;
      const delta = Number(v?.priceDelta);
      values.push({
        value,
        image: v?.image ? String(v.image) : undefined,
        priceDelta: Number.isFinite(delta) && delta !== 0 ? delta : undefined,
      });
    }
    if (name && values.length > 0) out.push({ name, values });
  }
  return out;
};

/** Default selection: first value of every option. */
export const defaultVariantSelection = (options: VariantOption[]): Record<string, string> => {
  const sel: Record<string, string> = {};
  for (const opt of options) sel[opt.name] = opt.values[0].value;
  return sel;
};

export const variantPriceDelta = (
  options: VariantOption[],
  selection: Record<string, string>
): number =>
  options.reduce((sum, opt) => {
    const v = opt.values.find((x) => x.value === selection[opt.name]);
    return sum + (v?.priceDelta ?? 0);
  }, 0);

export const variantLabel = (selection?: Record<string, string> | null): string =>
  selection
    ? Object.entries(selection)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')
    : '';
