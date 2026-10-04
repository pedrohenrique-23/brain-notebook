import React, { useState, useEffect } from 'react';
import { SleepLog, SleepQuality } from '../../types';
import { X, Moon, Clock } from 'lucide-react';
import { getTodayDateString } from '../../services/storage';

interface SleepModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sleepData: Omit<SleepLog, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => void | Promise<void>;
  sleepToEdit?: SleepLog | null;
  userId: string;
}

const QUALITY_OPTIONS: { id: SleepQuality; label: string; desc: string }[] = [
  { id: 'excelente', label: 'Excelente', desc: 'Acordei renovado e revigorado' },
  { id: 'bom', label: 'Bom', desc: 'Noite tranquila e restauradora' },
  { id: 'regular', label: 'Regular', desc: 'Sono interrompido ou leve' },
  { id: 'ruim', label: 'Ruim', desc: 'Pouco descanso ou insônia' },
];

const PRESET_HOURS = [6, 6.5, 7, 7.5, 8, 8.5, 9];

export const SleepModal: React.FC<SleepModalProps> = ({
  isOpen,
  onClose,
  onSave,
  sleepToEdit,
  userId,
}) => {
  if (!isOpen) return null;

  const [date, setDate] = useState(sleepToEdit?.date || getTodayDateString());
  const [hours, setHours] = useState<number>(sleepToEdit?.hours || 8);
  const [bedtime, setBedtime] = useState(sleepToEdit?.bedtime || '23:00');
  const [wakeTime, setWakeTime] = useState(sleepToEdit?.wake_time || '07:00');
  const [quality, setQuality] = useState<SleepQuality>(sleepToEdit?.quality || 'bom');
  const [notes, setNotes] = useState(sleepToEdit?.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Atualizar cálculo automático de horas se bedtime e wakeTime mudarem
  const calculateHoursFromTimes = (bed: string, wake: string) => {
    if (!bed || !wake) return null;
    const [bH, bM] = bed.split(':').map(Number);
    const [wH, wM] = wake.split(':').map(Number);
    if (isNaN(bH) || isNaN(bM) || isNaN(wH) || isNaN(wM)) return null;

    let bedMinutes = bH * 60 + bM;
    let wakeMinutes = wH * 60 + wM;

    // Se a hora de acordar for menor ou igual à hora de dormir, cruzou meia-noite
    if (wakeMinutes <= bedMinutes) {
      wakeMinutes += 24 * 60;
    }

    const diffMinutes = wakeMinutes - bedMinutes;
    const calculated = Number((diffMinutes / 60).toFixed(1));
    return calculated > 0 && calculated <= 24 ? calculated : null;
  };

  const handleBedtimeChange = (newBed: string) => {
    setBedtime(newBed);
    const calc = calculateHoursFromTimes(newBed, wakeTime);
    if (calc !== null) {
      setHours(calc);
    }
  };

  const handleWakeTimeChange = (newWake: string) => {
    setWakeTime(newWake);
    const calc = calculateHoursFromTimes(bedtime, newWake);
    if (calc !== null) {
      setHours(calc);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave({
        id: sleepToEdit?.id,
        user_id: userId,
        date,
        hours: Number(hours) || 0,
        bedtime: bedtime || undefined,
        wake_time: wakeTime || undefined,
        quality,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error(err);
      setSaveError(err instanceof Error ? err.message : 'Erro ao guardar registro de sono.');
    } finally {
      setIsSaving(false);
    }
  };

  const hoursInt = Math.floor(hours);
  const minutesInt = Math.round((hours - hoursInt) * 60);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-sheet-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Moon size={20} style={{ color: 'var(--accent-terracotta)' }} />
            <h2 className="modal-sheet-title">
              {sleepToEdit ? 'Editar Noite de Sono' : 'Registrar Sono da Noite'}
            </h2>
          </div>
          <button type="button" className="btn-ghost" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-sheet-body">
            <div className="form-group">
              <label className="form-label">Data da Noite *</label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            {/* SELEÇÃO E CONTROLE DE HORAS */}
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <label className="form-label">Duração do Sono *</label>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {hoursInt}h {minutesInt > 0 ? `${minutesInt}m` : ''} ({hours}h)
                </span>
              </div>

              {/* Botões rápidos de horas */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                {PRESET_HOURS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHours(h)}
                    style={{
                      padding: '0.35rem 0.65rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-sm)',
                      border: hours === h ? '1px solid var(--ink-primary)' : '1px solid var(--border-paper)',
                      backgroundColor: hours === h ? 'var(--ink-primary)' : 'var(--bg-paper-card)',
                      color: hours === h ? '#FFFFFF' : 'var(--ink-primary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {h}h
                  </button>
                ))}
              </div>

              {/* Slider de ajuste fino */}
              <input
                type="range"
                min="3"
                max="14"
                step="0.25"
                value={hours}
                onChange={(e) => setHours(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--ink-primary)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--ink-muted)', marginTop: '0.2rem' }}>
                <span>3h</span>
                <span>Meta ideal (7h - 9h)</span>
                <span>14h</span>
              </div>
            </div>

            {/* HORÁRIOS OPCIONAIS: DORMIR E ACORDAR */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Clock size={13} /> Deitou-se
                </label>
                <input
                  type="time"
                  className="form-input"
                  value={bedtime}
                  onChange={(e) => handleBedtimeChange(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Clock size={13} /> Despertou
                </label>
                <input
                  type="time"
                  className="form-input"
                  value={wakeTime}
                  onChange={(e) => handleWakeTimeChange(e.target.value)}
                />
              </div>
            </div>

            {/* QUALIDADE DO SONO */}
            <div className="form-group">
              <label className="form-label">Como você se sentiu ao acordar?</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {QUALITY_OPTIONS.map((q) => {
                  const isSelected = quality === q.id;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setQuality(q.id)}
                      style={{
                        padding: '0.65rem 0.85rem',
                        textAlign: 'left',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected ? '1.5px solid var(--ink-primary)' : '1px solid var(--border-paper)',
                        backgroundColor: isSelected ? 'var(--bg-paper-white)' : 'var(--bg-paper-card)',
                        boxShadow: isSelected ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: isSelected ? 'var(--ink-primary)' : 'var(--ink-secondary)' }}>
                        {q.label}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', marginTop: '0.15rem', lineHeight: 1.2 }}>
                        {q.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* OBSERVAÇÕES / DIÁRIO DO SONO */}
            <div className="form-group">
              <label className="form-label">Anotações do Diário de Sono</label>
              <textarea
                className="form-textarea"
                placeholder="Ex: Tomei café tarde, li 20 páginas antes de dormir, acordei no meio da noite..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {saveError && (
            <p role="alert" style={{ color: 'var(--accent-terracotta)', fontSize: '0.8rem', padding: '0 1.5rem 0.75rem' }}>
              {saveError}
            </p>
          )}

          <div className="modal-sheet-footer">
            <button type="button" className="btn-ink-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-ink-primary" disabled={isSaving}>
              {isSaving ? 'Guardando...' : sleepToEdit ? 'Atualizar Noite' : 'Registrar Sono'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
