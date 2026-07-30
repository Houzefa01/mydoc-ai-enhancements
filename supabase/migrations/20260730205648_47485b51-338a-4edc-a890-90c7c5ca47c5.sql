CREATE TABLE public.system_settings (
  id text PRIMARY KEY DEFAULT 'global',
  tokens_per_credit integer NOT NULL DEFAULT 8000,
  credit_price numeric(10,4) NOT NULL DEFAULT 0.15,
  ai_provider text NOT NULL DEFAULT 'deepseek',
  ai_model text NOT NULL DEFAULT 'deepseek-chat',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT system_settings_single_row CHECK (id = 'global'),
  CONSTRAINT system_settings_tokens_positive CHECK (tokens_per_credit > 0),
  CONSTRAINT system_settings_price_positive CHECK (credit_price >= 0)
);

GRANT SELECT ON public.system_settings TO authenticated;
GRANT ALL ON public.system_settings TO service_role;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "system_settings_read" ON public.system_settings FOR SELECT TO authenticated USING (true);

CREATE TRIGGER system_settings_updated_at BEFORE UPDATE ON public.system_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.system_settings (id) VALUES ('global');

CREATE TABLE public.system_settings_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL,
  old_value text NOT NULL DEFAULT '',
  new_value text NOT NULL DEFAULT '',
  changed_by uuid,
  changed_by_email text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.system_settings_history TO authenticated;
GRANT ALL ON public.system_settings_history TO service_role;
ALTER TABLE public.system_settings_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "system_settings_history_admin_read" ON public.system_settings_history
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX system_settings_history_created_at_idx ON public.system_settings_history (created_at DESC);