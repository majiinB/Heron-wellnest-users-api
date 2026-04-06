import { AppDataSource } from "../config/datasource.config.js";
import type { PaginatedStudents, Student } from "../types/student.type.js";

export class StudentRepository {
  public async findAllPaginated(limit = 10, cursor?: string, search?: string): Promise<PaginatedStudents> {
    const parameters: (string | number)[] = [];
    let paramIndex = 1;
    const conditions: string[] = [];

    if (search?.trim()) {
      conditions.push(`(s.email ILIKE $${paramIndex} OR s.user_name ILIKE $${paramIndex})`);
      parameters.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (cursor) {
      conditions.push(`(s.created_at, s.user_id) < (
        SELECT created_at, user_id
        FROM student
        WHERE user_id = $${paramIndex++}
      )`);
      parameters.push(cursor);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const query = `
      SELECT
        s.user_id,
        s.user_name,
        s.email,
        s.is_deleted,
        s.created_at,
        s.updated_at,
        s.finished_onboarding,
        s.program_id,
        cp.program_name,
        cd.department_name,
        s.cor_school_year,
        s.year_level
      FROM student s
      INNER JOIN college_programs cp ON s.program_id = cp.program_id
      INNER JOIN college_departments cd ON cp.college_department_id = cd.department_id
      ${whereClause}
      ORDER BY s.created_at DESC, s.user_id DESC
      LIMIT $${paramIndex}
    `;

    parameters.push(limit + 1);

    const data: Student[] = await AppDataSource.query(query, parameters);
    const hasMore = data.length > limit;
    const students = hasMore ? data.slice(0, limit) : data;
    const nextCursor = hasMore ? students[students.length - 1].user_id : undefined;

    return {
      students,
      hasMore,
      nextCursor,
    };
  }

  public async searchByEmailOrName(search: string, limit = 10, cursor?: string): Promise<PaginatedStudents> {
    return this.findAllPaginated(limit, cursor, search);
  }
}
