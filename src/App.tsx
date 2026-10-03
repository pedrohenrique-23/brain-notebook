import React, { useState, useEffect, useCallback } from 'react';
import { Goal, Habit, Note, SleepLog, Task, User } from './types';
import {
  getCurrentUser,
  getTasks,
  getHabits,
  getNotes,
  getGoals,
  getSleepLogs,
  saveTask,
  saveHabit,
  saveNote,
  saveGoal,
  saveSleepLog,
} from './services/storage';

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
import { SupabaseModal } from './components/modals/SupabaseModal';
import { AuthModal } from './components/modals/AuthModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(() => getCurrentUser());
  const [currentPage, setCurrentPage] = useState<string>('home');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

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

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Recarregar dados do usuário atual
  const refreshData = useCallback(() => {
    if (!currentUser) return;
    setTasks(getTasks(currentUser.id));
    setHabits(getHabits(currentUser.id));
    setSleepLogs(getSleepLogs(currentUser.id));
    setNotes(getNotes(currentUser.id));
    setGoals(getGoals(currentUser.id));
  }, [currentUser]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

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

  // Handlers de salvamento
  const handleSaveTask = (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => {
    saveTask(taskData);
    refreshData();
  };

  const handleSaveHabit = (habitData: Omit<Habit, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => {
    saveHabit(habitData);
    refreshData();
  };

  const handleSaveSleep = (sleepData: Omit<SleepLog, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => {
    saveSleepLog(sleepData);
    refreshData();
  };

  const handleSaveNote = (noteData: Omit<Note, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => {
    saveNote(noteData);
    refreshData();
  };

  const handleSaveGoal = (goalData: Omit<Goal, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => {
    saveGoal(goalData);
    refreshData();
  };

  const handleUserChange = (user: User) => {
    setCurrentUser(user);
    refreshData();
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
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      >
        {currentPage === 'home' && (
          <HomePage
            tasks={tasks}
            habits={habits}
            sleepLogs={sleepLogs}
            notes={notes}
            goals={goals}
            onNavigate={setCurrentPage}
            onOpenNewTask={handleOpenNewTask}
            onOpenNewHabit={handleOpenNewHabit}
            onOpenNewSleep={handleOpenNewSleep}
            onOpenNewNote={handleOpenNewNote}
            onDataRefresh={refreshData}
          />
        )}

        {currentPage === 'tasks' && (
          <TasksPage
            tasks={tasks}
            onOpenNewTask={handleOpenNewTask}
            onEditTask={handleEditTask}
            onDataRefresh={refreshData}
          />
        )}

        {currentPage === 'habits' && (
          <HabitsPage
            habits={habits}
            onOpenNewHabit={handleOpenNewHabit}
            onEditHabit={handleEditHabit}
            onDataRefresh={refreshData}
          />
        )}

        {currentPage === 'sleep' && (
          <SleepPage
            sleepLogs={sleepLogs}
            onOpenNewSleep={handleOpenNewSleep}
            onEditSleep={handleEditSleep}
            onDataRefresh={refreshData}
          />
        )}

        {currentPage === 'notes' && (
          <NotesPage
            notes={notes}
            onOpenNewNote={handleOpenNewNote}
            onEditNote={handleEditNote}
            onDataRefresh={refreshData}
          />
        )}

        {currentPage === 'goals' && (
          <GoalsPage
            goals={goals}
            onOpenNewGoal={handleOpenNewGoal}
            onEditGoal={handleEditGoal}
            onDataRefresh={refreshData}
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

      <SupabaseModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onDataRefresh={refreshData}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleUserChange}
        currentUser={currentUser}
      />
    </>
  );
}
