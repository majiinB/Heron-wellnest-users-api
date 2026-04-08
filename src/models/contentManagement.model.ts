import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * @file contentManagement.model.ts
 *
 * @description Content management model for Heron wellnest system.
 *
 * This module defines the "ContentManagement" entity, which represents
 * content entries managed in the system.
 *
 * @author Arthur M. Artugue
 * @created 2026-04-07
 * @updated 2026-04-07
 */
@Entity("content_management")
export class ContentManagement {
  @PrimaryGeneratedColumn("uuid")
  content_id!: string;

  @Column({ type: "varchar", nullable: false })
  title!: string;

  @Column({ type: "varchar", nullable: false })
  headline!: string;

  @Column({ type: "varchar", nullable: false })
  image!: string;

  @Column({ type: "text", nullable: false })
  summary!: string;

  @CreateDateColumn({ type: "timestamptz" })
  created_at!: Date;
}
