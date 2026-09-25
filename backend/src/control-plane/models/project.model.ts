import { ObjectId } from 'mongodb';
import { z } from 'zod';

export const ProjectStatus = {
  ACTIVE: 'ACTIVE',
  DISABLED: 'DISABLED',
} as const;

export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export interface Project {
  _id: ObjectId;
  ownerId: ObjectId;
  name: string;
  description?: string;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectData {
  ownerId: ObjectId | string;
  name: string;
  description?: string;
  status?: ProjectStatus;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  status?: ProjectStatus;
}

export const projectStatusSchema = z.enum([ProjectStatus.ACTIVE, ProjectStatus.DISABLED]);

export const createProjectSchema = z.object({
  ownerId: z.union([
    z.string().min(1, 'Owner ID cannot be empty'),
    z.instanceof(ObjectId),
  ]),
  name: z.string().min(1, 'Project name cannot be empty'),
  description: z.string().optional(),
  status: projectStatusSchema.default(ProjectStatus.ACTIVE),
});

export const createProjectBodySchema = z.object({
  name: z.string().min(1, 'Project name cannot be empty'),
  description: z.string().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name cannot be empty').optional(),
  description: z.string().optional(),
  status: projectStatusSchema.optional(),
});
