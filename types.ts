
export enum TaskCategory {
  EXAM = 'Exam',
  PROJECT = 'Project',
  ASSIGNMENT = 'Assignment',
  NOTES = 'Notes'
}

export enum TaskStatus {
  PENDING = 'pending',
  COMPLETED = 'completed'
}

export interface AppSettings {
  wUrgency: number;
  wWeight: number;
  wEffort: number;
  wCategory: number;
  stressWindowDays: number;
  maxStudyHoursPerDay: number;
}

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  deadline: string; // ISO format
  effortHours: number;
  academicWeight: number; // 0 to 1
  status: TaskStatus;
  priorityScore: number;
}

export interface StressPoint {
  date: string;
  stressScore: number;
}

export interface User {
  email: string;
  isLoggedIn: boolean;
}

export type SortField = 'priority' | 'deadline' | 'effort';
export type Page = 'dashboard' | 'tasks' | 'finished' | 'planner' | 'analytics' | 'reports' | 'settings' | 'login';
