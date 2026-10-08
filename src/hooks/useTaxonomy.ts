import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { compareCatalogCategories, getSubcategoryPriority } from '@/lib/catalogPriority';

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  is_active: boolean;
  display_order: number;
}

export interface NavCategory {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  icon_key: string | null;
  description: string | null;
  is_active: boolean;
  display_order: number;
  subcategories: Subcategory[];
}

const STALE = 5 * 60 * 1000;

/** Categories + their subcategories, active only, in admin-defined order. Single cached fetch. */
export const useNavCategories = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['nav-categories'],
    queryFn: async () => {
      const [cats, subs] = await Promise.all([
        supabase
          .from('categories')
          .select('id,name,slug,image_url,icon_key,description,is_active,display_order')
          .eq('is_active', true)
          .order('display_order')
          .order('name'),
        supabase
          .from('subcategories')
          .select('*')
          .eq('is_active', true)
          .order('display_order')
          .order('name'),
      ]);
      if (cats.error) throw cats.error;
      if (subs.error) throw subs.error;
      const subList = (subs.data || []) as Subcategory[];
      return ((cats.data || []) as Omit<NavCategory, 'subcategories'>[])
        .sort(compareCatalogCategories)
        .map((c) => ({
          ...c,
          subcategories: subList
            .filter((s) => s.category_id === c.id)
            .sort((a, b) => {
              const priority = getSubcategoryPriority(c.slug, a.slug) - getSubcategoryPriority(c.slug, b.slug);
              return priority || a.display_order - b.display_order || a.name.localeCompare(b.name);
            }),
        })) as NavCategory[];
    },
    staleTime: STALE,
  });

  return { navCategories: data || [], loading: isLoading };
};

export const useBrands = (activeOnly = true) => {
  const { data, isLoading } = useQuery({
    queryKey: ['brands', activeOnly],
    queryFn: async () => {
      let q = supabase.from('brands').select('*').order('display_order').order('name');
      if (activeOnly) q = q.eq('is_active', true);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as Brand[];
    },
    staleTime: STALE,
  });
  return { brands: data || [], loading: isLoading };
};

/**
 * Map of category_id -> brands that actually have products in that category.
 * Keeps each category's mega menu showing only its own brands.
 */
export const useCategoryBrands = () => {
  const { brands } = useBrands();
  const { data, isLoading } = useQuery({
    queryKey: ['category-brand-links'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('category_id,brand_id')
        .not('brand_id', 'is', null)
        .not('category_id', 'is', null);
      if (error) throw error;
      return (data || []) as { category_id: string; brand_id: string }[];
    },
    staleTime: STALE,
  });

  const byCategory: Record<string, Brand[]> = {};
  const brandById = new Map(brands.map((b) => [b.id, b]));
  for (const link of data || []) {
    const brand = brandById.get(link.brand_id);
    if (!brand) continue;
    const list = (byCategory[link.category_id] ||= []);
    if (!list.some((b) => b.id === brand.id)) list.push(brand);
  }
  for (const key of Object.keys(byCategory)) {
    byCategory[key].sort((a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name));
  }

  return { categoryBrands: byCategory, loading: isLoading };
};

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
