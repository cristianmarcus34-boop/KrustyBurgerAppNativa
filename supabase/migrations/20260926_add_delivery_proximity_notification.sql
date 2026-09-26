ALTER TABLE public.pedidos
ADD COLUMN IF NOT EXISTS aviso_cercania_enviado boolean NOT NULL DEFAULT false;
