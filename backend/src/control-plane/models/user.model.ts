import { ObjectId } from 'mongodb';
import { z } from 'zod';

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  DISABLED: 'DISABLED',
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export interface User {
  _id: ObjectId;
  supabaseUserId: string;
  email: string;
  name?: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  supabaseUserId: string;
  email: string;
  name?: string;
  status?: UserStatus;
}

export interface UpdateUserData {
  email?: string;
  name?: string;
  status?: UserStatus;
}

export const userStatusSchema = z.enum([UserStatus.ACTIVE, UserStatus.DISABLED]);

export const createUserSchema = z.object({
  supabaseUserId: z.string().min(1, 'Supabase user ID cannot be empty'),
  email: z.string().email('Invalid email address'),
  name: z.string().min(1).optional(),
  status: userStatusSchema.default(UserStatus.ACTIVE),
});

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  name: z.string().min(1).optional(),
  status: userStatusSchema.optional(),
});
