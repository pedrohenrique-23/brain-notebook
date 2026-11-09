import React, { useState } from 'react';
import { Note, NoteColor, NoteType } from '../../types';
import { X, Pin, Plus, Check, ListChecks } from 'lucide-react';
import { parseChecklistContent, serializeChecklistItems, ChecklistItem } from '../../services/notes';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (noteData: Omit<Note, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => void | Promise<void>;
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

  const initialType: NoteType = noteToEdit?.type || 'paper';
  const initialContent = noteToEdit?.content || '';

  const [title, setTitle] = useState(noteToEdit?.title || '');
  const [content, setContent] = useState(initialContent);
  const [color, setColor] = useState<NoteColor>(noteToEdit?.color || 'sand');
  const [type, setType] = useState<NoteType>(initialType);
  const [isPinned, setIsPinned] = useState(noteToEdit?.is_pinned || false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Estado para itens de checklist
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(() => {
    if (initialType === 'checklist' || initialContent.includes('[ ]') || initialContent.includes('[x]')) {
      return parseChecklistContent(initialContent);
    }
    return [];
  });
  const [newItemText, setNewItemText] = useState('');
  const [rawTextMode, setRawTextMode] = useState(false);

  // Adicionar item à lista
  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    const newItem: ChecklistItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      text: newItemText.trim(),
      checked: false,
    };
    setChecklistItems((prev) => [...prev, newItem]);
    setNewItemText('');
  };

  const handleToggleItemCheck = (id: string) => {
    setChecklistItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    setChecklistItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleTypeChange = (newType: NoteType) => {
    if (newType === 'checklist' && type !== 'checklist') {
      // Se estava em texto, converte linhas para itens de checklist
      if (content.trim()) {
        const parsed = parseChecklistContent(content);
        if (parsed.length > 0) {
          setChecklistItems(parsed);
        }
      }
    } else if (newType !== 'checklist' && type === 'checklist') {
      // Se estava em checklist e mudou para folha/post-it, atualiza texto
      if (checklistItems.length > 0) {
        setContent(serializeChecklistItems(checklistItems));
      }
    }
    setType(newType);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalContent = content.trim();
    if (type === 'checklist' && !rawTextMode) {
      finalContent = serializeChecklistItems(checklistItems);
      if (!title.trim() && !finalContent) return;
    } else {
      if (!title.trim() && !finalContent) return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave({
        id: noteToEdit?.id,
        user_id: userId,
        title: title.trim() || 'Sem título',
        content: finalContent,
        color,
        type,
        is_pinned: isPinned,
      });
      onClose();
    } catch (err) {
      console.error(err);
      setSaveError(err instanceof Error ? err.message : 'Erro ao guardar anotação.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modal-sheet-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 className="modal-sheet-title">
              {noteToEdit
                ? type === 'checklist'
                  ? 'Editar Checklist'
                  : 'Editar Anotação'
                : type === 'checklist'
                ? 'Nova Lista de Checklist'
                : 'Nova Anotação'}
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
                placeholder={
                  type === 'checklist'
                    ? 'Ex: Mercado da semana, Itens para viagem...'
                    : 'Ex: Ideias para o projeto, Insights do dia...'
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>

            {/* SE FOR CHECKLIST */}
            {type === 'checklist' && !rawTextMode ? (
              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    Itens do Checklist
                  </label>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => {
                      setContent(serializeChecklistItems(checklistItems));
                      setRawTextMode(true);
                    }}
                    style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', textDecoration: 'underline' }}
                  >
                    Editar texto livre
                  </button>
                </div>

                {/* Input de Novo Item */}
                <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '0.75rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Adicionar novo item à lista..."
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddItem();
                      }
                    }}
                    style={{ fontSize: '0.85rem' }}
                  />
                  <button
                    type="button"
                    className="btn-ink-secondary"
                    onClick={handleAddItem}
                    style={{ fontSize: '0.8rem', padding: '0 0.85rem', whiteSpace: 'nowrap' }}
                  >
                    <Plus size={14} /> Adicionar
                  </button>
                </div>

                {/* Lista de itens existentes */}
                <div
                  style={{
                    maxHeight: '220px',
                    overflowY: 'auto',
                    border: '1px solid var(--border-paper)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.5rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.45)',
                  }}
                >
                  {checklistItems.length === 0 ? (
                    <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--ink-muted)', padding: '1rem 0', margin: 0 }}>
                      Nenhum item adicionado ainda. Digite acima e pressione Enter.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {checklistItems.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.5rem',
                            padding: '0.35rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: item.checked ? 'rgba(0,0,0,0.03)' : 'var(--bg-paper-white)',
                            border: '1px solid rgba(0,0,0,0.04)',
                          }}
                        >
                          <div
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0, cursor: 'pointer' }}
                            onClick={() => handleToggleItemCheck(item.id)}
                          >
                            <button
                              type="button"
                              className={`checklist-box-btn ${item.checked ? 'checked' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleItemCheck(item.id);
                              }}
                              style={{ flexShrink: 0 }}
                            >
                              {item.checked && <Check size={12} strokeWidth={3} />}
                            </button>
                            <span
                              style={{
                                fontSize: '0.85rem',
                                color: item.checked ? 'var(--ink-muted)' : 'var(--ink-primary)',
                                textDecoration: item.checked ? 'line-through' : 'none',
                                wordBreak: 'break-word',
                              }}
                            >
                              {item.text}
                            </span>
                          </div>

                          <button
                            type="button"
                            className="btn-ghost"
                            onClick={() => handleRemoveItem(item.id)}
                            title="Remover item"
                            style={{ padding: '0.2rem', color: 'var(--ink-muted)' }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* SE FOR TEXTO OU CHECKLIST EM MODO TEXTO */
              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    Conteúdo da Anotação
                  </label>
                  {type === 'checklist' && (
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => {
                        const parsed = parseChecklistContent(content);
                        setChecklistItems(parsed);
                        setRawTextMode(false);
                      }}
                      style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', textDecoration: 'underline' }}
                    >
                      Voltar ao modo visual
                    </button>
                  )}
                </div>
                <textarea
                  className="form-textarea"
                  placeholder={
                    type === 'checklist'
                      ? '- [ ] Item 1\n- [ ] Item 2\n- [x] Item concluído'
                      : 'Escreva livremente aqui...'
                  }
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                />
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Estilo da Folha</label>
                <select
                  className="form-select"
                  value={type}
                  onChange={(e) => handleTypeChange(e.target.value as NoteType)}
                >
                  <option value="paper">Folha de Caderno</option>
                  <option value="postit">Post-it Adesivo</option>
                  <option value="checklist">Lista / Checklist</option>
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
              {isSaving ? 'Guardando...' : noteToEdit ? 'Atualizar Nota' : 'Guardar Nota'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
