import { AppDataSource } from "../config/datasource.config.js";
import { hashPassword } from "../utils/crypt.util.js";
import { v4 as uuidv4 } from "uuid";
import type { Counselor, CounselorListItem, PaginatedCounselors } from "../types/counselor.type.js";
import { AppError } from "../types/appError.type.js";

export class CounselorRepository {
  public async findAllWithoutPasswordPaginated(limit = 10, cursor?: string): Promise<PaginatedCounselors> {
    const parameters: (string | number)[] = [];
    let paramIndex = 1;
    const conditions: string[] = ["c.is_deleted = false"];

    if (cursor) {
      conditions.push(`(c.created_at, c.user_id) < (
        SELECT created_at, user_id
        FROM counselor
        WHERE user_id = $${paramIndex++}
      )`);
      parameters.push(cursor);
    }

    const query = `
      SELECT
        c.user_id,
        c.user_name,
        c.email,
        c.department_id,
        cd.department_name,
        c.created_at,
        c.updated_at
      FROM counselor c
      INNER JOIN college_departments cd ON c.department_id = cd.department_id
      WHERE ${conditions.join(" AND ")}
      ORDER BY c.created_at DESC, c.user_id DESC
      LIMIT $${paramIndex}
    `;

    parameters.push(limit + 1);

    const data: CounselorListItem[] = await AppDataSource.query(query, parameters);
    const hasMore = data.length > limit;
    const counselors = hasMore ? data.slice(0, limit) : data;
    const nextCursor = hasMore ? counselors[counselors.length - 1].user_id : undefined;

    return {
      counselors,
      hasMore,
      nextCursor,
    };
  }

  /**
   * Find a counselor by email (for login/authentication)
   * Returns null if counselor not found or is deleted
   */
  async findByEmail(email: string): Promise<Counselor | null> {
    const query = `
      SELECT 
        user_id,
        user_name,
        email,
        password,
        is_deleted,
        department_id,
        created_at,
        updated_at
      FROM counselor
      WHERE email = $1
        AND is_deleted = false
    `;

    const result = await AppDataSource.query(query, [email]);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Find a counselor by user_id
   * Returns null if counselor not found or is deleted
   */
  async findById(userId: string): Promise<Counselor | null> {
    const query = `
      SELECT 
        user_id,
        user_name,
        email,
        password,
        is_deleted,
        department_id,
        created_at,
        updated_at
      FROM counselor
      WHERE user_id = $1
        AND is_deleted = false
    `;

    const result = await AppDataSource.query(query, [userId]);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Find a counselor by email without password (for safe responses)
   * Returns null if counselor not found or is deleted
   */
  async findByEmailWithoutPassword(email: string): Promise<Omit<Counselor, 'password'> | null> {
    const query = `
      SELECT 
        user_id,
        user_name,
        email,
        is_deleted,
        department_id,
        created_at,
        updated_at
      FROM counselor
      WHERE email = $1
        AND is_deleted = false
    `;

    const result = await AppDataSource.query(query, [email]);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Find a counselor by user_id without password (for safe responses)
   * Returns null if counselor not found or is deleted
   */
  async findByIdWithoutPassword(userId: string): Promise<Omit<Counselor, 'password'> | null> {
    const query = `
      SELECT 
        user_id,
        user_name,
        email,
        is_deleted,
        department_id,
        created_at,
        updated_at
      FROM counselor
      WHERE user_id = $1
        AND is_deleted = false
    `;

    const result = await AppDataSource.query(query, [userId]);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Check if a counselor exists by email
   */
  async existsByEmail(email: string): Promise<boolean> {
    const query = `
      SELECT EXISTS(
        SELECT 1 
        FROM counselor 
        WHERE email = $1 
          AND is_deleted = false
      ) as exists
    `;

    const result = await AppDataSource.query(query, [email]);
    return result[0].exists;
  }

  /**
   * Find counselors by college department
   */
    /**
   * Find counselors by college department
   */
  async findByDepartment(departmentName: string): Promise<Counselor[]> {
    const query = `
      SELECT 
        c.user_id,
        c.user_name,
        c.email,
        c.password,
        c.is_deleted,
        c.department_id,
        c.created_at,
        c.updated_at,
        cd.department_name
      FROM counselor c
      INNER JOIN college_departments cd ON c.department_id = cd.department_id
      WHERE cd.department_name = $1
        AND c.is_deleted = false
      ORDER BY c.user_name ASC
    `;
  
    const result = await AppDataSource.query(query, [departmentName]);
    return result;
  }
  
  /**
   * Find counselors by college department without password (for safe responses)
   */
  async findByDepartmentWithoutPassword(departmentName: string): Promise<Omit<Counselor, 'password'>[]> {
    const query = `
      SELECT 
        c.user_id,
        c.user_name,
        c.email,
        c.is_deleted,
        c.department_id,
        c.created_at,
        c.updated_at,
        cd.department_name
      FROM counselor c
      INNER JOIN college_departments cd ON c.department_id = cd.department_id
      WHERE cd.department_name = $1
        AND c.is_deleted = false
      ORDER BY c.user_name ASC
    `;
  
    const result = await AppDataSource.query(query, [departmentName]);
    return result;
  }

  public async findAllWithoutPassword(): Promise<Omit<Counselor, 'password'>[]> {
  const query = `
    SELECT 
      c.user_id,
      c.user_name,
      c.email,
      c.is_deleted,
      c.department_id,
      c.created_at,
      c.updated_at,
      cd.department_name
    FROM counselor c
    INNER JOIN college_departments cd ON c.department_id = cd.department_id
    WHERE c.is_deleted = false
    ORDER BY cd.department_name ASC, c.user_name ASC
  `;

  const result = await AppDataSource.query(query);
  return result;
}

  async updateBasicInfo(
    userId: string,
    payload: {
      user_name?: string;
      email?: string;
      department_id?: string;
    }
  ): Promise<Omit<Counselor, 'password'> | null> {
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

    if (payload.department_id !== undefined) {
      sets.push(`department_id = $${sets.length + 1}`);
      values.push(payload.department_id);
    }

    if (sets.length === 0) {
      return this.findByIdWithoutPassword(userId);
    }

    const query = `
      UPDATE counselor
      SET ${sets.join(", ")}, updated_at = NOW()
      WHERE user_id = $${sets.length + 1}
        AND is_deleted = false
      RETURNING
        user_id,
        user_name,
        email,
        is_deleted,
        department_id,
        created_at,
        updated_at
    `;

    const result = await AppDataSource.query(query, [...values, userId]);
    return result.length > 0 ? result[0] : null;
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<Omit<Counselor, 'password'> | null> {
    const query = `
      UPDATE counselor
      SET password = $1, updated_at = NOW()
      WHERE user_id = $2
        AND is_deleted = false
      RETURNING
        user_id,
        user_name,
        email,
        is_deleted,
        department_id,
        created_at,
        updated_at
    `;

    const result = await AppDataSource.query(query, [hashedPassword, userId]);
    return result.length > 0 ? result[0] : null;
  }

  async softDeleteById(userId: string): Promise<Omit<Counselor, 'password'> | null> {
    const query = `
      UPDATE counselor
      SET is_deleted = true, updated_at = NOW()
      WHERE user_id = $1
        AND is_deleted = false
      RETURNING
        user_id,
        user_name,
        email,
        is_deleted,
        department_id,
        created_at,
        updated_at
    `;

    const result = await AppDataSource.query(query, [userId]);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Create a new counselor
   * @param user_name - Counselor's name
   * @param email - Counselor's email
   * @param password - Plain text password (will be hashed)
   * @param department_id - The department ID the counselor belongs to
   * @returns The created counselor without password
   */
  async create(
    user_name: string,
    email: string,
    password: string,
    department_id: string
  ): Promise<Omit<Counselor, 'password'> | null> {
    // Check if email already exists
    const existingCounselor = await this.findByEmail(email);
    if (existingCounselor) {
      throw new AppError(409, "EMAIL_ALREADY_EXISTS", `Counselor with email ${email} already exists`, true);
    }

    const userId = uuidv4();
    const hashedPassword = await hashPassword(password);

    const query = `
      INSERT INTO counselor (
        user_id,
        user_name,
        email,
        password,
        department_id,
        is_deleted,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, false, NOW(), NOW())
      RETURNING 
        user_id,
        user_name,
        email,
        is_deleted,
        department_id,
        created_at,
        updated_at
    `;

    const result = await AppDataSource.query(query, [
      userId,
      user_name,
      email,
      hashedPassword,
      department_id,
    ]);

    return result.length > 0 ? result[0] : null;
  }
}