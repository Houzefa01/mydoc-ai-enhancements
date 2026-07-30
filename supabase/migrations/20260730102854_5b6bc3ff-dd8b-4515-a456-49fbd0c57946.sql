CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  m jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url, phone, birth_date, city, postal_code, country)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(m->>'name', m->>'full_name', split_part(COALESCE(NEW.email, ''), '@', 1)),
    m->>'avatar_url',
    NULLIF(m->>'phone', ''),
    NULLIF(m->>'birth_date', '')::date,
    NULLIF(m->>'city', ''),
    NULLIF(m->>'postal_code', ''),
    NULLIF(m->>'country', '')
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.credits (user_id, balance) VALUES (NEW.id, 100) ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.credit_transactions (user_id, label, amount) VALUES (NEW.id, 'Crédits de bienvenue', 100);
  RETURN NEW;
END; $function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_projects_updated_at ON public.projects;
CREATE TRIGGER set_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_documents_updated_at ON public.documents;
CREATE TRIGGER set_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();