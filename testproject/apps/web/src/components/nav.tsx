'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/viewmodels';
import Link from 'next/link';

export function Nav() {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-20 w-full border-b border-[var(--border)] bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            FanHouse Slice
          </Link>
          <div className="hidden items-center gap-4 text-sm md:flex">
            <Link href="/feed" className="hover:text-[var(--accent)]">
              Feed
            </Link>
            <Link href="/creator" className="hover:text-[var(--accent)]">
              Creator
            </Link>
            {user?.role === 'ADMIN' && (
              <Link href="/admin" className="hover:text-[var(--accent)]">
                Admin
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="hidden text-xs text-neutral-500 md:inline">
                {user.email} · {user.role}
              </span>
              <Button variant="outline" size="sm" onClick={logout}>
                Sign out
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
