
import { Task, TaskCategory, StressPoint, AppSettings } from './types';

export const CATEGORY_SCORES: Record<TaskCategory, number> = {
  [TaskCategory.EXAM]: 1.0,
  [TaskCategory.PROJECT]: 0.8,
  [TaskCategory.ASSIGNMENT]: 0.6,
  [TaskCategory.NOTES]: 0.4,
};

export const DEFAULT_SETTINGS: AppSettings = {
  wUrgency: 0.4,
  wWeight: 0.3,
  wEffort: 0.2,
  wCategory: 0.1,
  stressWindowDays: 3,
  maxStudyHoursPerDay: 6
};

/**
 * P = (w1 * U) + (w2 * I) + (w3 * E) + (w4 * C)
 * U = 1 / (days_left + 1)
 * I = weight (0–1)
 * E = effort_hours normalized (max 10 hours)
 * C = category score
 */
export const calculatePriorityScore = (task: Omit<Task, 'priorityScore' | 'id'>, settings: AppSettings): number => {
  const deadlineDate = new Date(task.deadline);
  const now = new Date();
  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  
  const U = 1 / (diffDays + 1);
  const I = task.academicWeight;
  const E = Math.min(task.effortHours, 10) / 10;
  const C = CATEGORY_SCORES[task.category];

  const score = (settings.wUrgency * U) + (settings.wWeight * I) + (settings.wEffort * E) + (settings.wCategory * C);
  return Number(score.toFixed(4));
};

export const getPriorityLevel = (score: number) => {
  if (score > 0.70) return { label: 'High', color: 'text-red-600 bg-red-50 border-red-200' };
  if (score >= 0.40) return { label: 'Medium', color: 'text-orange-600 bg-orange-50 border-orange-200' };
  return { label: 'Low', color: 'text-green-600 bg-green-50 border-green-200' };
};

export const calculateStressAnalysis = (tasks: Task[], daysAhead: number = 14, windowSize: number = 3): StressPoint[] => {
  const points: StressPoint[] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  for (let i = 0; i < daysAhead; i++) {
    const checkDate = new Date(now);
    checkDate.setDate(now.getDate() + i);
    
    const windowEnd = new Date(checkDate);
    windowEnd.setDate(checkDate.getDate() + windowSize);

    const stressScore = tasks
      .filter(t => t.status === 'pending')
      .filter(t => {
        const d = new Date(t.deadline);
        return d >= checkDate && d <= windowEnd;
      })
      .reduce((sum, t) => sum + t.effortHours, 0);

    points.push({
      date: checkDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      stressScore
    });
  }

  return points;
};
