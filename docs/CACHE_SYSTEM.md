# Event-Driven Cache System

This document describes the caching system implemented for improved performance and reduced database load.

## Overview

The cache system is **event-driven**, meaning:
- Cache is **never** automatically expired based on time
- Cache is **only** cleared when the admin explicitly saves content changes
- This eliminates unnecessary database queries and provides instant TTFB (Time To First Byte)

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Express   │────▶│   In-Memory │
│  (Visitor)  │     │   Server    │     │    Cache    │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                           │                    │ (cache miss)
                           ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐
                    │ Admin Panel │────▶│  PostgreSQL │
                    │  (Updates)  │     │  Database   │
                    └─────────────┘     └─────────────┘
                           │
                           │ (POST /api/cache-clear)
                           ▼
                    ┌─────────────┐
                    │ Clear &     │
                    │ Refresh     │
                    └─────────────┘
```

## Components

### 1. Backend (lib/cache)

Located in `lib/cache/src/cache.ts`:
- `getCache<T>(key)` - Get cached data
- `setCache<T>(key, data)` - Store data in cache
- `clearCache(key)` - Clear specific cache entry
- `clearAllCache()` - Clear all cache entries
- `validateCacheWebhookToken(token)` - Validate webhook authentication

### 2. Server Routes (artifacts/api-server/src/routes/cache.ts)

**POST /api/cache-clear**

Clears the server cache and optionally pre-warms it with fresh data.

**Headers:**
```
x-webhook-token: <your-cache-webhook-secret>
Content-Type: application/json
```

**Body (optional):**
```json
{
  "refreshSSR": true
}
```

**Responses:**
- `200`: Cache cleared successfully
- `401`: Invalid or missing token

**GET /api/cache-stats**

Debug endpoint to view cache status.

### 3. SSR Integration (artifacts/api-server/src/lib/ssr.ts)

Modified to use caching:
- `fetchSSRData()` - Returns cached data if available, otherwise fetches from DB
- `refreshSSRCache()` - Force refresh cache (used after admin updates)

## Setup Instructions

### 1. Server Configuration

Add to your environment variables (`artifacts/api-server/.env`):

```env
CACHE_WEBHOOK_SECRET=your-strong-random-secret
```

Generate a strong secret:
```bash
openssl rand -base64 32
```

### 2. Frontend Configuration

Add to your environment variables (`artifacts/mockup-sandbox/.env`):

```env
VITE_CACHE_WEBHOOK_TOKEN=your-cache-webhook-secret
```

**Important:** The frontend token must match the server secret exactly.

### 3. Usage in Admin Panel

Import and use the `useClearCache` hook in your admin components:

```tsx
import { useClearCache } from "@/hooks/use-cache";

function SettingsPage() {
  const clearCache = useClearCache();

  async function handleSave() {
    // 1. Save the settings
    await saveSettings(formData);
    
    // 2. Clear the cache so visitors see the changes
    await clearCache.mutateAsync({ refreshSSR: true });
    
    // 3. Show success message
    toast.success("Settings saved and cache refreshed!");
  }

  return (
    <form onSubmit={handleSave}>
      {/* ... form fields ... */}
      <button type="submit">Save</button>
    </form>
  );
}
```

## Security Considerations

1. **Webhook Token**: The cache clear endpoint is protected by a secret token. Never expose this token publicly.

2. **Environment Variables**: Store secrets in environment variables, never in code.

3. **Access Control**: Only admin users should have access to trigger the cache clear webhook.

## Performance Benefits

- **TTFB**: Instant response from in-memory cache
- **Database Load**: Reduced from N queries per visit to 1 query per content update
- **No Flicker**: SSR data is injected into HTML, eliminating content flash

## Troubleshooting

### Cache not clearing?

1. Verify the webhook token matches between server and client
2. Check server logs for cache-related messages
3. Ensure `CACHE_WEBHOOK_SECRET` is set on the server

### Still seeing old content?

1. Hard refresh the page (Ctrl+Shift+R / Cmd+Shift+R)
2. Check if `refreshSSR: true` is being passed to the mutation
3. Verify the API request is completing successfully

### Cache growing too large?

The in-memory cache is designed for single-server deployments. For multi-server deployments, consider:
- Using Redis instead of in-memory cache
- Implementing cache invalidation across all servers
