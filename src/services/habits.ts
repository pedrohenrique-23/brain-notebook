import { supabase } from '../lib/supabase';
import { Habit, HabitRecord } from '../types';
import { EntityInput, fromDbRow, nowIso, requireUserId, toDbPayload, toError } from './supabaseHelpers';

const HABITS_TABLE = 'habits';
const RECORDS_TABLE = 'habit_records';

export type HabitInput = EntityInput<Habit>;

function toHabitRecord(row: Record<string, unknown>): HabitRecord {
  const record = fromDbRow<HabitRecord>(row);
  return { ...record, value: record.value === undefined ? undefined : Number(record.value) };
}

// ==========================================================================
// CRUD HÁBITOS (Supabase)
// ==========================================================================

export async function fetchHabits(): Promise<Habit[]> {
  try {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from(HABITS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map((row) => fromDbRow<Habit>(row));
  } catch (err) {
    throw toError('carregar hábitos', err);
  }
}

export async function saveHabit(habit: HabitInput): Promise<Habit> {
  const { id, ...fields } = habit;

  try {
    if (id) {
      const { data, error } = await supabase
        .from(HABITS_TABLE)
        .update({ ...toDbPayload(fields), updated_at: nowIso() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return fromDbRow<Habit>(data);
    }

    const userId = await requireUserId();
    const { data, error } = await supabase
      .from(HABITS_TABLE)
      .insert({ ...toDbPayload(fields), user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return fromDbRow<Habit>(data);
  } catch (err) {
    throw toError(id ? 'atualizar hábito' : 'criar hábito', err);
  }
}

// Os registros do hábito são removidos pelo ON DELETE CASCADE de habit_records
export async function deleteHabit(habitId: string): Promise<void> {
  try {
    const { error } = await supabase.from(HABITS_TABLE).delete().eq('id', habitId);
    if (error) throw error;
  } catch (err) {
    throw toError('excluir hábito', err);
  }
}

// ==========================================================================
// REGISTROS DIÁRIOS DOS HÁBITOS (Supabase)
// ==========================================================================

export async function fetchHabitRecords(habitIds: string[]): Promise<HabitRecord[]> {
  if (habitIds.length === 0) return [];

  try {
    const { data, error } = await supabase
      .from(RECORDS_TABLE)
      .select('*')
      .in('habit_id', habitIds);

    if (error) throw error;
    return (data ?? []).map(toHabitRecord);
  } catch (err) {
    throw toError('carregar registros de hábitos', err);
  }
}

// Marca/desmarca o hábito no dia e devolve o registro resultante
export async function toggleHabitDay(habitId: string, dateStr: string): Promise<HabitRecord> {
  try {
    const { data: existing, error: findError } = await supabase
      .from(RECORDS_TABLE)
      .select('*')
      .eq('habit_id', habitId)
      .eq('date', dateStr)
      .maybeSingle();

    if (findError) throw findError;

    if (existing) {
      const { data, error } = await supabase
        .from(RECORDS_TABLE)
        .update({ completed: !existing.completed })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return toHabitRecord(data);
    }

    const { data, error } = await supabase
      .from(RECORDS_TABLE)
      .insert({ habit_id: habitId, date: dateStr, completed: true, value: 1 })
      .select()
      .single();

    if (error) throw error;
    return toHabitRecord(data);
  } catch (err) {
    throw toError('registrar hábito', err);
  }
}

// Calcular sequência atual (streak) de um hábito em dias consecutivos
export function calculateStreak(records: HabitRecord[]): number {
  const datesSet = new Set(records.filter((r) => r.completed).map((r) => r.date));
  if (datesSet.size === 0) return 0;

  let streak = 0;
  const checkDate = new Date();

  // Se hoje não estiver marcado ainda, pode verificar a partir de ontem
  const todayStr = checkDate.toISOString().split('T')[0];
  if (!datesSet.has(todayStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (datesSet.has(checkDate.toISOString().split('T')[0])) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}
