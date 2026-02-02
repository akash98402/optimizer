
import { GoogleGenAI } from "@google/genai";
import { Task } from "../types";

// Initialize the Google GenAI SDK with the API key from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Provides a daily strategic breakdown for academic tasks.
 * Upgraded to gemini-3-pro-preview for better handling of complex reasoning tasks.
 */
export const getDailyStrategy = async (tasks: Task[], maxHours: number) => {
  const todayTasks = tasks
    .filter(t => t.status === 'pending')
    .sort((a, b) => b.priorityScore - a.priorityScore);

  if (todayTasks.length === 0) return "No pending tasks. Great day for review or rest!";

  const summary = todayTasks.slice(0, 5).map(t => `- ${t.title} (${t.effortHours}h, Priority: ${t.priorityScore})`).join('\n');

  try {
    // Using gemini-3-pro-preview as academic planning constitutes a complex text task with advanced reasoning
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `High-priority tasks for today (Study window: ${maxHours}h):\n${summary}`,
      config: { 
        systemInstruction: "You are an Academic Planner. Provide a brief (max 100 words) strategic breakdown of how to attack these tasks today without burning out.",
        temperature: 0.6 
      }
    });
    // Accessing the .text property directly as per the latest SDK standards (property, not a method)
    return response.text;
  } catch (e) {
    return "Focus on your top priority task first. Take 10-minute breaks every hour.";
  }
};

/**
 * Provides academic advice using high-performance generative models.
 */
export const getAcademicAdvice = async (tasks: Task[]) => {
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  if (pendingTasks.length === 0) return "Excellent job! All your tasks are completed.";

  const taskSummary = pendingTasks.slice(0, 10).map(t => 
    `- ${t.title} (Due ${t.deadline}, Weight: ${t.academicWeight}, Effort: ${t.effortHours}h)`
  ).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Current pending workload:\n${taskSummary}`,
      config: { 
        systemInstruction: "You are an Academic Workflow Optimizer. Provide 3 short, actionable tips for this specific workload to improve student efficiency.",
        temperature: 0.7 
      }
    });
    return response.text;
  } catch (error) {
    return "Focus on tasks with the highest academic weight first.";
  }
};
