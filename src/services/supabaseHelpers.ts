import { supabase } from '../lib/supabase';

// Dados de formulário para criar (sem id) ou editar (com id) um registro
export type EntityInput<T> = Omit<T, 'id' | 'created_at' | 'updated_at'> & { id?: string };

// Converte qualquer erro do Supabase/rede em um Error com mensagem legível
export function toError(action: string, err: unknown): Error {
  const detail =
    err && typeof err === 'object' && 'message' in err
      ? String((err as { message: unknown }).message)
      : String(err);
  return new Error(`Erro ao ${action}: ${detail}`);
}

// As políticas RLS exigem user_id = auth.uid(), então toda operação
// precisa de uma sessão ativa no Supabase Auth.
export async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const userId = data.session?.user.id;
  if (!userId) throw new Error('nenhuma sessão ativa. Entre na sua conta.');
  return userId;
}

// undefined some do JSON enviado ao Supabase e a coluna manteria o valor antigo
// numa edição; null limpa a coluna de verdade.
export function toDbPayload<T extends object>(fields: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, value === undefined ? null : value])
  );
}

// null vindo do banco vira undefined, para casar com os campos opcionais dos tipos do app
export function fromDbRow<T>(row: Record<string, unknown>): T {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, value === null ? undefined : value])
  ) as T;
}

export function nowIso(): string {
  return new Date().toISOString();
}
