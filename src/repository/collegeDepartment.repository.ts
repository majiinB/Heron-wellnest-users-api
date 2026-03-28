import { AppDataSource } from "../config/datasource.config.js";
import type { CollegeDepartment } from "../types/collegeDepartment.type.js";

export class CollegeDepartmentRepository {
  /**
   * Get all active college departments.
   */
  public async findAll(): Promise<CollegeDepartment[]> {
    const query = `
      SELECT
        department_id,
        department_name,
        is_deleted,
        created_at,
        updated_at
      FROM college_departments
      WHERE is_deleted = false
      ORDER BY department_name ASC
    `;

    const departments: CollegeDepartment[] = await AppDataSource.query(query);
    return departments;
  }
}
