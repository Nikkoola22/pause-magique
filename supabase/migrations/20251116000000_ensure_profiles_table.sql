-- Créer la table profiles si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(100) UNIQUE,
  full_name VARCHAR(200),
  email VARCHAR(255),
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'employe',
  service VARCHAR(100),
  manager_id UUID REFERENCES public.profiles(id),
  avatar_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS sur la table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Créer les policies RLS
-- Policy: Chacun peut voir son propre profil
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Les admins peuvent voir tous les profils
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Policy: Les managers peuvent voir les profils de leur équipe
CREATE POLICY "Managers can view team profiles"
  ON public.profiles FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'manager'
    OR manager_id = auth.uid()
  );

-- Policy: Chacun peut créer son profil
CREATE POLICY "Users can create their profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Chacun peut mettre à jour son profil
CREATE POLICY "Users can update their profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Créer les index pour les performances
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);
CREATE INDEX IF NOT EXISTS profiles_manager_id_idx ON public.profiles(manager_id);
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);
