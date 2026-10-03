import React, { useState } from 'react';
import { Goal, GoalCategory, GoalStatus, GoalTimeframe } from '../../types';
import { X, Image as ImageIcon } from 'lucide-react';

import dreamCarImg from '../../assets/images/vision_dream_car_1790983448951.jpg';
import mountainCabinImg from '../../assets/images/vision_mountain_cabin_1790983459005.jpg';
import studyDeskImg from '../../assets/images/vision_study_desk_1790983469118.jpg';
import gardenHouseImg from '../../assets/images/vision_garden_house_1790983478513.jpg';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goalData: Omit<Goal, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => void;
  goalToEdit?: Goal | null;
  userId: string;
}

const PRESET_IMAGES = [
  { label: 'Carro dos Sonhos', url: dreamCarImg },
  { label: 'Cabana nas Montanhas', url: mountainCabinImg },
  { label: 'Estudo / Setup', url: studyDeskImg },
  { label: 'Casa com Jardim', url: gardenHouseImg },
];

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  goalToEdit,
  userId,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState(goalToEdit?.title || '');
  const [description, setDescription] = useState(goalToEdit?.description || '');
  const [category, setCategory] = useState<GoalCategory>(goalToEdit?.category || 'Pessoal');
  const [timeframe, setTimeframe] = useState<GoalTimeframe>(goalToEdit?.timeframe || 'medio');
  const [targetValue, setTargetValue] = useState<string>(goalToEdit?.target_value?.toString() || '');
  const [currentValue, setCurrentValue] = useState<string>(goalToEdit?.current_value?.toString() || '0');
  const [unit, setUnit] = useState(goalToEdit?.unit || 'R$');
  const [deadline, setDeadline] = useState(goalToEdit?.deadline || '');
  const [status, setStatus] = useState<GoalStatus>(goalToEdit?.status || 'active');
  const [imageUrl, setImageUrl] = useState(goalToEdit?.image_url || dreamCarImg);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      id: goalToEdit?.id,
      user_id: userId,
      title: title.trim(),
      description: description.trim(),
      type: category.toLowerCase(),
      category,
      timeframe,
      target_value: targetValue ? Number(targetValue) : undefined,
      current_value: currentValue ? Number(currentValue) : 0,
      unit,
      deadline: deadline || undefined,
      status,
      image_url: imageUrl,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-sheet-header">
          <h2 className="modal-sheet-title">
            {goalToEdit ? 'Editar Meta / Sonho' : 'Nova Meta do Caderno'}
          </h2>
          <button type="button" className="btn-ghost" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-sheet-body">
            <div className="form-group">
              <label className="form-label">Título do Objetivo / Sonho *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Meu Primeiro Carro, Viagem em Família, Reserva de R$ 10.000"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Categoria</label>
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as GoalCategory)}
                >
                  <option value="Pessoal">Pessoal</option>
                  <option value="Financeira">Financeira</option>
                  <option value="Profissional">Profissional</option>
                  <option value="Estudos">Estudos</option>
                  <option value="Saúde">Saúde</option>
                  <option value="Espiritual">Espiritual</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Prazo</label>
                <select
                  className="form-select"
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value as GoalTimeframe)}
                >
                  <option value="curto">Curto Prazo (até 6 meses)</option>
                  <option value="medio">Médio Prazo (6 meses a 2 anos)</option>
                  <option value="longo">Longo Prazo (2+ anos)</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Valor Atual</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  placeholder="0"
                  value={currentValue}
                  onChange={(e) => setCurrentValue(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Valor Alvo</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  placeholder="Ex: 45000"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Unidade de Medida</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: R$, livros, horas, km"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Data Limite Desejada</label>
                <input
                  type="date"
                  className="form-input"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Foto para o Vision Board (Mural de Sonhos)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {PRESET_IMAGES.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setImageUrl(img.url)}
                    style={{
                      border: imageUrl === img.url ? '2px solid var(--ink-primary)' : '1px solid var(--border-paper)',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      height: '56px',
                      padding: 0,
                      position: 'relative',
                    }}
                  >
                    <img src={img.url} alt={img.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
              <input
                type="text"
                className="form-input"
                placeholder="Ou cole a URL de uma imagem personalizada"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Descrição / Por que você quer alcançar isso?</label>
              <textarea
                className="form-textarea"
                placeholder="Detalhes sobre a meta, motivação e plano de ação..."
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
              {goalToEdit ? 'Atualizar Meta' : 'Fixar Meta no Caderno'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
