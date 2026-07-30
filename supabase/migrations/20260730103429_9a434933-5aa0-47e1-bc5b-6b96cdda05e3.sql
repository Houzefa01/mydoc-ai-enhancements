CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_birth date;
BEGIN
  BEGIN
    v_birth := NULLIF(NEW.raw_user_meta_data->>'birth_date','')::date;
  EXCEPTION WHEN others THEN
    v_birth := NULL;
  END;

  INSERT INTO public.profiles (id, email, name, avatar_url, phone, birth_date, address, city, postal_code, country)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'name',''), NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email,''),'@',1)),
    NEW.raw_user_meta_data->>'avatar_url',
    NULLIF(NEW.raw_user_meta_data->>'phone',''),
    v_birth,
    NULLIF(NEW.raw_user_meta_data->>'address',''),
    NULLIF(NEW.raw_user_meta_data->>'city',''),
    NULLIF(NEW.raw_user_meta_data->>'postal_code',''),
    NULLIF(NEW.raw_user_meta_data->>'country','')
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.credits (user_id, balance) VALUES (NEW.id, 100) ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.credit_transactions (user_id, label, amount) VALUES (NEW.id, 'Crédits de bienvenue', 100);
  RETURN NEW;
END; $function$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;