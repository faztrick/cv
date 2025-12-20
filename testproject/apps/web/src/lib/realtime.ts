import Ably from 'ably';

export function createAblyClient() {
  const key = process.env.NEXT_PUBLIC_ABLY_KEY;
  if (!key) {
    return null;
  }
  return new Ably.Realtime({ key });
}
