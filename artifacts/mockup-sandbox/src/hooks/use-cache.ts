import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clearServerCache } from "@workspace/api-client-react";

/**
 * Environment variable name for the cache webhook token
 * Set this in your environment configuration
 */
const CACHE_WEBHOOK_TOKEN = import.meta.env.VITE_CACHE_WEBHOOK_TOKEN || "";

/**
 * Hook to clear server cache after content updates
 * 
 * This hook should be used in admin panels after saving any content changes
 * (settings, pages, services, projects, navigation, etc.)
 * 
 * @example
 * ```tsx
 * function SettingsPage() {
 *   const clearCache = useClearCache();
 *   
 *   async function handleSave() {
 *     await saveSettings();
 *     // Trigger cache refresh so visitors see the new content
 *     await clearCache.mutateAsync({ refreshSSR: true });
 *   }
 *   
 *   return <button onClick={handleSave}>Save</button>;
 * }
 * ```
 */
export function useClearCache() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options?: { refreshSSR?: boolean }) => {
      if (!CACHE_WEBHOOK_TOKEN) {
        console.warn(
          "Cache webhook token not configured. Set VITE_CACHE_WEBHOOK_TOKEN in your environment."
        );
        return null;
      }

      return clearServerCache({
        webhookToken: CACHE_WEBHOOK_TOKEN,
        refreshSSR: options?.refreshSSR ?? true,
      });
    },
    onSuccess: () => {
      // Optionally invalidate queries to update the UI
      // queryClient.invalidateQueries();
    },
  });
}

/**
 * Higher-order function to create a cache clearing handler for forms
 * 
 * @param queryClient - React Query client instance
 * @returns A function that saves data AND clears the cache
 * 
 * @example
 * ```tsx
 * const clearCacheAfterSave = useCreateCacheClearingHandler(queryClient);
 * 
 * async function handleSubmit(data: FormData) {
 *   await clearCacheAfterSave(
 *     () => saveSettings(data),
 *     { refreshSSR: true }
 *   );
 * }
 * ```
 */
export function useCreateCacheClearingHandler() {
  const clearCache = useClearCache();

  return async function clearCacheAfterSave<T>(
    saveFn: () => Promise<T>,
    options?: { refreshSSR?: boolean }
  ): Promise<T> {
    // First, save the data
    const result = await saveFn();
    
    // Then, clear the server cache
    try {
      await clearCache.mutateAsync(options);
    } catch (error) {
      console.error("Failed to clear cache:", error);
      // Don't throw - the save was successful
    }
    
    return result;
  };
}
