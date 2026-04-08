import { AppDataSource } from "../config/datasource.config.js";
import type { StudentClassification, ClassificationEnum } from '../types/studentClassification.type.js';
import type { DepartmentStatistics, SentimentPeriodStat } from "../types/departmentStatistics.type.js";

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
  private parseSentimentStats(raw: unknown): SentimentPeriodStat[] {
    if (!raw) {
      return [];
    }

    let parsed: unknown;
    try {
      parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      return [];
    }

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((item) => {
      const row = item as Record<string, unknown>;
      return {
        period_start: String(row.period_start ?? ''),
        mood: String(row.mood ?? ''),
        count: Number(row.count ?? 0),
        percentage: Number(row.percentage ?? 0)
      };
    }).filter((item) => item.period_start && item.mood);
  }

  public async findAll(filters: StudentClassificationFilters = {}): Promise<PaginatedStudentClassifications> {
    const {
      classification,
      departmentName,
      limit = 10,
      cursor
    } = filters;
  
    const conditions: string[] = ['s.is_deleted = false'];
    const parameters: Array<string | number> = [];
    let paramIndex = 1;
  
    if (classification) {
      conditions.push(`latest_sc.classification = $${paramIndex++}`);
      parameters.push(classification);
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
          classification_probabilities,
          classified_at,
          ROW_NUMBER() OVER (PARTITION BY student_id ORDER BY classified_at DESC, classification_id DESC) as rn
        FROM student_classification
      )
      SELECT 
        latest_sc.classification_id,
        latest_sc.student_id,
        latest_sc.classification,
        latest_sc.classification_probabilities,
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

  public async findByStudentId(studentId: string): Promise<StudentClassification | null> {
    // First, get the student classification details
    const classificationQuery = `
      SELECT 
        sc.classification_id,
        sc.student_id,
        sc.classification,
        sc.classification_probabilities,
        sc.classified_at,
        s.user_name,
        s.email,
        cd.department_id,
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

    const dailyClassificationsQuery = `
      SELECT
        classification_id,
        student_id,
        classification,
        classification_probabilities,
        classified_at
      FROM student_classification
      WHERE student_id = $1
        AND classified_at >= NOW() - INTERVAL '7 days'
      ORDER BY classified_at DESC
    `;

    const dailyClassifications = await AppDataSource.query(dailyClassificationsQuery, [studentId]);

    const weeklyClassificationsQuery = `
      SELECT
        weekly_classification_id,
        student_id,
        week_start,
        week_end,
        dominant_classification,
        is_flagged,
        classified_at
      FROM student_weekly_classification
      WHERE student_id = $1
      ORDER BY week_start DESC, classified_at DESC
      LIMIT 7
    `;

    const weeklyClassifications = await AppDataSource.query(weeklyClassificationsQuery, [studentId]);
  
    // Combine the results
    const result: StudentClassification = {
      ...classificationResult[0],
      mood_check_ins: moodCheckIns,
      daily_classifications: dailyClassifications,
      weekly_classifications: weeklyClassifications
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

  public async findById(classificationId: string): Promise<StudentClassification | null> {
    const query = `
      SELECT 
        sc.classification_id,
        sc.student_id,
        sc.classification,
        sc.classification_probabilities,
        sc.classified_at,
        s.user_name,
        s.email,
        cd.department_id,
        cd.department_name
      FROM student_classification sc
      INNER JOIN student s ON sc.student_id = s.user_id
      INNER JOIN college_programs cp ON s.program_id = cp.program_id
      INNER JOIN college_departments cd ON cp.college_department_id = cd.department_id
      WHERE sc.classification_id = $1
        AND s.is_deleted = false
    `;

    const result = await AppDataSource.query(query, [classificationId]);
    return result.length > 0 ? result[0] : null;
  }

  public async findAllStudentAnalytics(): Promise<Record<string, unknown>[]> {
    const query = "SELECT * FROM student_analytics";
    return AppDataSource.query(query);
  }

    /**
   * Get statistics for students classified in a specific department
   * Returns counts and percentages for each classification category
   */
  public async getDepartmentStatistics(departmentName: string): Promise<DepartmentStatistics | null> {
    const query = `
      WITH latest_classifications AS (
        SELECT 
          student_id,
          classification,
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
      department_classification_counts AS (
        SELECT 
          cd.department_name,
          COUNT(DISTINCT CASE WHEN latest_sc.classification = 'Excelling' THEN s.user_id END) as excelling_count,
          COUNT(DISTINCT CASE WHEN latest_sc.classification = 'Thriving' THEN s.user_id END) as thriving_count,
          COUNT(DISTINCT CASE WHEN latest_sc.classification = 'Struggling' THEN s.user_id END) as struggling_count,
          COUNT(DISTINCT CASE WHEN latest_sc.classification = 'InCrisis' THEN s.user_id END) as in_crisis_count
        FROM student s
        INNER JOIN college_programs cp ON s.program_id = cp.program_id
        INNER JOIN college_departments cd ON cp.college_department_id = cd.department_id
        LEFT JOIN latest_classifications latest_sc ON latest_sc.student_id = s.user_id AND latest_sc.rn = 1
        WHERE s.is_deleted = false
          AND cd.department_name = $1
        GROUP BY cd.department_name
      ),
      classification_counts AS (
        SELECT 
          COALESCE(dcc.excelling_count, 0) as excelling_count,
          COALESCE(dcc.thriving_count, 0) as thriving_count,
          COALESCE(dcc.struggling_count, 0) as struggling_count,
          COALESCE(dcc.in_crisis_count, 0) as in_crisis_count
        FROM department_students ds
        LEFT JOIN department_classification_counts dcc ON dcc.department_name = ds.department_name
      ),
      department_moods AS (
        SELECT
          cd.department_name,
          m.checked_in_at,
          mood
        FROM student s
        INNER JOIN college_programs cp ON s.program_id = cp.program_id
        INNER JOIN college_departments cd ON cp.college_department_id = cd.department_id
        INNER JOIN mood_check_ins m ON m.user_id = s.user_id
        CROSS JOIN LATERAL unnest(array_remove(ARRAY[m.mood_1, m.mood_2, m.mood_3], NULL::varchar)) AS mood
        WHERE s.is_deleted = false
          AND cd.department_name = $1
      ),
      weekly_sentiment_counts AS (
        SELECT
          department_name,
          date_trunc('week', checked_in_at AT TIME ZONE 'Asia/Manila')::date AS period_start,
          mood,
          COUNT(*) AS mood_count
        FROM department_moods
        GROUP BY department_name, period_start, mood
      ),
      weekly_sentiment_totals AS (
        SELECT
          department_name,
          period_start,
          SUM(mood_count) AS total_count
        FROM weekly_sentiment_counts
        GROUP BY department_name, period_start
      ),
      weekly_sentiments AS (
        SELECT
          wsc.department_name,
          jsonb_agg(
            jsonb_build_object(
              'period_start', wsc.period_start::text,
              'mood', wsc.mood,
              'count', wsc.mood_count,
              'percentage', ROUND((wsc.mood_count::numeric / NULLIF(wst.total_count, 0)) * 100, 2)
            )
            ORDER BY wsc.period_start DESC, wsc.mood ASC
          ) AS weekly_sentiments
        FROM weekly_sentiment_counts wsc
        INNER JOIN weekly_sentiment_totals wst
          ON wst.department_name = wsc.department_name
         AND wst.period_start = wsc.period_start
        GROUP BY wsc.department_name
      ),
      monthly_sentiment_counts AS (
        SELECT
          department_name,
          date_trunc('month', checked_in_at AT TIME ZONE 'Asia/Manila')::date AS period_start,
          mood,
          COUNT(*) AS mood_count
        FROM department_moods
        GROUP BY department_name, period_start, mood
      ),
      monthly_sentiment_totals AS (
        SELECT
          department_name,
          period_start,
          SUM(mood_count) AS total_count
        FROM monthly_sentiment_counts
        GROUP BY department_name, period_start
      ),
      monthly_sentiments AS (
        SELECT
          msc.department_name,
          jsonb_agg(
            jsonb_build_object(
              'period_start', msc.period_start::text,
              'mood', msc.mood,
              'count', msc.mood_count,
              'percentage', ROUND((msc.mood_count::numeric / NULLIF(mst.total_count, 0)) * 100, 2)
            )
            ORDER BY msc.period_start DESC, msc.mood ASC
          ) AS monthly_sentiments
        FROM monthly_sentiment_counts msc
        INNER JOIN monthly_sentiment_totals mst
          ON mst.department_name = msc.department_name
         AND mst.period_start = msc.period_start
        GROUP BY msc.department_name
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
        ) as not_classified_percentage,
        COALESCE(ws.weekly_sentiments, '[]'::jsonb) as weekly_sentiments,
        COALESCE(ms.monthly_sentiments, '[]'::jsonb) as monthly_sentiments
      FROM department_students ds
      CROSS JOIN classification_counts cc
      LEFT JOIN weekly_sentiments ws ON ws.department_name = ds.department_name
      LEFT JOIN monthly_sentiments ms ON ms.department_name = ds.department_name
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
      not_classified_percentage: parseFloat(result[0].not_classified_percentage) || 0,
      weekly_sentiments: this.parseSentimentStats(result[0].weekly_sentiments),
      monthly_sentiments: this.parseSentimentStats(result[0].monthly_sentiments)
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
      ),
      department_classification_counts AS (
        SELECT
          cd.department_name,
          COUNT(DISTINCT CASE WHEN latest_sc.classification = 'Excelling' THEN s.user_id END) as excelling_count,
          COUNT(DISTINCT CASE WHEN latest_sc.classification = 'Thriving' THEN s.user_id END) as thriving_count,
          COUNT(DISTINCT CASE WHEN latest_sc.classification = 'Struggling' THEN s.user_id END) as struggling_count,
          COUNT(DISTINCT CASE WHEN latest_sc.classification = 'InCrisis' THEN s.user_id END) as in_crisis_count
        FROM student s
        INNER JOIN college_programs cp ON s.program_id = cp.program_id
        INNER JOIN college_departments cd ON cp.college_department_id = cd.department_id
        LEFT JOIN latest_classifications latest_sc ON latest_sc.student_id = s.user_id AND latest_sc.rn = 1
        WHERE s.is_deleted = false
        GROUP BY cd.department_name
      ),
      department_moods AS (
        SELECT
          cd.department_name,
          m.checked_in_at,
          mood
        FROM student s
        INNER JOIN college_programs cp ON s.program_id = cp.program_id
        INNER JOIN college_departments cd ON cp.college_department_id = cd.department_id
        INNER JOIN mood_check_ins m ON m.user_id = s.user_id
        CROSS JOIN LATERAL unnest(array_remove(ARRAY[m.mood_1, m.mood_2, m.mood_3], NULL::varchar)) AS mood
        WHERE s.is_deleted = false
      ),
      weekly_sentiment_counts AS (
        SELECT
          department_name,
          date_trunc('week', checked_in_at AT TIME ZONE 'Asia/Manila')::date AS period_start,
          mood,
          COUNT(*) AS mood_count
        FROM department_moods
        GROUP BY department_name, period_start, mood
      ),
      weekly_sentiment_totals AS (
        SELECT
          department_name,
          period_start,
          SUM(mood_count) AS total_count
        FROM weekly_sentiment_counts
        GROUP BY department_name, period_start
      ),
      weekly_sentiments AS (
        SELECT
          wsc.department_name,
          jsonb_agg(
            jsonb_build_object(
              'period_start', wsc.period_start::text,
              'mood', wsc.mood,
              'count', wsc.mood_count,
              'percentage', ROUND((wsc.mood_count::numeric / NULLIF(wst.total_count, 0)) * 100, 2)
            )
            ORDER BY wsc.period_start DESC, wsc.mood ASC
          ) AS weekly_sentiments
        FROM weekly_sentiment_counts wsc
        INNER JOIN weekly_sentiment_totals wst
          ON wst.department_name = wsc.department_name
         AND wst.period_start = wsc.period_start
        GROUP BY wsc.department_name
      ),
      monthly_sentiment_counts AS (
        SELECT
          department_name,
          date_trunc('month', checked_in_at AT TIME ZONE 'Asia/Manila')::date AS period_start,
          mood,
          COUNT(*) AS mood_count
        FROM department_moods
        GROUP BY department_name, period_start, mood
      ),
      monthly_sentiment_totals AS (
        SELECT
          department_name,
          period_start,
          SUM(mood_count) AS total_count
        FROM monthly_sentiment_counts
        GROUP BY department_name, period_start
      ),
      monthly_sentiments AS (
        SELECT
          msc.department_name,
          jsonb_agg(
            jsonb_build_object(
              'period_start', msc.period_start::text,
              'mood', msc.mood,
              'count', msc.mood_count,
              'percentage', ROUND((msc.mood_count::numeric / NULLIF(mst.total_count, 0)) * 100, 2)
            )
            ORDER BY msc.period_start DESC, msc.mood ASC
          ) AS monthly_sentiments
        FROM monthly_sentiment_counts msc
        INNER JOIN monthly_sentiment_totals mst
          ON mst.department_name = msc.department_name
         AND mst.period_start = msc.period_start
        GROUP BY msc.department_name
      )
      SELECT 
        ds.department_name,
        ds.total_students,
        COALESCE(dcc.excelling_count, 0) as excelling_count,
        COALESCE(dcc.thriving_count, 0) as thriving_count,
        COALESCE(dcc.struggling_count, 0) as struggling_count,
        COALESCE(dcc.in_crisis_count, 0) as in_crisis_count,
        (ds.total_students - 
          COALESCE(dcc.excelling_count, 0) -
          COALESCE(dcc.thriving_count, 0) -
          COALESCE(dcc.struggling_count, 0) -
          COALESCE(dcc.in_crisis_count, 0)
        ) as not_classified_count,
        ROUND(
          (COALESCE(dcc.excelling_count, 0)::numeric / 
           NULLIF(ds.total_students, 0) * 100), 
          2
        ) as excelling_percentage,
        ROUND(
          (COALESCE(dcc.thriving_count, 0)::numeric / 
           NULLIF(ds.total_students, 0) * 100), 
          2
        ) as thriving_percentage,
        ROUND(
          (COALESCE(dcc.struggling_count, 0)::numeric / 
           NULLIF(ds.total_students, 0) * 100), 
          2
        ) as struggling_percentage,
        ROUND(
          (COALESCE(dcc.in_crisis_count, 0)::numeric / 
           NULLIF(ds.total_students, 0) * 100), 
          2
        ) as in_crisis_percentage,
        ROUND(
          ((ds.total_students - 
            COALESCE(dcc.excelling_count, 0) -
            COALESCE(dcc.thriving_count, 0) -
            COALESCE(dcc.struggling_count, 0) -
            COALESCE(dcc.in_crisis_count, 0)
          )::numeric / NULLIF(ds.total_students, 0) * 100), 
          2
        ) as not_classified_percentage,
        COALESCE(ws.weekly_sentiments, '[]'::jsonb) as weekly_sentiments,
        COALESCE(ms.monthly_sentiments, '[]'::jsonb) as monthly_sentiments
      FROM department_students ds
      LEFT JOIN department_classification_counts dcc ON dcc.department_name = ds.department_name
      LEFT JOIN weekly_sentiments ws ON ws.department_name = ds.department_name
      LEFT JOIN monthly_sentiments ms ON ms.department_name = ds.department_name
      ORDER BY ds.department_name ASC
    `;
  
    const result = await AppDataSource.query(query);
  
    return result.map((row: Record<string, unknown>) => ({
      department_name: String(row.department_name ?? ''),
      total_students: parseInt(String(row.total_students ?? '0'), 10),
      excelling_count: parseInt(String(row.excelling_count ?? '0'), 10),
      thriving_count: parseInt(String(row.thriving_count ?? '0'), 10),
      struggling_count: parseInt(String(row.struggling_count ?? '0'), 10),
      in_crisis_count: parseInt(String(row.in_crisis_count ?? '0'), 10),
      not_classified_count: parseInt(String(row.not_classified_count ?? '0'), 10),
      excelling_percentage: parseFloat(String(row.excelling_percentage ?? '0')) || 0,
      thriving_percentage: parseFloat(String(row.thriving_percentage ?? '0')) || 0,
      struggling_percentage: parseFloat(String(row.struggling_percentage ?? '0')) || 0,
      in_crisis_percentage: parseFloat(String(row.in_crisis_percentage ?? '0')) || 0,
      not_classified_percentage: parseFloat(String(row.not_classified_percentage ?? '0')) || 0,
      weekly_sentiments: this.parseSentimentStats(row.weekly_sentiments),
      monthly_sentiments: this.parseSentimentStats(row.monthly_sentiments)
    }));
  }
}