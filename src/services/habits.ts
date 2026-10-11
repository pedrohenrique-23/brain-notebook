import { supabase } from '../lib/supabase';
import { Habit, HabitRecord, HabitReflectionNote } from '../types';
import { EntityInput, fromDbRow, nowIso, requireUserId, toDbPayload, toError } from './supabaseHelpers';

const HABITS_TABLE = 'habits';
const RECORDS_TABLE = 'habit_records';

export type HabitInput = Omit<Habit, 'id' | 'created_at' | 'updated_at' | 'user_id'> & {
  id?: string;
  user_id?: string;
};

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
    return (data ?? []).map((row) => {
      const habit = fromDbRow<Habit>(row);
      // Resolver categoria caso não exista na coluna do banco
      if (!habit.category) {
        const cached = localStorage.getItem(`caderno_habit_cat_${habit.id}`);
        if (cached) {
          habit.category = cached;
        } else {
          habit.category = inferHabitCategory(habit.name);
        }
      }
      return habit;
    });
  } catch (err) {
    throw toError('carregar hábitos', err);
  }
}

export function inferHabitCategory(name: string): string {
  const n = name.toLowerCase();
  if (
    n.includes('sleep') ||
    n.includes('sono') ||
    n.includes('água') ||
    n.includes('water') ||
    n.includes('medicin') ||
    n.includes('skin') ||
    n.includes('teeth') ||
    n.includes('dente') ||
    n.includes('treino') ||
    n.includes('yoga') ||
    n.includes('stretch') ||
    n.includes('along') ||
    n.includes('food') ||
    n.includes('almoço') ||
    n.includes('comida')
  ) {
    return 'Saúde & Corpo';
  }
  if (
    n.includes('read') ||
    n.includes('ler') ||
    n.includes('livro') ||
    n.includes('estud') ||
    n.includes('foco') ||
    n.includes('program') ||
    n.includes('mental')
  ) {
    return 'Mente & Foco';
  }
  return 'Rotina';
}

export async function saveHabit(habit: HabitInput): Promise<Habit> {
  const { id, category, ...fields } = habit;
  const chosenCategory = category || inferHabitCategory(fields.name || '');

  try {
    if (id) {
      try {
        const { data, error } = await supabase
          .from(HABITS_TABLE)
          .update({ ...toDbPayload({ ...fields, category: chosenCategory }), updated_at: nowIso() })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        localStorage.setItem(`caderno_habit_cat_${id}`, chosenCategory);
        return { ...fromDbRow<Habit>(data), category: chosenCategory };
      } catch (errWithCat) {
        // Fallback caso a tabela não tenha a coluna 'category'
        const { data, error } = await supabase
          .from(HABITS_TABLE)
          .update({ ...toDbPayload(fields), updated_at: nowIso() })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        localStorage.setItem(`caderno_habit_cat_${id}`, chosenCategory);
        return { ...fromDbRow<Habit>(data), category: chosenCategory };
      }
    }

    const userId = await requireUserId();
    try {
      const { data, error } = await supabase
        .from(HABITS_TABLE)
        .insert({ ...toDbPayload({ ...fields, category: chosenCategory }), user_id: userId })
        .select()
        .single();

      if (error) throw error;
      const created = fromDbRow<Habit>(data);
      localStorage.setItem(`caderno_habit_cat_${created.id}`, chosenCategory);
      return { ...created, category: chosenCategory };
    } catch (errWithCat) {
      // Fallback sem a coluna category
      const { data, error } = await supabase
        .from(HABITS_TABLE)
        .insert({ ...toDbPayload(fields), user_id: userId })
        .select()
        .single();

      if (error) throw error;
      const created = fromDbRow<Habit>(data);
      localStorage.setItem(`caderno_habit_cat_${created.id}`, chosenCategory);
      return { ...created, category: chosenCategory };
    }
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

// ==========================================================================
// NOTAS DA SEMANA / REFLEXÕES DO BULLET JOURNAL
// ==========================================================================

const REFLECTIONS_KEY = 'caderno_habit_reflections';

const DEFAULT_REFLECTIONS: HabitReflectionNote[] = [
  {
    id: 'ref_default_1',
    user_id: '',
    month: 'default',
    week: 2,
    text: '"Excelente ritmo de sono nos últimos 5 dias seguidos! Sentindo mais energia nas manhãs."',
    created_at: new Date().toISOString(),
  },
  {
    id: 'ref_default_2',
    user_id: '',
    month: 'default',
    week: 2,
    text: '"Priorizar leitura nos fins de semana e deixar o livro visível no travesseiro."',
    created_at: new Date().toISOString(),
  },
];

export function fetchHabitReflections(monthStr: string): HabitReflectionNote[] {
  try {
    const raw = localStorage.getItem(REFLECTIONS_KEY);
    if (!raw) {
      localStorage.setItem(REFLECTIONS_KEY, JSON.stringify(DEFAULT_REFLECTIONS));
      return DEFAULT_REFLECTIONS;
    }
    const list: HabitReflectionNote[] = JSON.parse(raw);
    const filtered = list.filter((r) => r.month === monthStr || r.month === 'default');
    return filtered.length > 0 ? filtered : DEFAULT_REFLECTIONS;
  } catch {
    return DEFAULT_REFLECTIONS;
  }
}

export function saveHabitReflection(monthStr: string, weekNum: number, text: string): HabitReflectionNote {
  const raw = localStorage.getItem(REFLECTIONS_KEY);
  let list: HabitReflectionNote[] = raw ? JSON.parse(raw) : [...DEFAULT_REFLECTIONS];
  const newNote: HabitReflectionNote = {
    id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    user_id: '',
    month: monthStr,
    week: weekNum,
    text: text.trim().startsWith('"') ? text.trim() : `"${text.trim()}"`,
    created_at: new Date().toISOString(),
  };
  list.unshift(newNote);
  localStorage.setItem(REFLECTIONS_KEY, JSON.stringify(list));
  return newNote;
}

// Modelos inspirados no bullet journal autêntico (exatos da imagem de referência)
export const BUJO_PRESET_HABITS: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] = [
  {
    name: '8 h > sleep',
    description: 'sono regenerador',
    category: 'Saúde & Corpo',
    frequency: 'Meta diária',
    target: 8,
    target_type: 'duration',
    unit: 'horas',
    start_date: new Date().toISOString().split('T')[0],
  },
  {
    name: 'medicin',
    description: 'manhã & vitaminas',
    category: 'Saúde & Corpo',
    frequency: 'Todos os dias',
    target: 7,
    target_type: 'sequence',
    unit: 'dias seguidos',
    start_date: new Date().toISOString().split('T')[0],
  },
  {
    name: 'skin care',
    description: 'noite / hidratação',
    category: 'Saúde & Corpo',
    frequency: 'Todos os dias',
    target: 7,
    target_type: 'sequence',
    unit: 'dias seguidos',
    start_date: new Date().toISOString().split('T')[0],
  },
  {
    name: 'am teeth',
    description: 'fio dental & enxágue',
    category: 'Saúde & Corpo',
    frequency: 'Todos os dias',
    target: 7,
    target_type: 'sequence',
    unit: 'dias seguidos',
    start_date: new Date().toISOString().split('T')[0],
  },
  {
    name: 'read',
    description: 'mín. 20 páginas',
    category: 'Mente & Foco',
    frequency: 'Todos os dias',
    target: 20,
    target_type: 'quantity',
    unit: 'páginas',
    start_date: new Date().toISOString().split('T')[0],
  },
  {
    name: 'eat < 20 min',
    description: 'refeição sem telas',
    category: 'Rotina',
    frequency: 'Todos os dias',
    target: 7,
    target_type: 'sequence',
    unit: 'dias seguidos',
    start_date: new Date().toISOString().split('T')[0],
  },
  {
    name: 'mix food',
    description: 'prato colorido & fibras',
    category: 'Saúde & Corpo',
    frequency: 'Todos os dias',
    target: 7,
    target_type: 'sequence',
    unit: 'dias seguidos',
    start_date: new Date().toISOString().split('T')[0],
  },
  {
    name: 'yoga / stretch',
    description: '15 min matinal',
    category: 'Saúde & Corpo',
    frequency: '5x por semana',
    target: 15,
    target_type: 'duration',
    unit: 'minutos',
    start_date: new Date().toISOString().split('T')[0],
  },
  {
    name: 'water 2.5l',
    description: 'garrafa de vidro',
    category: 'Saúde & Corpo',
    frequency: 'Meta diária',
    target: 2.5,
    target_type: 'quantity',
    unit: 'Litros',
    start_date: new Date().toISOString().split('T')[0],
  },
];
