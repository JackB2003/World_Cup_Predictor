const TZ = "America/Chicago";

export function teamBarColor(color: string): string {
  return color === "#FFFFFF" ? "#cfd6e2" : color;
}

export function formatKickoffTime(iso?: string, fallback = "TBD"): string {
  if (!iso) return fallback;
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: TZ,
  });
}

function chicagoDateStr(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: TZ }); // "YYYY-MM-DD"
}

export function isToday(dateIso: string): boolean {
  return chicagoDateStr(new Date(dateIso)) === chicagoDateStr(new Date());
}

export function isTomorrowDate(dateIso: string): boolean {
  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
  return chicagoDateStr(new Date(dateIso)) === chicagoDateStr(tomorrow);
}
