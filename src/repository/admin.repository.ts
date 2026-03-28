import { AppDataSource } from "../config/datasource.config.js";
import { hashPassword } from "../utils/crypt.util.js";
import { v4 as uuidv4 } from "uuid";
import type { Admin } from "../types/admin.type.js";

export class AdminRepository {
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
      throw new Error(`Admin with email ${email} already exists`);
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