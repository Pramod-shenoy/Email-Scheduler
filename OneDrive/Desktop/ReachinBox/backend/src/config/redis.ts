// Simple in-memory Redis mock for development (no external Redis required)
const store = new Map<string, string>();

const redis = {
  get: async (key: string) => store.get(key) || null,
  set: async (key: string, value: string) => { store.set(key, value); return 'OK'; },
  incr: async (key: string) => {
    const current = parseInt(store.get(key) || '0');
    const newValue = current + 1;
    store.set(key, newValue.toString());
    return newValue;
  },
  expire: async (key: string, seconds: number) => {
    // Simple mock - in real Redis this would expire the key
    setTimeout(() => store.delete(key), seconds * 1000);
    return 1;
  },
  pipeline: () => ({
    incr: (key: string) => ({ exec: async () => [[null, 1]] }),
    expire: (key: string, seconds: number) => ({ exec: async () => [[null, 1]] }),
    exec: async () => [[null, 1]],
  }),
  ping: async () => 'PONG',
};

console.log('⚠️ Using in-memory Redis mock for development');

export { redis };
export default redis;