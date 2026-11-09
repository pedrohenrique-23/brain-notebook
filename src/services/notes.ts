import { supabase } from '../lib/supabase';
import { Note } from '../types';
import { EntityInput, fromDbRow, nowIso, requireUserId, toDbPayload, toError } from './supabaseHelpers';

const NOTES_TABLE = 'notes';

export type NoteInput = EntityInput<Note>;

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export function parseChecklistContent(content: string): ChecklistItem[] {
  if (!content) return [];
  const lines = content.split('\n');
  const items: ChecklistItem[] = [];
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const match = trimmed.match(/^[-*]?\s*\[([ xX])\]\s*(.*)$/);
    if (match) {
      items.push({
        id: `chk-${index}`,
        checked: match[1].toLowerCase() === 'x',
        text: match[2].trim(),
      });
    } else {
      items.push({
        id: `chk-${index}`,
        checked: false,
        text: trimmed.replace(/^[-*]\s*/, ''),
      });
    }
  });
  return items;
}

export function serializeChecklistItems(items: ChecklistItem[]): string {
  return items.map((item) => `[${item.checked ? 'x' : ' '}] ${item.text.trim()}`).join('\n');
}

export function isChecklistNote(note: Note): boolean {
  if (note.type === 'checklist') return true;
  if (!note.content) return false;
  const lines = note.content.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length === 0) return false;
  return lines.every((l) => /^[-*]?\s*\[([ xX])\]/.test(l.trim()));
}

// content é opcional no banco, mas a UI trata como string
function toNote(row: Record<string, unknown>): Note {
  const note = fromDbRow<Note>(row);
  const content = note.content ?? '';
  // Se o conteúdo é explicitamente checklist e type veio 'paper', preserva tipo checklist
  const lines = content.split('\n').filter((l) => l.trim().length > 0);
  const appearsChecklist = lines.length > 0 && lines.every((l) => /^[-*]?\s*\[([ xX])\]/.test(l.trim()));
  const finalType = note.type === 'checklist' || appearsChecklist ? 'checklist' : note.type || 'paper';

  return { ...note, content, type: finalType };
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
  const isChecklist = fields.type === 'checklist';

  try {
    if (id) {
      const { data, error } = await supabase
        .from(NOTES_TABLE)
        .update({ ...toDbPayload(fields), updated_at: nowIso() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        // Se houver restrição no banco remoto contra 'checklist', armazena como 'paper'
        if (isChecklist && (error.message?.includes('violates check constraint') || error.code === '23514')) {
          const fallbackFields = { ...fields, type: 'paper' as const };
          const { data: retryData, error: retryError } = await supabase
            .from(NOTES_TABLE)
            .update({ ...toDbPayload(fallbackFields), updated_at: nowIso() })
            .eq('id', id)
            .select()
            .single();
          if (retryError) throw retryError;
          return { ...toNote(retryData), type: 'checklist' };
        }
        throw error;
      }
      return toNote(data);
    }

    const userId = await requireUserId();
    const { data, error } = await supabase
      .from(NOTES_TABLE)
      .insert({ ...toDbPayload(fields), user_id: userId })
      .select()
      .single();

    if (error) {
      if (isChecklist && (error.message?.includes('violates check constraint') || error.code === '23514')) {
        const fallbackFields = { ...fields, type: 'paper' as const };
        const { data: retryData, error: retryError } = await supabase
          .from(NOTES_TABLE)
          .insert({ ...toDbPayload(fallbackFields), user_id: userId })
          .select()
          .single();
        if (retryError) throw retryError;
        return { ...toNote(retryData), type: 'checklist' };
      }
      throw error;
    }
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
