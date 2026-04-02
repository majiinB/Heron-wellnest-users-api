import { AppDataSource } from "../config/datasource.config.js";
import { hashPassword } from "../utils/crypt.util.js";
import { v4 as uuidv4 } from "uuid";
import type { Admin, AdminListItem, PaginatedAdmins } from "../types/admin.type.js";
import { AppError } from "../types/appError.type.js";

export class AdminRepository {
  public async findAllWithoutPasswordPaginated(limit = 10, cursor?: string): Promise<PaginatedAdmins> {
    const parameters: (string | number)[] = [];
    let paramIndex = 1;
    const conditions: string[] = ["a.is_deleted = false"];

    if (cursor) {
      conditions.push(`(a.created_at, a.user_id) < (
        SELECT created_at, user_id
        FROM admin
        WHERE user_id = $${paramIndex++}
      )`);
      parameters.push(cursor);
    }

    const query = `
      SELECT
        a.user_id,
        a.user_name,
        a.email,
        a.is_super_admin,
        a.is_deleted,
        a.created_at,
        a.updated_at
      FROM admin a
      WHERE ${conditions.join(" AND ")}
      ORDER BY a.created_at DESC, a.user_id DESC
      LIMIT $${paramIndex}
    `;

    parameters.push(limit + 1);

    const data: AdminListItem[] = await AppDataSource.query(query, parameters);
    const hasMore = data.length > limit;
    const admins = hasMore ? data.slice(0, limit) : data;
    const nextCursor = hasMore ? admins[admins.length - 1].user_id : undefined;

    return {
      admins,
      hasMore,
      nextCursor,
    };
  }

  /**
   * Find an admin by email (for login/authentication)
   * Returns null if admin not found or is deleted
   */
  async findByEmail(email: string): Promise<Admin | null> {
    const query = `
      SELECT 
        user_id,
        user_name,
        email,
        password,
        is_super_admin,
        is_deleted,
        created_at,
        updated_at
      FROM admin
      WHERE email = $1
        AND is_deleted = false
    `;

    const result = await AppDataSource.query(query, [email]);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Find an admin by user_id
   * Returns null if admin not found or is deleted
   */
  async findById(userId: string): Promise<Admin | null> {
    const query = `
      SELECT 
        user_id,
        user_name,
        email,
        password,
        is_super_admin,
        is_deleted,
        created_at,
        updated_at
      FROM admin
      WHERE user_id = $1
        AND is_deleted = false
    `;

    const result = await AppDataSource.query(query, [userId]);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Find an admin by email without password (for safe responses)
   * Returns null if admin not found or is deleted
   */
  async findByEmailWithoutPassword(email: string): Promise<Omit<Admin, 'password'> | null> {
    const query = `
      SELECT 
        user_id,
        user_name,
        email,
        is_super_admin,
        is_deleted,
        created_at,
        updated_at
      FROM admin
      WHERE email = $1
        AND is_deleted = false
    `;

    const result = await AppDataSource.query(query, [email]);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Find an admin by user_id without password (for safe responses)
   * Returns null if admin not found or is deleted
   */
  async findByIdWithoutPassword(userId: string): Promise<Omit<Admin, 'password'> | null> {
    const query = `
      SELECT 
        user_id,
        user_name,
        email,
        is_super_admin,
        is_deleted,
        created_at,
        updated_at
      FROM admin
      WHERE user_id = $1
        AND is_deleted = false
    `;

    const result = await AppDataSource.query(query, [userId]);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Check if an admin exists by email
   */
  async existsByEmail(email: string): Promise<boolean> {
    const query = `
      SELECT EXISTS(
        SELECT 1 
        FROM admin 
        WHERE email = $1 
          AND is_deleted = false
      ) as exists
    `;

    const result = await AppDataSource.query(query, [email]);
    return result[0].exists;
  }

  /**
   * Check if a super admin exists by email
   */
  async isSuperAdmin(userId: string): Promise<boolean> {
    const query = `
      SELECT is_super_admin
      FROM admin
      WHERE user_id = $1
        AND is_deleted = false
    `;

    const result = await AppDataSource.query(query, [userId]);
    return result.length > 0 ? result[0].is_super_admin : false;
  }

  async updateBasicInfo(
    userId: string,
    payload: {
      user_name?: string;
      email?: string;
    }
  ): Promise<Omit<Admin, 'password'> | null> {
    const sets: string[] = [];
    const values: string[] = [];

    if (payload.user_name !== undefined) {
      sets.push(`user_name = $${sets.length + 1}`);
      values.push(payload.user_name);
    }

    if (payload.email !== undefined) {
      sets.push(`email = $${sets.length + 1}`);
      values.push(payload.email);
    }

    if (sets.length === 0) {
      return this.findByIdWithoutPassword(userId);
    }

    const query = `
      UPDATE admin
      SET ${sets.join(", ")}, updated_at = NOW()
      WHERE user_id = $${sets.length + 1}
        AND is_deleted = false
      RETURNING
        user_id,
        user_name,
        email,
        is_super_admin,
        is_deleted,
        created_at,
        updated_at
    `;

    const result = await AppDataSource.query(query, [...values, userId]);
    return result.length > 0 ? result[0] : null;
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<Omit<Admin, 'password'> | null> {
    const query = `
      UPDATE admin
      SET password = $1, updated_at = NOW()
      WHERE user_id = $2
        AND is_deleted = false
      RETURNING
        user_id,
        user_name,
        email,
        is_super_admin,
        is_deleted,
        created_at,
        updated_at
    `;

    const result = await AppDataSource.query(query, [hashedPassword, userId]);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Create a new admin
   * @param user_name - Admin's name
   * @param email - Admin's email
   * @param password - Plain text password (will be hashed)
   * @param is_super_admin - Whether this admin is a super admin
   * @returns The created admin without password
   */
  async create(
    user_name: string,
    email: string,
    password: string,
    is_super_admin: boolean = false
  ): Promise<Omit<Admin, 'password'> | null> {
    // Check if email already exists
    const existingAdmin = await this.findByEmail(email);
    if (existingAdmin) {
      throw new AppError(409, "EMAIL_ALREADY_EXISTS", `Admin with email ${email} already exists`, true);
    }

    const userId = uuidv4();
    const hashedPassword = await hashPassword(password);

    const query = `
      INSERT INTO admin (
        user_id,
        user_name,
        email,
        password,
        is_super_admin,
        is_deleted,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, false, NOW(), NOW())
      RETURNING 
        user_id,
        user_name,
        email,
        is_super_admin,
        is_deleted,
        created_at,
        updated_at
    `;

    const result = await AppDataSource.query(query, [
      userId,
      user_name,
      email,
      hashedPassword,
      is_super_admin,
    ]);

    return result.length > 0 ? result[0] : null;
  }
}