export interface CollegeProgram {
  program_id: string;
  program_name: string;
  college_department_id: string | null;
  department_name: string | null;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}
