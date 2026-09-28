export interface Category {
  id: string;
  name: string;
  /** Count of published posts in this category. Never negative; zero for a new category. */
  publishedPostCount: number;
}
