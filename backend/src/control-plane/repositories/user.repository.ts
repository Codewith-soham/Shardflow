import { Collection, ObjectId, type Db } from 'mongodb';

import { getDatabase } from '../../database/client.js';
import {
  type User,
  type CreateUserData,
  type UpdateUserData,
  UserStatus,
} from '../models/user.model.js';

export const USERS_COLLECTION = 'users';

export class UserRepository {
  private readonly db: Db;
  private readonly collection: Collection<User>;

  constructor(db?: Db) {
    this.db = db ?? getDatabase();
    this.collection = this.db.collection<User>(USERS_COLLECTION);
  }

  /**
   * Creates the required indexes for the users collection as specified in database-design.md:
   * - unique index on supabaseUserId
   * - index on email
   */
  async ensureIndexes(): Promise<void> {
    await this.collection.createIndex(
      { supabaseUserId: 1 },
      { unique: true, name: 'idx_users_supabaseUserId_unique' }
    );
    await this.collection.createIndex(
      { email: 1 },
      { name: 'idx_users_email' }
    );
  }

  /**
   * Persists a new user document.
   */
  async create(data: CreateUserData): Promise<User> {
    const now = new Date();
    const doc: User = {
      _id: new ObjectId(),
      supabaseUserId: data.supabaseUserId,
      email: data.email,
      name: data.name,
      status: data.status ?? UserStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    };

    await this.collection.insertOne(doc as any);
    return doc;
  }

  /**
   * Finds a user by internal MongoDB ObjectId.
   */
  async findById(id: string | ObjectId): Promise<User | null> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    return this.collection.findOne({ _id: objectId });
  }

  /**
   * Finds a user by Supabase Auth user identifier.
   */
  async findBySupabaseUserId(supabaseUserId: string): Promise<User | null> {
    return this.collection.findOne({ supabaseUserId });
  }

  /**
   * Finds a user by email address.
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.collection.findOne({ email });
  }

  /**
   * Updates user fields and refreshes updatedAt.
   */
  async update(id: string | ObjectId, data: UpdateUserData): Promise<User | null> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const now = new Date();

    const updateFields: Partial<User> = {
      ...data,
      updatedAt: now,
    };

    const result = await this.collection.findOneAndUpdate(
      { _id: objectId },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    return result;
  }
}
