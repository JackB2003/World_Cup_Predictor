export async function runWithPocketBaseFallback<T>(
  run: () => Promise<T>,
  fallback: () => T,
  opts: { label: string; log: (result: T) => void },
): Promise<void> {
  try {
    const result = await run();
    opts.log(result);
  } catch (err) {
    const result = fallback();
    console.log(`PocketBase unavailable — ${opts.label}:`);
    opts.log(result);
    if (err instanceof Error) console.warn(err.message);
  }
}
