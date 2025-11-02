-- Create agent_plannings table for storing weekly schedules
CREATE TABLE IF NOT EXISTS public.agent_plannings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL,
  week TEXT NOT NULL,
  planning JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(agent_id, week)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_agent_plannings_agent_id ON public.agent_plannings(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_plannings_week ON public.agent_plannings(week);
CREATE INDEX IF NOT EXISTS idx_agent_plannings_agent_week ON public.agent_plannings(agent_id, week);

-- Enable RLS
ALTER TABLE public.agent_plannings ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Anyone authenticated can read
CREATE POLICY "Authenticated users can read agent plannings" 
ON public.agent_plannings FOR SELECT 
TO authenticated USING (true);

-- Anyone authenticated can insert
CREATE POLICY "Authenticated users can insert agent plannings" 
ON public.agent_plannings FOR INSERT 
TO authenticated WITH CHECK (true);

-- Anyone authenticated can update
CREATE POLICY "Authenticated users can update agent plannings" 
ON public.agent_plannings FOR UPDATE 
TO authenticated USING (true);

-- Anyone authenticated can delete
CREATE POLICY "Authenticated users can delete agent plannings" 
ON public.agent_plannings FOR DELETE 
TO authenticated USING (true);

-- Create trigger to update updated_at automatically
CREATE OR REPLACE FUNCTION public.update_agent_plannings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_agent_plannings_updated_at ON public.agent_plannings;
CREATE TRIGGER update_agent_plannings_updated_at
BEFORE UPDATE ON public.agent_plannings
FOR EACH ROW
EXECUTE FUNCTION public.update_agent_plannings_timestamp();
