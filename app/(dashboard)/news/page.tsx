import { NewsView } from "@/components/views/news";
import { fetchWorldCupData } from "@/lib/data/service";

export default async function NewsPage() {
  const data = await fetchWorldCupData();
  return <NewsView data={data} />;
}
