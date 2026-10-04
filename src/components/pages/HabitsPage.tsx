import React, { useState } from 'react';
import { Habit, HabitRecord } from '../../types';
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight, CheckCircle, Flame } from 'lucide-react';
import { deleteHabit, calculateStreak } from '../../services/habits';

interface HabitsPageProps {
  habits: Habit[];
  habitRecords: HabitRecord[];
  onToggleHabitDay: (habitId: string, dateStr: string) => Promise<void>;
  onOpenNewHabit: () => void;
  onEditHabit: (habit: Habit) => void;
  onDataRefresh: () => void | Promise<void>;
}

export const HabitsPage: React.FC<HabitsPageProps> = ({
  habits,
  habitRecords,
  onToggleHabitDay,
  onOpenNewHabit,
  onEditHabit,
  onDataRefresh,
}) => {
  // Offset de semanas em relação à semana atual
  const [weekOffset, setWeekOffset] = useState<number>(0);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Calcular segunda-feira da semana visualizada
  const baseDate = new Date();
  baseDate.setDate(today.getDate() + weekOffset * 7);

  const currentDayOfWeek = baseDate.getDay();
  const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + mondayOffset + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayNames = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
    return {
      name: dayNames[d.getDay()],
      dateStr,
      dayNumber: d.getDate(),
      isToday: dateStr === todayStr,
    };
  });

  const weekLabel = `${weekDays[0].dayNumber}/${weekDays[0].dateStr.split('-')[1]} a ${weekDays[6].dayNumber}/${weekDays[6].dateStr.split('-')[1]}`;

  const handleToggle = (habitId: string, dateStr: string) => {
    void onToggleHabitDay(habitId, dateStr);
  };

  const handleDelete = async (habitId: string) => {
    if (!window.confirm('Deseja excluir este hábito e todo o seu histórico do caderno?')) return;
    try {
      await deleteHabit(habitId);
      await onDataRefresh();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Erro ao excluir hábito.');
    }
  };

  // Calcular se meta foi atingida na semana
  const evaluateHabitWeek = (habit: Habit, recordsMap: Set<string>) => {
    const daysCompleted = weekDays.filter((wd) => recordsMap.has(wd.dateStr)).length;

    if (habit.target_type === 'sequence') {
      // Verificar maior sequência de dias consecutivos na semana
      let maxConsecutive = 0;
      let curConsecutive = 0;
      weekDays.forEach((wd) => {
        if (recordsMap.has(wd.dateStr)) {
          curConsecutive++;
          if (curConsecutive > maxConsecutive) maxConsecutive = curConsecutive;
        } else {
          curConsecutive = 0;
        }
      });
      return {
        progress: maxConsecutive,
        isGoalMet: maxConsecutive >= habit.target,
        text: `${maxConsecutive}/${habit.target} dias consecutivos`,
      };
    } else {
      // Frequência ou quantidade
      return {
        progress: daysCompleted,
        isGoalMet: daysCompleted >= habit.target,
        text: `${daysCompleted}/${habit.target} ${habit.unit || 'vezes'}`,
      };
    }
  };

  return (
    <div className="page-sheet">
      <div className="journal-header">
        <div>
          <div className="journal-date-badge">HABIT TRACKER</div>
          <h1 className="journal-heading-script">Hábitos & Rotinas</h1>
        </div>
        <div className="journal-header-actions">
          <button className="btn-ink-primary" onClick={onOpenNewHabit}>
            <Plus size={16} /> Novo Hábito
          </button>
        </div>
      </div>

      {/* NAVEGAÇÃO DE SEMANA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', padding: '0.65rem 1rem', backgroundColor: 'var(--bg-paper-card)', border: '1px solid var(--border-paper)', borderRadius: 'var(--radius-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setWeekOffset(weekOffset - 1)}
            title="Semana anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink-primary)' }}>
            Semana: {weekLabel}
          </span>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setWeekOffset(weekOffset + 1)}
            title="Próxima semana"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {weekOffset !== 0 && (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setWeekOffset(0)}
            style={{ fontSize: '0.8rem', color: 'var(--accent-terracotta)' }}
          >
            Voltar para Hoje
          </button>
        )}
      </div>

      {/* LISTA DE HÁBITOS */}
      {habits.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--ink-muted)' }}>
          <p style={{ fontFamily: 'var(--font-script)', fontSize: '1.8rem', marginBottom: '0.5rem', color: 'var(--ink-secondary)' }}>
            Nenhum hábito cadastrado no caderno
          </p>
          <p style={{ fontSize: '0.85rem' }}>
            Crie hábitos de leitura, oração, exercícios ou estudos para acompanhar suas sequências diárias.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {habits.map((habit) => {
            const records = habitRecords.filter((r) => r.habit_id === habit.id);
            const streak = calculateStreak(records);
            const recordsMap = new Set(records.filter((r) => r.completed).map((r) => r.date));
            const evalResult = evaluateHabitWeek(habit, recordsMap);

            return (
              <div key={habit.id} className="habit-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--ink-primary)' }}>
                        {habit.name}
                      </h3>
                      {evalResult.isGoalMet && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--accent-sage)', fontWeight: 600, backgroundColor: 'rgba(78, 99, 72, 0.1)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>
                          <CheckCircle size={13} /> Meta da semana atingida!
                        </span>
                      )}
                    </div>
                    {habit.description && (
                      <p style={{ fontSize: '0.83rem', color: 'var(--ink-secondary)', marginTop: '0.2rem' }}>
                        {habit.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                      <span>Meta: {habit.frequency}</span>
                      <span>·</span>
                      <span>Progresso: {evalResult.text}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.6rem', backgroundColor: 'var(--bg-paper)', border: '1px solid var(--border-paper)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--ink-primary)' }}>
                      <Flame size={14} style={{ color: streak > 0 ? 'var(--accent-terracotta)' : 'var(--ink-muted)' }} />
                      <span>{streak} {streak === 1 ? 'dia de streak' : 'dias de streak'}</span>
                    </div>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => onEditHabit(habit)}
                      title="Editar hábito"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => handleDelete(habit.id)}
                      title="Excluir hábito"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* GRADE DE DIAS DA SEMANA ESTILO BULLET JOURNAL */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-paper)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-paper)' }}>
                  <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                    {weekDays.map((wd) => {
                      const isDone = recordsMap.has(wd.dateStr);
                      return (
                        <div key={wd.dateStr} className="habit-day-col">
                          <span className={`habit-day-label ${wd.isToday ? 'is-today' : ''}`}>
                            {wd.name}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', fontVariantNumeric: 'tabular-nums' }}>
                            {wd.dayNumber}
                          </span>
                          <button
                            type="button"
                            className={`habit-circle-btn ${isDone ? 'done' : ''}`}
                            onClick={() => handleToggle(habit.id, wd.dateStr)}
                            title={`Marcar ${habit.name} em ${wd.name} (${wd.dateStr})`}
                          >
                            {isDone ? '●' : '○'}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Status Semanal
                    </span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: evalResult.isGoalMet ? 'var(--accent-sage)' : 'var(--ink-primary)' }}>
                      {evalResult.isGoalMet ? 'Concluída' : 'Em progresso'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
