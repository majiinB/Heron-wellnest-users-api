import { AppDataSource } from "../config/datasource.config.js";
import type { CollegeProgram } from "../types/collegeProgram.type.js";

export class CollegeProgramRepository {
  /**
   * Get all active college programs.
   */
  public async findAll(): Promise<CollegeProgram[]> {
    const query = `
      SELECT
        cp.program_id,
        cp.program_name,
        cp.college_department_id,
        cd.department_name,
        cp.is_deleted,
        cp.created_at,
        cp.updated_at
      FROM college_programs cp
      LEFT JOIN college_departments cd
        ON cp.college_department_id = cd.department_id
      WHERE cp.is_deleted = false
      ORDER BY cp.program_name ASC
    `;

    const programs: CollegeProgram[] = await AppDataSource.query(query);
    return programs;
  }

  /**
   * Get all active college programs under a specific department.
   * @param departmentId - The department ID to filter programs by
   * @returns Array of programs in the specified department
   */
  public async findByDepartment(departmentId: string): Promise<CollegeProgram[]> {
    const query = `
      SELECT
        cp.program_id,
        cp.program_name,
        cp.college_department_id,
        cd.department_name,
        cp.is_deleted,
        cp.created_at,
        cp.updated_at
      FROM college_programs cp
      LEFT JOIN college_departments cd
        ON cp.college_department_id = cd.department_id
      WHERE cp.is_deleted = false
        AND cp.college_department_id = $1
      ORDER BY cp.program_name ASC
    `;

    const programs: CollegeProgram[] = await AppDataSource.query(query, [departmentId]);
    return programs;
  }
}
