export function teamBarColor(color: string): string {
  return color === "#FFFFFF" ? "#cfd6e2" : color;
}

export function formatKickoffTime(iso?: string, fallback = "TBD"): string {
  if (!iso) return fallback;
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function isToday(dateIso: string): boolean {
  const d = new Date(dateIso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}
