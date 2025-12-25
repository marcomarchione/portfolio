/**
 * Query Client Configuration
 *
 * TanStack Query client with default settings.
 */
import { QueryClient } from '@tanstack/react-query';

/**
 * Default stale time: 5 minutes.
 */
const DEFAULT_STALE_TIME = 5 * 60 * 1000;

/**
 * Default retry count.
 */
const DEFAULT_RETRY = 1;

/**
 * Query client singleton instance.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: DEFAULT_STALE_TIME,
      retry: DEFAULT_RETRY,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
