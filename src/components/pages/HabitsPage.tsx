import React, { useState, useMemo } from 'react';
import { Habit, HabitRecord } from '../../types';
import {
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ChevronDown,
  Sliders,
  Sparkles,
  Pin,
  ArrowRight,
} from 'lucide-react';
import {
  deleteHabit,
  calculateStreak,
  fetchHabitReflections,
  saveHabitReflection,
  saveHabit,
  BUJO_PRESET_HABITS,
} from '../../services/habits';
import ritualPhoto from '../../assets/images/bullet_journal_ritual_1791675237277.jpg';

interface HabitsPageProps {
  habits: Habit[];
  habitRecords: HabitRecord[];
  onToggleHabitDay: (habitId: string, dateStr: string) => Promise<void>;
  onOpenNewHabit: () => void;
  onEditHabit: (habit: Habit) => void;
  onDataRefresh: () => void | Promise<void>;
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const CATEGORIES = ['Todos', 'Saúde & Corpo', 'Mente & Foco', 'Rotina'];

export const HabitsPage: React.FC<HabitsPageProps> = ({
  habits,
  habitRecords,
  onToggleHabitDay,
  onOpenNewHabit,
  onEditHabit,
  onDataRefresh,
}) => {
  // Controle de Mês e Ano Selecionado
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth()); // 0 a 11
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [viewTab, setViewTab] = useState<'hoje' | 'mensal' | 'estatisticas' | 'diario'>('mensal');
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [isSeedingPresets, setIsSeedingPresets] = useState(false);

  // Data atual
  const todayStr = now.toISOString().split('T')[0];
  const todayDay = now.getDate();
  const isCurrentMonthView = selectedYear === now.getFullYear() && selectedMonth === now.getMonth();

  // Dias no mês selecionado
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate();
  }, [selectedYear, selectedMonth]);

  // Lista de dias do mês: 1 a 28/30/31
  const monthDays = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const dayNum = i + 1;
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const isToday = isCurrentMonthView && dayNum === todayDay;
      return {
        dayNum,
        dateStr,
        isToday,
      };
    });
  }, [selectedYear, selectedMonth, daysInMonth, isCurrentMonthView, todayDay]);

  // Navegação de mês
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const monthYearKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
  const [reflections, setReflections] = useState(() => fetchHabitReflections(monthYearKey));

  // Filtragem por categoria
  const filteredHabits = useMemo(() => {
    if (selectedCategory === 'Todos') return habits;
    return habits.filter((h) => (h.category || 'Rotina') === selectedCategory);
  }, [habits, selectedCategory]);

  // Mapa de registros indexado por `habitId|dateStr`
  const recordsMap = useMemo(() => {
    const map = new Map<string, boolean>();
    habitRecords.forEach((r) => {
      if (r.completed) {
        map.set(`${r.habit_id}|${r.date}`, true);
      }
    });
    return map;
  }, [habitRecords]);

  // Métricas do Mês
  const monthMetrics = useMemo(() => {
    if (habits.length === 0) {
      return {
        consistencyPct: 0,
        maxStreak: 0,
        topHabit: null as { habit: Habit; pct: number; streak: number } | null,
        lowestHabit: null as { habit: Habit; pct: number } | null,
        totalCompletedMarks: 0,
        totalPossibleMarks: 0,
        monthlyGoalPct: 0,
      };
    }

    let totalCompleted = 0;
    const daysElapsed = isCurrentMonthView ? Math.min(todayDay, daysInMonth) : daysInMonth;
    const totalPossible = habits.length * daysElapsed;

    const habitStats = habits.map((h) => {
      let count = 0;
      monthDays.forEach((d) => {
        if (recordsMap.has(`${h.id}|${d.dateStr}`)) count++;
      });
      const pct = daysElapsed > 0 ? Math.round((count / daysElapsed) * 100) : 0;
      const recs = habitRecords.filter((r) => r.habit_id === h.id);
      const streak = calculateStreak(recs);
      totalCompleted += count;
      return { habit: h, count, pct, streak };
    });

    const consistencyPct = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
    const maxStreak = Math.max(0, ...habitStats.map((s) => s.streak));

    // Top e Lowest
    const sorted = [...habitStats].sort((a, b) => b.pct - a.pct);
    const topHabit = sorted[0] || null;
    const lowestHabit = sorted.length > 1 ? sorted[sorted.length - 1] : null;

    const totalMonthPossible = habits.length * daysInMonth;
    const monthlyGoalPct = totalMonthPossible > 0 ? Math.round((totalCompleted / totalMonthPossible) * 100) : 0;

    return {
      consistencyPct,
      maxStreak,
      topHabit,
      lowestHabit,
      totalCompletedMarks: totalCompleted,
      totalPossibleMarks: totalMonthPossible,
      monthlyGoalPct,
    };
  }, [habits, habitRecords, recordsMap, monthDays, isCurrentMonthView, todayDay, daysInMonth]);

  // Exclusão de Hábito
  const handleDeleteHabit = async (habitId: string, habitName: string) => {
    if (!window.confirm(`Deseja retirar o hábito "${habitName}" do seu caderno?`)) return;
    try {
      await deleteHabit(habitId);
      await onDataRefresh();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Erro ao excluir hábito.');
    }
  };

  // Carregar Hábitos Padrão do Bullet Journal (se a lista estiver vazia ou pelo botão Personalizar Grade)
  const handleLoadBujoPresets = async () => {
    if (habits.length > 0) {
      const confirmAdd = window.confirm(
        'Deseja adicionar os hábitos clássicos do Bullet Journal (sleep, medicin, skin care, teeth, read, water, etc.) ao seu caderno?'
      );
      if (!confirmAdd) return;
    }

    setIsSeedingPresets(true);
    try {
      for (const preset of BUJO_PRESET_HABITS) {
        // Verifica se já existe um hábito com o mesmo nome para evitar duplicar
        const alreadyExists = habits.some(
          (h) => h.name.toLowerCase().trim() === preset.name.toLowerCase().trim()
        );
        if (!alreadyExists) {
          await saveHabit(preset);
        }
      }
      await onDataRefresh();
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar modelos de hábitos: ' + (err instanceof Error ? err.message : ''));
    } finally {
      setIsSeedingPresets(false);
    }
  };

  // Salvar nota rápida da semana
  const handleAddReflection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    const currentWeekNum = Math.min(4, Math.ceil(todayDay / 7));
    const saved = saveHabitReflection(monthYearKey, currentWeekNum, newNoteText);
    setReflections((prev) => [saved, ...prev]);
    setNewNoteText('');
    setIsAddingNote(false);
  };

  const currentWeekNumber = Math.min(4, Math.ceil(todayDay / 7));

  return (
    <div className="page-sheet" style={{ padding: '1.75rem 2rem' }}>
      {/* 1. BARRA SUPERIOR DE CABEÇALHO */}
      <div className="bujo-top-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div>
            <h1 className="bujo-brand-title">habits & routine</h1>
            <div className="bujo-brand-subtitle">BULLET JOURNAL</div>
          </div>

          {/* Seletor Rápido de Mês */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="bujo-month-pill-btn"
              onClick={() => setShowMonthDropdown((prev) => !prev)}
              aria-label="Selecionar mês"
            >
              <Calendar size={14} style={{ color: 'var(--accent-terracotta)' }} />
              <span>
                {MONTH_NAMES[selectedMonth]} {selectedYear}
              </span>
              <ChevronDown size={14} style={{ color: 'var(--ink-muted)' }} />
            </button>

            {showMonthDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '0.4rem',
                  backgroundColor: 'var(--bg-paper-white)',
                  border: '1px solid var(--border-paper-dark)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  padding: '0.5rem',
                  zIndex: 30,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.35rem',
                  width: '280px',
                }}
              >
                {MONTH_NAMES.map((mName, idx) => (
                  <button
                    key={mName}
                    type="button"
                    onClick={() => {
                      setSelectedMonth(idx);
                      setShowMonthDropdown(false);
                    }}
                    style={{
                      padding: '0.4rem 0.5rem',
                      fontSize: '0.78rem',
                      fontWeight: selectedMonth === idx ? 600 : 400,
                      backgroundColor:
                        selectedMonth === idx ? 'var(--ink-primary)' : 'transparent',
                      color: selectedMonth === idx ? '#FFFFFF' : 'var(--ink-primary)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      border: 'none',
                    }}
                  >
                    {mName.slice(0, 3)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Abas Centrais & Botão Novo Hábito */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="bujo-view-tabs">
            <button
              type="button"
              className={`bujo-view-tab-btn ${viewTab === 'hoje' ? 'active' : ''}`}
              onClick={() => setViewTab('hoje')}
            >
              Hoje
            </button>
            <button
              type="button"
              className={`bujo-view-tab-btn ${viewTab === 'mensal' ? 'active' : ''}`}
              onClick={() => setViewTab('mensal')}
            >
              Visão Mensal
            </button>
            <button
              type="button"
              className={`bujo-view-tab-btn ${viewTab === 'estatisticas' ? 'active' : ''}`}
              onClick={() => setViewTab('estatisticas')}
            >
              Estatísticas
            </button>
            <button
              type="button"
              className={`bujo-view-tab-btn ${viewTab === 'diario' ? 'active' : ''}`}
              onClick={() => setViewTab('diario')}
            >
              Diário
            </button>
          </div>

          <button className="btn-ink-primary" onClick={onOpenNewHabit}>
            <Plus size={16} /> Novo Hábito
          </button>
        </div>
      </div>

      {/* 2. SUB-BARRA DE NAVEGAÇÃO, FILTROS E MÉTRICAS */}
      <div className="bujo-sub-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          {/* Navegador de Mês: < Novembro 2025 > */}
          <div className="bujo-month-stepper">
            <button
              type="button"
              className="btn-ghost"
              onClick={handlePrevMonth}
              title="Mês anterior"
              style={{ padding: '0.25rem' }}
            >
              <ChevronLeft size={18} />
            </button>
            <span className="bujo-month-title">
              {MONTH_NAMES[selectedMonth]} {selectedYear}
            </span>
            <button
              type="button"
              className="btn-ghost"
              onClick={handleNextMonth}
              title="Próximo mês"
              style={{ padding: '0.25rem' }}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Filtros por Categoria */}
          <div className="bujo-filter-pills">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`bujo-filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Métricas do Topo e Botão Personalizar Grade */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div className="bujo-sub-metrics">
            <div className="bujo-metric-item">
              <span className="bujo-metric-label">Consistência Geral</span>
              <span className="bujo-metric-value">{monthMetrics.consistencyPct}%</span>
            </div>
            <div className="bujo-metric-item">
              <span className="bujo-metric-label">Sequência Atual</span>
              <span className="bujo-metric-value">{monthMetrics.maxStreak} dias</span>
            </div>
          </div>

          <button
            type="button"
            className="bujo-btn-custom-grid"
            onClick={handleLoadBujoPresets}
            disabled={isSeedingPresets}
            title="Carregar ou sincronizar modelos clássicos de hábitos do Bullet Journal"
          >
            <Sliders size={14} />
            <span>{isSeedingPresets ? 'Adicionando...' : 'Personalizar Grade'}</span>
          </button>
        </div>
      </div>

      {/* 3. LAYOUT PRINCIPAL: GRADE DO CADERNO (ESQUERDA) + INSIGHTS & NOTAS (DIREITA) */}
      <div className="bujo-layout-grid">
        {/* COLUNA ESQUERDA: A FOLHA DE CADERNO COM A GRADE DE 30/31 DIAS */}
        <div className="bujo-sheet">
          {/* FAIXA ARTÍSTICA AQUARELADA COM "habits" */}
          <div className="bujo-sheet-header">
            <div className="bujo-watercolor-banner">
              <h2 className="bujo-sheet-title">habits</h2>
            </div>
            <div className="bujo-sheet-subtitle">
              BULLET JOURNAL TRACKER &bull; {daysInMonth} dias &bull; preencha com nanquim
            </div>
          </div>

          {/* TABELA DE DIAS COM RASTREAMENTO */}
          {filteredHabits.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--ink-muted)' }}>
              <p
                style={{
                  fontFamily: 'var(--font-editorial)',
                  fontStyle: 'italic',
                  fontSize: '1.8rem',
                  marginBottom: '0.5rem',
                  color: 'var(--ink-secondary)',
                }}
              >
                Nenhum hábito encontrado nesta categoria
              </p>
              <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                Crie um novo hábito ou use a grade clássica com sono, remédios, leitura, hidratação e cuidados.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                <button className="btn-ink-primary" onClick={onOpenNewHabit}>
                  <Plus size={16} /> Criar Hábito
                </button>
                <button className="btn-ink-secondary" onClick={handleLoadBujoPresets}>
                  <Sparkles size={16} /> Carregar Grade Padrão
                </button>
              </div>
            </div>
          ) : (
            <div className="bujo-table-wrap">
              <table className="bujo-grid-table">
                <thead>
                  <tr>
                    <th className="col-habit">Hábito</th>
                    {monthDays.map((d) => (
                      <th
                        key={d.dayNum}
                        className={`col-day ${d.isToday ? 'is-today' : ''}`}
                        title={d.isToday ? `Hoje (Dia ${d.dayNum})` : `Dia ${d.dayNum}`}
                      >
                        {d.dayNum}
                      </th>
                    ))}
                    <th className="col-summary">Resumo</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHabits.map((habit) => {
                    // Contagem de dias concluídos no mês
                    let completedInMonth = 0;
                    monthDays.forEach((d) => {
                      if (recordsMap.has(`${habit.id}|${d.dateStr}`)) completedInMonth++;
                    });
                    const pctMonth = Math.round((completedInMonth / daysInMonth) * 100);

                    return (
                      <tr key={habit.id}>
                        {/* Coluna do Hábito: Nome e Descrição / Gatilho */}
                        <td style={{ verticalAlign: 'middle' }}>
                          <div className="bujo-habit-info">
                            <div className="bujo-habit-name-row">
                              <span className="bujo-habit-name">{habit.name}</span>
                              <div className="bujo-habit-actions">
                                <button
                                  type="button"
                                  className="btn-ghost"
                                  onClick={() => onEditHabit(habit)}
                                  title="Editar hábito"
                                  style={{ padding: '0.15rem' }}
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  type="button"
                                  className="btn-ghost"
                                  onClick={() => handleDeleteHabit(habit.id, habit.name)}
                                  title="Excluir hábito"
                                  style={{ padding: '0.15rem' }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                            {habit.description && (
                              <span className="bujo-habit-cue">{habit.description}</span>
                            )}
                          </div>
                        </td>

                        {/* Células de Pontos: 1 a 31 */}
                        {monthDays.map((d) => {
                          const isDone = recordsMap.has(`${habit.id}|${d.dateStr}`);
                          const isToday = d.isToday;

                          return (
                            <td
                              key={d.dayNum}
                              className={`bujo-dot-cell ${isToday ? 'is-today-col' : ''}`}
                            >
                              <button
                                type="button"
                                className={`bujo-dot-btn ${isDone ? 'completed' : ''} ${
                                  isToday ? 'today-halo' : ''
                                }`}
                                onClick={() => onToggleHabitDay(habit.id, d.dateStr)}
                                title={`${habit.name} • ${d.dayNum}/${selectedMonth + 1}/${selectedYear}: ${
                                  isDone ? 'Concluído (Clique para desmarcar)' : 'Pendente (Clique para preencher)'
                                }`}
                                aria-label={`${habit.name} dia ${d.dayNum}`}
                              />
                            </td>
                          );
                        })}

                        {/* Resumo no canto direito: 11/30 • 79% */}
                        <td>
                          <div className="bujo-summary-badge">
                            {completedInMonth}/{daysInMonth} &bull; {pctMonth}%
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* RODAPÉ DA FOLHA: LEGENDA & FRASE POÉTICA */}
          <div className="bujo-sheet-footer">
            <div className="bujo-legend">
              <div className="bujo-legend-item">
                <span
                  style={{
                    display: 'inline-block',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: '#181818',
                  }}
                />
                <span>Completado</span>
              </div>
              <div className="bujo-legend-item">
                <span
                  style={{
                    display: 'inline-block',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    border: '1.5px solid var(--border-paper-dark)',
                    backgroundColor: 'transparent',
                  }}
                />
                <span>Pendente</span>
              </div>
              <div className="bujo-legend-item">
                <span
                  style={{
                    display: 'inline-block',
                    width: '14px',
                    height: '14px',
                    borderRadius: '3px',
                    backgroundColor: 'rgba(246, 214, 201, 0.75)',
                    border: '1px solid rgba(230, 185, 170, 0.8)',
                  }}
                />
                <span>Dia Atual ({todayDay})</span>
              </div>
            </div>

            <div className="bujo-quote">&ldquo;A const&acirc;ncia sutil transforma montanhas.&rdquo;</div>
          </div>
        </div>

        {/* COLUNA DIREITA: CARDS DE INSIGHTS, NOTAS DA SEMANA E RITUAL MATINAL */}
        <div className="bujo-sidebar-column">
          {/* CARD 1: INSIGHTS DO MÊS */}
          <div className="bujo-insight-card">
            <div className="bujo-folded-tab" title="Destaques">
              <Sparkles size={16} />
            </div>

            <h3 className="bujo-sidebar-title">Insights do m&ecirc;s</h3>

            {/* MAIS CONSTANTE */}
            <div className="bujo-insight-block">
              <div className="bujo-insight-top">
                <span className="bujo-insight-kicker">Mais Constante</span>
                <span className="bujo-insight-pct">
                  {monthMetrics.topHabit ? `${monthMetrics.topHabit.pct}%` : '—'}
                </span>
              </div>
              <div className="bujo-insight-name">
                {monthMetrics.topHabit ? monthMetrics.topHabit.habit.name : 'Nenhum hábito ainda'}
              </div>
              <div className="bujo-insight-sub">
                {monthMetrics.topHabit && monthMetrics.topHabit.streak > 0
                  ? `${monthMetrics.topHabit.streak} dias consecutivos sem interrupções.`
                  : 'Mantenha a frequência para construir sua sequência.'}
              </div>
            </div>

            {/* PRECISA DE CARINHO */}
            {monthMetrics.lowestHabit && (
              <div className="bujo-insight-block">
                <div className="bujo-insight-top">
                  <span className="bujo-insight-kicker">Precisa de Carinho</span>
                  <span className="bujo-insight-pct">{monthMetrics.lowestHabit.pct}%</span>
                </div>
                <div className="bujo-insight-name">{monthMetrics.lowestHabit.habit.name}</div>
                <div className="bujo-insight-sub">
                  Dica: vincule este hábito imediatamente após uma rotina já consolidada.
                </div>
              </div>
            )}

            {/* META MENSAL */}
            <div className="bujo-insight-block">
              <div className="bujo-insight-top">
                <span className="bujo-insight-kicker">Meta Mensal</span>
              </div>
              <div className="bujo-progress-ring-row">
                <div style={{ fontSize: '0.88rem', color: 'var(--ink-secondary)' }}>
                  <strong style={{ color: 'var(--ink-primary)', fontSize: '1.25rem', fontVariantNumeric: 'tabular-nums' }}>
                    {monthMetrics.totalCompletedMarks}
                  </strong>{' '}
                  / {monthMetrics.totalPossibleMarks} marcas
                </div>

                {/* Gauge circular SVG */}
                <div style={{ position: 'relative', width: '48px', height: '48px' }}>
                  <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="rgba(0,0,0,0.08)"
                      strokeWidth="3.2"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#181818"
                      strokeWidth="3.2"
                      strokeDasharray={`${monthMetrics.monthlyGoalPct}, 100`}
                    />
                  </svg>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: 'var(--ink-primary)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {monthMetrics.monthlyGoalPct}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: NOTAS DA SEMANA */}
          <div className="bujo-notes-card">
            <div className="bujo-notes-header">
              <div className="bujo-notes-title-group">
                <Pin size={15} style={{ color: 'var(--accent-terracotta)' }} />
                <h4
                  style={{
                    fontFamily: 'var(--font-editorial)',
                    fontStyle: 'italic',
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: 'var(--ink-primary)',
                  }}
                >
                  notas da semana
                </h4>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', textTransform: 'lowercase' }}>
                semana {currentWeekNumber}
              </span>
            </div>

            <div className="bujo-notes-list">
              {reflections.map((ref) => (
                <div key={ref.id} className="bujo-note-quote">
                  {ref.text}
                </div>
              ))}
            </div>

            {/* Formulário / Botão de Adicionar Nota com Nanquim */}
            {isAddingNote ? (
              <form onSubmit={handleAddReflection} style={{ marginTop: '0.75rem' }}>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="Escreva sua reflexão semanal com nanquim..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  autoFocus
                  style={{ fontSize: '0.8rem', padding: '0.5rem' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', marginTop: '0.4rem' }}>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setIsAddingNote(false)}
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-ink-primary"
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                  >
                    Anotar
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                className="bujo-note-add-btn"
                onClick={() => setIsAddingNote(true)}
              >
                <span>Adicionar nota rápida com nanquim</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>

          {/* CARD 3: RITUAL MATINAL (FOTO INSPIRACIONAL DO BULLET JOURNAL) */}
          <div className="bujo-ritual-photo-card">
            <img
              src={ritualPhoto}
              alt="Caderno aberto de bullet journal com caneta tinteiro"
              className="bujo-ritual-photo"
            />
            <div className="bujo-ritual-overlay">
              <span className="bujo-ritual-kicker">Ritual Matinal</span>
              <p className="bujo-ritual-text">Reserve 3 minutos para registrar suas marcas.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. RODAPÉ INFORMATIVO DA PÁGINA */}
      <div className="bujo-page-footer">
        <div>
          <strong style={{ color: 'var(--ink-primary)' }}>habits & routine</strong> &mdash; rotina consciente & planejamento di&aacute;rio
        </div>
        <div>&copy; {new Date().getFullYear()} Edi&ccedil;&atilde;o Papel & Tinta</div>
      </div>
    </div>
  );
};
