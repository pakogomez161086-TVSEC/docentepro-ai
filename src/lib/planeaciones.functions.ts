import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  proyecto_id: z.string().uuid(),
  num_sesiones: z.number().int().min(3).max(20),
});

export const generarPlaneacionCompleta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: proyecto, error: errProyecto } = await supabase
      .from("proyectos")
      .select(
        "id, grado, tomo, trimestre, campo_formativo, disciplina, titulo, ppa, proyecto_academico, producto_integrador",
      )
      .eq("id", data.proyecto_id)
      .maybeSingle();

    if (errProyecto) throw new Error(errProyecto.message);
    if (!proyecto) throw new Error("No se encontró el proyecto.");

    const { generarPlaneacionIA } = await import("./planeacion.server");
    const generada = await generarPlaneacionIA({
      grado: proyecto.grado,
      tomo: proyecto.tomo,
      trimestre: proyecto.trimestre,
      campo_formativo: proyecto.campo_formativo,
      disciplina: proyecto.disciplina,
      titulo: proyecto.titulo,
      ppa: proyecto.ppa,
      proyecto_academico: proyecto.proyecto_academico,
      producto_integrador: proyecto.producto_integrador,
      numSesiones: data.num_sesiones,
    });

    const { sesiones, ...contenido } = generada;

    const { data: planeacion, error: errPlan } = await supabase
      .from("planeaciones")
      .insert({
        user_id: userId,
        proyecto_id: proyecto.id,
        titulo: contenido.titulo || proyecto.titulo,
        contenido,
        estado: "generada",
      })
      .select("id")
      .single();

    if (errPlan || !planeacion) throw new Error(errPlan?.message ?? "No se pudo guardar.");

    if (sesiones?.length) {
      const { error: errSes } = await supabase.from("sesiones").insert(
        sesiones.map((s, i) => ({
          user_id: userId,
          planeacion_id: planeacion.id,
          numero: s.numero ?? i + 1,
          titulo: s.titulo,
          inicio: s.inicio,
          desarrollo: s.desarrollo,
          cierre: s.cierre,
          materiales: s.materiales,
          evaluacion: s.evaluacion,
          duracion_min: s.duracion_min ?? 50,
        })),
      );
      if (errSes) throw new Error(errSes.message);
    }

    await supabase.from("proyectos").update({ estado: "en_curso" }).eq("id", proyecto.id);

    return { planeacion_id: planeacion.id, sesiones: sesiones?.length ?? 0 };
  });
