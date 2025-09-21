-- Migration simple et sure: etendre l'enum public.user_role
-- Date: 2025-01-20 12:00:00
-- Se concentre uniquement sur la table profiles qui a definitivement une colonne role

BEGIN;

-- 1) Supprimer TOUTES les politiques RLS qui mentionnent 'role'
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE qual ILIKE '%role%' OR with_check ILIKE '%role%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      rec.policyname, rec.schemaname, rec.tablename);
    END LOOP;
END$$;

-- 2) Supprimer toutes les valeurs par defaut sur les colonnes user_role
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT table_schema, table_name, column_name
        FROM information_schema.columns 
        WHERE udt_name = 'user_role'
    LOOP
        EXECUTE format('ALTER TABLE %I.%I ALTER COLUMN %I DROP DEFAULT',
                      rec.table_schema, rec.table_name, rec.column_name);
    END LOOP;
END$$;

-- 3) Supprimer toutes les contraintes qui utilisent user_role
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT tc.table_schema, tc.table_name, tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
        WHERE cc.check_clause LIKE '%user_role%'
           OR tc.constraint_name LIKE '%user_role%'
    LOOP
        EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I',
                      rec.table_schema, rec.table_name, rec.constraint_name);
    END LOOP;
END$$;

-- 4) Creer le nouvel ENUM
CREATE TYPE public.user_role_new AS ENUM (
    'admin',
    'chef_service',
    'employe',
    'medecin',
    'infirmiere',
    'dentiste',
    'assistante_dentaire',
    'rh',
    'comptabilite',
    'sage_femme'
);

-- 5) Convertir toutes les colonnes user_role vers le nouvel enum
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT table_schema, table_name, column_name
        FROM information_schema.columns 
        WHERE udt_name = 'user_role'
    LOOP
        EXECUTE format('ALTER TABLE %I.%I ALTER COLUMN %I TYPE public.user_role_new USING %I::text::public.user_role_new',
                      rec.table_schema, rec.table_name, rec.column_name, rec.column_name);
    END LOOP;
END$$;

-- 6) Supprimer l'ancien enum
DROP TYPE IF EXISTS public.user_role CASCADE;

-- 7) Renommer le nouvel enum
ALTER TYPE public.user_role_new RENAME TO user_role;

-- 8) Remettre les valeurs par defaut
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT table_schema, table_name, column_name
        FROM information_schema.columns 
        WHERE udt_name = 'user_role'
    LOOP
        -- Remettre 'employe' comme valeur par defaut
        EXECUTE format('ALTER TABLE %I.%I ALTER COLUMN %I SET DEFAULT ''employe''::public.user_role',
                      rec.table_schema, rec.table_name, rec.column_name);
    END LOOP;
END$$;

-- 9) Recréer UNIQUEMENT les politiques RLS pour la table profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND role = 'admin');

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Service managers can view their team"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND role = 'chef_service');

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- 10) Documenter le type
COMMENT ON TYPE public.user_role IS 'Enum des roles utilisateur dans l''application - admin, chef_service, employe, medecin, infirmiere, dentiste, assistante_dentaire, rh, comptabilite, sage_femme';

COMMIT;

-- Verifier que la migration a fonctionne
SELECT unnest(enum_range(NULL::user_role)) as available_roles;