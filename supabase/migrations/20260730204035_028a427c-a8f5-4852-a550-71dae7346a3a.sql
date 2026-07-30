INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'admin@demo.fr'
ON CONFLICT (user_id, role) DO NOTHING;