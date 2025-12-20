/**
 * MVVM Architecture - View Layer
 *
 * Admin Page View - Pure presentational component consuming AdminViewModel.
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AdminCreator, LedgerEntry } from '@/models/types';
import { useAdmin, useAuth } from '@/viewmodels';

// ============ Sub-Components ============

interface CreatorRowProps {
  creator: AdminCreator;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDisable: (id: string) => void;
}

function CreatorRow({ creator, onApprove, onReject, onDisable }: CreatorRowProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-white px-4 py-3">
      <div>
        <div className="font-medium">{creator.displayName}</div>
        <div className="text-xs text-neutral-500">
          {creator.user.email} · {creator.status}
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onApprove(creator.id)}>
          Approve
        </Button>
        <Button size="sm" variant="outline" onClick={() => onReject(creator.id)}>
          Reject
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDisable(creator.id)}>
          Disable
        </Button>
      </div>
    </div>
  );
}

interface LedgerRowProps {
  entry: LedgerEntry;
}

function LedgerRow({ entry }: LedgerRowProps) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3">
      <div className="font-medium">{entry.type}</div>
      <div className="text-xs text-neutral-500">
        {entry.amountCents} {entry.currency} · {new Date(entry.createdAt).toLocaleString()}
      </div>
    </div>
  );
}

// ============ Main View ============

export default function AdminPage() {
  const { user, token, isAdmin } = useAuth();
  const vm = useAdmin(token);

  // Access control
  if (!user || !isAdmin) {
    return (
      <main className="mx-auto max-w-4xl px-6 pb-20 pt-12">
        <Card className="bg-white/80">
          <CardHeader>
            <CardTitle>Admin access only</CardTitle>
            <CardDescription>Sign in with an admin account to view this panel.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 pb-20 pt-10">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-semibold">Admin console</h2>
        {vm.message && (
          <div className="rounded-2xl bg-white/80 px-4 py-2 text-sm">{vm.message}</div>
        )}
      </div>

      {/* Creators Panel */}
      <Card className="bg-white/85">
        <CardHeader>
          <CardTitle>Creators pending approval</CardTitle>
          <CardDescription>Approve, reject, or disable creators.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {vm.creators.length === 0 && (
            <div className="text-neutral-600">No creators yet.</div>
          )}
          {vm.creators.map((creator) => (
            <CreatorRow
              key={creator.id}
              creator={creator}
              onApprove={vm.approveCreator}
              onReject={vm.rejectCreator}
              onDisable={vm.disableCreator}
            />
          ))}
        </CardContent>
      </Card>

      {/* Ledger Panel */}
      <Card className="bg-white/85">
        <CardHeader>
          <CardTitle>Ledger entries</CardTitle>
          <CardDescription>Append-only transaction log.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {vm.ledgerEntries.length === 0 && (
            <div className="text-neutral-600">No transactions yet.</div>
          )}
          {vm.ledgerEntries.map((entry) => (
            <LedgerRow key={entry.id} entry={entry} />
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
