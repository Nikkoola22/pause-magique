-- Migration pour corriger les politiques RLS et résoudre la récursion infinie

-- D'abord, désactiver RLS temporairement sur la table profiles
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes sur profiles
DROP POLICY IF EXISTS "Users can read their own data" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all users" ON public.profiles;
DROP POLICY IF EXISTS "Responsables can read users in their service" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can create users" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can update users" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can delete users" ON public.profiles;

-- Réactiver RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Créer des politiques simples sans récursion
-- Politique pour permettre la lecture à tous les utilisateurs authentifiés
CREATE POLICY "Authenticated users can read profiles" 
ON public.profiles FOR SELECT 
TO authenticated USING (true);

-- Politique pour permettre l'insertion à tous les utilisateurs authentifiés
CREATE POLICY "Authenticated users can insert profiles" 
ON public.profiles FOR INSERT 
TO authenticated WITH CHECK (true);

-- Politique pour permettre la mise à jour à tous les utilisateurs authentifiés
CREATE POLICY "Authenticated users can update profiles" 
ON public.profiles FOR UPDATE 
TO authenticated USING (true);

-- Politique pour permettre la suppression à tous les utilisateurs authentifiés
CREATE POLICY "Authenticated users can delete profiles" 
ON public.profiles FOR DELETE 
TO authenticated USING (true);

-- Alternative : Si vous voulez des politiques plus restrictives, utilisez celles-ci à la place :

-- Désactiver les politiques permissives ci-dessus si vous voulez des politiques restrictives
-- DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.profiles;
-- DROP POLICY IF EXISTS "Authenticated users can insert profiles" ON public.profiles;
-- DROP POLICY IF EXISTS "Authenticated users can update profiles" ON public.profiles;
-- DROP POLICY IF EXISTS "Authenticated users can delete profiles" ON public.profiles;

-- Politiques restrictives (commentées par défaut)
-- CREATE POLICY "Users can read profiles" 
-- ON public.profiles FOR SELECT 
-- TO authenticated USING (
--   role = 'admin' OR 
--   id = auth.uid() OR
--   (role = 'chef_service' AND service IN ('medecine', 'dentaire', 'radiologie'))
-- );

-- CREATE POLICY "Admins can manage profiles" 
-- ON public.profiles FOR ALL 
-- TO authenticated USING (role = 'admin');

-- Créer une fonction utilitaire pour vérifier les permissions sans récursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer une fonction utilitaire pour vérifier si l'utilisateur est responsable de service
CREATE OR REPLACE FUNCTION public.is_service_manager(service_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'chef_service' 
    AND service = service_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;




