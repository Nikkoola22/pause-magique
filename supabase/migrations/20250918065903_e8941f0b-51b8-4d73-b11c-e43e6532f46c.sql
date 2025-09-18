-- Create admins table
CREATE TABLE public.admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Create policy to deny all access (only edge functions can access)
CREATE POLICY "No direct access to admins" ON public.admins AS RESTRICTIVE FOR ALL USING (false);

-- Insert default admin user with bcrypt hash for "admin123"
INSERT INTO public.admins (username, password_hash) VALUES 
('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');