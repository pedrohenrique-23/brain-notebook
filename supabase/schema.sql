-- ==========================================================
-- SCRIPT DE CRIAÇÃO DO BANCO DE DADOS - CADERNO DIGITAL
-- Banco: PostgreSQL (Supabase) com Row Level Security (RLS)
-- Execute este script no SQL Editor do seu projeto Supabase!
-- ==========================================================

-- 1. TABELA DE TAREFAS (tasks)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    due_date DATE,
    category TEXT NOT NULL DEFAULT 'Geral',
    recurrence TEXT DEFAULT 'none',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ativar RLS em tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver apenas suas próprias tarefas"
    ON public.tasks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas tarefas"
    ON public.tasks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem editar suas próprias tarefas"
    ON public.tasks FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir suas próprias tarefas"
    ON public.tasks FOR DELETE
    USING (auth.uid() = user_id);


-- 2. TABELA DE HÁBITOS (habits)
CREATE TABLE IF NOT EXISTS public.habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    frequency TEXT NOT NULL DEFAULT 'Diário',
    target INTEGER NOT NULL DEFAULT 1,
    target_type TEXT NOT NULL DEFAULT 'frequency' CHECK (target_type IN ('frequency', 'sequence', 'quantity', 'duration')),
    unit TEXT,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ativar RLS em habits
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver apenas seus próprios hábitos"
    ON public.habits FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus hábitos"
    ON public.habits FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem editar seus próprios hábitos"
    ON public.habits FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir seus próprios hábitos"
    ON public.habits FOR DELETE
    USING (auth.uid() = user_id);


-- 3. TABELA DE REGISTROS DE HÁBITOS (habit_records)
CREATE TABLE IF NOT EXISTS public.habit_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT true,
    value NUMERIC DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(habit_id, date)
);

-- Ativar RLS em habit_records através do relacionamento com o hábito do usuário
ALTER TABLE public.habit_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários gerenciam registros de seus hábitos"
    ON public.habit_records FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.habits
            WHERE public.habits.id = public.habit_records.habit_id
            AND public.habits.user_id = auth.uid()
        )
    );


-- 4. TABELA DE ANOTAÇÕES (notes)
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    color TEXT NOT NULL DEFAULT 'sand',
    type TEXT NOT NULL DEFAULT 'paper' CHECK (type IN ('paper', 'postit')),
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ativar RLS em notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver apenas suas próprias anotações"
    ON public.notes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas anotações"
    ON public.notes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem editar suas anotações"
    ON public.notes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir suas anotações"
    ON public.notes FOR DELETE
    USING (auth.uid() = user_id);


-- 5. TABELA DE METAS E VISION BOARD (goals)
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'geral',
    category TEXT NOT NULL DEFAULT 'Pessoal',
    timeframe TEXT NOT NULL DEFAULT 'medio' CHECK (timeframe IN ('curto', 'medio', 'longo')),
    target_value NUMERIC,
    current_value NUMERIC DEFAULT 0,
    unit TEXT,
    deadline DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ativar RLS em goals
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver apenas suas próprias metas"
    ON public.goals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas metas"
    ON public.goals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem editar suas metas"
    ON public.goals FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir suas metas"
    ON public.goals FOR DELETE
    USING (auth.uid() = user_id);


-- 6. TABELA DE CONTROLE DO SONO (sleep_logs)
CREATE TABLE IF NOT EXISTS public.sleep_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hours NUMERIC(4, 2) NOT NULL CHECK (hours >= 0 AND hours <= 24),
    bedtime TIME,
    wake_time TIME,
    quality TEXT DEFAULT 'bom' CHECK (quality IN ('ruim', 'regular', 'bom', 'excelente')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Ativar RLS em sleep_logs
ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver apenas seus próprios registros de sono"
    ON public.sleep_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus registros de sono"
    ON public.sleep_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem editar seus registros de sono"
    ON public.sleep_logs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir seus registros de sono"
    ON public.sleep_logs FOR DELETE
    USING (auth.uid() = user_id);
