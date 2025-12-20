/**
 * MVVM Architecture - View Layer
 *
 * Creator Page View - Pure presentational component consuming CreatorViewModel.
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth, useCreator } from '@/viewmodels';

// ============ Sub-Components ============

interface ApplyFormProps {
  displayName: string;
  bio: string;
  onDisplayNameChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

function ApplyForm({ displayName, bio, onDisplayNameChange, onBioChange, onSubmit, loading }: ApplyFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Card className="bg-white/80">
      <CardHeader>
        <CardTitle>Apply to become a creator</CardTitle>
        <CardDescription>Persona verification is mocked, but states are enforced.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Display name</label>
            <Input
              value={displayName}
              onChange={(e) => onDisplayNameChange(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Bio</label>
            <Textarea value={bio} onChange={(e) => onBioChange(e.target.value)} />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit application'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PendingStatusCard({ status }: { status: string }) {
  return (
    <Card className="bg-white/80">
      <CardHeader>
        <CardTitle>Verification pending</CardTitle>
        <CardDescription>
          Your status is {status}. An admin must approve you before monetization.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

interface CreatePostFormProps {
  title: string;
  body: string;
  priceType: 'FREE' | 'SUBSCRIBER' | 'PPV';
  priceCents: number;
  onTitleChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onPriceTypeChange: (value: 'FREE' | 'SUBSCRIBER' | 'PPV') => void;
  onPriceCentsChange: (value: number) => void;
  onMediaChange: (file: File | null) => void;
  onSubmit: () => void;
  loading: boolean;
}

function CreatePostForm({
  title,
  body,
  priceType,
  priceCents,
  onTitleChange,
  onBodyChange,
  onPriceTypeChange,
  onPriceCentsChange,
  onMediaChange,
  onSubmit,
  loading
}: CreatePostFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Card className="bg-white/80">
      <CardHeader>
        <CardTitle>Create a post</CardTitle>
        <CardDescription>Media uploads are stored locally and gated by entitlements.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input value={title} onChange={(e) => onTitleChange(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Body</label>
            <Textarea value={body} onChange={(e) => onBodyChange(e.target.value)} required />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pricing</label>
              <select
                className="h-11 w-full rounded-2xl border border-[var(--border)] bg-white px-3 text-sm"
                value={priceType}
                onChange={(e) => onPriceTypeChange(e.target.value as 'FREE' | 'SUBSCRIBER' | 'PPV')}
              >
                <option value="FREE">Free</option>
                <option value="SUBSCRIBER">Subscriber only</option>
                <option value="PPV">PPV</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">PPV price (cents)</label>
              <Input
                type="number"
                value={priceCents}
                onChange={(e) => onPriceCentsChange(Number(e.target.value))}
                min={0}
                step={50}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Media upload</label>
            <Input
              type="file"
              onChange={(e) => onMediaChange(e.target.files?.[0] ?? null)}
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Publishing...' : 'Publish post'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ============ Main View ============

export default function CreatorPage() {
  const { user, isAuthenticated, isApprovedCreator } = useAuth();
  const vm = useCreator();

  // Not signed in
  if (!isAuthenticated) {
    return (
      <main className="mx-auto max-w-4xl px-6 pb-20 pt-12">
        <Card className="bg-white/80">
          <CardHeader>
            <CardTitle>Creator onboarding</CardTitle>
            <CardDescription>Sign in to apply as a creator.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 pb-20 pt-10">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-3xl font-semibold">Creator hub</h2>
        <Badge>Status: {vm.creatorStatus}</Badge>
      </div>

      {/* Messages */}
      {vm.message && (
        <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm">{vm.message}</div>
      )}
      {vm.error && (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{vm.error}</div>
      )}

      {/* Apply Form - show only if not a creator yet */}
      {!user?.creator && (
        <ApplyForm
          displayName={vm.applyForm.displayName}
          bio={vm.applyForm.bio}
          onDisplayNameChange={(v) => vm.updateApplyForm({ displayName: v })}
          onBioChange={(v) => vm.updateApplyForm({ bio: v })}
          onSubmit={vm.submitApplication}
          loading={vm.loading}
        />
      )}

      {/* Pending Status */}
      {user?.creator && user.creator.status !== 'APPROVED' && (
        <PendingStatusCard status={user.creator.status} />
      )}

      {/* Post Creation - show only if approved creator */}
      {isApprovedCreator && (
        <CreatePostForm
          title={vm.postForm.title}
          body={vm.postForm.body}
          priceType={vm.postForm.priceType}
          priceCents={vm.postForm.priceCents}
          onTitleChange={(v) => vm.updatePostForm({ title: v })}
          onBodyChange={(v) => vm.updatePostForm({ body: v })}
          onPriceTypeChange={(v) => vm.updatePostForm({ priceType: v })}
          onPriceCentsChange={(v) => vm.updatePostForm({ priceCents: v })}
          onMediaChange={(f) => vm.updatePostForm({ media: f })}
          onSubmit={vm.createPost}
          loading={vm.loading}
        />
      )}
    </main>
  );
}
