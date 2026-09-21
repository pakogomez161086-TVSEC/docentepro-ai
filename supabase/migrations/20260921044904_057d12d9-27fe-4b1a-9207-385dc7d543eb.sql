
CREATE TABLE public.proyectos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grado smallint NOT NULL CHECK (grado BETWEEN 1 AND 3),
  tomo smallint NOT NULL CHECK (tomo BETWEEN 1 AND 3),
  trimestre smallint CHECK (trimestre BETWEEN 1 AND 3),
  campo_formativo text NOT NULL,
  disciplina text NOT NULL,
  titulo text NOT NULL,
  ppa text,
  proyecto_academico text,
  producto_integrador text,
  estado text NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador','en_curso','completado')),
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.planeaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proyecto_id uuid REFERENCES public.proyectos(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  contenido jsonb NOT NULL DEFAULT '{}'::jsonb,
  estado text NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador','generada','revisada')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sesiones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  planeacion_id uuid NOT NULL REFERENCES public.planeaciones(id) ON DELETE CASCADE,
  numero smallint NOT NULL,
  titulo text NOT NULL,
  inicio text,
  desarrollo text,
  cierre text,
  materiales text,
  evaluacion text,
  duracion_min smallint DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_proyectos_user ON public.proyectos(user_id, grado, tomo);
CREATE INDEX idx_planeaciones_user ON public.planeaciones(user_id);
CREATE INDEX idx_sesiones_planeacion ON public.sesiones(planeacion_id, numero);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.proyectos TO authenticated;
GRANT ALL ON public.proyectos TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planeaciones TO authenticated;
GRANT ALL ON public.planeaciones TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sesiones TO authenticated;
GRANT ALL ON public.sesiones TO service_role;

ALTER TABLE public.proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planeaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sesiones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proyectos_own" ON public.proyectos FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "proyectos_admin_read" ON public.proyectos FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "planeaciones_own" ON public.planeaciones FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "planeaciones_admin_read" ON public.planeaciones FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "sesiones_own" ON public.sesiones FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sesiones_admin_read" ON public.sesiones FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'));

CREATE TRIGGER trg_proyectos_updated BEFORE UPDATE ON public.proyectos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_planeaciones_updated BEFORE UPDATE ON public.planeaciones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_sesiones_updated BEFORE UPDATE ON public.sesiones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
