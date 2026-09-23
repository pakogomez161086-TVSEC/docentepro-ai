CREATE TYPE public.agenda_tipo AS ENUM ('tarea','incidencia','acuerdo','cte','evaluacion','evento');
CREATE TYPE public.agenda_prioridad AS ENUM ('baja','media','alta');

CREATE TABLE public.agenda_entradas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo public.agenda_tipo NOT NULL DEFAULT 'tarea',
  titulo text NOT NULL,
  descripcion text,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  hora time,
  prioridad public.agenda_prioridad NOT NULL DEFAULT 'media',
  completado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_agenda_user_fecha ON public.agenda_entradas (user_id, fecha DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_entradas TO authenticated;
GRANT ALL ON public.agenda_entradas TO service_role;

ALTER TABLE public.agenda_entradas ENABLE ROW LEVEL SECURITY;

CREATE POLICY agenda_own ON public.agenda_entradas FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY agenda_admin_read ON public.agenda_entradas FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'::app_role));

CREATE TRIGGER trg_agenda_updated BEFORE UPDATE ON public.agenda_entradas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();