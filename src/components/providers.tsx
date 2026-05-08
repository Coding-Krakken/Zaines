"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { SettingsProvider } from "@/providers/settings-provider";
import { useMemo } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  // Create a stable QueryClient instance
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 10 * 60 * 1000, // 10 minutes
            refetchOnWindowFocus: true,
            retry: 3,
          },
        },
      }),
    [],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider
        refetchOnWindowFocus={false}
        refetchWhenOffline={false}
        refetchInterval={0}
      >
        <SettingsProvider>{children}</SettingsProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
