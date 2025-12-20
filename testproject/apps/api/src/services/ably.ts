import Ably from 'ably/promises';

const ablyKey = process.env.ABLY_API_KEY;
let client: Ably.Realtime | null = null;

function getClient() {
  if (!ablyKey) {
    return null;
  }
  if (!client) {
    client = new Ably.Realtime({ key: ablyKey });
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
