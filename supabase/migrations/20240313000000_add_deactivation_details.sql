-- Add deactivation_details column to leads table
ALTER TABLE public.leads
ADD COLUMN deactivation_details TEXT DEFAULT NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_leads_deactivation_details ON public.leads (deactivation_details)
WHERE
    deactivation_details IS NOT NULL;