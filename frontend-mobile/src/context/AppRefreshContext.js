import React, {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from 'react';

const AppRefreshContext = createContext(null);

export function AppRefreshProvider({ children }) {
  const callbacksRef = useRef(new Map());
  const [refreshing, setRefreshing] = useState(false);

  const register = useCallback((key, fn) => {
    callbacksRef.current.set(key, fn);
    return () => {
      callbacksRef.current.delete(key);
    };
  }, []);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const tasks = [...callbacksRef.current.values()].map((fn) =>
        Promise.resolve(fn()).catch((err) => {
          console.error('App refresh error:', err);
        })
      );
      await Promise.all(tasks);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const refreshKeys = useCallback(async (...keys) => {
    await Promise.all(
      keys.map((key) => {
        const fn = callbacksRef.current.get(key);
        return fn ? Promise.resolve(fn()).catch((err) => {
          console.error(`Refresh error (${key}):`, err);
        }) : Promise.resolve();
      })
    );
  }, []);

  return (
    <AppRefreshContext.Provider value={{ register, refreshAll, refreshKeys, refreshing }}>
      {children}
    </AppRefreshContext.Provider>
  );
}

/** Regista o fetch da página; é chamado em cada refresh global. */
export function useRegisterRefresh(key, fetchFn) {
  const ctx = useContext(AppRefreshContext);
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  useEffect(() => {
    if (!ctx) return undefined;
    return ctx.register(key, () => fetchRef.current());
  }, [key, ctx]);
}

/** Pull-to-refresh: actualiza todos os dados registados na app. */
export function usePullToRefresh() {
  const ctx = useContext(AppRefreshContext);
  if (!ctx) {
    return { refreshing: false, onRefresh: async () => {}, refreshKeys: async () => {} };
  }
  return {
    refreshing: ctx.refreshing,
    onRefresh: ctx.refreshAll,
    refreshKeys: ctx.refreshKeys,
  };
}
