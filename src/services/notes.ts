import { supabase } from '../lib/supabase';
import { Note } from '../types';
import { EntityInput, fromDbRow, nowIso, requireUserId, toDbPayload, toError } from './supabaseHelpers';

const NOTES_TABLE = 'notes';

export type NoteInput = EntityInput<Note>;

// content é opcional no banco, mas a UI trata como string
function toNote(row: Record<string, unknown>): Note {
  const note = fromDbRow<Note>(row);
  return { ...note, content: note.content ?? '' };
}

// ==========================================================================
// CRUD ANOTAÇÕES (Supabase)
// ==========================================================================

export async function fetchNotes(): Promise<Note[]> {
  try {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from(NOTES_TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(toNote);
  } catch (err) {
    throw toError('carregar anotações', err);
  }
}

export async function saveNote(note: NoteInput): Promise<Note> {
  const { id, ...fields } = note;

  try {
    if (id) {
      const { data, error } = await supabase
        .from(NOTES_TABLE)
        .update({ ...toDbPayload(fields), updated_at: nowIso() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return toNote(data);
    }

    const userId = await requireUserId();
    const { data, error } = await supabase
      .from(NOTES_TABLE)
      .insert({ ...toDbPayload(fields), user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return toNote(data);
  } catch (err) {
    throw toError(id ? 'atualizar anotação' : 'criar anotação', err);
  }
}

export async function deleteNote(noteId: string): Promise<void> {
  try {
    const { error } = await supabase.from(NOTES_TABLE).delete().eq('id', noteId);
    if (error) throw error;
  } catch (err) {
    throw toError('excluir anotação', err);
  }
}

export async function setNotePinned(noteId: string, isPinned: boolean): Promise<Note> {
  try {
    const { data, error } = await supabase
      .from(NOTES_TABLE)
      .update({ is_pinned: isPinned, updated_at: nowIso() })
      .eq('id', noteId)
      .select()
      .single();

    if (error) throw error;
    return toNote(data);
  } catch (err) {
    throw toError('fixar anotação', err);
  }
}
