import React, { useState } from 'react';
import { Task, TaskCategory, TaskStatus } from '../../types';
import { Plus, Edit2, Trash2, CheckCircle2, Clock, Circle } from 'lucide-react';
import { cycleTaskStatus, deleteTask, getTodayDateString } from '../../services/storage';

interface TasksPageProps {
  tasks: Task[];
  onOpenNewTask: () => void;
  onEditTask: (task: Task) => void;
  onDataRefresh: () => void;
}

type DateFilter = 'all' | 'today' | 'tomorrow' | 'week' | 'overdue' | 'completed';

export const TasksPage: React.FC<TasksPageProps> = ({
  tasks,
  onOpenNewTask,
  onEditTask,
  onDataRefresh,
}) => {
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const todayStr = getTodayDateString();

  const handleStatusToggle = (taskId: string) => {
    cycleTaskStatus(taskId);
    onDataRefresh();
  };

  const handleDelete = (taskId: string) => {
    if (window.confirm('Deseja excluir esta tarefa do caderno?')) {
      deleteTask(taskId);
      onDataRefresh();
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

  return (
    <div className="page-sheet">
      <div className="journal-header">
        <div>
          <div className="journal-date-badge">ORGANIZAÇÃO DIÁRIA</div>
          <h1 className="journal-heading-script">Minhas Tarefas</h1>
        </div>
        <div className="journal-header-actions">
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

      {/* LEGENDA BULLET JOURNAL */}
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
        <div className="task-list">
          {filteredTasks.map((t) => (
            <div key={t.id} className={`task-item ${t.status === 'completed' ? 'completed' : ''}`}>
              <button
                type="button"
                className={`bujo-bullet-btn ${t.status}`}
                onClick={() => handleStatusToggle(t.id)}
                title="Clique para alternar status (Pendente -> Em andamento -> Concluída)"
              >
                {t.status === 'completed' && '●'}
                {t.status === 'in_progress' && '◐'}
                {t.status === 'pending' && '○'}
              </button>

              <div className="task-content">
                <div className="task-title">{t.title}</div>
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
