export interface Student {
  user_id: string;
  user_name: string;
  email: string;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
  finished_onboarding: boolean;
  program_id: string;
  program_name?: string;
  department_name?: string;
  cor_school_year: string;
  year_level: string;
}

export interface PaginatedStudents {
  students: Student[];
  hasMore: boolean;
  nextCursor?: string;
}
