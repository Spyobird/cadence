import { get, set, del, clear } from 'idb-keyval';

export const db = {
  async save(key: string, value: any) {
    await set(key, value);
  },
  async get(key: string) {
    return await get(key);
  },
  async remove(key: string) {
    await del(key);
  },
  async reset() {
    await clear();
  }
};