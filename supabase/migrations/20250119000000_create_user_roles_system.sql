-- Migration pour créer le système de gestion des droits à 3 niveaux
-- 1. Admin : Créer les agents et responsables de service
-- 2. Responsable de service : Gérer les demandes des agents de leur service
-- 3. Agent : Faire des demandes de congés

-- Créer la table des services
CREATE TABLE IF NOT EXISTS public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer la table unifiée des utilisateurs avec rôles
CREATE TABLE IF NOT EXISTS public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  email TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'employe',
  service_id UUID REFERENCES public.services(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.users(id)
);

-- Créer la table des demandes de congés
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.users(id),
  service_id UUID NOT NULL REFERENCES public.services(id),
  leave_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INTEGER NOT NULL,
  reason TEXT,
  status leave_status NOT NULL DEFAULT 'en_attente',
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur toutes les tables
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Politiques pour la table services
CREATE POLICY "Services are readable by all authenticated users" 
ON public.services FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Only admins can modify services" 
ON public.services FOR ALL 
TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Politiques pour la table users
CREATE POLICY "Users can read their own data" 
ON public.users FOR SELECT 
TO authenticated USING (id = auth.uid());

CREATE POLICY "Admins can read all users" 
ON public.users FOR SELECT 
TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

CREATE POLICY "Responsables can read users in their service" 
ON public.users FOR SELECT 
TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.users u1
    WHERE u1.id = auth.uid() 
    AND u1.role = 'chef_service'
    AND u1.service_id = users.service_id
  )
);

CREATE POLICY "Only admins can create users" 
ON public.users FOR INSERT 
TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

CREATE POLICY "Only admins can update users" 
ON public.users FOR UPDATE 
TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Politiques pour la table leave_requests
CREATE POLICY "Users can read their own leave requests" 
ON public.leave_requests FOR SELECT 
TO authenticated USING (employee_id = auth.uid());

CREATE POLICY "Responsables can read leave requests in their service" 
ON public.leave_requests FOR SELECT 
TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'chef_service'
    AND users.service_id = leave_requests.service_id
  )
);

CREATE POLICY "Admins can read all leave requests" 
ON public.leave_requests FOR SELECT 
TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

CREATE POLICY "Users can create their own leave requests" 
ON public.leave_requests FOR INSERT 
TO authenticated WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Responsables can update leave requests in their service" 
ON public.leave_requests FOR UPDATE 
TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'chef_service'
    AND users.service_id = leave_requests.service_id
  )
);

-- Créer les triggers pour updated_at
CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at
BEFORE UPDATE ON public.leave_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insérer les services par défaut
INSERT INTO public.services (name, description) VALUES 
('Médecine', 'Service de médecine générale et spécialisée'),
('Dentaire', 'Service dentaire et d''orthodontie'),
('Radiologie', 'Service de radiologie et d''imagerie médicale');

-- Insérer un admin par défaut
INSERT INTO public.users (username, password_hash, first_name, last_name, role) VALUES 
('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'System', 'admin');

-- Insérer des responsables de service
INSERT INTO public.users (username, password_hash, first_name, last_name, role, service_id) VALUES 
('resp.medecine', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Dr. Jean', 'Dupont', 'chef_service', 
 (SELECT id FROM public.services WHERE name = 'Médecine')),
('resp.dentaire', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Dr. Marie', 'Martin', 'chef_service',
 (SELECT id FROM public.services WHERE name = 'Dentaire'));

-- Insérer des agents de test
INSERT INTO public.users (username, password_hash, first_name, last_name, role, service_id) VALUES 
('agent1', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sophie', 'Bernard', 'employe',
 (SELECT id FROM public.services WHERE name = 'Médecine')),
('agent2', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Pierre', 'Durand', 'employe',
 (SELECT id FROM public.services WHERE name = 'Dentaire')),
('agent3', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Claire', 'Moreau', 'employe',
 (SELECT id FROM public.services WHERE name = 'Radiologie'));






