
-- Tabela de snapshot compartilhado do estado do sistema (obrigações, templates, eventos)
-- Ferramenta interna mockada: leitura/escrita aberta a anon e authenticated.
CREATE TABLE public.app_state (
  id integer PRIMARY KEY DEFAULT 1,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text,
  CONSTRAINT single_row CHECK (id = 1)
);
INSERT INTO public.app_state (id, data) VALUES (1, '{}'::jsonb);

GRANT SELECT, INSERT, UPDATE ON public.app_state TO anon, authenticated;
GRANT ALL ON public.app_state TO service_role;
ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_state_read_all" ON public.app_state FOR SELECT USING (true);
CREATE POLICY "app_state_update_all" ON public.app_state FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "app_state_insert_all" ON public.app_state FOR INSERT WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.app_state;
ALTER TABLE public.app_state REPLICA IDENTITY FULL;

-- Dedupe de notificações
CREATE TABLE public.notificacoes_enviadas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave text NOT NULL UNIQUE,
  canal text NOT NULL,
  payload jsonb,
  enviada_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.notificacoes_enviadas TO anon, authenticated;
GRANT ALL ON public.notificacoes_enviadas TO service_role;
ALTER TABLE public.notificacoes_enviadas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_read_all" ON public.notificacoes_enviadas FOR SELECT USING (true);
CREATE POLICY "notif_insert_all" ON public.notificacoes_enviadas FOR INSERT WITH CHECK (true);
