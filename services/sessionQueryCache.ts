import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";

const LEGACY_CACHE_KEY = "REACT_QUERY_OFFLINE_CACHE";

export function createSessionQueryCache(userId: string | null) {
  const queryClient = new QueryClient();
  let closed = false;
  let pendingWrite = Promise.resolve();
  const stored = createAsyncStoragePersister({
    key: `gathergo-query:${userId}`,
    storage: userId === null ? undefined : {
      getItem: (key) => AsyncStorage.getItem(key),
      removeItem: (key) => AsyncStorage.removeItem(key),
      setItem: (key, value) => {
        const write = pendingWrite.then(async () => {
          if (!closed) await AsyncStorage.setItem(key, value);
        });
        pendingWrite = write.catch(() => {});
        return write;
      },
    },
  });
  const persister: typeof stored = {
    persistClient: (client) => closed ? Promise.resolve() : stored.persistClient(client),
    restoreClient: async () => {
      const client = await stored.restoreClient();
      return closed ? undefined : client;
    },
    removeClient: () => stored.removeClient(),
  };

  return {
    queryClient,
    persister,
    clear: async () => {
      // Stop queued persistence writes before releasing this account's client.
      closed = true;
      const cancellation = queryClient.cancelQueries();
      queryClient.clear();
      await cancellation;
      await pendingWrite;
      await stored.removeClient();
      await AsyncStorage.removeItem(LEGACY_CACHE_KEY);
    },
  };
}

let activeCache: ReturnType<typeof createSessionQueryCache> | null = null;

export function registerSessionQueryCache(cache: NonNullable<typeof activeCache>) {
  activeCache = cache;
  return () => {
    if (activeCache === cache) activeCache = null;
  };
}

export async function clearSessionQueryCache() {
  if (activeCache) await activeCache.clear();
  else await AsyncStorage.removeItem(LEGACY_CACHE_KEY);
}
