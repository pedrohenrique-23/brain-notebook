import React, { useState } from 'react';
import { Task, TaskCategory, TaskStatus } from '../../types';
import { Plus, Edit2, Trash2, CheckSquare, Check } from 'lucide-react';
import { getTodayDateString } from '../../services/storage';
import { cycleTaskStatus, deleteTask, toggleTaskComplete } from '../../services/tasks';

interface TasksPageProps {
  tasks: Task[];
  onOpenNewTask: () => void;
  onEditTask: (task: Task) => void;
  onDataRefresh: () => void | Promise<void>;
}

type DateFilter = 'all' | 'today' | 'tomorrow' | 'week' | 'overdue' | 'completed';
type TaskViewMode = 'checklist' | 'bujo';

export const TasksPage: React.FC<TasksPageProps> = ({
  tasks,
  onOpenNewTask,
  onEditTask,
  onDataRefresh,
}) => {
  const [viewMode, setViewMode] = useState<TaskViewMode>('checklist');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const todayStr = getTodayDateString();

  const handleStatusToggle = async (task: Task) => {
    try {
      await cycleTaskStatus(task);
      await onDataRefresh();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Erro ao atualizar tarefa.');
    }
  };

  const handleToggleChecklist = async (task: Task) => {
    try {
      await toggleTaskComplete(task);
      await onDataRefresh();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Erro ao atualizar tarefa.');
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!window.confirm('Deseja excluir esta tarefa do caderno?')) return;
    try {
      await deleteTask(taskId);
      await onDataRefresh();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Erro ao excluir tarefa.');
    }
  };

  // Filtragem
  const filteredTasks = tasks.filter((t) => {
    // Categoria
    if (categoryFilter !== 'all' && t.category !== categoryFilter) {
      return false;
    }

    // Filtro temporal / status
    if (dateFilter === 'completed') {
      return t.status === 'completed';
    }

    if (t.status === 'completed' && dateFilter !== 'all') {
      return false;
    }

    if (dateFilter === 'today') {
      return t.due_date === todayStr;
    }

    if (dateFilter === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      return t.due_date === tomorrowStr;
    }

    if (dateFilter === 'overdue') {
      return t.due_date && t.due_date < todayStr && t.status !== 'completed';
    }

    if (dateFilter === 'week') {
      if (!t.due_date) return false;
      const today = new Date();
      const in7Days = new Date();
      in7Days.setDate(today.getDate() + 7);
      const in7DaysStr = in7Days.toISOString().split('T')[0];
      return t.due_date >= todayStr && t.due_date <= in7DaysStr;
    }

    return true;
  });

  const categories: TaskCategory[] = ['Pessoal', 'Trabalho', 'Estudos', 'Saúde', 'Espiritual', 'Geral'];
  const completedCount = filteredTasks.filter((t) => t.status === 'completed').length;
  const progressPct = filteredTasks.length > 0 ? Math.round((completedCount / filteredTasks.length) * 100) : 0;

  return (
    <div className="page-sheet">
      <div className="journal-header">
        <div>
          <div className="journal-date-badge">ORGANIZAÇÃO DIÁRIA</div>
          <h1 className="journal-heading-script">Minhas Tarefas</h1>
        </div>
        <div className="journal-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Seletor de Modo de Visualização: Checklist vs BuJo */}
          <div className="task-view-mode-tabs">
            <button
              type="button"
              className={`task-view-tab-btn ${viewMode === 'checklist' ? 'active' : ''}`}
              onClick={() => setViewMode('checklist')}
              title="Visualização em Checklist com caixas de marcação direta"
            >
              <CheckSquare size={14} />
              <span>Checklist</span>
            </button>
            <button
              type="button"
              className={`task-view-tab-btn ${viewMode === 'bujo' ? 'active' : ''}`}
              onClick={() => setViewMode('bujo')}
              title="Visualização Bullet Journal (○ Pendente, ◐ Em andamento, ● Concluída)"
            >
              <span style={{ fontSize: '1rem', lineHeight: 1 }}>○</span>
              <span>Lista BuJo</span>
            </button>
          </div>

          <button className="btn-ink-primary" onClick={onOpenNewTask}>
            <Plus size={16} /> Nova Tarefa
          </button>
        </div>
      </div>

      {/* FILTROS TEMPORAIS E STATUS */}
      <div className="filter-bar">
        <button
          className={`filter-tab-btn ${dateFilter === 'all' ? 'active' : ''}`}
          onClick={() => setDateFilter('all')}
        >
          Todas ({tasks.length})
        </button>
        <button
          className={`filter-tab-btn ${dateFilter === 'today' ? 'active' : ''}`}
          onClick={() => setDateFilter('today')}
        >
          Hoje
        </button>
        <button
          className={`filter-tab-btn ${dateFilter === 'tomorrow' ? 'active' : ''}`}
          onClick={() => setDateFilter('tomorrow')}
        >
          Amanhã
        </button>
        <button
          className={`filter-tab-btn ${dateFilter === 'week' ? 'active' : ''}`}
          onClick={() => setDateFilter('week')}
        >
          Esta Semana
        </button>
        <button
          className={`filter-tab-btn ${dateFilter === 'overdue' ? 'active' : ''}`}
          onClick={() => setDateFilter('overdue')}
        >
          Atrasadas
        </button>
        <button
          className={`filter-tab-btn ${dateFilter === 'completed' ? 'active' : ''}`}
          onClick={() => setDateFilter('completed')}
        >
          Concluídas ({tasks.filter((t) => t.status === 'completed').length})
        </button>
      </div>

      {/* FILTRO DE CATEGORIAS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginRight: '0.35rem' }}>
          Categoria:
        </span>
        <button
          className={`filter-tab-btn ${categoryFilter === 'all' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('all')}
          style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
        >
          Todas
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`filter-tab-btn ${categoryFilter === cat ? 'active' : ''}`}
            onClick={() => setCategoryFilter(cat)}
            style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* BARRA DE PROGRESSO EM MODO CHECKLIST */}
      {viewMode === 'checklist' && filteredTasks.length > 0 && (
        <div className="task-checklist-progress-card">
          <div className="task-checklist-progress-text">
            <span style={{ fontWeight: 600, color: 'var(--ink-primary)', fontSize: '0.82rem' }}>
              Progresso do Checklist
            </span>
            <span style={{ color: 'var(--ink-secondary)', fontSize: '0.8rem', fontVariantNumeric: 'tabular-nums' }}>
              <strong>{completedCount}</strong> de {filteredTasks.length} concluídas ({progressPct}%)
            </span>
          </div>
          <div className="task-checklist-progress-track">
            <div
              className="task-checklist-progress-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* LEGENDA BULLET JOURNAL (SOMENTE EM MODO BUJO) */}
      {viewMode === 'bujo' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '0.65rem 0.9rem', backgroundColor: 'var(--bg-paper-card)', border: '1px solid var(--border-paper)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.75rem', color: 'var(--ink-secondary)' }}>
          <span style={{ fontWeight: 600 }}>Legenda Bullet Journal:</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ fontSize: '1rem', color: 'var(--ink-secondary)' }}>○</span> Pendente
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ fontSize: '1rem', color: 'var(--accent-terracotta)' }}>◐</span> Em andamento
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ fontSize: '1rem', color: 'var(--accent-sage)' }}>●</span> Concluída
          </span>
        </div>
      )}

      {/* LISTA DE TAREFAS */}
      {filteredTasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--ink-muted)' }}>
          <p style={{ fontFamily: 'var(--font-script)', fontSize: '1.8rem', marginBottom: '0.5rem', color: 'var(--ink-secondary)' }}>
            Nenhuma tarefa encontrada neste filtro
          </p>
          <p style={{ fontSize: '0.85rem' }}>
            Aproveite a tranquilidade ou clique em "+ Nova Tarefa" para registrar algo.
          </p>
        </div>
      ) : (
        <div className={`task-list ${viewMode === 'checklist' ? 'is-checklist-mode' : ''}`}>
          {filteredTasks.map((t) => (
            <div key={t.id} className={`task-item ${t.status === 'completed' ? 'completed' : ''}`}>
              {viewMode === 'checklist' ? (
                <button
                  type="button"
                  className={`checklist-box-btn ${t.status === 'completed' ? 'checked' : ''}`}
                  onClick={() => handleToggleChecklist(t)}
                  title={t.status === 'completed' ? 'Marcar como pendente' : 'Marcar como concluída'}
                  aria-label={`Marcar tarefa ${t.title}`}
                >
                  {t.status === 'completed' && <Check size={13} strokeWidth={3} />}
                </button>
              ) : (
                <button
                  type="button"
                  className={`bujo-bullet-btn ${t.status}`}
                  onClick={() => handleStatusToggle(t)}
                  title="Clique para alternar status (Pendente -> Em andamento -> Concluída)"
                >
                  {t.status === 'completed' && '●'}
                  {t.status === 'in_progress' && '◐'}
                  {t.status === 'pending' && '○'}
                </button>
              )}

              <div className="task-content">
                <div
                  className={`task-title ${t.status === 'completed' ? 'struck' : ''}`}
                  onClick={() => (viewMode === 'checklist' ? handleToggleChecklist(t) : undefined)}
                  style={{ cursor: viewMode === 'checklist' ? 'pointer' : 'default' }}
                >
                  {t.title}
                </div>
                {t.description && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--ink-secondary)', marginTop: '0.2rem', whiteSpace: 'pre-line' }}>
                    {t.description}
                  </p>
                )}
                <div className="task-meta">
                  <span className="task-tag">{t.category}</span>
                  <span>·</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <span className={`task-priority-dot priority-${t.priority}`} />
                    Prioridade {t.priority === 'high' ? 'Alta' : t.priority === 'medium' ? 'Média' : 'Baixa'}
                  </span>
                  {t.due_date && (
                    <>
                      <span>·</span>
                      <span className="task-date">Prazo: {t.due_date}</span>
                    </>
                  )}
                  {t.recurrence && t.recurrence !== 'none' && (
                    <>
                      <span>·</span>
                      <span>
                        Recorrência: {t.recurrence === 'daily' ? 'Diária' : t.recurrence === 'weekly' ? 'Semanal' : 'Mensal'}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="task-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => onEditTask(t)}
                  title="Editar tarefa"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => handleDelete(t.id)}
                  title="Excluir tarefa"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
