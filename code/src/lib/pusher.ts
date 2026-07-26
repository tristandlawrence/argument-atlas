// filepath: src/lib/pusher.ts
import Pusher from 'pusher';

// Server-side Pusher instance
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID || 'test',
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || 'test',
  secret: process.env.PUSHER_SECRET || 'test',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
  useTLS: true,
});

// For client-side, we'll create a simple event emitter fallback
// since Pusher requires credentials. In production, use real Pusher.
type EventCallback = (data: unknown) => void;

class MockPusher {
  private channels: Map<string, Map<string, EventCallback>> = new Map();

  subscribe(channel: string) {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Map());
    }
    return this;
  }

  bind(event: string, callback: EventCallback) {
    this.channels.forEach((events) => {
      events.set(event, callback);
    });
    return this;
  }

  trigger(channel: string, event: string, data: unknown) {
    const callbacks = this.channels.get(channel);
    if (callbacks) {
      const callback = callbacks.get(event);
      if (callback) {
        callback(data);
      }
    }
  }
}

export const pusherClient = typeof window !== 'undefined' 
  ? new MockPusher() 
  : null;