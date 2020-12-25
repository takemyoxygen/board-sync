import NodeCache from 'node-cache';

export default class CachedStore<T> {
  private readonly cache: NodeCache;

  constructor(
    ttlSeconds: number,
    private readonly getValue: (key: string) => Promise<T>
  ) {
    this.cache = new NodeCache({ stdTTL: ttlSeconds });
  }

  async get(key: string): Promise<T> {
    if (this.cache.has(key)) {
      return this.cache.get<T>(key)!;
    }

    const value = await this.getValue(key);
    this.cache.set(key, value);
    return value;
  }
}
