-- Add missing column used by the app
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT '';

-- Optional: keep category trimmed (no constraint needed)
COMMENT ON COLUMN public.products.category IS 'Product category used for grouping in UI';
