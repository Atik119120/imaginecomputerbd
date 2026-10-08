import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { compareCatalogCategories, compareCatalogProducts } from '@/lib/catalogPriority';

export interface DatabaseProduct {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  discount: number | null;
  image_url: string | null;
  supplementary_images: string[] | null;
  category_id: string | null;
  subcategory_id?: string | null;
  brand_id?: string | null;
  colors: string[] | null;
  sizes: string[] | null;
  sku: string | null;
  in_stock: boolean | null;
  description: string | null;
  fabric?: string | null;
  is_preorder?: boolean | null;
  preorder_release_date?: string | null;
}

export interface DatabaseCategory {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  icon_key?: string | null;
  display_order?: number;
}

interface DatabaseSubcategory {
  id: string;
  name: string;
  slug: string;
}

// Transform database product to match the existing Product type used in components
export const transformProduct = (
  dbProduct: DatabaseProduct,
  categories: DatabaseCategory[],
  subcategories: DatabaseSubcategory[] = [],
) => {
  const category = categories.find(c => c.id === dbProduct.category_id);
  const subcategory = subcategories.find(s => s.id === dbProduct.subcategory_id);
  return {
    id: dbProduct.id,
    name: dbProduct.name,
    price: dbProduct.price,
    originalPrice: dbProduct.original_price ?? undefined,
    discount: dbProduct.discount ?? undefined,
    image: dbProduct.image_url || '/placeholder.svg',
    supplementaryImages: dbProduct.supplementary_images ?? undefined,
    category: category?.name || 'Uncategorized',
    subcategoryId: dbProduct.subcategory_id ?? undefined,
    subcategoryName: subcategory?.name,
    brandId: dbProduct.brand_id ?? undefined,
    colors: dbProduct.colors ?? undefined,
    sizes: dbProduct.sizes ?? undefined,
    sku: dbProduct.sku ?? undefined,
    inStock: dbProduct.in_stock ?? true,
    fabric: dbProduct.fabric ?? undefined,
    isPreorder: dbProduct.is_preorder ?? false,
    preorderReleaseDate: dbProduct.preorder_release_date ?? undefined,
  };
};

const STALE = 5 * 60 * 1000; // 5 min
const PAGE_SIZE = 1000;

const fetchAllInStockProducts = async () => {
  const allProducts: DatabaseProduct[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('in_stock', true)
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;

    const page = (data || []) as DatabaseProduct[];
    allProducts.push(...page);
    if (page.length < PAGE_SIZE) break;
  }

  return allProducts;
};

export const useProducts = () => {
  const productsQuery = useQuery({
    queryKey: ['products', 'in_stock'],
    queryFn: fetchAllInStockProducts,
    staleTime: STALE,
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('display_order').order('name');
      if (error) throw error;
      return (data || []) as DatabaseCategory[];
    },
    staleTime: STALE,
  });

  const subcategoriesQuery = useQuery({
    queryKey: ['subcategories', 'catalog-priority'],
    queryFn: async () => {
      const { data, error } = await supabase.from('subcategories').select('id,name,slug');
      if (error) throw error;
      return (data || []) as DatabaseSubcategory[];
    },
    staleTime: STALE,
  });

  const products = productsQuery.data || [];
  const categories = [...(categoriesQuery.data || [])].sort(compareCatalogCategories);
  const subcategories = subcategoriesQuery.data || [];
  const transformedProducts = products
    .map(p => transformProduct(p, categories, subcategories))
    .sort(compareCatalogProducts);

  return {
    products: transformedProducts,
    categories,
    loading: productsQuery.isLoading || categoriesQuery.isLoading || subcategoriesQuery.isLoading,
    error: (productsQuery.error || categoriesQuery.error || subcategoriesQuery.error) as any,
    rawProducts: products,
  };
};

export const useCategories = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('display_order').order('name');
      if (error) throw error;
      return ((data || []) as DatabaseCategory[]).sort(compareCatalogCategories);
    },
    staleTime: STALE,
  });
  return { categories: data || [], loading: isLoading, error: error as any };
};
