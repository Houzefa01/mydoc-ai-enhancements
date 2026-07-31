CREATE TABLE public.provider_api_keys (
  provider text PRIMARY KEY,
  api_key text NOT NULL,
  updated_by uuid,
  updated_by_email text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.provider_api_keys TO service_role;
ALTER TABLE public.provider_api_keys ENABLE ROW LEVEL SECURITY;