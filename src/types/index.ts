export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskCategory = 'Pessoal' | 'Trabalho' | 'Estudos' | 'Saúde' | 'Espiritual' | 'Geral';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string; // YYYY-MM-DD
  category: TaskCategory;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  created_at: string;
  updated_at: string;
}

export type HabitTargetType = 'frequency' | 'sequence' | 'quantity' | 'duration';

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  frequency: string; // e.g., '3x por semana'
  target: number; // e.g. 3 (times), 2 (liters), 30 (minutes)
  target_type: HabitTargetType; // frequency, sequence, quantity, duration
  unit?: string; // e.g. 'dias', 'L', 'minutos', 'vezes'
  start_date: string;
  created_at: string;
  updated_at: string;
}

export interface HabitRecord {
  id: string;
  habit_id: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  value?: number;
  created_at: string;
}

export type NoteColor = 'sand' | 'yellow' | 'green' | 'blue' | 'peach' | 'purple';
export type NoteType = 'paper' | 'postit';

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  color: NoteColor;
  type: NoteType;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export type GoalCategory = 'Pessoal' | 'Financeira' | 'Profissional' | 'Estudos' | 'Saúde' | 'Espiritual';
export type GoalTimeframe = 'curto' | 'medio' | 'longo';
export type GoalStatus = 'active' | 'completed' | 'paused';

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  type: string;
  category: GoalCategory;
  timeframe: GoalTimeframe;
  target_value?: number;
  current_value?: number;
  unit?: string; // e.g. 'R$', 'km', 'capítulos'
  deadline?: string;
  status: GoalStatus;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export type SleepQuality = 'ruim' | 'regular' | 'bom' | 'excelente';

export interface SleepLog {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  hours: number;
  bedtime?: string; // HH:mm
  wake_time?: string; // HH:mm
  quality?: SleepQuality;
  notes?: string;
  created_at: string;
  updated_at: string;
}
