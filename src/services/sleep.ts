import { supabase } from '../lib/supabase';
import { SleepLog } from '../types';
import { EntityInput, fromDbRow, nowIso, requireUserId, toDbPayload, toError } from './supabaseHelpers';

const SLEEP_TABLE = 'sleep_logs';

export type SleepLogInput = EntityInput<SleepLog>;

// Colunas TIME voltam como HH:MM:SS; os inputs do app usam HH:mm
function toSleepLog(row: Record<string, unknown>): SleepLog {
  const log = fromDbRow<SleepLog>(row);
  return {
    ...log,
    hours: Number(log.hours),
    bedtime: log.bedtime?.slice(0, 5),
    wake_time: log.wake_time?.slice(0, 5),
  };
}

// ==========================================================================
// CRUD CONTROLE DO SONO (Supabase)
// ==========================================================================

export async function fetchSleepLogs(): Promise<SleepLog[]> {
  try {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from(SLEEP_TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false }); // Mais recente primeiro

    if (error) throw error;
    return (data ?? []).map(toSleepLog);
  } catch (err) {
    throw toError('carregar registros de sono', err);
  }
}

export async function saveSleepLog(log: SleepLogInput): Promise<SleepLog> {
  const { id, ...fields } = log;

  try {
    if (id) {
      const { data, error } = await supabase
        .from(SLEEP_TABLE)
        .update({ ...toDbPayload(fields), updated_at: nowIso() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return toSleepLog(data);
    }

    // Um registro por dia: se já existir um para a mesma data, ele é sobrescrito
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from(SLEEP_TABLE)
      .upsert(
        { ...toDbPayload(fields), user_id: userId, updated_at: nowIso() },
        { onConflict: 'user_id,date' }
      )
      .select()
      .single();

    if (error) throw error;
    return toSleepLog(data);
  } catch (err) {
    throw toError(id ? 'atualizar registro de sono' : 'criar registro de sono', err);
  }
}

export async function deleteSleepLog(logId: string): Promise<void> {
  try {
    const { error } = await supabase.from(SLEEP_TABLE).delete().eq('id', logId);
    if (error) throw error;
  } catch (err) {
    throw toError('excluir registro de sono', err);
  }
}
