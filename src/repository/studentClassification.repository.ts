import { AppDataSource } from "../config/datasource.config.js";
import type { StudentClassification, ClassificationEnum } from '../types/studentClassification.type.js';
import type { DepartmentStatistics } from "../types/departmentStatistics.type.js";

/**
 * Filters for querying student classifications.
 * 
 * @interface StudentClassificationFilters
 * @property {ClassificationEnum} [classification] - The classification type to filter by
 * @property {boolean} [isFlagged] - Whether to filter by flagged status
 * @property {string} [departmentName] - The department name to filter by
 * @property {number} [limit] - Maximum number of results to return
 * @property {string} [cursor] - Classification ID of the last item from the previous page for pagination
 */
export interface StudentClassificationFilters {
  classification?: ClassificationEnum;
  isFlagged?: boolean;
  departmentName?: string;
  limit?: number;
  cursor?: string; // classification_id of the last item from previous page
}

export type PaginatedStudentClassifications = {
  classifications: StudentClassification[];
  hasMore: boolean;
  nextCursor?: string; // classification_id of the last classification for the next page
}

export class StudentClassificationRepository {
    async findAll(filters: StudentClassificationFilters = {}): Promise<PaginatedStudentClassifications> {
    const {
      classification,
      isFlagged,
      departmentName,
      limit = 10,
      cursor
    } = filters;
  
    const conditions: string[] = ['s.is_deleted = false'];
    const parameters: any[] = [];
    let paramIndex = 1;
  
    if (classification) {
      conditions.push(`latest_sc.classification = $${paramIndex++}`);
      parameters.push(classification);
    }
  
    if (isFlagged !== undefined) {
      conditions.push(`latest_sc.is_flagged = $${paramIndex++}`);
      parameters.push(isFlagged);
    }
  
    if (departmentName !== undefined) {
      conditions.push(`cd.department_name = $${paramIndex++}`);
      parameters.push(departmentName);
    }
  
    if (cursor) {
      conditions.push(`(latest_sc.classified_at, latest_sc.classification_id) < (
        SELECT classified_at, classification_id 
        FROM student_classification 
        WHERE classification_id = $${paramIndex++}
      )`);
      parameters.push(cursor);
    }
  
    const whereClause = `WHERE ${conditions.join(' AND ')}`;
  
    // Fetch limit + 1 to check if there are more results
    const dataQuery = `
      WITH latest_classifications AS (
        SELECT 
          classification_id,
          student_id,
          classification,
          is_flagged,
          classified_at,
          ROW_NUMBER() OVER (PARTITION BY student_id ORDER BY classified_at DESC, classification_id DESC) as rn
        FROM student_classification
      )
      SELECT 
        latest_sc.classification_id,
        latest_sc.student_id,
        latest_sc.classification,
        latest_sc.is_flagged,
        latest_sc.classified_at,
        s.email,
        cd.department_name
      FROM latest_classifications latest_sc
      INNER JOIN student s ON latest_sc.student_id = s.user_id
      INNER JOIN college_programs cp ON s.program_id = cp.program_id
      INNER JOIN college_departments cd ON cp.college_department_id = cd.department_id
      ${whereClause}
        AND latest_sc.rn = 1
      ORDER BY latest_sc.classified_at DESC, latest_sc.classification_id DESC
      LIMIT $${paramIndex++}
    `;
  
    const data = await AppDataSource.query(dataQuery, [...parameters, limit + 1]);
  
    const hasMore = data.length > limit;
    const classifications = hasMore ? data.slice(0, limit) : data;
    const nextCursor = hasMore ? classifications[classifications.length - 1].classification_id : undefined;
  
    return {
      classifications,
      hasMore,
      nextCursor
    };
  }

    async findByStudentId(studentId: string): Promise<StudentClassification | null> {
    // First, get the student classification details
    const classificationQuery = `
      SELECT 
        sc.classification_id,
        sc.student_id,
        sc.classification,
        sc.is_flagged,
        sc.classified_at,
        s.user_name,
        s.email,
        cp.college_department_id as department_id,
        cp.program_name,
        cd.department_name
      FROM student_classification sc
      INNER JOIN student s ON sc.student_id = s.user_id
      INNER JOIN college_programs cp ON s.program_id = cp.program_id
      INNER JOIN college_departments cd ON cp.college_department_id = cd.department_id
      WHERE sc.student_id = $1
        AND s.is_deleted = false
      ORDER BY sc.classified_at DESC
      LIMIT 1
    `;
  
    const classificationResult = await AppDataSource.query(classificationQuery, [studentId]);
    
    if (classificationResult.length === 0) {
      return null;
    }
  
    // Get the 7 most recent mood check-ins for this student
    const moodCheckInsQuery = `
      SELECT 
        check_in_id,
        user_id,
        mood_1,
        mood_2,
        mood_3,
        checked_in_at
      FROM mood_check_ins
      WHERE user_id = $1
      ORDER BY checked_in_at DESC
      LIMIT 7
    `;
  
    const moodCheckIns = await AppDataSource.query(moodCheckInsQuery, [studentId]);
  
    // Combine the results
    const result: StudentClassification = {
      ...classificationResult[0],
      mood_check_ins: moodCheckIns
    };
  
    return result;
  }

  async findByClassification(
    classification: ClassificationEnum,
    limit = 10,
    cursor?: string
  ): Promise<PaginatedStudentClassifications> {
    return this.findAll({ classification, limit, cursor });
  }

  async findFlagged(
    limit = 10,
    cursor?: string
  ): Promise<PaginatedStudentClassifications> {
    return this.findAll({ isFlagged: true, limit, cursor });
  }

  async findByDepartment(
    departmentName: string,
    limit = 10,
    cursor?: string
  ): Promise<PaginatedStudentClassifications> {
    return this.findAll({ departmentName, limit, cursor });
  }

  async findById(classificationId: string): Promise<StudentClassification | null> {
    const query = `
      SELECT 
        sc.classification_id,
        sc.student_id,
        sc.classification,
        sc.is_flagged,
        sc.classified_at,
        s.user_name,
        s.email,
        cp.college_department_id as department_id,
        cd.department_name
      FROM student_classification sc
      INNER JOIN student s ON sc.student_id = s.user_id
      INNER JOIN college_programs cp ON s.college_program = cp.program_id
      INNER JOIN college_departments cd ON cp.college_department_id = cd.department_id
      WHERE sc.classification_id = $1
        AND s.is_deleted = false
    `;

    const result = await AppDataSource.query(query, [classificationId]);
    return result.length > 0 ? result[0] : null;
  }

    /**
   * Get statistics for students classified in a specific department
   * Returns counts and percentages for each classification category
   */
  async getDepartmentStatistics(departmentName: string): Promise<DepartmentStatistics | null> {
    const query = `
      WITH latest_classifications AS (
        SELECT 
          student_id,
          classification,
          is_flagged,
          classified_at,
          ROW_NUMBER() OVER (PARTITION BY student_id ORDER BY classified_at DESC, classification_id DESC) as rn
        FROM student_classification
      ),
      department_students AS (
        SELECT 
          cd.department_name,
          COUNT(DISTINCT s.user_id) as total_students
        FROM student s
        INNER JOIN college_programs cp ON s.program_id = cp.program_id
        INNER JOIN college_departments cd ON cp.college_department_id = cd.department_id
        WHERE s.is_deleted = false
          AND cd.department_name = $1
        GROUP BY cd.department_name
      ),
      classification_counts AS (
        SELECT 
          COUNT(DISTINCT CASE WHEN latest_sc.classification = 'Excelling' THEN latest_sc.student_id END) as excelling_count,
          COUNT(DISTINCT CASE WHEN latest_sc.classification = 'Thriving' THEN latest_sc.student_id END) as thriving_count,
          COUNT(DISTINCT CASE WHEN latest_sc.classification = 'Struggling' THEN latest_sc.student_id END) as struggling_count,
          COUNT(DISTINCT CASE WHEN latest_sc.classification = 'InCrisis' THEN latest_sc.student_id END) as in_crisis_count
        FROM department_students ds
        LEFT JOIN student s ON s.is_deleted = false
        LEFT JOIN college_programs cp ON s.program_id = cp.program_id
        LEFT JOIN college_departments cd ON cp.college_department_id = cd.department_id AND cd.department_name = ds.department_name
        LEFT JOIN latest_classifications latest_sc ON latest_sc.student_id = s.user_id AND latest_sc.rn = 1
      )
      SELECT 
        ds.department_name,
        ds.total_students,
        COALESCE(cc.excelling_count, 0) as excelling_count,
        COALESCE(cc.thriving_count, 0) as thriving_count,
        COALESCE(cc.struggling_count, 0) as struggling_count,
        COALESCE(cc.in_crisis_count, 0) as in_crisis_count,
        (ds.total_students - COALESCE(cc.excelling_count, 0) - COALESCE(cc.thriving_count, 0) - COALESCE(cc.struggling_count, 0) - COALESCE(cc.in_crisis_count, 0)) as not_classified_count,
        ROUND(
          (COALESCE(cc.excelling_count, 0)::numeric / NULLIF(ds.total_students, 0) * 100), 
          2
        ) as excelling_percentage,
        ROUND(
          (COALESCE(cc.thriving_count, 0)::numeric / NULLIF(ds.total_students, 0) * 100), 
          2
        ) as thriving_percentage,
        ROUND(
          (COALESCE(cc.struggling_count, 0)::numeric / NULLIF(ds.total_students, 0) * 100), 
          2
        ) as struggling_percentage,
        ROUND(
          (COALESCE(cc.in_crisis_count, 0)::numeric / NULLIF(ds.total_students, 0) * 100), 
          2
        ) as in_crisis_percentage,
        ROUND(
          ((ds.total_students - COALESCE(cc.excelling_count, 0) - COALESCE(cc.thriving_count, 0) - COALESCE(cc.struggling_count, 0) - COALESCE(cc.in_crisis_count, 0))::numeric / NULLIF(ds.total_students, 0) * 100), 
          2
        ) as not_classified_percentage
      FROM department_students ds
      CROSS JOIN classification_counts cc
    `;
  
    const result = await AppDataSource.query(query, [departmentName]);
    
    if (result.length === 0) {
      return null;
    }
  
    return {
      department_name: result[0].department_name,
      total_students: parseInt(result[0].total_students, 10),
      excelling_count: parseInt(result[0].excelling_count, 10),
      thriving_count: parseInt(result[0].thriving_count, 10),
      struggling_count: parseInt(result[0].struggling_count, 10),
      in_crisis_count: parseInt(result[0].in_crisis_count, 10),
      not_classified_count: parseInt(result[0].not_classified_count, 10),
      excelling_percentage: parseFloat(result[0].excelling_percentage) || 0,
      thriving_percentage: parseFloat(result[0].thriving_percentage) || 0,
      struggling_percentage: parseFloat(result[0].struggling_percentage) || 0,
      in_crisis_percentage: parseFloat(result[0].in_crisis_percentage) || 0,
      not_classified_percentage: parseFloat(result[0].not_classified_percentage) || 0
    };
  }
  
  /**
   * Get statistics for all departments
   * Returns counts and percentages for each classification category per department
   */
  async getAllDepartmentsStatistics(): Promise<DepartmentStatistics[]> {
    const query = `
      WITH latest_classifications AS (
        SELECT 
          student_id,
          classification,
          is_flagged,
          classified_at,
          ROW_NUMBER() OVER (PARTITION BY student_id ORDER BY classified_at DESC, classification_id DESC) as rn
        FROM student_classification
      ),
      department_students AS (
        SELECT 
          cd.department_name,
          COUNT(DISTINCT s.user_id) as total_students
        FROM student s
        INNER JOIN college_programs cp ON s.program_id = cp.program_id
        INNER JOIN college_departments cd ON cp.college_department_id = cd.department_id
        WHERE s.is_deleted = false
        GROUP BY cd.department_name
      )
      SELECT 
        ds.department_name,
        ds.total_students,
        COALESCE(COUNT(DISTINCT CASE WHEN latest_sc.classification = 'Excelling' THEN latest_sc.student_id END), 0) as excelling_count,
        COALESCE(COUNT(DISTINCT CASE WHEN latest_sc.classification = 'Thriving' THEN latest_sc.student_id END), 0) as thriving_count,
        COALESCE(COUNT(DISTINCT CASE WHEN latest_sc.classification = 'Struggling' THEN latest_sc.student_id END), 0) as struggling_count,
        COALESCE(COUNT(DISTINCT CASE WHEN latest_sc.classification = 'InCrisis' THEN latest_sc.student_id END), 0) as in_crisis_count,
        (ds.total_students - 
          COALESCE(COUNT(DISTINCT CASE WHEN latest_sc.classification = 'Excelling' THEN latest_sc.student_id END), 0) -
          COALESCE(COUNT(DISTINCT CASE WHEN latest_sc.classification = 'Thriving' THEN latest_sc.student_id END), 0) -
          COALESCE(COUNT(DISTINCT CASE WHEN latest_sc.classification = 'Struggling' THEN latest_sc.student_id END), 0) -
          COALESCE(COUNT(DISTINCT CASE WHEN latest_sc.classification = 'InCrisis' THEN latest_sc.student_id END), 0)
        ) as not_classified_count,
        ROUND(
          (COALESCE(COUNT(DISTINCT CASE WHEN latest_sc.classification = 'Excelling' THEN latest_sc.student_id END), 0)::numeric / 
           NULLIF(ds.total_students, 0) * 100), 
          2
        ) as excelling_percentage,
        ROUND(
          (COALESCE(COUNT(DISTINCT CASE WHEN latest_sc.classification = 'Thriving' THEN latest_sc.student_id END), 0)::numeric / 
           NULLIF(ds.total_students, 0) * 100), 
          2
        ) as thriving_percentage,
        ROUND(
          (COALESCE(COUNT(DISTINCT CASE WHEN latest_sc.classification = 'Struggling' THEN latest_sc.student_id END), 0)::numeric / 
           NULLIF(ds.total_students, 0) * 100), 
          2
        ) as struggling_percentage,
        ROUND(
          (COALESCE(COUNT(DISTINCT CASE WHEN latest_sc.classification = 'InCrisis' THEN latest_sc.student_id END), 0)::numeric / 
           NULLIF(ds.total_students, 0) * 100), 
          2
        ) as in_crisis_percentage,
        ROUND(
          ((ds.total_students - 
            COALESCE(COUNT(DISTINCT CASE WHEN latest_sc.classification = 'Excelling' THEN latest_sc.student_id END), 0) -
            COALESCE(COUNT(DISTINCT CASE WHEN latest_sc.classification = 'Thriving' THEN latest_sc.student_id END), 0) -
            COALESCE(COUNT(DISTINCT CASE WHEN latest_sc.classification = 'Struggling' THEN latest_sc.student_id END), 0) -
            COALESCE(COUNT(DISTINCT CASE WHEN latest_sc.classification = 'InCrisis' THEN latest_sc.student_id END), 0)
          )::numeric / NULLIF(ds.total_students, 0) * 100), 
          2
        ) as not_classified_percentage
      FROM department_students ds
      LEFT JOIN student s ON s.is_deleted = false
      LEFT JOIN college_programs cp ON s.program_id = cp.program_id
      LEFT JOIN college_departments cd ON cp.college_department_id = cd.department_id AND cd.department_name = ds.department_name
      LEFT JOIN latest_classifications latest_sc ON latest_sc.student_id = s.user_id AND latest_sc.rn = 1
      GROUP BY ds.department_name, ds.total_students
      ORDER BY ds.department_name ASC
    `;
  
    const result = await AppDataSource.query(query);
  
    return result.map((row: any) => ({
      department_name: row.department_name,
      total_students: parseInt(row.total_students, 10),
      excelling_count: parseInt(row.excelling_count, 10),
      thriving_count: parseInt(row.thriving_count, 10),
      struggling_count: parseInt(row.struggling_count, 10),
      in_crisis_count: parseInt(row.in_crisis_count, 10),
      not_classified_count: parseInt(row.not_classified_count, 10),
      excelling_percentage: parseFloat(row.excelling_percentage) || 0,
      thriving_percentage: parseFloat(row.thriving_percentage) || 0,
      struggling_percentage: parseFloat(row.struggling_percentage) || 0,
      in_crisis_percentage: parseFloat(row.in_crisis_percentage) || 0,
      not_classified_percentage: parseFloat(row.not_classified_percentage) || 0
    }));
  }
}