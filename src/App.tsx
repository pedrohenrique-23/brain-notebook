import React, { useState, useEffect, useCallback } from 'react';
import { Goal, Habit, HabitRecord, Note, SleepLog, Task, User } from './types';
import { fetchTasks, saveTask, TaskInput } from './services/tasks';
import { fetchHabits, fetchHabitRecords, saveHabit, toggleHabitDay, HabitInput } from './services/habits';
import { fetchGoals, saveGoal, GoalInput } from './services/goals';
import { fetchSleepLogs, saveSleepLog, SleepLogInput } from './services/sleep';
import { fetchNotes, saveNote, NoteInput } from './services/notes';
import { useAuth } from './contexts/AuthContext';

import { NotebookLayout } from './components/layout/NotebookLayout';
import { HomePage } from './components/pages/HomePage';
import { TasksPage } from './components/pages/TasksPage';
import { HabitsPage } from './components/pages/HabitsPage';
import { SleepPage } from './components/pages/SleepPage';
import { NotesPage } from './components/pages/NotesPage';
import { GoalsPage } from './components/pages/GoalsPage';

import { TaskModal } from './components/modals/TaskModal';
import { HabitModal } from './components/modals/HabitModal';
import { SleepModal } from './components/modals/SleepModal';
import { NoteModal } from './components/modals/NoteModal';
import { GoalModal } from './components/modals/GoalModal';
import { AuthModal } from './components/modals/AuthModal';

// Auth guard: o painel só é montado com uma sessão ativa no Supabase
export default function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-muted)', fontStyle: 'italic' }}>
        Abrindo o caderno...
      </div>
    );
  }

  if (!user) {
    return <AuthModal isOpen onClose={() => {}} dismissible={false} />;
  }

  // key: troca de conta remonta o painel e descarta o estado do usuário anterior
  return <Dashboard key={user.id} currentUser={user} />;
}

function Dashboard({ currentUser }: { currentUser: User }) {
  const [currentPage, setCurrentPage] = useState<string>('home');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitRecords, setHabitRecords] = useState<HabitRecord[]>([]);
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // Modais
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null);

  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);
  const [sleepToEdit, setSleepToEdit] = useState<SleepLog | null>(null);

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Executa um carregamento do Supabase e expõe a falha no aviso do topo da página
  const runLoader = useCallback(async (loader: () => Promise<void>) => {
    try {
      await loader();
    } catch (err) {
      console.error(err);
      setDataError(err instanceof Error ? err.message : 'Erro ao carregar dados do Supabase.');
    }
  }, []);

  const loadTasks = useCallback(() => runLoader(async () => setTasks(await fetchTasks())), [runLoader]);
  const loadGoals = useCallback(() => runLoader(async () => setGoals(await fetchGoals())), [runLoader]);
  const loadSleepLogs = useCallback(() => runLoader(async () => setSleepLogs(await fetchSleepLogs())), [runLoader]);
  const loadNotes = useCallback(() => runLoader(async () => setNotes(await fetchNotes())), [runLoader]);
  const loadHabits = useCallback(
    () =>
      runLoader(async () => {
        const list = await fetchHabits();
        const records = await fetchHabitRecords(list.map((h) => h.id));
        setHabits(list);
        setHabitRecords(records);
      }),
    [runLoader]
  );

  // Recarregar todos os dados do usuário atual
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setDataError(null);
    await Promise.all([loadTasks(), loadHabits(), loadSleepLogs(), loadNotes(), loadGoals()]);
    setIsLoading(false);
  }, [loadTasks, loadHabits, loadSleepLogs, loadNotes, loadGoals]);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  // Marca/desmarca um hábito no dia e atualiza só o registro afetado
  const handleToggleHabitDay = async (habitId: string, dateStr: string) => {
    try {
      const record = await toggleHabitDay(habitId, dateStr);
      setHabitRecords((prev) => [...prev.filter((r) => r.id !== record.id), record]);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Erro ao registrar hábito.');
    }
  };

  // Handlers para abrir modais de criação/edição
  const handleOpenNewTask = () => {
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleOpenNewHabit = () => {
    setHabitToEdit(null);
    setIsHabitModalOpen(true);
  };

  const handleEditHabit = (habit: Habit) => {
    setHabitToEdit(habit);
    setIsHabitModalOpen(true);
  };

  const handleOpenNewSleep = () => {
    setSleepToEdit(null);
    setIsSleepModalOpen(true);
  };

  const handleEditSleep = (sleep: SleepLog) => {
    setSleepToEdit(sleep);
    setIsSleepModalOpen(true);
  };

  const handleOpenNewNote = () => {
    setNoteToEdit(null);
    setIsNoteModalOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setNoteToEdit(note);
    setIsNoteModalOpen(true);
  };

  const handleOpenNewGoal = () => {
    setGoalToEdit(null);
    setIsGoalModalOpen(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setGoalToEdit(goal);
    setIsGoalModalOpen(true);
  };

  // Handlers de salvamento: os modais aguardam a promessa e mostram o erro, se houver
  const handleSaveTask = async (taskData: TaskInput) => {
    await saveTask(taskData);
    await loadTasks();
  };

  const handleSaveHabit = async (habitData: HabitInput) => {
    await saveHabit(habitData);
    await loadHabits();
  };

  // Recarrega a lista: um novo registro pode ter sobrescrito outro da mesma data
  const handleSaveSleep = async (sleepData: SleepLogInput) => {
    await saveSleepLog(sleepData);
    await loadSleepLogs();
  };

  const handleSaveNote = async (noteData: NoteInput) => {
    const saved = await saveNote(noteData);
    setNotes((prev) =>
      noteData.id ? prev.map((n) => (n.id === saved.id ? saved : n)) : [saved, ...prev]
    );
  };

  const handleSaveGoal = async (goalData: GoalInput) => {
    await saveGoal(goalData);
    await loadGoals();
  };

  const pendingTaskCount = tasks.filter((t) => t.status !== 'completed').length;

  return (
    <>
      <NotebookLayout
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        currentUser={currentUser}
        taskCount={pendingTaskCount}
        habitCount={habits.length}
        sleepCount={sleepLogs.length}
        noteCount={notes.length}
        goalCount={goals.length}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      >
        {dataError && (
          <div role="alert" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', margin: '0 0 1rem', border: '1px solid var(--accent-terracotta)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-terracotta)', fontSize: '0.85rem' }}>
            <span>{dataError}</span>
            <button type="button" className="btn-ghost" onClick={() => void refreshData()}>
              Tentar novamente
            </button>
          </div>
        )}

        {currentPage === 'home' && (
          <HomePage
            tasks={tasks}
            habits={habits}
            sleepLogs={sleepLogs}
            notes={notes}
            goals={goals}
            habitRecords={habitRecords}
            onToggleHabitDay={handleToggleHabitDay}
            onNavigate={setCurrentPage}
            onOpenNewTask={handleOpenNewTask}
            onOpenNewHabit={handleOpenNewHabit}
            onOpenNewSleep={handleOpenNewSleep}
            onOpenNewNote={handleOpenNewNote}
            onDataRefresh={loadTasks}
          />
        )}

        {currentPage === 'tasks' && (
          <TasksPage
            tasks={tasks}
            onOpenNewTask={handleOpenNewTask}
            onEditTask={handleEditTask}
            onDataRefresh={loadTasks}
          />
        )}

        {currentPage === 'habits' && (
          <HabitsPage
            habits={habits}
            habitRecords={habitRecords}
            onToggleHabitDay={handleToggleHabitDay}
            onOpenNewHabit={handleOpenNewHabit}
            onEditHabit={handleEditHabit}
            onDataRefresh={loadHabits}
          />
        )}

        {currentPage === 'sleep' && (
          <SleepPage
            sleepLogs={sleepLogs}
            onOpenNewSleep={handleOpenNewSleep}
            onEditSleep={handleEditSleep}
            onDataRefresh={loadSleepLogs}
          />
        )}

        {currentPage === 'notes' && (
          <NotesPage
            notes={notes}
            isLoading={isLoading}
            onOpenNewNote={handleOpenNewNote}
            onEditNote={handleEditNote}
            onDataRefresh={loadNotes}
          />
        )}

        {currentPage === 'goals' && (
          <GoalsPage
            goals={goals}
            onOpenNewGoal={handleOpenNewGoal}
            onEditGoal={handleEditGoal}
            onDataRefresh={loadGoals}
          />
        )}
      </NotebookLayout>

      {/* Modais de Formulários */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
        userId={currentUser.id}
      />

      <HabitModal
        isOpen={isHabitModalOpen}
        onClose={() => setIsHabitModalOpen(false)}
        onSave={handleSaveHabit}
        habitToEdit={habitToEdit}
        userId={currentUser.id}
      />

      <SleepModal
        isOpen={isSleepModalOpen}
        onClose={() => setIsSleepModalOpen(false)}
        onSave={handleSaveSleep}
        sleepToEdit={sleepToEdit}
        userId={currentUser.id}
      />

      <NoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        onSave={handleSaveNote}
        noteToEdit={noteToEdit}
        userId={currentUser.id}
      />

      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSave={handleSaveGoal}
        goalToEdit={goalToEdit}
        userId={currentUser.id}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}
