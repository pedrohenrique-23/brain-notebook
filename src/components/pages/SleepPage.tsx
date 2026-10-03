import React, { useState } from 'react';
import { SleepLog } from '../../types';
import { Plus, Edit2, Trash2, Moon, Sparkles, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { deleteSleepLog, calculateSleepStats } from '../../services/storage';

interface SleepPageProps {
  sleepLogs: SleepLog[];
  onOpenNewSleep: () => void;
  onEditSleep: (log: SleepLog) => void;
  onDataRefresh: () => void;
}

type PeriodFilter = 7 | 14 | 30;

export const SleepPage: React.FC<SleepPageProps> = ({
  sleepLogs,
  onOpenNewSleep,
  onEditSleep,
  onDataRefresh,
}) => {
  const [period, setPeriod] = useState<PeriodFilter>(14);
  const [hoveredLog, setHoveredLog] = useState<{ log: SleepLog; x: number; y: number } | null>(null);

  const handleDelete = (id: string) => {
    if (window.confirm('Deseja excluir este registro de sono do caderno?')) {
      deleteSleepLog(id);
      onDataRefresh();
    }
  };

  // Filtrar logs para o período selecionado
  const now = new Date();
  const cutoffDate = new Date();
  cutoffDate.setDate(now.getDate() - (period - 1));
  const cutoffStr = cutoffDate.toISOString().split('T')[0];

  // Ordenados cronologicamente para o gráfico (mais antigo para o mais recente)
  // Gerar dias contínuos para o período selecionado para preencher dias faltantes no gráfico
  const dateList: string[] = [];
  for (let i = period - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    dateList.push(d.toISOString().split('T')[0]);
  }

  const logsByDate = new Map<string, SleepLog>();
  sleepLogs.forEach((l) => logsByDate.set(l.date, l));

  // Itens para o gráfico
  const chartItems = dateList.map((dStr) => {
    const existing = logsByDate.get(dStr);
    const d = new Date(dStr + 'T12:00:00');
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return {
      dateStr: dStr,
      dayLabel: dayNames[d.getDay()],
      dateShort: `${d.getDate()}/${String(d.getMonth() + 1).padStart(2, '0')}`,
      log: existing || null,
      hours: existing ? existing.hours : 0,
    };
  });

  const periodLogs = sleepLogs.filter((l) => l.date >= cutoffStr);
  const stats = calculateSleepStats(periodLogs);

  // Dimensões do Gráfico SVG
  const svgWidth = 840;
  const svgHeight = 240;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartPlotWidth = svgWidth - paddingLeft - paddingRight;
  const chartPlotHeight = svgHeight - paddingTop - paddingBottom;
  const maxScaleHours = 12; // Eixo Y vai até 12h

  const getY = (h: number) => {
    const clamped = Math.max(0, Math.min(maxScaleHours, h));
    return paddingTop + chartPlotHeight - (clamped / maxScaleHours) * chartPlotHeight;
  };

  const getX = (index: number) => {
    if (chartItems.length <= 1) return paddingLeft + chartPlotWidth / 2;
    return paddingLeft + (index / (chartItems.length - 1)) * chartPlotWidth;
  };

  // Coordenadas dos pontos registrados
  const validPoints = chartItems
    .map((item, idx) => ({ ...item, index: idx, x: getX(idx), y: getY(item.hours) }))
    .filter((p) => p.hours > 0);

  // Path SVG para a linha contínua do sono
  const linePath = validPoints.length > 1
    ? validPoints.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '')
    : '';

  // Faixa de sono ideal (7h a 9h)
  const yIdealTop = getY(9);
  const yIdealBottom = getY(7);
  const idealBandHeight = yIdealBottom - yIdealTop;

  // Linha de meta (8h)
  const yTarget8h = getY(8);

  const getQualityBadgeColor = (q?: string) => {
    switch (q) {
      case 'excelente':
        return { text: '#2E5A36', bg: 'rgba(46, 90, 54, 0.1)', border: '#A6CFA8' };
      case 'bom':
        return { text: '#2C4A6F', bg: 'rgba(44, 74, 111, 0.1)', border: '#A9C4E2' };
      case 'regular':
        return { text: '#8A5D18', bg: 'rgba(138, 93, 24, 0.1)', border: '#DFBF82' };
      case 'ruim':
        return { text: '#8C382A', bg: 'rgba(140, 56, 42, 0.1)', border: '#DF9D94' };
      default:
        return { text: 'var(--ink-secondary)', bg: 'rgba(0,0,0,0.04)', border: 'var(--border-paper)' };
    }
  };

  return (
    <div className="page-sheet">
      <div className="journal-header">
        <div>
          <div className="journal-date-badge">RASTREADOR DE REPOUSO & BEM-ESTAR</div>
          <h1 className="journal-heading-script">Controle do Sono</h1>
        </div>
        <div className="journal-header-actions">
          <button className="btn-ink-primary" onClick={onOpenNewSleep}>
            <Plus size={16} /> Registrar Noite
          </button>
        </div>
      </div>

      {/* CARDS DE RESUMO E ESTATÍSTICAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <div className="section-block" style={{ padding: '1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--ink-muted)', fontWeight: 600 }}>
              Média no Período
            </span>
            <Moon size={15} style={{ color: 'var(--accent-terracotta)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--ink-primary)', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
            {stats.averageFormatted || '0h'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ink-secondary)', marginTop: '0.35rem' }}>
            {stats.averageHours >= 7 && stats.averageHours <= 9
              ? 'Dentro da faixa ideal de repouso'
              : stats.averageHours < 7
              ? 'Abaixo da recomendação de 7h'
              : 'Acima de 9h por noite'}
          </div>
        </div>

        <div className="section-block" style={{ padding: '1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--ink-muted)', fontWeight: 600 }}>
              Consistência da Meta
            </span>
            <Sparkles size={15} style={{ color: 'var(--accent-sage)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--ink-primary)', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
            {stats.goalMetPercent}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ink-secondary)', marginTop: '0.35rem' }}>
            Das noites entre 7h e 9h de sono
          </div>
        </div>

        <div className="section-block" style={{ padding: '1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--ink-muted)', fontWeight: 600 }}>
              Maior / Menor Duração
            </span>
            <TrendingUp size={15} style={{ color: 'var(--ink-muted)' }} />
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--ink-primary)', fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
            {stats.bestHours > 0 ? `${stats.bestHours}h` : '—'} / {stats.lowestHours > 0 ? `${stats.lowestHours}h` : '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ink-secondary)', marginTop: '0.35rem' }}>
            Variação máxima de noites
          </div>
        </div>

        <div className="section-block" style={{ padding: '1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--ink-muted)', fontWeight: 600 }}>
              Noites Registradas
            </span>
            <Calendar size={15} style={{ color: 'var(--ink-muted)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--ink-primary)', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
            {stats.totalLogs}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ink-secondary)', marginTop: '0.35rem' }}>
            No período de {period} dias
          </div>
        </div>
      </div>

      {/* SELETOR DE PERÍODO E TÍTULO DO GRÁFICO */}
      <div className="section-block" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div className="section-title-wrap">
            <h2 className="section-title">Evolução Diária do Sono</h2>
            <span className="section-subtitle-print">Gráfico Pautado</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginRight: '0.2rem' }}>
              Visualizar:
            </span>
            <button
              type="button"
              className={`filter-tab-btn ${period === 7 ? 'active' : ''}`}
              onClick={() => setPeriod(7)}
            >
              7 Dias
            </button>
            <button
              type="button"
              className={`filter-tab-btn ${period === 14 ? 'active' : ''}`}
              onClick={() => setPeriod(14)}
            >
              14 Dias
            </button>
            <button
              type="button"
              className={`filter-tab-btn ${period === 30 ? 'active' : ''}`}
              onClick={() => setPeriod(30)}
            >
              30 Dias
            </button>
          </div>
        </div>

        {/* GRÁFICO SVG ESTILO FOLHA DE CADERNO */}
        <div style={{ width: '100%', overflowX: 'auto', position: 'relative' }}>
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            style={{ width: '100%', minWidth: '600px', height: 'auto', display: 'block' }}
          >
            <defs>
              {/* Gradiente sutil para área preenchida */}
              <linearGradient id="sleepAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--ink-primary)" stopOpacity="0.12" />
                <stop offset="100%" stopColor="var(--ink-primary)" stopOpacity="0.01" />
              </linearGradient>
            </defs>

            {/* FAIXA RECOMENDADA DE SONO (7h a 9h) */}
            <rect
              x={paddingLeft}
              y={yIdealTop}
              width={chartPlotWidth}
              height={idealBandHeight}
              fill="rgba(78, 99, 72, 0.08)"
            />
            <text
              x={svgWidth - paddingRight - 8}
              y={yIdealTop + 14}
              textAnchor="end"
              fontSize="9.5"
              fill="var(--accent-sage)"
              fontWeight="600"
              fontFamily="var(--font-body)"
            >
              Faixa Ideal (7h - 9h)
            </text>

            {/* LINHAS DE GRADE HORIZONTAIS (2h, 4h, 6h, 8h, 10h) */}
            {[0, 2, 4, 6, 8, 10].map((h) => {
              const y = getY(h);
              const isTarget = h === 8;
              return (
                <g key={h}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={svgWidth - paddingRight}
                    y2={y}
                    stroke={isTarget ? 'var(--accent-terracotta)' : 'var(--rule-line)'}
                    strokeWidth={isTarget ? '1' : '0.8'}
                    strokeDasharray={isTarget ? '3 3' : undefined}
                  />
                  <text
                    x={paddingLeft - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    fontSize="10"
                    fill={isTarget ? 'var(--accent-terracotta)' : 'var(--ink-muted)'}
                    fontFamily="var(--font-body)"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                    fontWeight={isTarget ? '600' : '400'}
                  >
                    {h}h
                  </text>
                </g>
              );
            })}

            {/* ÁREA SOMBREADA ABAIXO DA LINHA */}
            {validPoints.length > 1 && (
              <path
                d={`${linePath} L ${validPoints[validPoints.length - 1].x} ${getY(0)} L ${validPoints[0].x} ${getY(0)} Z`}
                fill="url(#sleepAreaGrad)"
              />
            )}

            {/* LINHA DE TENDÊNCIA DO SONO */}
            {validPoints.length > 1 && (
              <path
                d={linePath}
                fill="none"
                stroke="var(--ink-primary)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* BARRAS VERTICAIS SUTIS E PONTOS DE CADERNO */}
            {chartItems.map((item, idx) => {
              const x = getX(idx);
              const y = getY(item.hours);
              const hasData = item.hours > 0;
              const isHovered = hoveredLog?.log.date === item.dateStr;

              return (
                <g key={item.dateStr}>
                  {/* Linha vertical pontilhada sutil para o dia */}
                  <line
                    x1={x}
                    y1={paddingTop}
                    x2={x}
                    y2={paddingTop + chartPlotHeight}
                    stroke="var(--rule-line)"
                    strokeWidth="0.5"
                    strokeDasharray="2 4"
                  />

                  {/* Barra fina estilizada de preenchimento */}
                  {hasData && (
                    <line
                      x1={x}
                      y1={y}
                      x2={x}
                      y2={getY(0)}
                      stroke="var(--ink-primary)"
                      strokeWidth={period === 7 ? '6' : period === 14 ? '4' : '2'}
                      strokeOpacity={isHovered ? 0.35 : 0.15}
                      strokeLinecap="round"
                    />
                  )}

                  {/* Ponto estilo Bullet Journal */}
                  {hasData && (
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? 6 : 4}
                      fill={isHovered ? 'var(--accent-terracotta)' : 'var(--ink-primary)'}
                      stroke="var(--bg-paper-white)"
                      strokeWidth="1.5"
                      style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                      onMouseEnter={() => item.log && setHoveredLog({ log: item.log, x, y })}
                      onMouseLeave={() => setHoveredLog(null)}
                      onClick={() => item.log && onEditSleep(item.log)}
                    />
                  )}

                  {/* Rótulo de Data e Dia da Semana no Eixo X */}
                  <text
                    x={x}
                    y={svgHeight - 18}
                    textAnchor="middle"
                    fontSize={period === 30 ? '8' : '9.5'}
                    fill="var(--ink-secondary)"
                    fontWeight="500"
                    fontFamily="var(--font-body)"
                  >
                    {item.dayLabel}
                  </text>
                  <text
                    x={x}
                    y={svgHeight - 6}
                    textAnchor="middle"
                    fontSize={period === 30 ? '7.5' : '8.5'}
                    fill="var(--ink-muted)"
                    fontFamily="var(--font-body)"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {item.dateShort}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* TOOLTIP INTERATIVO FLUTUANTE */}
          {hoveredLog && (
            <div
              style={{
                position: 'absolute',
                left: `${(hoveredLog.x / svgWidth) * 100}%`,
                top: `${(hoveredLog.y / svgHeight) * 100}%`,
                transform: 'translate(-50%, -120%)',
                backgroundColor: 'var(--bg-paper-white)',
                border: '1px solid var(--border-paper-dark)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
                padding: '0.6rem 0.85rem',
                fontSize: '0.8rem',
                zIndex: 20,
                pointerEvents: 'none',
                minWidth: '150px',
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--ink-primary)', marginBottom: '0.2rem' }}>
                {hoveredLog.log.date.split('-').reverse().join('/')}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--ink-muted)' }}>Duração:</span>
                <strong style={{ color: 'var(--ink-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {Math.floor(hoveredLog.log.hours)}h {Math.round((hoveredLog.log.hours - Math.floor(hoveredLog.log.hours)) * 60)}m ({hoveredLog.log.hours}h)
                </strong>
              </div>
              {hoveredLog.log.bedtime && hoveredLog.log.wake_time && (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                  <span>Horários:</span>
                  <span>{hoveredLog.log.bedtime} → {hoveredLog.log.wake_time}</span>
                </div>
              )}
              {hoveredLog.log.quality && (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', fontSize: '0.75rem', textTransform: 'capitalize' }}>
                  <span style={{ color: 'var(--ink-muted)' }}>Sensação:</span>
                  <span style={{ fontWeight: 600, color: getQualityBadgeColor(hoveredLog.log.quality).text }}>
                    {hoveredLog.log.quality}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* LEGENDA DO GRÁFICO */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', marginTop: '1.25rem', fontSize: '0.75rem', color: 'var(--ink-secondary)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--ink-primary)' }} />
            <span>Horas dormidas na noite</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ display: 'inline-block', width: '20px', height: '2px', backgroundColor: 'var(--accent-terracotta)', borderTop: '2px dashed var(--accent-terracotta)' }} />
            <span>Meta recomendada (8h)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ display: 'inline-block', width: '14px', height: '10px', backgroundColor: 'rgba(78, 99, 72, 0.2)', border: '1px solid var(--accent-sage)', borderRadius: '2px' }} />
            <span>Faixa de repouso ideal (7h a 9h)</span>
          </div>
        </div>
      </div>

      {/* HISTÓRICO DE NOITES REGISTRADAS */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontFamily: 'var(--font-script)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--ink-primary)' }}>
            Diário de Noites Anotadas
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
            Total de {sleepLogs.length} noites gravadas
          </span>
        </div>

        {sleepLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--ink-muted)', backgroundColor: 'var(--bg-paper-card)', border: '1px solid var(--border-paper)', borderRadius: 'var(--radius-md)' }}>
            <Moon size={32} style={{ margin: '0 auto 0.5rem auto', color: 'var(--ink-muted)' }} />
            <p style={{ fontFamily: 'var(--font-script)', fontSize: '1.6rem', color: 'var(--ink-primary)', marginBottom: '0.25rem' }}>
              Nenhuma noite de sono registrada ainda
            </p>
            <p style={{ fontSize: '0.85rem' }}>
              Comece a registrar quantas horas dormiu para visualizar seu gráfico e evolução semanal.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {sleepLogs.map((log) => {
              const qColor = getQualityBadgeColor(log.quality);
              const hInt = Math.floor(log.hours);
              const mInt = Math.round((log.hours - hInt) * 60);

              const dateFormatted = new Date(log.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              });

              return (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1.15rem',
                    backgroundColor: 'var(--bg-paper-white)',
                    border: '1px solid var(--border-paper)',
                    borderRadius: 'var(--radius-md)',
                    gap: '1rem',
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.15rem', flex: 1, minWidth: 0 }}>
                    <div style={{ textAlign: 'center', minWidth: '70px', padding: '0.35rem 0.5rem', backgroundColor: 'var(--bg-paper)', border: '1px solid var(--border-paper)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--ink-primary)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                        {hInt}h{mInt > 0 ? `${mInt}m` : ''}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', marginTop: '0.15rem' }}>
                        {log.hours} horas
                      </div>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--ink-primary)', textTransform: 'capitalize' }}>
                          {dateFormatted}
                        </span>
                        {log.quality && (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              color: qColor.text,
                              backgroundColor: qColor.bg,
                              border: `1px solid ${qColor.border}`,
                              padding: '0.1rem 0.45rem',
                              borderRadius: 'var(--radius-sm)',
                              textTransform: 'capitalize',
                            }}
                          >
                            {log.quality}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.2rem', fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                        {log.bedtime && log.wake_time && (
                          <span>Horário: {log.bedtime} às {log.wake_time}</span>
                        )}
                        {log.notes && (
                          <>
                            <span>·</span>
                            <span style={{ fontStyle: 'italic', color: 'var(--ink-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              "{log.notes}"
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => onEditSleep(log)}
                      title="Editar registro de sono"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => handleDelete(log.id)}
                      title="Excluir registro de sono"
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
    </div>
  );
};
