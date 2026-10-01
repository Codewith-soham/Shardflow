import { Collection, ObjectId, type Db } from 'mongodb';

import { getDatabase } from '../../database/client.js';
import {
  type Project,
  type CreateProjectData,
  type UpdateProjectData,
  ProjectStatus,
} from '../models/project.model.js';

export const PROJECTS_COLLECTION = 'projects';

export class ProjectRepository {
  private readonly db?: Db;

  constructor(db?: Db) {
    this.db = db;
  }

  private get collection(): Collection<Project> {
    return (this.db ?? getDatabase()).collection<Project>(PROJECTS_COLLECTION);
  }

  /**
   * Creates the required indexes for the projects collection as specified in database-design.md:
   * - index on ownerId
   * - compound unique index on ownerId + name
   */
  async ensureIndexes(): Promise<void> {
    await this.collection.createIndex(
      { ownerId: 1 },
      { name: 'idx_projects_ownerId' }
    );
    await this.collection.createIndex(
      { ownerId: 1, name: 1 },
      { unique: true, name: 'idx_projects_ownerId_name_unique' }
    );
  }

  /**
   * Persists a new project document.
   */
  async create(data: CreateProjectData): Promise<Project> {
    const now = new Date();
    const ownerObjectId =
      typeof data.ownerId === 'string' ? new ObjectId(data.ownerId) : data.ownerId;

    const doc: Project = {
      _id: new ObjectId(),
      ownerId: ownerObjectId,
      name: data.name,
      description: data.description,
      status: data.status ?? ProjectStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    };

    await this.collection.insertOne(doc as any);
    return doc;
  }

  /**
   * Finds a project by internal MongoDB ObjectId.
   */
  async findById(id: string | ObjectId): Promise<Project | null> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    return this.collection.findOne({ _id: objectId });
  }

  /**
   * Finds a project by its internal ObjectId and ownerId (ensuring authorization scope).
   */
  async findByIdAndOwnerId(
    id: string | ObjectId,
    ownerId: string | ObjectId
  ): Promise<Project | null> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const ownerObjectId =
      typeof ownerId === 'string' ? new ObjectId(ownerId) : ownerId;
    return this.collection.findOne({ _id: objectId, ownerId: ownerObjectId });
  }

  /**
   * Finds all projects belonging to a specific owner.
   */
  async findByOwnerId(ownerId: string | ObjectId): Promise<Project[]> {
    const ownerObjectId =
      typeof ownerId === 'string' ? new ObjectId(ownerId) : ownerId;
    return this.collection.find({ ownerId: ownerObjectId }).toArray();
  }

  /**
   * Finds a project by owner and name.
   */
  async findByOwnerIdAndName(
    ownerId: string | ObjectId,
    name: string
  ): Promise<Project | null> {
    const ownerObjectId =
      typeof ownerId === 'string' ? new ObjectId(ownerId) : ownerId;
    return this.collection.findOne({ ownerId: ownerObjectId, name });
  }

  /**
   * Updates project fields and refreshes updatedAt.
   */
  async update(id: string | ObjectId, data: UpdateProjectData): Promise<Project | null> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const now = new Date();

    const updateFields: Partial<Project> = {
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

  /**
   * Updates project fields scoped by ownerId and refreshes updatedAt.
   */
  async updateByIdAndOwnerId(
    id: string | ObjectId,
    ownerId: string | ObjectId,
    data: UpdateProjectData
  ): Promise<Project | null> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const ownerObjectId =
      typeof ownerId === 'string' ? new ObjectId(ownerId) : ownerId;
    const now = new Date();

    const updateFields: Partial<Project> = {
      ...data,
      updatedAt: now,
    };

    const result = await this.collection.findOneAndUpdate(
      { _id: objectId, ownerId: ownerObjectId },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    return result;
  }

  /**
   * Deactivates/disables a project.
   */
  async disable(id: string | ObjectId, ownerId?: string | ObjectId): Promise<Project | null> {
    if (ownerId) {
      return this.updateByIdAndOwnerId(id, ownerId, { status: ProjectStatus.DISABLED });
    }
    return this.update(id, { status: ProjectStatus.DISABLED });
  }

  /**
   * Physically deletes a project document.
   */
  async delete(id: string | ObjectId): Promise<boolean> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const result = await this.collection.deleteOne({ _id: objectId });
    return result.deletedCount > 0;
  }
}
