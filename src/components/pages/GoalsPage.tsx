import React, { useState } from 'react';
import { Goal, GoalCategory, GoalTimeframe } from '../../types';
import { Plus, Edit2, Trash2, LayoutGrid, List } from 'lucide-react';
import { deleteGoal } from '../../services/goals';

interface GoalsPageProps {
  goals: Goal[];
  onOpenNewGoal: () => void;
  onEditGoal: (goal: Goal) => void;
  onDataRefresh: () => void | Promise<void>;
}

export const GoalsPage: React.FC<GoalsPageProps> = ({
  goals,
  onOpenNewGoal,
  onEditGoal,
  onDataRefresh,
}) => {
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [timeframeFilter, setTimeframeFilter] = useState<'all' | GoalTimeframe>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const handleDelete = async (goalId: string) => {
    if (!window.confirm('Deseja retirar este objetivo do seu caderno?')) return;
    try {
      await deleteGoal(goalId);
      await onDataRefresh();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Erro ao excluir meta.');
    }
  };

  const filteredGoals = goals.filter((g) => {
    if (timeframeFilter !== 'all' && g.timeframe !== timeframeFilter) return false;
    if (categoryFilter !== 'all' && g.category !== categoryFilter) return false;
    return true;
  });

  const categories: GoalCategory[] = ['Pessoal', 'Financeira', 'Profissional', 'Estudos', 'Saúde', 'Espiritual'];

  return (
    <div className="page-sheet">
      <div className="journal-header">
        <div>
          <div className="journal-date-badge">MURAL DE SONHOS & OBJETIVOS</div>
          <h1 className="journal-heading-script">Metas & Vision Board</h1>
        </div>
        <div className="journal-header-actions">
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-paper-card)', border: '1px solid var(--border-paper)', borderRadius: 'var(--radius-sm)', padding: '2px' }}>
            <button
              type="button"
              className={`filter-tab-btn ${viewMode === 'board' ? 'active' : ''}`}
              onClick={() => setViewMode('board')}
              title="Visualização Vision Board (Mural com Fotos)"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.65rem' }}
            >
              <LayoutGrid size={15} /> Mural
            </button>
            <button
              type="button"
              className={`filter-tab-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Visualização em Lista"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.65rem' }}
            >
              <List size={15} /> Lista
            </button>
          </div>

          <button className="btn-ink-primary" onClick={onOpenNewGoal}>
            <Plus size={16} /> Nova Meta
          </button>
        </div>
      </div>

      {/* FILTROS DE PRAZO E CATEGORIA */}
      <div className="filter-bar">
        <button
          className={`filter-tab-btn ${timeframeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setTimeframeFilter('all')}
        >
          Todos os Prazos ({goals.length})
        </button>
        <button
          className={`filter-tab-btn ${timeframeFilter === 'curto' ? 'active' : ''}`}
          onClick={() => setTimeframeFilter('curto')}
        >
          Curto Prazo
        </button>
        <button
          className={`filter-tab-btn ${timeframeFilter === 'medio' ? 'active' : ''}`}
          onClick={() => setTimeframeFilter('medio')}
        >
          Médio Prazo
        </button>
        <button
          className={`filter-tab-btn ${timeframeFilter === 'longo' ? 'active' : ''}`}
          onClick={() => setTimeframeFilter('longo')}
        >
          Longo Prazo
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
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
        {categories.map((c) => (
          <button
            key={c}
            className={`filter-tab-btn ${categoryFilter === c ? 'active' : ''}`}
            onClick={() => setCategoryFilter(c)}
            style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* CONTEÚDO: MURAL OU LISTA */}
      {filteredGoals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--ink-muted)' }}>
          <p style={{ fontFamily: 'var(--font-script)', fontSize: '1.8rem', marginBottom: '0.5rem', color: 'var(--ink-secondary)' }}>
            Nenhum objetivo registrado neste filtro
          </p>
          <p style={{ fontSize: '0.85rem' }}>
            Adicione seus sonhos no mural: viagens, conquistas, finanças ou metas profissionais.
          </p>
        </div>
      ) : viewMode === 'board' ? (
        /* VISION BOARD (MURAL DE SONHOS) */
        <div className="vision-board-grid">
          {filteredGoals.map((g) => {
            const current = g.current_value || 0;
            const target = g.target_value || 1;
            const pct = Math.min(100, Math.round((current / target) * 100));

            return (
              <div key={g.id} className="vision-item-card">
                {/* Foto no formato polaroid / recorte de revista colado */}
                <div className="vision-photo-frame">
                  {g.image_url ? (
                    <img
                      src={g.image_url}
                      alt={g.title}
                      className="vision-photo-img"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="vision-photo-placeholder">
                      <span>{g.category}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <h3 className="vision-card-title">{g.title}</h3>
                  <div style={{ display: 'flex', gap: '0.2rem' }}>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => onEditGoal(g)}
                      title="Editar meta"
                      style={{ padding: '0.2rem' }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => handleDelete(g.id)}
                      title="Excluir meta"
                      style={{ padding: '0.2rem' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {g.description && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--ink-secondary)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                    {g.description}
                  </p>
                )}

                <div className="vision-card-meta">
                  <span>{g.category} · {g.timeframe === 'curto' ? 'Curto prazo' : g.timeframe === 'medio' ? 'Médio prazo' : 'Longo prazo'}</span>
                  {g.deadline && <span>Alvo: {g.deadline}</span>}
                </div>

                {g.target_value && (
                  <div style={{ marginTop: 'auto' }}>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="progress-values-row">
                      <span>{pct}% concluído</span>
                      <strong style={{ color: 'var(--ink-primary)' }}>
                        {g.unit ? `${g.unit} ` : ''}{current.toLocaleString('pt-BR')} / {g.unit ? `${g.unit} ` : ''}{target.toLocaleString('pt-BR')}
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* VISUALIZAÇÃO EM LISTA ESTRUTURADA */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredGoals.map((g) => {
            const current = g.current_value || 0;
            const target = g.target_value || 1;
            const pct = Math.min(100, Math.round((current / target) * 100));

            return (
              <div
                key={g.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem 1.25rem',
                  backgroundColor: 'var(--bg-paper-white)',
                  border: '1px solid var(--border-paper)',
                  borderRadius: 'var(--radius-md)',
                  gap: '1.25rem',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink-primary)' }}>
                      {g.title}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                      {g.category} · {g.timeframe === 'curto' ? 'Curto prazo' : g.timeframe === 'medio' ? 'Médio prazo' : 'Longo prazo'}
                    </span>
                  </div>
                  {g.description && (
                    <p style={{ fontSize: '0.82rem', color: 'var(--ink-secondary)', marginTop: '0.2rem' }}>
                      {g.description}
                    </p>
                  )}
                </div>

                {g.target_value && (
                  <div style={{ width: '220px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                      <span>Progresso</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: '0.25rem', textAlign: 'right' }}>
                      {g.unit ? `${g.unit} ` : ''}{current.toLocaleString('pt-BR')} / {g.unit ? `${g.unit} ` : ''}{target.toLocaleString('pt-BR')}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => onEditGoal(g)}
                    title="Editar meta"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => handleDelete(g.id)}
                    title="Excluir meta"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
