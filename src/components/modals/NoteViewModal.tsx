import React from 'react';
import { Note } from '../../types';
import { X, Pin, Edit2, Trash2, Check, CheckSquare } from 'lucide-react';
import { parseChecklistContent, serializeChecklistItems, isChecklistNote } from '../../services/notes';

interface NoteViewModalProps {
  isOpen: boolean;
  note: Note | null;
  onClose: () => void;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
  onTogglePin: (note: Note) => void;
  onUpdateNoteContent?: (note: Note, newContent: string) => Promise<void>;
}

export const NoteViewModal: React.FC<NoteViewModalProps> = ({
  isOpen,
  note,
  onClose,
  onEdit,
  onDelete,
  onTogglePin,
  onUpdateNoteContent,
}) => {
  if (!isOpen || !note) return null;

  const isChecklist = isChecklistNote(note);
  const checklistItems = isChecklist ? parseChecklistContent(note.content) : [];
  const completedCount = checklistItems.filter((i) => i.checked).length;

  const handleToggleItem = async (index: number) => {
    if (!onUpdateNoteContent) return;
    const updated = [...checklistItems];
    updated[index] = { ...updated[index], checked: !updated[index].checked };
    const newContent = serializeChecklistItems(updated);
    try {
      await onUpdateNoteContent(note, newContent);
    } catch (err) {
      console.error(err);
    }
  };

  const getStyleLabel = () => {
    if (note.type === 'checklist' || isChecklist) return 'Lista / Checklist';
    if (note.type === 'postit') return 'Post-it Adesivo';
    return 'Folha de Caderno';
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`modal-sheet note-view-sheet note-${note.color}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '560px',
          width: '92%',
          position: 'relative',
          padding: '2rem 2.25rem 1.75rem',
        }}
      >
        {/* Washi tape no topo se for post-it ou checklist */}
        {(note.type === 'postit' || note.type === 'checklist') && (
          <div className="note-washi-tape" style={{ top: '-10px' }} />
        )}

        {/* CABEÇALHO */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '1rem',
            marginBottom: '1.25rem',
            paddingBottom: '0.85rem',
            borderBottom: '1px dashed rgba(120, 110, 95, 0.25)',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.35rem',
                fontSize: '0.72rem',
                color: 'var(--ink-muted)',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              <span>{getStyleLabel()}</span>
              <span>&bull;</span>
              <span>
                {new Date(note.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-script)',
                fontSize: '2.1rem',
                fontWeight: 700,
                color: 'var(--ink-primary)',
                lineHeight: 1.15,
                wordBreak: 'break-word',
              }}
            >
              {note.title}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => onTogglePin(note)}
              title={note.is_pinned ? 'Desafixar nota' : 'Fixar no topo'}
              style={{
                color: note.is_pinned ? 'var(--accent-terracotta)' : 'var(--ink-muted)',
                padding: '0.35rem',
              }}
            >
              <Pin size={18} style={{ transform: note.is_pinned ? 'rotate(45deg)' : 'none' }} />
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                onClose();
                onEdit(note);
              }}
              title="Editar esta anotação"
              style={{ padding: '0.35rem' }}
            >
              <Edit2 size={16} />
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                onClose();
                onDelete(note.id);
              }}
              title="Excluir do caderno"
              style={{ padding: '0.35rem' }}
            >
              <Trash2 size={16} />
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={onClose}
              aria-label="Fechar"
              style={{ padding: '0.35rem' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* CORPO DA NOTA */}
        <div
          style={{
            maxHeight: '52vh',
            overflowY: 'auto',
            paddingRight: '0.5rem',
            marginRight: '-0.5rem',
          }}
        >
          {isChecklist ? (
            <div>
              {checklistItems.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.78rem',
                    color: 'var(--ink-muted)',
                    marginBottom: '0.85rem',
                    paddingBottom: '0.45rem',
                    borderBottom: '1px dotted rgba(120, 110, 95, 0.2)',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckSquare size={14} /> Itens da lista
                  </span>
                  <span>
                    <strong>{completedCount}</strong> de {checklistItems.length} concluídos
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {checklistItems.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => handleToggleItem(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.65rem',
                      cursor: 'pointer',
                      padding: '0.35rem 0.45rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: item.checked ? 'rgba(0,0,0,0.02)' : 'transparent',
                      transition: 'background-color 0.12s ease',
                    }}
                  >
                    <button
                      type="button"
                      className={`checklist-box-btn ${item.checked ? 'checked' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleItem(idx);
                      }}
                      style={{ marginTop: '2px', flexShrink: 0 }}
                      aria-label={item.checked ? 'Desmarcar item' : 'Marcar item'}
                    >
                      {item.checked && <Check size={12} strokeWidth={3} />}
                    </button>
                    <span
                      style={{
                        fontSize: '0.92rem',
                        lineHeight: 1.45,
                        color: item.checked ? 'var(--ink-muted)' : 'var(--ink-primary)',
                        textDecoration: item.checked ? 'line-through' : 'none',
                        wordBreak: 'break-word',
                      }}
                    >
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              style={{
                fontSize: '0.95rem',
                lineHeight: 1.65,
                color: 'var(--ink-primary)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: 'inherit',
              }}
            >
              {note.content}
            </div>
          )}
        </div>

        {/* RODAPÉ DO MODAL */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '1.5rem',
            paddingTop: '0.85rem',
            borderTop: '1px dashed rgba(120, 110, 95, 0.25)',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
            Clique fora ou aperte Fechar para voltar
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn-ink-secondary"
              onClick={() => {
                onClose();
                onEdit(note);
              }}
              style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem' }}
            >
              <Edit2 size={13} /> Editar
            </button>
            <button
              type="button"
              className="btn-ink-primary"
              onClick={onClose}
              style={{ fontSize: '0.82rem', padding: '0.4rem 0.95rem' }}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
