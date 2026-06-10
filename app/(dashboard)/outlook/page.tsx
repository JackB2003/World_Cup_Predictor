import { OutlookView } from "@/components/views/outlook";
import { fetchWorldCupData } from "@/lib/data/service";

export default async function OutlookPage() {
  const data = await fetchWorldCupData();
  return <OutlookView data={data} />;
}
