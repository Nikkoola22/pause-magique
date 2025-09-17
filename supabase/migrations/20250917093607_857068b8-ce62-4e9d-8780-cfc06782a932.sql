-- Create administrators table
CREATE TABLE public.administrators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.administrators ENABLE ROW LEVEL SECURITY;

-- Create policies - only authenticated users can read admin data
CREATE POLICY "Administrators can be read by authenticated users" 
ON public.administrators 
FOR SELECT 
TO authenticated
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_administrators_updated_at
BEFORE UPDATE ON public.administrators
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert test admin account (password: admin123)
-- Using bcrypt hash for password "admin123"
INSERT INTO public.administrators (username, password_hash) 
VALUES ('admin', '$2b$10$8K1p/a0dUVDD6OG1/qGDueQr/fYOLM9z7LpVd4BrE9jVT5oU0uQK2');