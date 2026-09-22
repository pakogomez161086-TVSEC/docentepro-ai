import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Clock, ClipboardList } from "lucide-react";
import { useEffect, useState } from "react";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/sesiones")({
  head: () => ({
    meta: [
      { title: "Sesiones — DocentePRO Telesecundaria" },
      {
        name: "description",
        content:
          "Consulta las sesiones generadas con inicio, desarrollo, cierre, materiales, evaluación y tiempo.",
      },
      { property: "og:title", content: "Sesiones — DocentePRO Telesecundaria" },
      {
        property: "og:description",
        content: "Secuencias de sesión listas para el aula, alineadas a la NEM.",
      },
    ],
  }),
  component: SesionesPage,
});

type Sesion = {
  id: string;
  numero: number;
  titulo: string;
  inicio: string | null;
  desarrollo: string | null;
  cierre: string | null;
  materiales: string | null;
  evaluacion: string | null;
  duracion_min: number | null;
};

function SesionesPage() {
  const { user } = useAuth();
  const [planeacionId, setPlaneacionId] = useState("");

  const { data: planeaciones = [] } = useQuery({
    queryKey: ["planeaciones", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planeaciones")
        .select("id, titulo")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!planeacionId && planeaciones[0]) setPlaneacionId(planeaciones[0].id);
  }, [planeaciones, planeacionId]);

  const { data: sesiones = [], isLoading } = useQuery({
    queryKey: ["sesiones", planeacionId],
    enabled: Boolean(planeacionId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sesiones")
        .select("id, numero, titulo, inicio, desarrollo, cierre, materiales, evaluacion, duracion_min")
        .eq("planeacion_id", planeacionId)
        .order("numero", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Sesion[];
    },
  });

  return (
    <DashboardShell title="Sesiones" subtitle="Secuencias listas para el aula">
      <section className="flex flex-wrap items-end justify-between gap-4 rounded-3xl border bg-surface p-5 shadow-soft">
        <div className="min-w-64 flex-1 space-y-1.5">
          <Label>Planeación</Label>
          <Select value={planeacionId} onValueChange={setPlaneacionId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una planeación" />
            </SelectTrigger>
            <SelectContent>
              {planeaciones.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.titulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Badge variant="secondary" className="h-9 px-3 text-sm">
          {sesiones.length} sesiones
        </Badge>
      </section>

      {planeaciones.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <ClipboardList className="h-6 w-6 text-primary" />
            <p className="font-semibold">Aún no hay planeaciones</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Genera una planeación completa y sus sesiones aparecerán aquí automáticamente.
            </p>
            <Button asChild>
              <Link to="/planeaciones">Generar planeación</Link>
            </Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando sesiones…</p>
      ) : (
        <section className="space-y-4">
          {sesiones.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.03 * i }}
            >
              <Card className="border-border/70 shadow-soft">
                <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                      {s.numero}
                    </span>
                    <CardTitle className="text-base leading-snug">{s.titulo}</CardTitle>
                  </div>
                  <Badge variant="outline" className="shrink-0 gap-1">
                    <Clock className="h-3 w-3" /> {s.duracion_min ?? 50} min
                  </Badge>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm md:grid-cols-3">
                  {(
                    [
                      ["Inicio", s.inicio],
                      ["Desarrollo", s.desarrollo],
                      ["Cierre", s.cierre],
                    ] as const
                  ).map(([label, valor]) => (
                    <div key={label} className="rounded-xl border bg-card p-3">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
                        {label}
                      </p>
                      <p className="text-muted-foreground">{valor ?? "—"}</p>
                    </div>
                  ))}
                  <div className="md:col-span-3 grid gap-3 sm:grid-cols-2">
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Materiales: </span>
                      {s.materiales ?? "—"}
                    </p>
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Evaluación: </span>
                      {s.evaluacion ?? "—"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </section>
      )}
    </DashboardShell>
  );
}
