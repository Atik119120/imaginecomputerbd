import { SpecGroup } from '@/lib/specifications';
import { VariantOption } from '@/lib/variants';

export interface PackageOption {
  name: string;
  price: number;
  weight?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  supplementaryImages?: string[];
  category: string;
  subcategoryId?: string;
  brandId?: string;
  colors?: string[];
  colorImages?: Record<string, string>;
  sizes?: string[];
  sku?: string;
  inStock?: boolean;
  description?: string;
  fabric?: string;
  isPreorder?: boolean;
  preorderReleaseDate?: string;
  sizeChart?: { headers: string[]; rows: string[][] } | null;
  returnPolicy?: string;
  moreInfo?: { label: string; value: string }[] | null;
  packages?: PackageOption[];
  brand?: string;
  model?: string;
  warranty?: string;
  specifications?: SpecGroup[];
  variants?: VariantOption[];
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  selectedPackage?: string;
  selectedVariants?: Record<string, string>;
}

export interface Category {
  id: string;
  name: string;
  image: string;
  slug: string;
}
