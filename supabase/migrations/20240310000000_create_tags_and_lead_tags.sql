-- Tags table: global list of tag names
CREATE TABLE IF NOT EXISTS public.tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tags_pkey PRIMARY KEY (id),
  CONSTRAINT tags_name_unique UNIQUE (name)
);

-- Junction table: links leads to tags (many-to-many)
CREATE TABLE IF NOT EXISTS public.lead_tags (
  lead_id uuid NOT NULL,
  tag_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lead_tags_pkey PRIMARY KEY (lead_id, tag_id),
  CONSTRAINT lead_tags_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE,
  CONSTRAINT lead_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE
);

-- Indexes for lookups
CREATE INDEX IF NOT EXISTS idx_lead_tags_lead_id ON public.lead_tags(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_tags_tag_id ON public.lead_tags(tag_id);

-- Enable RLS (optional; add policies as needed for your auth setup)
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_tags ENABLE ROW LEVEL SECURITY;

-- Allow anon/authenticated to read and write (adjust for your security needs)
CREATE POLICY "Allow all for tags" ON public.tags FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for lead_tags" ON public.lead_tags FOR ALL USING (true) WITH CHECK (true);
