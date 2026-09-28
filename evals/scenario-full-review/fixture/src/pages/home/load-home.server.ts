import type { Category } from "../../domain/category";

declare function getHomeSections(): Promise<{ hero: string | null }>;
declare function listCategories(): Promise<Category[]>;

/** Two parallel calls; the category chip row shows only categories with published posts. */
export async function loadHome() {
  const [sections, categories] = await Promise.all([getHomeSections(), listCategories()]);

  // Only categories with at least one published post belong in the home chip row.
  const chipCategories = categories.filter((category) => category.publishedPostCount > 0);

  return { sections, categories: chipCategories };
}

export type HomePageData = Awaited<ReturnType<typeof loadHome>>;
