import { AppShell } from "@/components/layout/app-shell";
import { fetchWorldCupData } from "@/lib/data/service";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const data = await fetchWorldCupData();
  return <AppShell data={data}>{children}</AppShell>;
}
