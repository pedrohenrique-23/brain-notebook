import { supabase } from '../lib/supabase';
import { Goal } from '../types';
import { EntityInput, fromDbRow, nowIso, requireUserId, toDbPayload, toError } from './supabaseHelpers';

const GOALS_TABLE = 'goals';

export type GoalInput = EntityInput<Goal>;

// ==========================================================================
// CRUD METAS & VISION BOARD (Supabase)
// ==========================================================================

export async function fetchGoals(): Promise<Goal[]> {
  try {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from(GOALS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map((row) => fromDbRow<Goal>(row));
  } catch (err) {
    throw toError('carregar metas', err);
  }
}

export async function saveGoal(goal: GoalInput): Promise<Goal> {
  const { id, ...fields } = goal;

  try {
    if (id) {
      const { data, error } = await supabase
        .from(GOALS_TABLE)
        .update({ ...toDbPayload(fields), updated_at: nowIso() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return fromDbRow<Goal>(data);
    }

    const userId = await requireUserId();
    const { data, error } = await supabase
      .from(GOALS_TABLE)
      .insert({ ...toDbPayload(fields), user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return fromDbRow<Goal>(data);
  } catch (err) {
    throw toError(id ? 'atualizar meta' : 'criar meta', err);
  }
}

export async function deleteGoal(goalId: string): Promise<void> {
  try {
    const { error } = await supabase.from(GOALS_TABLE).delete().eq('id', goalId);
    if (error) throw error;
  } catch (err) {
    throw toError('excluir meta', err);
  }
}
