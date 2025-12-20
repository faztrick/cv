'use client';

import { AuthProvider } from '@/viewmodels';

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
