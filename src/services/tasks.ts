import { supabase } from '../lib/supabase';
import { Task } from '../types';
import { EntityInput, fromDbRow, nowIso, requireUserId, toDbPayload, toError } from './supabaseHelpers';

const TASKS_TABLE = 'tasks';

export type TaskInput = EntityInput<Task>;

// ==========================================================================
// CRUD TAREFAS (Supabase)
// ==========================================================================

export async function fetchTasks(): Promise<Task[]> {
  try {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from(TASKS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map((row) => fromDbRow<Task>(row));
  } catch (err) {
    throw toError('carregar tarefas', err);
  }
}

export async function saveTask(task: TaskInput): Promise<Task> {
  const { id, ...fields } = task;

  try {
    if (id) {
      const { data, error } = await supabase
        .from(TASKS_TABLE)
        .update({ ...toDbPayload(fields), updated_at: nowIso() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return fromDbRow<Task>(data);
    }

    const userId = await requireUserId();
    const { data, error } = await supabase
      .from(TASKS_TABLE)
      .insert({ ...toDbPayload(fields), user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return fromDbRow<Task>(data);
  } catch (err) {
    throw toError(id ? 'atualizar tarefa' : 'criar tarefa', err);
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  try {
    const { error } = await supabase.from(TASKS_TABLE).delete().eq('id', taskId);
    if (error) throw error;
  } catch (err) {
    throw toError('excluir tarefa', err);
  }
}

// Ciclo Bullet Journal: pending (○) -> in_progress (◐) -> completed (●) -> pending (○)
export async function cycleTaskStatus(task: Task): Promise<Task> {
  let nextStatus: Task['status'] = 'in_progress';
  if (task.status === 'in_progress') nextStatus = 'completed';
  else if (task.status === 'completed') nextStatus = 'pending';

  try {
    const { data, error } = await supabase
      .from(TASKS_TABLE)
      .update({ status: nextStatus, updated_at: nowIso() })
      .eq('id', task.id)
      .select()
      .single();

    if (error) throw error;
    return fromDbRow<Task>(data);
  } catch (err) {
    throw toError('atualizar status da tarefa', err);
  }
}
