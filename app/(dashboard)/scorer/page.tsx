import { ScorerView } from "@/components/views/scorer";
import { fetchWorldCupData } from "@/lib/data/service";

export default async function ScorerPage() {
  const data = await fetchWorldCupData();
  return <ScorerView data={data} />;
}
