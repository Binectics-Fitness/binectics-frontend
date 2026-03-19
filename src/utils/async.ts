/**
 * Async Utilities
 * Concurrency-limited helpers for batched API requests.
 */

/**
 * Map over an array with a concurrency limit, executing the async mapper
 * for at most `concurrency` items at a time.
 *
 * This avoids the N+1 "fan-out" problem where `Promise.all` fires every
 * request simultaneously, overwhelming the API and increasing latency.
 *
 * @param items - The array of items to process
 * @param mapper - An async function to apply to each item
 * @param concurrency - Maximum number of in-flight promises (default 5)
 * @returns A promise that resolves to the mapped results in the same order
 */
export async function pMap<T, R>(
  items: T[],
  mapper: (item: T, index: number) => Promise<R>,
  concurrency: number = 5,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const idx = nextIndex++;
      results[idx] = await mapper(items[idx], idx);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker(),
  );

  await Promise.all(workers);
  return results;
}
