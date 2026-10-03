import React, { useState } from 'react';
import { Habit, HabitTargetType } from '../../types';
import { X } from 'lucide-react';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habitData: Omit<Habit, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => void;
  habitToEdit?: Habit | null;
  userId: string;
}

export const HabitModal: React.FC<HabitModalProps> = ({
  isOpen,
  onClose,
  onSave,
  habitToEdit,
  userId,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(habitToEdit?.name || '');
  const [description, setDescription] = useState(habitToEdit?.description || '');
  const [targetType, setTargetType] = useState<HabitTargetType>(habitToEdit?.target_type || 'sequence');
  const [target, setTarget] = useState<number>(habitToEdit?.target || 3);
  const [unit, setUnit] = useState<string>(habitToEdit?.unit || 'dias consecutivos');
  const [frequency, setFrequency] = useState(habitToEdit?.frequency || 'Meta semanal');
  const [startDate, setStartDate] = useState(habitToEdit?.start_date || new Date().toISOString().split('T')[0]);

  // Ajustar unidade sugerida com base no tipo de meta
  const handleTypeChange = (type: HabitTargetType) => {
    setTargetType(type);
    if (type === 'sequence') {
      setUnit('dias consecutivos');
      setFrequency('Dias seguidos');
    } else if (type === 'frequency') {
      setUnit('vezes por semana');
      setFrequency('Semanal');
    } else if (type === 'quantity') {
      setUnit('Litros/unidades');
      setFrequency('Meta diária');
    } else if (type === 'duration') {
      setUnit('minutos por dia');
      setFrequency('Meta diária');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: habitToEdit?.id,
      user_id: userId,
      name: name.trim(),
      description: description.trim(),
      frequency,
      target: Number(target) || 1,
      target_type: targetType,
      unit,
      start_date: startDate,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-sheet-header">
          <h2 className="modal-sheet-title">
            {habitToEdit ? 'Editar Hábito' : 'Novo Hábito'}
          </h2>
          <button type="button" className="btn-ghost" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-sheet-body">
            <div className="form-group">
              <label className="form-label">Nome do Hábito *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Ler a Bíblia, Beber 2L de água, Caminhar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tipo de Meta do Hábito</label>
              <select
                className="form-select"
                value={targetType}
                onChange={(e) => handleTypeChange(e.target.value as HabitTargetType)}
              >
                <option value="sequence">Sequência (ex: 3 dias consecutivos)</option>
                <option value="frequency">Frequência (ex: 4 vezes por semana)</option>
                <option value="quantity">Quantidade (ex: 2 Litros por dia)</option>
                <option value="duration">Duração (ex: 30 minutos por dia)</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Meta Numérica</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={target}
                  onChange={(e) => setTarget(Math.max(1, parseInt(e.target.value) || 1))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Unidade / Rótulo</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: dias seguidos, L, min, vezes"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Frequência Resumida</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: 3 dias seguidos na semana"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Data de Início</label>
                <input
                  type="date"
                  className="form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Motivação / Detalhes</label>
              <textarea
                className="form-textarea"
                placeholder="Por que este hábito é importante para o seu crescimento pessoal?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <div className="modal-sheet-footer">
            <button type="button" className="btn-ink-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-ink-primary">
              {habitToEdit ? 'Salvar Hábito' : 'Criar Hábito'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
