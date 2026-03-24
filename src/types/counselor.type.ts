export interface Counselor {
  user_id: string;
  user_name: string;
  email: string;
  password: string;
  is_deleted: boolean;
  department_id: string;
  created_at: Date;
  updated_at: Date;
}

export type SafeCounselor = Omit<Counselor, 'password'>;

export interface CounselorListItem {
  user_id: string;
  user_name: string;
  email: string;
  department_id: string;
  department_name: string;
  created_at: Date;
  updated_at: Date;
}

export interface PaginatedCounselors {
  counselors: CounselorListItem[];
  hasMore: boolean;
  nextCursor?: string;
}