import PocketBase from "pocketbase";
import { loadEnvIntoProcess } from "@/lib/env-file.js";

loadEnvIntoProcess();

let adminPb: PocketBase | null = null;

function getAdminPocketBase(): PocketBase {
  if (adminPb) return adminPb;

  const url = process.env.POCKETBASE_URL;
  if (!url) throw new Error("POCKETBASE_URL is not set");

  adminPb = new PocketBase(url);
  adminPb.autoCancellation(false);
  return adminPb;
}

export async function ensureAdminAuth(): Promise<PocketBase> {
  const pb = getAdminPocketBase();
  if (pb.authStore.isValid) return pb;

  const email = process.env.POCKETBASE_ADMIN_EMAIL;
  const password = process.env.POCKETBASE_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD are required");
  }

  await pb.collection("_superusers").authWithPassword(email, password);
  return pb;
}

export function getPublicPocketBase(): PocketBase {
  const url = process.env.POCKETBASE_URL;
  if (!url) throw new Error("POCKETBASE_URL is not set");
  const pb = new PocketBase(url);
  pb.autoCancellation(false);
  return pb;
}
