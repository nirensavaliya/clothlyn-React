const cache = new Map();
const inflight = new Map();
const CACHE_TTL_MS = 60 * 1000;

export const fetchWithScanCache = async (key, fetcher) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.data;
  }

  if (inflight.has(key)) {
    return inflight.get(key);
  }

  const promise = Promise.resolve()
    .then(fetcher)
    .then((data) => {
      cache.set(key, { data, ts: Date.now() });
      inflight.delete(key);
      return data;
    })
    .catch((error) => {
      inflight.delete(key);
      throw error;
    });

  inflight.set(key, promise);
  return promise;
};

export const clearScanFetchCache = () => {
  cache.clear();
  inflight.clear();
};
