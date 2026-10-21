import { ObjectId, type Db } from 'mongodb';

// ─── Minimal in-memory Mongo so the REAL repositories/services/routes run ────

function sameValue(a: unknown, b: unknown): boolean {
  if (a instanceof ObjectId || b instanceof ObjectId) return String(a) === String(b);
  return a === b;
}

function matches(doc: Record<string, any>, filter: Record<string, any>): boolean {
  return Object.entries(filter).every(([key, expected]) => sameValue(doc[key], expected));
}

export function createFakeDb(): Db {
  const collections = new Map<string, Record<string, any>[]>();
  const docsOf = (name: string) => {
    if (!collections.has(name)) collections.set(name, []);
    return collections.get(name)!;
  };

  const collection = (name: string) => {
    const docs = docsOf(name);
    return {
      insertOne: async (doc: any) => {
        docs.push(doc);
        return { insertedId: doc._id };
      },
      findOne: async (filter: any) => docs.find((d) => matches(d, filter)) ?? null,
      find: (filter: any) => ({ toArray: async () => docs.filter((d) => matches(d, filter)) }),
      findOneAndUpdate: async (filter: any, update: any, options: any = {}) => {
        let doc = docs.find((d) => matches(d, filter));
        if (!doc && options.upsert) {
          doc = { ...filter, ...(update.$setOnInsert ?? {}) };
          docs.push(doc!);
        }
        if (!doc) return null;
        Object.assign(doc, update.$set ?? {});
        return doc;
      },
      deleteOne: async (filter: any) => {
        const index = docs.findIndex((d) => matches(d, filter));
        if (index >= 0) docs.splice(index, 1);
        return { deletedCount: index >= 0 ? 1 : 0 };
      },
      countDocuments: async (filter: any) => docs.filter((d) => matches(d, filter)).length,
      createIndex: async () => 'ok',
    };
  };

  return { collection } as unknown as Db;
}
