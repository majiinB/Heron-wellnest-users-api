export interface SentimentPeriodStat {
  period_start: string;
  mood: string;
  count: number;
  percentage: number;
}

export interface DepartmentStatistics {
  department_name: string;
  total_students: number;
  excelling_count: number;
  thriving_count: number;
  struggling_count: number;
  in_crisis_count: number;
  not_classified_count: number;
  excelling_percentage: number;
  thriving_percentage: number;
  struggling_percentage: number;
  in_crisis_percentage: number;
  not_classified_percentage: number;
  weekly_sentiments: SentimentPeriodStat[];
  monthly_sentiments: SentimentPeriodStat[];
}