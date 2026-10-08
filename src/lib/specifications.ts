export interface SpecItem {
  label: string;
  value: string;
}

export interface SpecGroup {
  title?: string | null;
  items: SpecItem[];
}

const cleanItems = (raw: any): SpecItem[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((i: any) => ({
      label: String(i?.label ?? i?.name ?? '').trim(),
      value: String(i?.value ?? '').trim(),
    }))
    .filter((i) => i.label && i.value);
};

/**
 * Accepts either:
 *  - grouped format: [{ title, items: [{label, value}] }]
 *  - legacy flat format: [{ label, value }]
 * and always returns a normalized grouped structure.
 */
export const normalizeSpecifications = (raw: any): SpecGroup[] => {
  if (!raw) return [];
  let parsed = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed) || parsed.length === 0) return [];

  const isGrouped = parsed.some((g: any) => g && Array.isArray(g.items));

  if (!isGrouped) {
    const items = cleanItems(parsed);
    return items.length ? [{ title: null, items }] : [];
  }

  return parsed
    .map((g: any) => ({
      title: g?.title ? String(g.title).trim() : null,
      items: cleanItems(g?.items),
    }))
    .filter((g) => g.items.length > 0);
};

export const countSpecs = (groups: SpecGroup[]) =>
  groups.reduce((sum, g) => sum + g.items.length, 0);
