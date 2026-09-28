import type { HomePageData } from "./load-home.server";

export interface HomePageProps {
  data: HomePageData;
}

export const HomePage = ({ data }: HomePageProps) => {
  return (
    <main>
      <h1>Front page</h1>
      <ul>
        {data.categories.map((category) => (
          <li key={category.id}>{category.name}</li>
        ))}
      </ul>
    </main>
  );
};
