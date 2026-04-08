import { AppDataSource } from "../config/datasource.config.js";
import { ContentManagement } from "../models/contentManagement.model.js";
import type {
  ContentManagementItem,
  CreateContentManagementPayload,
  UpdateContentManagementPayload,
} from "../types/contentManagement.type.js";

export class ContentManagementRepository {
  private repository = AppDataSource.getRepository(ContentManagement);

  private toItem(row: ContentManagement): ContentManagementItem {
    return {
      content_id: row.content_id,
      title: row.title,
      headline: row.headline,
      image: row.image,
      summary: row.summary,
      created_at: row.created_at,
    };
  }

  public async create(payload: CreateContentManagementPayload): Promise<ContentManagementItem> {
    const content = this.repository.create({
      title: payload.title,
      headline: payload.headline,
      image: payload.image,
      summary: payload.summary,
    });

    const saved = await this.repository.save(content);

    return this.toItem(saved);
  }

  public async findAll(): Promise<ContentManagementItem[]> {
    const rows = await this.repository.find({
      order: {
        created_at: "DESC",
      },
    });

    return rows.map((row) => this.toItem(row));
  }

  public async findById(contentId: string): Promise<ContentManagementItem | null> {
    const row = await this.repository.findOne({
      where: {
        content_id: contentId,
      },
    });

    if (!row) {
      return null;
    }

    return this.toItem(row);
  }

  public async update(contentId: string, payload: UpdateContentManagementPayload): Promise<ContentManagementItem | null> {
    const existing = await this.repository.findOne({
      where: {
        content_id: contentId,
      },
    });

    if (!existing) {
      return null;
    }

    if (payload.title !== undefined) {
      existing.title = payload.title;
    }

    if (payload.headline !== undefined) {
      existing.headline = payload.headline;
    }

    if (payload.image !== undefined) {
      existing.image = payload.image;
    }

    if (payload.summary !== undefined) {
      existing.summary = payload.summary;
    }

    const updated = await this.repository.save(existing);
    return this.toItem(updated);
  }

  public async delete(contentId: string): Promise<ContentManagementItem | null> {
    const existing = await this.repository.findOne({
      where: {
        content_id: contentId,
      },
    });

    if (!existing) {
      return null;
    }

    await this.repository.remove(existing);
    return this.toItem(existing);
  }
}
