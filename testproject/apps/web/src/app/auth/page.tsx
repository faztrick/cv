'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/viewmodels';
import { useState } from 'react';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'FAN' | 'CREATOR'>('FAN');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, role);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 pb-20 pt-12">
      <Card className="bg-white/80">
        <CardHeader>
          <CardTitle>{mode === 'login' ? 'Welcome back' : 'Create your account'}</CardTitle>
          <CardDescription>
            {mode === 'login'
              ? 'Sign in to access the feed, creator tools, and admin console.'
              : 'Register as a fan or creator to start the onboarding flow.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {mode === 'register' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <select
                  className="h-11 w-full rounded-2xl border border-[var(--border)] bg-white px-3 text-sm"
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'FAN' | 'CREATOR')}
                >
                  <option value="FAN">Fan</option>
                  <option value="CREATOR">Creator</option>
                </select>
              </div>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" disabled={loading}>
              {loading ? 'Working...' : mode === 'login' ? 'Sign in' : 'Register'}
            </Button>
          </form>
          <div className="mt-4 text-sm text-neutral-600">
            {mode === 'login' ? (
              <button className="underline" onClick={() => setMode('register')}>
                Need an account? Register
              </button>
            ) : (
              <button className="underline" onClick={() => setMode('login')}>
                Already have an account? Sign in
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
