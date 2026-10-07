import { notFound } from "next/navigation";
import Explorer from "../../components/Explorer";
import { cities, categories, categorySlug, places } from "../../lib/data";
export default async function Page({ params }: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await params;
  if (
    path.length > 3 ||
    (path[0] && !cities.some((c) => c.slug === path[0])) ||
    (path[1] && !categories.some((c) => categorySlug(c) === path[1])) ||
    (path[2] &&
      !places.some(
        (p) => p.id === path[2] && p.city === path[0] && categorySlug(p.category) === path[1],
      ))
  )
    notFound();
  return <Explorer />;
}
