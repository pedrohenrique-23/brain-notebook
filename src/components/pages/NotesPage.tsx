import React, { useState } from 'react';
import { Note, NoteType } from '../../types';
import { Plus, Search, Pin, Edit2, Trash2 } from 'lucide-react';
import { deleteNote, setNotePinned } from '../../services/notes';

interface NotesPageProps {
  notes: Note[];
  isLoading?: boolean;
  error?: string | null;
  onOpenNewNote: () => void;
  onEditNote: (note: Note) => void;
  onDataRefresh: () => void | Promise<void>;
}

export const NotesPage: React.FC<NotesPageProps> = ({
  notes,
  isLoading = false,
  error = null,
  onOpenNewNote,
  onEditNote,
  onDataRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | NoteType>('all');

  const handleTogglePin = async (note: Note) => {
    try {
      await setNotePinned(note.id, !note.is_pinned);
      await onDataRefresh();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Erro ao fixar anotação.');
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!window.confirm('Deseja descartar esta anotação do caderno?')) return;
    try {
      await deleteNote(noteId);
      await onDataRefresh();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Erro ao excluir anotação.');
    }
  };

  const filteredNotes = notes.filter((n) => {
    if (typeFilter !== 'all' && n.type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inTitle = n.title.toLowerCase().includes(q);
      const inContent = n.content.toLowerCase().includes(q);
      return inTitle || inContent;
    }
    return true;
  });

  // Ordenar notas fixadas primeiro
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="page-sheet">
      <div className="journal-header">
        <div>
          <div className="journal-date-badge">FOLHAS & POST-ITS</div>
          <h1 className="journal-heading-script">Anotações do Caderno</h1>
        </div>
        <div className="journal-header-actions">
          <button className="btn-ink-primary" onClick={onOpenNewNote}>
            <Plus size={16} /> Nova Anotação
          </button>
        </div>
      </div>

      {/* BARRA DE PESQUISA E FILTROS */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px', maxWidth: '380px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Pesquisar anotações..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '32px', width: '100%' }}
          />
        </div>

        <div className="filter-bar" style={{ margin: 0, padding: 0, border: 'none' }}>
          <button
            className={`filter-tab-btn ${typeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setTypeFilter('all')}
          >
            Todas ({notes.length})
          </button>
          <button
            className={`filter-tab-btn ${typeFilter === 'paper' ? 'active' : ''}`}
            onClick={() => setTypeFilter('paper')}
          >
            Folhas de Caderno
          </button>
          <button
            className={`filter-tab-btn ${typeFilter === 'postit' ? 'active' : ''}`}
            onClick={() => setTypeFilter('postit')}
          >
            Post-its
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" style={{ color: 'var(--accent-terracotta)', fontSize: '0.85rem', padding: '0.75rem 0' }}>
          {error}
        </p>
      )}

      {/* GRID DE NOTAS */}
      {isLoading && notes.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--ink-muted)', fontStyle: 'italic' }}>
          Carregando anotações...
        </p>
      ) : sortedNotes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--ink-muted)' }}>
          <p style={{ fontFamily: 'var(--font-script)', fontSize: '1.8rem', marginBottom: '0.5rem', color: 'var(--ink-secondary)' }}>
            Nenhuma folha encontrada
          </p>
          <p style={{ fontSize: '0.85rem' }}>
            {searchQuery ? 'Tente buscar com outras palavras-chave.' : 'Crie sua primeira folha de ideias ou post-it adesivo.'}
          </p>
        </div>
      ) : (
        <div className="notes-grid">
          {sortedNotes.map((note) => (
            <div key={note.id} className={`note-card note-${note.color}`}>
              {/* Fita washi tape se for estilo post-it */}
              {note.type === 'postit' && <div className="note-washi-tape" />}

              <div className="note-header">
                <h3 className="note-title">{note.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => handleTogglePin(note)}
                    title={note.is_pinned ? 'Desafixar nota' : 'Fixar nota no topo'}
                    style={{ color: note.is_pinned ? 'var(--accent-terracotta)' : 'var(--ink-muted)', padding: '0.2rem' }}
                  >
                    <Pin size={15} style={{ transform: note.is_pinned ? 'rotate(45deg)' : 'none' }} />
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => onEditNote(note)}
                    title="Editar anotação"
                    style={{ padding: '0.2rem' }}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => handleDelete(note.id)}
                    title="Excluir folha"
                    style={{ padding: '0.2rem' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="note-content">{note.content}</div>

              <div className="note-footer">
                <span>{note.type === 'postit' ? 'Post-it' : 'Folha Pautada'}</span>
                <span>
                  {new Date(note.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
