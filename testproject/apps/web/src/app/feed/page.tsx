/**
 * MVVM Architecture - View Layer
 *
 * Feed Page View - Pure presentational component consuming PostsViewModel.
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Post } from '@/models/types';
import { useAuth, usePosts } from '@/viewmodels';

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
});

// ============ Sub-Components ============

interface PostCardProps {
  post: Post;
  onSubscribe: (creatorId: string) => void;
  onUnlock: (postId: string) => void;
  getMediaUrl: (assetId: string) => string;
}

function PostCard({ post, onSubscribe, onUnlock, getMediaUrl }: PostCardProps) {
  return (
    <Card className="bg-white/85">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{post.priceType}</Badge>
          <span className="text-xs text-neutral-500">{post.creator.displayName}</span>
        </div>
        <CardTitle>{post.title}</CardTitle>
        <CardDescription>{new Date(post.createdAt).toLocaleString()}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-neutral-700">{post.body}</p>

        {/* Subscribe CTA */}
        {!post.entitled && post.priceType === 'SUBSCRIBER' && (
          <Button variant="outline" onClick={() => onSubscribe(post.creator.id)}>
            Subscribe to unlock
          </Button>
        )}

        {/* PPV CTA */}
        {!post.entitled && post.priceType === 'PPV' && (
          <Button onClick={() => onUnlock(post.id)}>
            Unlock for {formatter.format(post.priceCents / 100)}
          </Button>
        )}

        {/* No Media */}
        {post.entitled && post.media.length === 0 && (
          <p className="text-xs text-neutral-500">No media uploaded for this post.</p>
        )}

        {/* Media Gallery */}
        {post.entitled && post.media.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2">
            {post.media.map((asset) => (
              <img
                key={asset.id}
                src={getMediaUrl(asset.id)}
                alt="Post media"
                className="rounded-2xl border border-[var(--border)] object-cover"
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface NotificationsPanelProps {
  notifications: Array<{ id: string; type: string; payload: Record<string, unknown> }>;
  isAuthenticated: boolean;
}

function NotificationsPanel({ notifications, isAuthenticated }: NotificationsPanelProps) {
  return (
    <Card className="bg-white/80">
      <CardHeader>
        <CardTitle>In-app notifications</CardTitle>
        <CardDescription>Mocked via Knock-style storage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {!isAuthenticated && <p className="text-neutral-600">Sign in to see notifications.</p>}
        {isAuthenticated && notifications.length === 0 && (
          <p className="text-neutral-600">No notifications yet.</p>
        )}
        {notifications.length > 0 && (
          <div className="space-y-2">
            {notifications.map((note) => (
              <div
                key={note.id}
                className="rounded-2xl border border-[var(--border)] bg-white px-3 py-2"
              >
                <div className="text-xs uppercase text-neutral-400">{note.type}</div>
                <div className="text-sm text-neutral-700">
                  {JSON.stringify(note.payload)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RealtimeStatusPanel() {
  const hasAblyKey = !!process.env.NEXT_PUBLIC_ABLY_KEY;

  return (
    <Card className="bg-white/80">
      <CardHeader>
        <CardTitle>Realtime status</CardTitle>
        <CardDescription>Powered by Ably (if key set)</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-neutral-600">
        {hasAblyKey
          ? 'Listening for post.created and ppv.unlocked events.'
          : 'Set NEXT_PUBLIC_ABLY_KEY to enable realtime updates.'}
      </CardContent>
    </Card>
  );
}

// ============ Main View ============

export default function FeedPage() {
  const { token, isAuthenticated } = useAuth();
  const vm = usePosts(token);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 pb-20 pt-10">
      <div className="grid gap-6 md:grid-cols-[1.6fr_0.8fr]">
        {/* Feed Column */}
        <div className="space-y-4">
          <h2 className="text-3xl font-semibold">Creator feed</h2>
          <p className="text-sm text-neutral-600">
            {isAuthenticated
              ? 'Your entitlements are enforced by the API. Locked posts stay hidden until you subscribe or unlock.'
              : 'Browse the public feed. Sign in to unlock gated posts.'}
          </p>

          {/* Messages */}
          {vm.message && (
            <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm">{vm.message}</div>
          )}
          {vm.error && (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{vm.error}</div>
          )}

          {/* Loading State */}
          {vm.loading ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] p-6">
              Loading posts…
            </div>
          ) : (
            <div className="space-y-4">
              {vm.posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onSubscribe={vm.subscribe}
                  onUnlock={vm.unlockPpv}
                  getMediaUrl={vm.getMediaUrl}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <NotificationsPanel
            notifications={vm.notifications}
            isAuthenticated={isAuthenticated}
          />
          <RealtimeStatusPanel />
        </div>
      </div>
    </main>
  );
}
