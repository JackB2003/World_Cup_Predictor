import fs from "fs/promises";
import path from "path";
import { ensureAdminAuth } from "@/lib/pocketbase/admin";
import { COLLECTIONS } from "@/lib/pocketbase/collections";

const BASE_URL = "https://v3.football.api-sports.io";
const DAILY_LIMIT = 100;
const WARN_THRESHOLD = 95;

type FetchOptions = {
  endpoint: string;
  params?: Record<string, string | number>;
  ttlHours?: number;
  skipCache?: boolean;
};

function cacheKey(endpoint: string, params?: Record<string, string | number>): string {
  const sorted = params
    ? Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&")
    : "";
  return `${endpoint}?${sorted}`;
}

async function getRequestsUsedToday(pb: Awaited<ReturnType<typeof ensureAdminAuth>>): Promise<number> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const logs = await pb.collection(COLLECTIONS.apiRequestLogs).getFullList({
    filter: `requestTimestamp >= "${start.toISOString()}"`,
  });
  return logs.length;
}

async function logRequest(
  pb: Awaited<ReturnType<typeof ensureAdminAuth>>,
  endpoint: string,
  status: number,
  errorMessage?: string,
) {
  const used = await getRequestsUsedToday(pb);
  await pb.collection(COLLECTIONS.apiRequestLogs).create({
    endpoint,
    requestTimestamp: new Date().toISOString(),
    requestsUsedToday: used + 1,
    responseStatus: status,
    errorMessage: errorMessage ?? "",
  });
}

function mockFileName(endpoint: string, params?: Record<string, string | number>): string {
  return cacheKey(endpoint, params).replace(/[?&=/]/g, "_").replace(/^_+/, "");
}

async function readMock(endpoint: string, params?: Record<string, string | number>): Promise<unknown> {
  const file = path.join(process.cwd(), "fixtures", "api-football", `${mockFileName(endpoint, params)}.json`);
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { response: [], results: 0, errors: ["mock file not found"] };
  }
}

async function getCached(
  pb: Awaited<ReturnType<typeof ensureAdminAuth>>,
  key: string,
): Promise<{ response: unknown; fetchedAt: string; ttlHours: number } | null> {
  try {
    const records = await pb.collection(COLLECTIONS.apiCache).getFullList({
      filter: `cacheKey = "${key.replace(/"/g, '\\"')}"`,
      sort: "-fetchedAt",
    });
    const hit = records[0];
    if (!hit) return null;
    const ageHours = (Date.now() - new Date(hit.fetchedAt).getTime()) / 3600000;
    if (ageHours > (hit.ttlHours ?? 6)) return null;
    return { response: hit.response, fetchedAt: hit.fetchedAt, ttlHours: hit.ttlHours };
  } catch {
    return null;
  }
}

async function setCache(
  pb: Awaited<ReturnType<typeof ensureAdminAuth>>,
  key: string,
  endpoint: string,
  response: unknown,
  ttlHours: number,
) {
  const existing = await pb.collection(COLLECTIONS.apiCache).getFullList({
    filter: `cacheKey = "${key.replace(/"/g, '\\"')}"`,
  });
  for (const r of existing) await pb.collection(COLLECTIONS.apiCache).delete(r.id);
  await pb.collection(COLLECTIONS.apiCache).create({
    cacheKey: key,
    endpoint,
    response,
    fetchedAt: new Date().toISOString(),
    ttlHours,
  });
}

async function apiFootballFetch<T = unknown>(opts: FetchOptions): Promise<T> {
  const mock = process.env.API_FOOTBALL_MOCK === "true";
  const key = cacheKey(opts.endpoint, opts.params);

  if (mock) {
    return (await readMock(opts.endpoint, opts.params)) as T;
  }

  const pb = await ensureAdminAuth();

  if (!opts.skipCache) {
    const cached = await getCached(pb, key);
    if (cached) return cached.response as T;
  }

  const used = await getRequestsUsedToday(pb);
  if (used >= WARN_THRESHOLD) {
    throw new Error(`API-Football daily limit nearly reached (${used}/${DAILY_LIMIT})`);
  }

  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) throw new Error("API_FOOTBALL_KEY is not set");

  const url = new URL(opts.endpoint, BASE_URL);
  if (opts.params) {
    Object.entries(opts.params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  }

  const res = await fetch(url.toString(), {
    headers: { "x-apisports-key": apiKey },
    next: { revalidate: 0 },
  });

  const data = await res.json();
  await logRequest(pb, opts.endpoint, res.status, res.ok ? undefined : JSON.stringify(data.errors ?? data));

  if (!res.ok) throw new Error(`API-Football error: ${res.status}`);

  await setCache(pb, key, opts.endpoint, data, opts.ttlHours ?? 6);
  return data as T;
}

export async function getApiUsageToday(): Promise<{ used: number; limit: number }> {
  try {
    const pb = await ensureAdminAuth();
    const used = await getRequestsUsedToday(pb);
    return { used, limit: DAILY_LIMIT };
  } catch {
    return { used: 0, limit: DAILY_LIMIT };
  }
}

export const apiFootball = {
  fixtures: (params: Record<string, string | number>) =>
    apiFootballFetch({ endpoint: "/fixtures", params, ttlHours: 2 }),
  standings: (params: Record<string, string | number>) =>
    apiFootballFetch({ endpoint: "/standings", params, ttlHours: 6 }),
  teams: (params: Record<string, string | number>) =>
    apiFootballFetch({ endpoint: "/teams", params, ttlHours: 168 }),
  topScorers: (params: Record<string, string | number>) =>
    apiFootballFetch({ endpoint: "/players/topscorers", params, ttlHours: 12 }),
  injuries: (params: Record<string, string | number>) =>
    apiFootballFetch({ endpoint: "/injuries", params, ttlHours: 4 }),
  teamStatistics: (params: Record<string, string | number>) =>
    apiFootballFetch({ endpoint: "/teams/statistics", params, ttlHours: 12 }),
  predictions: (params: Record<string, string | number>) =>
    apiFootballFetch({ endpoint: "/predictions", params, ttlHours: 2 }),
  leagues: (params: Record<string, string | number>) =>
    apiFootballFetch({ endpoint: "/leagues", params, ttlHours: 168 }),
};
