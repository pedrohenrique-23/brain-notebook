import React, { useState } from 'react';
import { Note, NoteColor, NoteType } from '../../types';
import { X, Pin } from 'lucide-react';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (noteData: Omit<Note, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => void;
  noteToEdit?: Note | null;
  userId: string;
}

const COLOR_OPTIONS: { id: NoteColor; label: string; bg: string }[] = [
  { id: 'sand', label: 'Areia', bg: '#FAF5EB' },
  { id: 'yellow', label: 'Amarelo', bg: '#FCF5C7' },
  { id: 'green', label: 'Verde', bg: '#E8F5E9' },
  { id: 'blue', label: 'Azul', bg: '#E8F1F5' },
  { id: 'peach', label: 'Pêssego', bg: '#FAECE5' },
  { id: 'purple', label: 'Lavanda', bg: '#F3EAF7' },
];

export const NoteModal: React.FC<NoteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  noteToEdit,
  userId,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState(noteToEdit?.title || '');
  const [content, setContent] = useState(noteToEdit?.content || '');
  const [color, setColor] = useState<NoteColor>(noteToEdit?.color || 'sand');
  const [type, setType] = useState<NoteType>(noteToEdit?.type || 'paper');
  const [isPinned, setIsPinned] = useState(noteToEdit?.is_pinned || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;

    onSave({
      id: noteToEdit?.id,
      user_id: userId,
      title: title.trim() || 'Sem título',
      content: content.trim(),
      color,
      type,
      is_pinned: isPinned,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-sheet-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 className="modal-sheet-title">
              {noteToEdit ? 'Editar Anotação' : 'Nova Anotação'}
            </h2>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setIsPinned(!isPinned)}
              title={isPinned ? 'Desafixar nota' : 'Fixar no topo'}
              style={{ color: isPinned ? 'var(--accent-terracotta)' : 'var(--ink-muted)' }}
            >
              <Pin size={18} style={{ transform: isPinned ? 'rotate(45deg)' : 'none' }} />
            </button>
          </div>
          <button type="button" className="btn-ghost" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-sheet-body">
            <div className="form-group">
              <label className="form-label">Título da Folha</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Ideias para o projeto, Insights do dia..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Conteúdo da Anotação</label>
              <textarea
                className="form-textarea"
                placeholder="Escreva livremente aqui..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Estilo da Folha</label>
                <select
                  className="form-select"
                  value={type}
                  onChange={(e) => setType(e.target.value as NoteType)}
                >
                  <option value="paper">Folha de Caderno (Paper)</option>
                  <option value="postit">Post-it Adesivo</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Tom do Papel</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setColor(c.id)}
                      title={c.label}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '4px',
                        backgroundColor: c.bg,
                        border: color === c.id ? '2px solid var(--ink-primary)' : '1px solid var(--border-paper-dark)',
                        cursor: 'pointer',
                        transform: color === c.id ? 'scale(1.15)' : 'scale(1)',
                        transition: 'transform 0.15s ease',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-sheet-footer">
            <button type="button" className="btn-ink-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-ink-primary">
              {noteToEdit ? 'Atualizar Nota' : 'Guardar Nota'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
