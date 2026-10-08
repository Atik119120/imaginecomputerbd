const CATEGORY_PRIORITY = ['monitor', 'laptop', 'gaming', 'gadget', 'desktop'];

const SUBCATEGORY_PRIORITY: Record<string, string[]> = {
  gadget: ['smart-watch', 'earbuds', 'tv-box', 'power-bank'],
  desktop: ['ai-pc', 'gaming-pc'],
};

const normalize = (value?: string | null) =>
  (value || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-');

export const getCategoryPriority = (nameOrSlug?: string | null) => {
  const value = normalize(nameOrSlug);
  const index = CATEGORY_PRIORITY.indexOf(value);
  return index === -1 ? CATEGORY_PRIORITY.length : index;
};

export const compareCatalogCategories = <T extends { name: string; slug?: string | null }>(a: T, b: T) => {
  const rankDifference = getCategoryPriority(a.slug || a.name) - getCategoryPriority(b.slug || b.name);
  return rankDifference || a.name.localeCompare(b.name);
};

export const getSubcategoryPriority = (
  categoryNameOrSlug?: string | null,
  subcategoryNameOrSlug?: string | null,
) => {
  const category = normalize(categoryNameOrSlug);
  const subcategory = normalize(subcategoryNameOrSlug);
  const priorities = SUBCATEGORY_PRIORITY[category];
  if (!priorities) return 0;

  const index = priorities.indexOf(subcategory);
  return index === -1 ? priorities.length : index;
};

export const compareCatalogProducts = <T extends {
  name: string;
  category: string;
  subcategoryName?: string;
}>(a: T, b: T) => {
  const categoryDifference = getCategoryPriority(a.category) - getCategoryPriority(b.category);
  if (categoryDifference) return categoryDifference;

  const subcategoryDifference =
    getSubcategoryPriority(a.category, a.subcategoryName || a.name) -
    getSubcategoryPriority(b.category, b.subcategoryName || b.name);
  return subcategoryDifference || a.name.localeCompare(b.name);
};