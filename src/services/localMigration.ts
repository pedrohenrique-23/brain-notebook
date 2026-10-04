import { supabase } from '../lib/supabase';
import { Goal, Habit, HabitRecord, Note, SleepLog, Task } from '../types';
import { requireUserId, toError } from './supabaseHelpers';

// Chaves usadas pela versão antiga do app, quando tudo ficava no localStorage
const LEGACY_KEYS = {
  tasks: 'caderno_tasks',
  habits: 'caderno_habits',
  habitRecords: 'caderno_habit_records',
  notes: 'caderno_notes',
  goals: 'caderno_goals',
  sleepLogs: 'caderno_sleep_logs',
} as const;

const MIGRATION_MARKER_KEY = 'caderno_supabase_migration';

export type LegacyEntity = keyof typeof LEGACY_KEYS;
export type LegacyCounts = Record<LegacyEntity, number>;

export const LEGACY_ENTITY_LABELS: Record<LegacyEntity, string> = {
  tasks: 'Tarefas',
  habits: 'Hábitos',
  habitRecords: 'Registros de hábitos',
  notes: 'Anotações',
  goals: 'Metas',
  sleepLogs: 'Registros de sono',
};

export interface MigrationMarker {
  userId: string;
  migratedAt: string;
}

interface LegacyData {
  tasks: Task[];
  habits: Habit[];
  habitRecords: HabitRecord[];
  notes: Note[];
  goals: Goal[];
  sleepLogs: SleepLog[];
}

function readList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function readLegacyData(): LegacyData {
  return {
    tasks: readList<Task>(LEGACY_KEYS.tasks),
    habits: readList<Habit>(LEGACY_KEYS.habits),
    habitRecords: readList<HabitRecord>(LEGACY_KEYS.habitRecords),
    notes: readList<Note>(LEGACY_KEYS.notes),
    goals: readList<Goal>(LEGACY_KEYS.goals),
    sleepLogs: readList<SleepLog>(LEGACY_KEYS.sleepLogs),
  };
}

export function getLegacyCounts(): LegacyCounts {
  const data = readLegacyData();
  return {
    tasks: data.tasks.length,
    habits: data.habits.length,
    habitRecords: data.habitRecords.length,
    notes: data.notes.length,
    goals: data.goals.length,
    sleepLogs: data.sleepLogs.length,
  };
}

export function getMigrationMarker(): MigrationMarker | null {
  try {
    const raw = localStorage.getItem(MIGRATION_MARKER_KEY);
    return raw ? (JSON.parse(raw) as MigrationMarker) : null;
  } catch {
    return null;
  }
}

// ==========================================================================
// Normalização: só colunas conhecidas, datas vazias viram null
// ==========================================================================

function textOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function numberOrNull(value: unknown): number | null {
  const n = typeof value === 'string' ? Number(value) : value;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
}

// Mantém as datas originais quando válidas, para preservar a ordem cronológica
function timestamps(item: { created_at?: string; updated_at?: string }) {
  const valid = (v?: string) => (v && !Number.isNaN(Date.parse(v)) ? v : undefined);
  const created = valid(item.created_at);
  const updated = valid(item.updated_at) ?? created;
  return {
    ...(created ? { created_at: created } : {}),
    ...(updated ? { updated_at: updated } : {}),
  };
}

// Em listas com chave única no banco, fica só a versão mais recente de cada chave
function dedupeBy<T extends { updated_at?: string; created_at?: string }>(items: T[], key: (item: T) => string): T[] {
  const byKey = new Map<string, T>();
  for (const item of items) {
    const k = key(item);
    const current = byKey.get(k);
    const stamp = (x: T) => x.updated_at ?? x.created_at ?? '';
    if (!current || stamp(item) >= stamp(current)) byKey.set(k, item);
  }
  return [...byKey.values()];
}

async function insertRows(table: string, rows: Record<string, unknown>[]): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await supabase.from(table).insert(rows);
  if (error) throw new Error(`${table}: ${error.message}`);
}

// ==========================================================================
// Migração
// ==========================================================================

// Envia o histórico do localStorage para as tabelas do usuário logado.
// Não apaga nada localmente; grava um marcador para evitar duplicação acidental.
export async function migrateLocalDataToSupabase(): Promise<LegacyCounts> {
  const migrated: LegacyCounts = { tasks: 0, habits: 0, habitRecords: 0, notes: 0, goals: 0, sleepLogs: 0 };

  try {
    const userId = await requireUserId();
    const data = readLegacyData();

    // Hábitos primeiro, com UUID gerado aqui para religar os registros diários ao novo id
    const habitIdMap = new Map<string, string>();
    const habitRows = data.habits.map((h) => {
      const newId = crypto.randomUUID();
      habitIdMap.set(h.id, newId);
      return {
        id: newId,
        user_id: userId,
        name: textOrNull(h.name) ?? 'Hábito sem nome',
        description: textOrNull(h.description),
        frequency: textOrNull(h.frequency) ?? 'Diário',
        target: Math.round(numberOrNull(h.target) ?? 1),
        target_type: h.target_type ?? 'frequency',
        unit: textOrNull(h.unit),
        ...(textOrNull(h.start_date) ? { start_date: h.start_date } : {}),
        ...timestamps(h),
      };
    });
    await insertRows('habits', habitRows);
    migrated.habits = habitRows.length;

    // Registros de hábitos cujo hábito não existe mais são descartados
    const recordRows = dedupeBy(
      data.habitRecords.filter((r) => habitIdMap.has(r.habit_id) && textOrNull(r.date)),
      (r) => `${r.habit_id}|${r.date}`
    ).map((r) => {
      // habit_records não tem updated_at
      const { created_at } = timestamps(r);
      return {
        habit_id: habitIdMap.get(r.habit_id),
        date: r.date,
        completed: Boolean(r.completed),
        value: numberOrNull(r.value) ?? 1,
        ...(created_at ? { created_at } : {}),
      };
    });
    await insertRows('habit_records', recordRows);
    migrated.habitRecords = recordRows.length;

    const taskRows = data.tasks.map((t) => ({
      user_id: userId,
      title: textOrNull(t.title) ?? 'Sem título',
      description: textOrNull(t.description),
      status: t.status ?? 'pending',
      priority: t.priority ?? 'medium',
      due_date: textOrNull(t.due_date),
      category: textOrNull(t.category) ?? 'Geral',
      recurrence: t.recurrence ?? 'none',
      ...timestamps(t),
    }));
    await insertRows('tasks', taskRows);
    migrated.tasks = taskRows.length;

    const noteRows = data.notes.map((n) => ({
      user_id: userId,
      title: textOrNull(n.title) ?? 'Sem título',
      content: n.content ?? '',
      color: n.color ?? 'sand',
      type: n.type ?? 'paper',
      is_pinned: Boolean(n.is_pinned),
      ...timestamps(n),
    }));
    await insertRows('notes', noteRows);
    migrated.notes = noteRows.length;

    const goalRows = data.goals.map((g) => ({
      user_id: userId,
      title: textOrNull(g.title) ?? 'Sem título',
      description: textOrNull(g.description),
      type: textOrNull(g.type) ?? 'geral',
      category: g.category ?? 'Pessoal',
      timeframe: g.timeframe ?? 'medio',
      target_value: numberOrNull(g.target_value),
      current_value: numberOrNull(g.current_value) ?? 0,
      unit: textOrNull(g.unit),
      deadline: textOrNull(g.deadline),
      status: g.status ?? 'active',
      image_url: textOrNull(g.image_url),
      ...timestamps(g),
    }));
    await insertRows('goals', goalRows);
    migrated.goals = goalRows.length;

    // sleep_logs tem UNIQUE(user_id, date): upsert para não falhar se a data já existir no Supabase
    const sleepRows = dedupeBy(
      data.sleepLogs.filter((s) => textOrNull(s.date)),
      (s) => s.date
    ).map((s) => ({
      user_id: userId,
      date: s.date,
      hours: numberOrNull(s.hours) ?? 0,
      bedtime: textOrNull(s.bedtime),
      wake_time: textOrNull(s.wake_time),
      quality: s.quality ?? 'bom',
      notes: textOrNull(s.notes),
      ...timestamps(s),
    }));
    if (sleepRows.length > 0) {
      const { error } = await supabase.from('sleep_logs').upsert(sleepRows, { onConflict: 'user_id,date' });
      if (error) throw new Error(`sleep_logs: ${error.message}`);
    }
    migrated.sleepLogs = sleepRows.length;

    const marker: MigrationMarker = { userId, migratedAt: new Date().toISOString() };
    localStorage.setItem(MIGRATION_MARKER_KEY, JSON.stringify(marker));
    return migrated;
  } catch (err) {
    // Sem transação no cliente: informa o que já foi enviado antes da falha
    const done = (Object.keys(migrated) as LegacyEntity[])
      .filter((k) => migrated[k] > 0)
      .map((k) => `${LEGACY_ENTITY_LABELS[k]}: ${migrated[k]}`)
      .join(', ');
    const error = toError('migrar dados locais', err);
    if (done) error.message += ` (já enviados antes da falha: ${done})`;
    throw error;
  }
}
