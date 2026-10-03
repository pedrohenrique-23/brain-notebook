import React from 'react';
import { Goal, Habit, Note, SleepLog, Task } from '../../types';
import { Plus, ArrowRight, Moon } from 'lucide-react';
import { cycleTaskStatus, toggleHabitDay, getHabitRecords, calculateStreak, calculateSleepStats } from '../../services/storage';

interface HomePageProps {
  tasks: Task[];
  habits: Habit[];
  notes: Note[];
  goals: Goal[];
  sleepLogs?: SleepLog[];
  onNavigate: (page: string) => void;
  onOpenNewTask: () => void;
  onOpenNewHabit: () => void;
  onOpenNewNote: () => void;
  onOpenNewSleep?: () => void;
  onDataRefresh: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  tasks,
  habits,
  notes,
  goals,
  sleepLogs = [],
  onNavigate,
  onOpenNewTask,
  onOpenNewHabit,
  onOpenNewNote,
  onOpenNewSleep,
  onDataRefresh,
}) => {
  // Obter data formatada no estilo clássico de diário
  const today = new Date();
  const dateFormatted = today
    .toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    .toUpperCase();
  const todayDateStr = today.toISOString().split('T')[0];

  // Obter dias da semana atual para os hábitos (Seg a Dom)
  const currentDayOfWeek = today.getDay(); // 0 dom, 1 seg ...
  const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + mondayOffset + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayNames = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
    return {
      name: dayNames[d.getDay()],
      dateStr,
      isToday: dateStr === todayDateStr,
    };
  });

  const handleToggleTaskStatus = (taskId: string) => {
    cycleTaskStatus(taskId);
    onDataRefresh();
  };

  const handleToggleHabit = (habitId: string, dateStr: string) => {
    toggleHabitDay(habitId, dateStr);
    onDataRefresh();
  };

  // Filtrar tarefas pendentes e de hoje
  const todayTasks = tasks.slice(0, 5);
  const activeGoals = goals.filter((g) => g.status === 'active').slice(0, 3);
  const recentNotes = notes.slice(0, 3);

  return (
    <div className="page-sheet">
      <div className="journal-header">
        <div>
          <div className="journal-date-badge">{dateFormatted}</div>
          <h1 className="journal-heading-script">Meu Caderno Pessoal</h1>
        </div>
        <div className="journal-header-actions">
          <button className="btn-ink-primary" onClick={onOpenNewTask}>
            <Plus size={16} /> Nova Tarefa
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* COLUNA ESQUERDA: Tarefas e Hábitos */}
        <div className="dashboard-column">
          {/* BLOCO: TAREFAS */}
          <div className="section-block">
            <div className="section-header-row">
              <div className="section-title-wrap">
                <h2 className="section-title">Tarefas do Dia</h2>
                <span className="section-subtitle-print">Bullet Journal</span>
              </div>
              <button className="btn-ghost" onClick={() => onNavigate('tasks')}>
                Ver todas <ArrowRight size={14} />
              </button>
            </div>

            {todayTasks.length === 0 ? (
              <p style={{ color: 'var(--ink-muted)', fontSize: '0.85rem', fontStyle: 'italic', padding: '0.5rem 0' }}>
                Nenhuma tarefa pendente para hoje. Que tal registrar uma atividade?
              </p>
            ) : (
              <div className="task-list">
                {todayTasks.map((t) => (
                  <div key={t.id} className={`task-item ${t.status === 'completed' ? 'completed' : ''}`}>
                    <button
                      type="button"
                      className={`bujo-bullet-btn ${t.status}`}
                      onClick={() => handleToggleTaskStatus(t.id)}
                      title={`Status: ${t.status === 'completed' ? 'Concluída' : t.status === 'in_progress' ? 'Em andamento' : 'Pendente'}. Clique para avançar.`}
                    >
                      {t.status === 'completed' && '●'}
                      {t.status === 'in_progress' && '◐'}
                      {t.status === 'pending' && '○'}
                    </button>

                    <div className="task-content">
                      <div className="task-title">{t.title}</div>
                      <div className="task-meta">
                        <span className="task-tag">{t.category}</span>
                        <span>·</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                          <span className={`task-priority-dot priority-${t.priority}`} />
                          {t.priority === 'high' ? 'Alta' : t.priority === 'medium' ? 'Média' : 'Baixa'}
                        </span>
                        {t.due_date && (
                          <>
                            <span>·</span>
                            <span className="task-date">{t.due_date}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* BLOCO: HÁBITOS */}
          <div className="section-block">
            <div className="section-header-row">
              <div className="section-title-wrap">
                <h2 className="section-title">Hábitos da Semana</h2>
                <span className="section-subtitle-print">Rotinas</span>
              </div>
              <button className="btn-ghost" onClick={() => onNavigate('habits')}>
                Ver hábitos <ArrowRight size={14} />
              </button>
            </div>

            {habits.length === 0 ? (
              <p style={{ color: 'var(--ink-muted)', fontSize: '0.85rem', fontStyle: 'italic', padding: '0.5rem 0' }}>
                Nenhum hábito cadastrado. Clique em Novo Hábito para começar sua rotina.
              </p>
            ) : (
              <div className="habit-list">
                {habits.map((h) => {
                  const records = getHabitRecords(h.id);
                  const streak = calculateStreak(h.id);
                  const recordsMap = new Set(records.filter((r) => r.completed).map((r) => r.date));
                  const weekDoneCount = weekDays.filter((wd) => recordsMap.has(wd.dateStr)).length;

                  return (
                    <div key={h.id} className="habit-card">
                      <div className="habit-header-row">
                        <div>
                          <div className="habit-name">{h.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                            {h.frequency} ({weekDoneCount}/{h.target} {h.unit || ''})
                          </div>
                        </div>
                        <div className="habit-streak-info">
                          <span>Sequência:</span>
                          <strong>{streak} {streak === 1 ? 'dia' : 'dias'}</strong>
                        </div>
                      </div>

                      <div className="habit-tracker-row">
                        <div className="habit-week-grid">
                          {weekDays.map((wd) => {
                            const isDone = recordsMap.has(wd.dateStr);
                            return (
                              <div key={wd.dateStr} className="habit-day-col">
                                <span className={`habit-day-label ${wd.isToday ? 'is-today' : ''}`}>
                                  {wd.name}
                                </span>
                                <button
                                  type="button"
                                  className={`habit-circle-btn ${isDone ? 'done' : ''}`}
                                  onClick={() => handleToggleHabit(h.id, wd.dateStr)}
                                  title={`${h.name} em ${wd.name} (${wd.dateStr}): ${isDone ? 'Concluído' : 'Não realizado'}`}
                                >
                                  {isDone ? '✓' : ''}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA: Metas e Notas Recentes */}
        <div className="dashboard-column">
          {/* BLOCO: METAS */}
          <div className="section-block">
            <div className="section-header-row">
              <div className="section-title-wrap">
                <h2 className="section-title">Metas & Objetivos</h2>
                <span className="section-subtitle-print">Progresso</span>
              </div>
              <button className="btn-ghost" onClick={() => onNavigate('goals')}>
                Ver metas <ArrowRight size={14} />
              </button>
            </div>

            {activeGoals.length === 0 ? (
              <p style={{ color: 'var(--ink-muted)', fontSize: '0.85rem', fontStyle: 'italic', padding: '0.5rem 0' }}>
                Nenhuma meta ativa no momento. Defina seus objetivos de curto e longo prazo.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {activeGoals.map((g) => {
                  const current = g.current_value || 0;
                  const target = g.target_value || 1;
                  const pct = Math.min(100, Math.round((current / target) * 100));

                  return (
                    <div key={g.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink-primary)' }}>
                          {g.title}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', fontVariantNumeric: 'tabular-nums' }}>
                          {pct}%
                        </span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="progress-values-row">
                        <span>{g.category}</span>
                        <span>
                          {g.unit ? `${g.unit} ` : ''}{current.toLocaleString('pt-BR')} / {g.unit ? `${g.unit} ` : ''}{target.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* BLOCO: CONTROLE DO SONO */}
          <div className="section-block">
            <div className="section-header-row">
              <div className="section-title-wrap">
                <h2 className="section-title">Repouso & Sono</h2>
                <span className="section-subtitle-print">Saúde</span>
              </div>
              <button className="btn-ghost" onClick={() => onNavigate('sleep')}>
                Ver gráfico <ArrowRight size={14} />
              </button>
            </div>

            {sleepLogs.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ color: 'var(--ink-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                  Nenhum registro de sono ainda.
                </p>
                {onOpenNewSleep && (
                  <button className="btn-ink-secondary" onClick={onOpenNewSleep} style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                    + Registrar Noite
                  </button>
                )}
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--ink-muted)' }}>
                      Última Noite ({sleepLogs[0].date.split('-').reverse().slice(0, 2).join('/')})
                    </span>
                    <div style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--ink-primary)', fontVariantNumeric: 'tabular-nums' }}>
                      {Math.floor(sleepLogs[0].hours)}h{Math.round((sleepLogs[0].hours - Math.floor(sleepLogs[0].hours)) * 60) > 0 ? `${Math.round((sleepLogs[0].hours - Math.floor(sleepLogs[0].hours)) * 60)}m` : ''}
                      <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--ink-muted)', marginLeft: '0.4rem' }}>
                        ({sleepLogs[0].hours}h)
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>Média recente</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--ink-primary)' }}>
                      {calculateSleepStats(sleepLogs.slice(0, 7)).averageFormatted}
                    </div>
                  </div>
                </div>

                {/* Mini barras dos últimos 7 dias */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.35rem', height: '48px', padding: '0.4rem 0', borderBottom: '1px dashed var(--border-paper)', marginBottom: '0.65rem' }}>
                  {sleepLogs.slice(0, 7).reverse().map((log) => {
                    const heightPct = Math.min(100, Math.round((log.hours / 12) * 100));
                    const isOptimal = log.hours >= 7 && log.hours <= 9;
                    return (
                      <div
                        key={log.id}
                        style={{
                          flex: 1,
                          height: `${heightPct}%`,
                          backgroundColor: isOptimal ? 'var(--ink-primary)' : 'var(--accent-terracotta)',
                          borderRadius: '2px 2px 0 0',
                          opacity: 0.85,
                          cursor: 'pointer',
                        }}
                        title={`${log.date}: ${log.hours}h`}
                        onClick={() => onNavigate('sleep')}
                      />
                    );
                  })}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                    {sleepLogs[0].quality ? `Sensação: ${sleepLogs[0].quality}` : 'Meta: 8 horas diárias'}
                  </span>
                  {onOpenNewSleep && (
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={onOpenNewSleep}
                      style={{ fontSize: '0.8rem', color: 'var(--accent-terracotta)', fontWeight: 600 }}
                    >
                      + Anotar hoje
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* BLOCO: NOTAS RECENTES */}
          <div className="section-block">
            <div className="section-header-row">
              <div className="section-title-wrap">
                <h2 className="section-title">Anotações Recentes</h2>
                <span className="section-subtitle-print">Idéias & Folhas</span>
              </div>
              <button className="btn-ghost" onClick={() => onNavigate('notes')}>
                Ver todas <ArrowRight size={14} />
              </button>
            </div>

            {recentNotes.length === 0 ? (
              <p style={{ color: 'var(--ink-muted)', fontSize: '0.85rem', fontStyle: 'italic', padding: '0.5rem 0' }}>
                Seu caderno está limpo. Crie uma nota rápida ou post-it.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                {recentNotes.map((n) => (
                  <div key={n.id} className={`note-card note-${n.color}`} style={{ minHeight: 'auto', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.3rem' }}>
                      <h4 style={{ fontFamily: 'var(--font-script)', fontSize: '1.35rem', fontWeight: 700 }}>
                        {n.title}
                      </h4>
                      <span style={{ fontSize: '0.7rem', color: 'var(--ink-muted)' }}>
                        {n.type === 'postit' ? 'Post-it' : 'Folha'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.83rem', color: 'var(--ink-secondary)', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {n.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
