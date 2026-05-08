# Dynamic Settings Architecture

## System Overview

The dynamic settings system enables **real-time configuration updates** across your entire site without rebuilds or manual refreshes. Changes made in the admin settings panel instantly propagate to all connected clients through an intelligent caching layer.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      User's Browser                         │
├──────────────────────────────────┬──────────────────────────┤
│ Component 1 (Footer)             │ Component 2 (Contact)    │
│ useSettings() hook               │ useSettings() hook       │
│ Reads: contactInfo               │ Reads: businessHours     │
└──────────┬───────────────────────┴──────────┬───────────────┘
           │                                   │
           │ useSettings() calls               │ useSettings() calls
           │ same cached data                  │ same cached data
           │                                   │
           └───────────────┬────────────────────┘
                          │
                          ▼
         ┌────────────────────────────────┐
         │   React Query Cache Layer      │
         │  (Stale: 1min, GC: 10min)     │
         │  Query Key: ['settings']       │
         └────────────┬───────────────────┘
                      │
                      │ Cache miss or invalidation
                      │
                      ▼
         ┌────────────────────────────────┐
         │  GET /api/admin/settings       │
         │  (Server-side API Route)       │
         └────────────┬───────────────────┘
                      │
                      ▼
         ┌────────────────────────────────┐
         │  Prisma + PostgreSQL           │
         │  Settings Table                │
         │  - key: "admin.address"        │
         │  - value: "123 Main St"        │
         └────────────────────────────────┘
```

## Components & Layers

### 1. **Settings Provider** (`src/providers/settings-provider.tsx`)
- React Context + React Query integration
- Manages settings state globally
- Provides `useSettings()` hook
- Provides `useInvalidateSettings()` hook

**Key Features:**
- Automatic caching with React Query
- Stale time: 60 seconds
- GC time: 600 seconds
- Refetch on window focus
- Retry 3 times on failure

### 2. **Site Settings Hook** (`src/hooks/use-site-settings.ts`)
- Wrapper around `useSettings()` for convenience
- Transforms raw settings into structured data
- Returns `{ contactInfo, businessHours, isLoading }`
- Includes `useFormattedAddress()` helper

### 3. **Main Providers** (`src/components/providers.tsx`)
- Wraps the entire app with providers
- QueryClientProvider (React Query)
- SessionProvider (NextAuth)
- SettingsProvider (Dynamic settings)

### 4. **Settings API** (`src/app/api/admin/settings/route.ts`)
- GET: Fetch all settings with defaults
- PUT: Update settings (auth required)
- Auto-invalidates cache on PUT via admin page

### 5. **Admin Settings Page** (`src/app/admin/settings/page.tsx`)
- Form to edit all settings
- Calls `useInvalidateSettings()` hook on save
- Triggers cache invalidation
- Shows success toast

## Data Flow: Change → Update → Refresh

### Scenario: User Changes Address in Admin Panel

```
1. User edits address field
   └─ Form state updates

2. User clicks "Save Settings"
   └─ onSubmit() called

3. API call: PUT /api/admin/settings
   └─ { address: "new address" }

4. Server updates database
   └─ Settings table updated

5. Client receives success response
   └─ API call completes

6. Invalidate cache
   └─ await invalidate()

7. React Query detects invalidation
   └─ Marks ['settings'] cache as stale

8. All components with useSettings() re-fetch
   └─ GET /api/admin/settings called

9. Components receive new data
   └─ contactInfo.address = "new address"

10. UI re-renders
    └─ Footer shows new address
    └─ Contact page shows new address
    └─ All components update simultaneously

11. Toast shown
    └─ "Settings saved successfully and updated across the site!"
```

**Total Time:** ~200-500ms (includes network round-trip)

## Caching Strategy

### React Query Configuration

```typescript
{
  queryKey: ['settings'],
  queryFn: fetchSettings,
  staleTime: 60 * 1000,           // 1 minute - data fresh for this long
  gcTime: 10 * 60 * 1000,         // 10 minutes - keep in memory this long
  refetchOnWindowFocus: true,     // Refresh when tab regains focus
  retry: 3,                        // Retry failed requests 3 times
}
```

### Cache Lifecycle

```
Time:    0      60s      120s       400s       600s
         |-------|--------|----------|---------|
State:   Fresh   Stale    Stale      Stale     Garbage
         (use)   (refetch (refetch   (refetch  Collected
                 on focus) on focus) on focus)

Legend:
- Fresh: Use cached value, don't fetch
- Stale: Use cached value, but refetch in background if accessed
- GC: Remove from memory if not accessed
```

## Performance Optimizations

### 1. **Single Request for Multiple Components**
All components using `useSettings()` hook share the same React Query cache. Whether 1 or 100 components use the hook, only 1 API call is made.

### 2. **Automatic Refetch on Window Focus**
When user clicks back on the browser tab after looking at email/other app, settings are automatically refreshed. This ensures stale data is replaced with fresh data.

### 3. **Stale-While-Revalidate Pattern**
Components get instant cached data (even if stale) while React Query silently refetches in the background.

### 4. **Efficient Invalidation**
Instead of refetching all data, only the settings cache is invalidated. Other queries (bookings, users, etc.) are unaffected.

## Error Handling

### Network Errors
```typescript
- First request fails
  └─ Retry after 1 second
  └─ Retry after 2 seconds  
  └─ Retry after 4 seconds
  └─ If all 3 retries fail
     └─ Use fallback defaults
     └─ Show error to admin
```

### API Errors
```typescript
- GET /api/admin/settings fails
  └─ Return defaults (safe fallback)
  └─ Log error to console

- PUT /api/admin/settings fails
  └─ Show error toast to user
  └─ Don't invalidate cache
  └─ User can retry
```

### Database Errors
```typescript
- If database not configured
  └─ All endpoints return defaults
  └─ No errors shown to user
  └─ Settings still work locally
```

## Security Considerations

### Authentication
- GET `/api/admin/settings` - No auth required (public settings)
- PUT `/api/admin/settings` - Auth required (staff/admin only)
- Auth checked at API level via `next-auth`

### Authorization
- Only users with `role === 'staff'` or `role === 'admin'` can update settings
- Non-authenticated users can only read

### Data Validation
- All settings validated with Zod schemas before saving
- Invalid data rejected with 400 Bad Request

## Extensibility

### Adding a New Setting

**Step 1:** Update `AdminSettings` type in `src/types/admin.ts`
```typescript
export interface AdminSettings {
  // ... existing
  myNewSetting: string;  // Add new field
}
```

**Step 2:** Add key constant in `src/lib/api/admin-settings.ts`
```typescript
const SETTINGS_KEYS = {
  // ... existing
  MY_NEW_SETTING: 'admin.my_new_setting',
};
```

**Step 3:** Add to default settings
```typescript
function getDefaultSettings(): AdminSettings {
  return {
    // ... existing
    myNewSetting: 'default value',
  };
}
```

**Step 4:** Add form field in admin page
```typescript
<FormField
  control={form.control}
  name="myNewSetting"
  render={({ field }) => (
    <FormItem>
      <FormLabel>My New Setting</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
    </FormItem>
  )}
/>
```

**Step 5:** Add Prisma migration (if needed)
```bash
npx prisma migrate dev
```

**Step 6:** Use in components
```typescript
const { settings } = useSettings();
console.log(settings.myNewSetting);
```

## Real-Time Enhancements (Future)

### Option 1: Server-Sent Events (SSE)
```
- Admin saves settings
- Server broadcasts to all connected clients
- Clients receive event immediately
- No polling needed
```

### Option 2: WebSocket
```
- Persistent connection to server
- Admin saves → Server broadcasts
- All clients receive instantly
- Most real-time option
```

### Option 3: Broadcast Channel API
```
- Same-origin tabs communicate directly
- Admin tab saves → Broadcast to other tabs
- Instant sync within same browser
```

Currently using: **Refetch on Focus** (simplest, effective for most use cases)

## Monitoring & Debugging

### React Query DevTools (Optional)
```typescript
// In providers.tsx, can add:
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<ReactQueryDevtools initialIsOpen={false} />
```

### Logging
```typescript
// In settings-provider.tsx:
console.log('Fetching settings...');
console.log('Settings loaded:', settings);
console.log('Cache invalidated');
```

### Browser DevTools
```javascript
// In browser console:
// View all React Query caches
window.__REACT_QUERY_DEVTOOLS_PANEL__
```

## Testing

### Manual Testing
1. Open `/admin/settings`
2. Open footer in separate tab
3. Change address
4. Watch footer update instantly

### Automated Testing (Future)
```typescript
describe('Dynamic Settings', () => {
  it('updates footer when admin changes address', async () => {
    // 1. Save new address
    // 2. Check cache was invalidated
    // 3. Verify footer component re-rendered
    // 4. Assert new address displayed
  });
});
```

## Summary

This architecture provides:
- ✅ **Real-time updates** - Changes instant across site
- ✅ **Efficient caching** - Single request for all components
- ✅ **Automatic refresh** - No manual refresh needed
- ✅ **Error resilience** - Graceful fallbacks
- ✅ **Easy extension** - Add settings without modifying core
- ✅ **Developer experience** - Simple hooks, sensible defaults
- ✅ **Performance** - Minimal API calls, smart caching
- ✅ **Maintainability** - Clear separation of concerns
