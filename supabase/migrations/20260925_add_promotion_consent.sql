ALTER TABLE public.perfiles
ADD COLUMN IF NOT EXISTS acepta_promociones boolean NOT NULL DEFAULT false;
