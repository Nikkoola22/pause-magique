-- Migration pour étendre l'enum public.service_type
-- Date: 2025-11-24
-- Ajoute: kine, infirmerie, prevention, dentiste, administration

BEGIN;

-- 1) Créer le nouvel ENUM avec toutes les valeurs (anciennes + nouvelles)
CREATE TYPE public.service_type_new AS ENUM (
    'medecine',
    'dentaire',
    'radiologie',
    'kine',
    'infirmerie',
    'prevention',
    'dentiste',
    'administration'
);

-- 2) Convertir les colonnes utilisant service_type
-- On utilise une conversion explicite via text pour éviter les erreurs de type
ALTER TABLE public.profiles 
  ALTER COLUMN service TYPE public.service_type_new 
  USING service::text::public.service_type_new;

ALTER TABLE public.training_programs 
  ALTER COLUMN service TYPE public.service_type_new 
  USING service::text::public.service_type_new;

-- 3) Supprimer l'ancien enum
DROP TYPE IF EXISTS public.service_type CASCADE;

-- 4) Renommer le nouvel enum
ALTER TYPE public.service_type_new RENAME TO service_type;

COMMIT;
