/**
 * Enum representing the classification levels of student performance and well-being.
 * 
 * @remarks
 * This enum is used to categorize students based on their academic performance 
 * and overall wellness status within the Heron WellNest system.
 * 
 * @enum {string}
 */
export enum ClassificationEnum {
  EXCELLING = 'Excelling',
  THRIVING = 'Thriving',
  STRUGGLING = 'Struggling',
  INCRISIS = 'InCrisis'
}

/**
 * Represents a student's classification record with associated user and department information.
 * 
 * @interface StudentClassification
 * @property {string} classification_id - Unique identifier for the classification record
 * @property {string} student_id - Unique identifier for the student
 * @property {ClassificationEnum} classification - The classification category assigned to the student
 * @property {boolean} is_flagged - Indicates whether this classification has been flagged for review
 * @property {Date} classified_at - Timestamp when the classification was assigned
 * @property {string} user_name - Name of the user associated with this classification
 * @property {string} email - Email address of the user
 * @property {number} department_id - Unique identifier for the department
 * @property {string} department_name - Name of the department
 */
export interface StudentClassification {
  classification_id: string;
  student_id: string;
  classification: ClassificationEnum;
  classification_probabilities: ClassificationProbabilities;
  classified_at: Date;
  user_name: string;
  email: string;
  department_id: string;
  program_name?: string;
  department_name: string;
  mood_check_ins?: MoodCheckIn[];
  daily_classifications?: DailyClassification[];
  weekly_classifications?: WeeklyClassification[];
}

export interface MoodCheckIn {
  check_in_id: string;
  mood_1: string;
  mood_2: string;
  mood_3: string;
  checked_in_at: Date;
}

export interface DailyClassification {
  classification_id: string;
  student_id: string;
  classification: ClassificationEnum;
  classification_probabilities: ClassificationProbabilities;
  classified_at: Date;
}

export interface WeeklyClassification {
  weekly_classification_id: string;
  student_id: string;
  week_start: Date;
  week_end: Date;
  dominant_classification: ClassificationEnum;
  is_flagged: boolean;
  classified_at: Date;
}

export interface ClassificationProbabilities {
  InCrisis: number;
  Thriving: number;
  Excelling: number;
  Struggling: number;
}