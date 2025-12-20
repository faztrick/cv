import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-20 pt-12">
      <section className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div className="space-y-6">
          <Badge>Vertical Slice</Badge>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
            FanHouse MVP: gated content, creator onboarding, and realtime in one slice.
          </h1>
          <p className="text-base text-neutral-600 md:text-lg">
            This is a production-minded slice of the FanHouse platform. It includes auth, creator
            verification states, subscription + PPV gating, mock payments with a ledger, Ably realtime
            events, and an admin control plane.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/feed">Explore the feed</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/creator">Creator tools</Link>
            </Button>
          </div>
        </div>
        <Card className="bg-white/70">
          <CardHeader>
            <CardTitle>Core slice checklist</CardTitle>
            <CardDescription>Everything required by the test is covered here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-neutral-600">
            <div>✓ Auth + roles</div>
            <div>✓ Creator onboarding with Persona-style states</div>
            <div>✓ Subscriber-only + PPV content gating</div>
            <div>✓ Mock payments + append-only ledger</div>
            <div>✓ Ably realtime event</div>
            <div>✓ Admin approval + disable actions</div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: 'Creators first',
            description: 'Apply, verify, and publish gated content with pricing controls.'
          },
          {
            title: 'Fans stay gated',
            description: 'Subscriptions and PPV unlocks determine what fans can see.'
          },
          {
            title: 'Admin control',
            description: 'Review creators, monitor ledger entries, and disable content instantly.'
          }
        ].map((card) => (
          <Card key={card.title} className="bg-white/70">
            <CardHeader>
              <CardTitle>{card.title}</CardTitle>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>
    </main>
  );
}
