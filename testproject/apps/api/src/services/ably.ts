import Ably from 'ably';

const ablyKey = process.env.ABLY_API_KEY;
// Ably's Promise API is available as `Ably.Realtime.Promise` in many builds.
// Keep typing loose here to avoid depending on build-specific type exports.
let client: any | null = null;

function getClient() {
  if (!ablyKey) {
    return null;
  }
  if (!client) {
    const RealtimeCtor = (Ably as any).Realtime?.Promise ?? (Ably as any).Realtime;
    client = new RealtimeCtor({ key: ablyKey });
  }
  return client;
}

export async function publishEvent(channelName: string, event: string, data: unknown) {
  const ablyClient = getClient();
  if (!ablyClient) {
    return;
  }
  const channel = ablyClient.channels.get(channelName);
  await channel.publish(event, data);
}
