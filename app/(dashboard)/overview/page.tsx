import { OverviewView } from "@/components/views/overview";
import { fetchWorldCupData } from "@/lib/data/service";

export default async function OverviewPage() {
  const data = await fetchWorldCupData();
  return <OverviewView data={data} />;
}
