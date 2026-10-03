import { Goal, Habit, HabitRecord, Note, SleepLog, SupabaseConfig, Task, User } from '../types';
import dreamCarImg from '../assets/images/vision_dream_car_1790983448951.jpg';
import mountainCabinImg from '../assets/images/vision_mountain_cabin_1790983459005.jpg';
import studyDeskImg from '../assets/images/vision_study_desk_1790983469118.jpg';
import gardenHouseImg from '../assets/images/vision_garden_house_1790983478513.jpg';

const STORAGE_KEYS = {
  USER: 'caderno_current_user',
  ALL_USERS: 'caderno_users',
  TASKS: 'caderno_tasks',
  HABITS: 'caderno_habits',
  HABIT_RECORDS: 'caderno_habit_records',
  NOTES: 'caderno_notes',
  GOALS: 'caderno_goals',
  SLEEP_LOGS: 'caderno_sleep_logs',
  SUPABASE_CONFIG: 'caderno_supabase_config',
};

// Usuário padrão inicial para uso imediato
export const DEFAULT_USER: User = {
  id: 'usr_pedro_default',
  name: 'Pedro Silva',
  email: 'pedro@cadernodigital.com',
};

// Função auxiliar para obter data local em YYYY-MM-DD
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Inicializar dados de exemplo enriquecidos se ainda não existirem
export function initializeSeedData(userId: string) {
  const tasksKey = STORAGE_KEYS.TASKS;
  const existingTasks = localStorage.getItem(tasksKey);
  
  if (!existingTasks || JSON.parse(existingTasks).length === 0) {
    const today = getTodayDateString();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const initialTasks: Task[] = [
      {
        id: 'task_1',
        user_id: userId,
        title: 'Estudar arquitetura de React e TypeScript',
        description: 'Revisar hooks customizados e padrões para a futura versão SaaS do Caderno.',
        status: 'pending',
        priority: 'high',
        due_date: today,
        category: 'Estudos',
        recurrence: 'daily',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'task_2',
        user_id: userId,
        title: 'Fazer feira e mercado da semana',
        description: 'Comprar frutas, café em grãos e itens essenciais.',
        status: 'in_progress',
        priority: 'medium',
        due_date: today,
        category: 'Pessoal',
        recurrence: 'weekly',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'task_3',
        user_id: userId,
        title: 'Leitura bíblica matinal (Gênesis 12-15)',
        description: 'Momento de oração e devocional antes de iniciar o trabalho.',
        status: 'completed',
        priority: 'high',
        due_date: today,
        category: 'Espiritual',
        recurrence: 'daily',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'task_4',
        user_id: userId,
        title: 'Planejar estrutura de tabelas do Supabase',
        description: 'Escrever scripts DDL com políticas RLS para multiusuário.',
        status: 'pending',
        priority: 'medium',
        due_date: tomorrowStr,
        category: 'Trabalho',
        recurrence: 'none',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    localStorage.setItem(tasksKey, JSON.stringify(initialTasks));
  }

  // Hábitos
  const habitsKey = STORAGE_KEYS.HABITS;
  const existingHabits = localStorage.getItem(habitsKey);
  if (!existingHabits || JSON.parse(existingHabits).length === 0) {
    const today = getTodayDateString();
    const initialHabits: Habit[] = [
      {
        id: 'habit_1',
        user_id: userId,
        name: 'Leitura diária',
        description: 'Ler ao menos 20 páginas de livro ou devocional.',
        frequency: 'Todos os dias',
        target: 7,
        target_type: 'sequence',
        unit: 'dias seguidos',
        start_date: today,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'habit_2',
        user_id: userId,
        name: 'Beber água (2 Litros)',
        description: 'Manter a garrafa de água cheia na mesa de estudos.',
        frequency: 'Meta diária',
        target: 2,
        target_type: 'quantity',
        unit: 'Litros',
        start_date: today,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'habit_3',
        user_id: userId,
        name: 'Treino e caminhada',
        description: 'Musculação ou corrida leve ao ar livre.',
        frequency: '4x por semana',
        target: 4,
        target_type: 'frequency',
        unit: 'vezes',
        start_date: today,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'habit_4',
        user_id: userId,
        name: 'Estudo focado de programação',
        description: 'Bloco de foco de 45 minutos sem distrações.',
        frequency: '5x por semana',
        target: 45,
        target_type: 'duration',
        unit: 'minutos',
        start_date: today,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    localStorage.setItem(habitsKey, JSON.stringify(initialHabits));

    // Pré-preencher alguns registros dos últimos 5 dias para demonstrar o visual de bullet journal
    const initialRecords: HabitRecord[] = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1) + i); // dias da semana atual
      const dStr = d.toISOString().split('T')[0];
      if (i < 4) {
        initialRecords.push({
          id: `rec_h1_${dStr}`,
          habit_id: 'habit_1',
          date: dStr,
          completed: true,
          value: 1,
          created_at: new Date().toISOString(),
        });
        initialRecords.push({
          id: `rec_h2_${dStr}`,
          habit_id: 'habit_2',
          date: dStr,
          completed: i !== 2, // dia 2 faltou
          value: i !== 2 ? 2 : 1,
          created_at: new Date().toISOString(),
        });
      }
    }
    localStorage.setItem(STORAGE_KEYS.HABIT_RECORDS, JSON.stringify(initialRecords));
  }

  // Notas
  const notesKey = STORAGE_KEYS.NOTES;
  const existingNotes = localStorage.getItem(notesKey);
  if (!existingNotes || JSON.parse(existingNotes).length === 0) {
    const initialNotes: Note[] = [
      {
        id: 'note_1',
        user_id: userId,
        title: 'Ideias para a V2 do Caderno',
        content: '• Migrar para Next.js App Router com Server Components\n• Sistema de cobrança e planos no Stripe\n• Exportação em PDF no formato fichário impresso\n• Suporte a temas de papel (Kraft, Pautado, Pontilhado)',
        color: 'sand',
        type: 'paper',
        is_pinned: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'note_2',
        user_id: userId,
        title: 'Versículos para Meditação',
        content: '"Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento." — Provérbios 3:5\n\nMantém a paz e a perseverança nos projetos diários.',
        color: 'yellow',
        type: 'postit',
        is_pinned: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'note_3',
        user_id: userId,
        title: 'Livros para Ler este Semestre',
        content: '1. O Poder do Hábito\n2. Essencialismo\n3. Código Limpo (Clean Code)\n4. Hábitos Atômicos',
        color: 'green',
        type: 'paper',
        is_pinned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'note_4',
        user_id: userId,
        title: 'Lembrete Financeiro',
        content: 'Separar 20% do faturamento direto para a reserva de emergência antes do dia 10.',
        color: 'peach',
        type: 'postit',
        is_pinned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    localStorage.setItem(notesKey, JSON.stringify(initialNotes));
  }

  // Metas / Vision Board
  const goalsKey = STORAGE_KEYS.GOALS;
  const existingGoals = localStorage.getItem(goalsKey);
  if (!existingGoals || JSON.parse(existingGoals).length === 0) {
    const initialGoals: Goal[] = [
      {
        id: 'goal_1',
        user_id: userId,
        title: 'Meu Primeiro Carro',
        description: 'Juntar o valor de entrada e primeira reserva para o carro dos sonhos.',
        type: 'financeira',
        category: 'Financeira',
        timeframe: 'medio',
        target_value: 45000,
        current_value: 14500,
        unit: 'R$',
        deadline: '2027-12-31',
        status: 'active',
        image_url: dreamCarImg,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'goal_2',
        user_id: userId,
        title: 'Viagem para Cabana nas Montanhas',
        description: 'Uma semana de descanso e retiro criativo em uma cabana acolhedora nas serras.',
        type: 'pessoal',
        category: 'Pessoal',
        timeframe: 'curto',
        target_value: 4000,
        current_value: 2800,
        unit: 'R$',
        deadline: '2027-07-20',
        status: 'active',
        image_url: mountainCabinImg,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'goal_3',
        user_id: userId,
        title: 'Montar Setup Minimalista de Desenvolvimento',
        description: 'Mesa ergonômica, monitor de alta definição e teclado mecânico silencioso.',
        type: 'profissional',
        category: 'Profissional',
        timeframe: 'curto',
        target_value: 6500,
        current_value: 5200,
        unit: 'R$',
        deadline: '2027-05-15',
        status: 'active',
        image_url: studyDeskImg,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'goal_4',
        user_id: userId,
        title: 'Conquistar a Casa com Jardim',
        description: 'Objetivo de longo prazo: casa espaçosa com varanda e quintal arborizado.',
        type: 'pessoal',
        category: 'Pessoal',
        timeframe: 'longo',
        target_value: 350000,
        current_value: 62000,
        unit: 'R$',
        deadline: '2030-12-31',
        status: 'active',
        image_url: gardenHouseImg,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    localStorage.setItem(goalsKey, JSON.stringify(initialGoals));
  }

  // Registros de Sono (Sleep Logs)
  const sleepKey = STORAGE_KEYS.SLEEP_LOGS;
  const existingSleep = localStorage.getItem(sleepKey);
  if (!existingSleep || JSON.parse(existingSleep).length === 0) {
    const initialSleepLogs: SleepLog[] = [];
    const sampleHours = [7.5, 8.0, 6.5, 7.2, 8.5, 7.0, 7.8, 6.8, 8.2, 7.5, 8.0, 7.2, 7.8, 8.0];
    const qualities: ('ruim' | 'regular' | 'bom' | 'excelente')[] = [
      'bom', 'excelente', 'regular', 'bom', 'excelente', 'bom', 'bom',
      'regular', 'excelente', 'bom', 'excelente', 'bom', 'excelente', 'excelente'
    ];

    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const hours = sampleHours[13 - i];
      const quality = qualities[13 - i];
      initialSleepLogs.push({
        id: `sleep_${dStr}`,
        user_id: userId,
        date: dStr,
        hours,
        bedtime: hours >= 8 ? '22:45' : hours >= 7 ? '23:30' : '00:30',
        wake_time: '07:00',
        quality,
        notes: i === 0 ? 'Acordei com disposição e mente descansada para os estudos.' : undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    localStorage.setItem(sleepKey, JSON.stringify(initialSleepLogs));
  }
}

// ==========================================================================
// SERVIÇO DE AUTENTICAÇÃO E SESSÃO
// ==========================================================================

export function getCurrentUser(): User {
  const userJson = localStorage.getItem(STORAGE_KEYS.USER);
  if (userJson) {
    try {
      return JSON.parse(userJson);
    } catch {
      // fallback
    }
  }
  // Se não existir usuário salvo, define o usuário padrão
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(DEFAULT_USER));
  initializeSeedData(DEFAULT_USER.id);
  return DEFAULT_USER;
}

export function setCurrentUser(user: User): void {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  initializeSeedData(user.id);
}

export function logoutUser(): void {
  localStorage.removeItem(STORAGE_KEYS.USER);
}

export function registerUser(name: string, email: string): User {
  const newUser: User = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
  };
  setCurrentUser(newUser);
  return newUser;
}

// ==========================================================================
// CRUD TAREFAS
// ==========================================================================

export function getTasks(userId: string): Task[] {
  const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
  if (!raw) return [];
  try {
    const list: Task[] = JSON.parse(raw);
    return list.filter((t) => t.user_id === userId);
  } catch {
    return [];
  }
}

export function saveTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Task {
  const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
  let list: Task[] = raw ? JSON.parse(raw) : [];

  if (task.id) {
    // Editar
    list = list.map((item) =>
      item.id === task.id
        ? { ...item, ...task, updated_at: new Date().toISOString() }
        : item
    );
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(list));
    return list.find((t) => t.id === task.id)!;
  } else {
    // Criar nova
    const newTask: Task = {
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.unshift(newTask);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(list));
    return newTask;
  }
}

export function deleteTask(taskId: string): void {
  const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
  if (!raw) return;
  const list: Task[] = JSON.parse(raw);
  const updated = list.filter((t) => t.id !== taskId);
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
}

export function cycleTaskStatus(taskId: string): Task | null {
  const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
  if (!raw) return null;
  const list: Task[] = JSON.parse(raw);
  const target = list.find((t) => t.id === taskId);
  if (!target) return null;

  // Ciclo Bullet Journal: pending (○) -> in_progress (◐) -> completed (●) -> pending (○)
  let nextStatus: Task['status'] = 'in_progress';
  if (target.status === 'in_progress') nextStatus = 'completed';
  else if (target.status === 'completed') nextStatus = 'pending';

  target.status = nextStatus;
  target.updated_at = new Date().toISOString();
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(list));
  return target;
}

// ==========================================================================
// CRUD HÁBITOS E REGISTROS
// ==========================================================================

export function getHabits(userId: string): Habit[] {
  const raw = localStorage.getItem(STORAGE_KEYS.HABITS);
  if (!raw) return [];
  try {
    const list: Habit[] = JSON.parse(raw);
    return list.filter((h) => h.user_id === userId);
  } catch {
    return [];
  }
}

export function saveHabit(habit: Omit<Habit, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Habit {
  const raw = localStorage.getItem(STORAGE_KEYS.HABITS);
  let list: Habit[] = raw ? JSON.parse(raw) : [];

  if (habit.id) {
    list = list.map((item) =>
      item.id === habit.id
        ? { ...item, ...habit, updated_at: new Date().toISOString() }
        : item
    );
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(list));
    return list.find((h) => h.id === habit.id)!;
  } else {
    const newHabit: Habit = {
      ...habit,
      id: `habit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.unshift(newHabit);
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(list));
    return newHabit;
  }
}

export function deleteHabit(habitId: string): void {
  const raw = localStorage.getItem(STORAGE_KEYS.HABITS);
  if (raw) {
    const list: Habit[] = JSON.parse(raw);
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(list.filter((h) => h.id !== habitId)));
  }
  // Excluir também os registros do hábito
  const recordsRaw = localStorage.getItem(STORAGE_KEYS.HABIT_RECORDS);
  if (recordsRaw) {
    const recs: HabitRecord[] = JSON.parse(recordsRaw);
    localStorage.setItem(STORAGE_KEYS.HABIT_RECORDS, JSON.stringify(recs.filter((r) => r.habit_id !== habitId)));
  }
}

export function getHabitRecords(habitId: string): HabitRecord[] {
  const raw = localStorage.getItem(STORAGE_KEYS.HABIT_RECORDS);
  if (!raw) return [];
  try {
    const list: HabitRecord[] = JSON.parse(raw);
    return list.filter((r) => r.habit_id === habitId);
  } catch {
    return [];
  }
}

export function toggleHabitDay(habitId: string, dateStr: string): boolean {
  const raw = localStorage.getItem(STORAGE_KEYS.HABIT_RECORDS);
  let list: HabitRecord[] = raw ? JSON.parse(raw) : [];

  const existingIndex = list.findIndex((r) => r.habit_id === habitId && r.date === dateStr);
  let isDone = false;

  if (existingIndex >= 0) {
    // Alternar
    list[existingIndex].completed = !list[existingIndex].completed;
    isDone = list[existingIndex].completed;
  } else {
    // Criar novo registro
    list.push({
      id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      habit_id: habitId,
      date: dateStr,
      completed: true,
      value: 1,
      created_at: new Date().toISOString(),
    });
    isDone = true;
  }

  localStorage.setItem(STORAGE_KEYS.HABIT_RECORDS, JSON.stringify(list));
  return isDone;
}

// Calcular sequência atual (streak) de um hábito em dias consecutivos
export function calculateStreak(habitId: string): number {
  const records = getHabitRecords(habitId).filter((r) => r.completed);
  if (records.length === 0) return 0;

  const datesSet = new Set(records.map((r) => r.date));
  let streak = 0;
  const checkDate = new Date();

  // Se hoje não estiver marcado ainda, pode verificar a partir de ontem
  const todayStr = checkDate.toISOString().split('T')[0];
  if (!datesSet.has(todayStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const dStr = checkDate.toISOString().split('T')[0];
    if (datesSet.has(dStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

// ==========================================================================
// CRUD ANOTAÇÕES
// ==========================================================================

export function getNotes(userId: string): Note[] {
  const raw = localStorage.getItem(STORAGE_KEYS.NOTES);
  if (!raw) return [];
  try {
    const list: Note[] = JSON.parse(raw);
    return list.filter((n) => n.user_id === userId);
  } catch {
    return [];
  }
}

export function saveNote(note: Omit<Note, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Note {
  const raw = localStorage.getItem(STORAGE_KEYS.NOTES);
  let list: Note[] = raw ? JSON.parse(raw) : [];

  if (note.id) {
    list = list.map((item) =>
      item.id === note.id
        ? { ...item, ...note, updated_at: new Date().toISOString() }
        : item
    );
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(list));
    return list.find((n) => n.id === note.id)!;
  } else {
    const newNote: Note = {
      ...note,
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.unshift(newNote);
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(list));
    return newNote;
  }
}

export function deleteNote(noteId: string): void {
  const raw = localStorage.getItem(STORAGE_KEYS.NOTES);
  if (!raw) return;
  const list: Note[] = JSON.parse(raw);
  localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(list.filter((n) => n.id !== noteId)));
}

export function togglePinNote(noteId: string): void {
  const raw = localStorage.getItem(STORAGE_KEYS.NOTES);
  if (!raw) return;
  const list: Note[] = JSON.parse(raw);
  const target = list.find((n) => n.id === noteId);
  if (target) {
    target.is_pinned = !target.is_pinned;
    target.updated_at = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(list));
  }
}

// ==========================================================================
// CRUD METAS & VISION BOARD
// ==========================================================================

export function getGoals(userId: string): Goal[] {
  const raw = localStorage.getItem(STORAGE_KEYS.GOALS);
  if (!raw) return [];
  try {
    const list: Goal[] = JSON.parse(raw);
    return list.filter((g) => g.user_id === userId);
  } catch {
    return [];
  }
}

export function saveGoal(goal: Omit<Goal, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Goal {
  const raw = localStorage.getItem(STORAGE_KEYS.GOALS);
  let list: Goal[] = raw ? JSON.parse(raw) : [];

  if (goal.id) {
    list = list.map((item) =>
      item.id === goal.id
        ? { ...item, ...goal, updated_at: new Date().toISOString() }
        : item
    );
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(list));
    return list.find((g) => g.id === goal.id)!;
  } else {
    const newGoal: Goal = {
      ...goal,
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.unshift(newGoal);
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(list));
    return newGoal;
  }
}

export function deleteGoal(goalId: string): void {
  const raw = localStorage.getItem(STORAGE_KEYS.GOALS);
  if (!raw) return;
  const list: Goal[] = JSON.parse(raw);
  localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(list.filter((g) => g.id !== goalId)));
}

// ==========================================================================
// CRUD CONTROLE DO SONO (SLEEP TRACKER)
// ==========================================================================

export function getSleepLogs(userId: string): SleepLog[] {
  const raw = localStorage.getItem(STORAGE_KEYS.SLEEP_LOGS);
  if (!raw) return [];
  try {
    const list: SleepLog[] = JSON.parse(raw);
    return list
      .filter((s) => s.user_id === userId)
      .sort((a, b) => b.date.localeCompare(a.date)); // Mais recente primeiro
  } catch {
    return [];
  }
}

export function saveSleepLog(
  log: Omit<SleepLog, 'id' | 'created_at' | 'updated_at'> & { id?: string }
): SleepLog {
  const raw = localStorage.getItem(STORAGE_KEYS.SLEEP_LOGS);
  let list: SleepLog[] = raw ? JSON.parse(raw) : [];

  // Se já existir registro para esta mesma data e mesmo usuário (e não for edição pelo mesmo ID), atualiza
  const existingSameDateIndex = list.findIndex(
    (s) => s.user_id === log.user_id && s.date === log.date && s.id !== log.id
  );

  if (log.id) {
    list = list.map((item) =>
      item.id === log.id
        ? { ...item, ...log, updated_at: new Date().toISOString() }
        : item
    );
    localStorage.setItem(STORAGE_KEYS.SLEEP_LOGS, JSON.stringify(list));
    return list.find((s) => s.id === log.id)!;
  } else if (existingSameDateIndex >= 0) {
    // Sobrescrever registro daquela data
    const existing = list[existingSameDateIndex];
    const updated: SleepLog = {
      ...existing,
      ...log,
      updated_at: new Date().toISOString(),
    };
    list[existingSameDateIndex] = updated;
    localStorage.setItem(STORAGE_KEYS.SLEEP_LOGS, JSON.stringify(list));
    return updated;
  } else {
    const newLog: SleepLog = {
      ...log,
      id: `sleep_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.unshift(newLog);
    localStorage.setItem(STORAGE_KEYS.SLEEP_LOGS, JSON.stringify(list));
    return newLog;
  }
}

export function deleteSleepLog(logId: string): void {
  const raw = localStorage.getItem(STORAGE_KEYS.SLEEP_LOGS);
  if (!raw) return;
  const list: SleepLog[] = JSON.parse(raw);
  localStorage.setItem(
    STORAGE_KEYS.SLEEP_LOGS,
    JSON.stringify(list.filter((s) => s.id !== logId))
  );
}

export interface SleepStats {
  averageHours: number;
  averageFormatted: string;
  totalLogs: number;
  latestHours: number | null;
  latestDate: string | null;
  bestHours: number;
  lowestHours: number;
  goalMetPercent: number; // Porcentagem que dormiu 7h ou mais
}

export function calculateSleepStats(logs: SleepLog[]): SleepStats {
  if (logs.length === 0) {
    return {
      averageHours: 0,
      averageFormatted: '0h',
      totalLogs: 0,
      latestHours: null,
      latestDate: null,
      bestHours: 0,
      lowestHours: 0,
      goalMetPercent: 0,
    };
  }

  const hoursArr = logs.map((l) => l.hours);
  const total = hoursArr.reduce((acc, h) => acc + h, 0);
  const avg = Number((total / logs.length).toFixed(1));
  const avgHoursInt = Math.floor(avg);
  const avgMins = Math.round((avg - avgHoursInt) * 60);

  const best = Math.max(...hoursArr);
  const lowest = Math.min(...hoursArr);
  const goalMetCount = hoursArr.filter((h) => h >= 7 && h <= 9.5).length;
  const goalMetPercent = Math.round((goalMetCount / logs.length) * 100);

  return {
    averageHours: avg,
    averageFormatted: `${avgHoursInt}h ${avgMins > 0 ? `${avgMins}m` : ''}`.trim(),
    totalLogs: logs.length,
    latestHours: logs[0]?.hours ?? null,
    latestDate: logs[0]?.date ?? null,
    bestHours: best,
    lowestHours: lowest,
    goalMetPercent,
  };
}

// ==========================================================================
// CONFIGURAÇÃO DO SUPABASE & SCRIPT SQL PRONTO
// ==========================================================================

export function getSupabaseConfig(): SupabaseConfig {
  const raw = localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  return {
    url: '',
    anonKey: '',
    isConnected: false,
  };
}

export function saveSupabaseConfig(url: string, anonKey: string): SupabaseConfig {
  const config: SupabaseConfig = {
    url: url.trim(),
    anonKey: anonKey.trim(),
    isConnected: Boolean(url.trim() && anonKey.trim()),
  };
  localStorage.setItem(STORAGE_KEYS.SUPABASE_CONFIG, JSON.stringify(config));
  return config;
}

// Script SQL completo para PostgreSQL no Supabase com Row Level Security (RLS)
export const SUPABASE_SQL_MIGRATION = `-- ==========================================================
-- SCRIPT DE CRIAÇÃO DO BANCO DE DADOS - CADERNO DIGITAL
-- Banco: PostgreSQL (Supabase) com Row Level Security (RLS)
-- Execute este script no SQL Editor do seu projeto Supabase!
-- ==========================================================

-- 1. TABELA DE TAREFAS (tasks)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    due_date DATE,
    category TEXT NOT NULL DEFAULT 'Geral',
    recurrence TEXT DEFAULT 'none',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ativar RLS em tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver apenas suas próprias tarefas"
    ON public.tasks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas tarefas"
    ON public.tasks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem editar suas próprias tarefas"
    ON public.tasks FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir suas próprias tarefas"
    ON public.tasks FOR DELETE
    USING (auth.uid() = user_id);


-- 2. TABELA DE HÁBITOS (habits)
CREATE TABLE IF NOT EXISTS public.habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    frequency TEXT NOT NULL DEFAULT 'Diário',
    target INTEGER NOT NULL DEFAULT 1,
    target_type TEXT NOT NULL DEFAULT 'frequency' CHECK (target_type IN ('frequency', 'sequence', 'quantity', 'duration')),
    unit TEXT,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ativar RLS em habits
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver apenas seus próprios hábitos"
    ON public.habits FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus hábitos"
    ON public.habits FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem editar seus próprios hábitos"
    ON public.habits FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir seus próprios hábitos"
    ON public.habits FOR DELETE
    USING (auth.uid() = user_id);


-- 3. TABELA DE REGISTROS DE HÁBITOS (habit_records)
CREATE TABLE IF NOT EXISTS public.habit_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT true,
    value NUMERIC DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(habit_id, date)
);

-- Ativar RLS em habit_records através do relacionamento com o hábito do usuário
ALTER TABLE public.habit_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários gerenciam registros de seus hábitos"
    ON public.habit_records FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.habits
            WHERE public.habits.id = public.habit_records.habit_id
            AND public.habits.user_id = auth.uid()
        )
    );


-- 4. TABELA DE ANOTAÇÕES (notes)
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    color TEXT NOT NULL DEFAULT 'sand',
    type TEXT NOT NULL DEFAULT 'paper' CHECK (type IN ('paper', 'postit')),
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ativar RLS em notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver apenas suas próprias anotações"
    ON public.notes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas anotações"
    ON public.notes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem editar suas anotações"
    ON public.notes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir suas anotações"
    ON public.notes FOR DELETE
    USING (auth.uid() = user_id);


-- 5. TABELA DE METAS E VISION BOARD (goals)
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'geral',
    category TEXT NOT NULL DEFAULT 'Pessoal',
    timeframe TEXT NOT NULL DEFAULT 'medio' CHECK (timeframe IN ('curto', 'medio', 'longo')),
    target_value NUMERIC,
    current_value NUMERIC DEFAULT 0,
    unit TEXT,
    deadline DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ativar RLS em goals
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver apenas suas próprias metas"
    ON public.goals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas metas"
    ON public.goals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem editar suas metas"
    ON public.goals FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir suas metas"
    ON public.goals FOR DELETE
    USING (auth.uid() = user_id);


-- 6. TABELA DE CONTROLE DO SONO (sleep_logs)
CREATE TABLE IF NOT EXISTS public.sleep_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hours NUMERIC(4, 2) NOT NULL CHECK (hours >= 0 AND hours <= 24),
    bedtime TIME,
    wake_time TIME,
    quality TEXT DEFAULT 'bom' CHECK (quality IN ('ruim', 'regular', 'bom', 'excelente')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Ativar RLS em sleep_logs
ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver apenas seus próprios registros de sono"
    ON public.sleep_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus registros de sono"
    ON public.sleep_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem editar seus registros de sono"
    ON public.sleep_logs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir seus registros de sono"
    ON public.sleep_logs FOR DELETE
    USING (auth.uid() = user_id);
`;
