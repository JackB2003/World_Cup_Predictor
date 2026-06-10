import { PicksView } from "@/components/views/picks";
import { fetchWorldCupData } from "@/lib/data/service";

export default async function PicksPage() {
  const data = await fetchWorldCupData();
  return <PicksView data={data} />;
}
