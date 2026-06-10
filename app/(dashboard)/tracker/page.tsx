import { TrackerView } from "@/components/views/tracker";
import { fetchWorldCupData } from "@/lib/data/service";

export default async function TrackerPage() {
  const data = await fetchWorldCupData();
  return <TrackerView data={data} />;
}
