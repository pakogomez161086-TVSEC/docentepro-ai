import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "motion/react";
import { FileText, Sparkles, Trash2, Wand2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { generarPlaneacionCompleta } from "@/lib/planeaciones.functions";
import { romano } from "@/lib/curriculo";

export const Route = createFileRoute("/_authenticated/planeaciones")({
  head: () => ({
    meta: [
      { title: "Planeación Automática — DocentePRO Telesecundaria" },
      {
        name: "description",
        content:
          "Genera en un clic la planeación didáctica completa: secuencia, 7 etapas, evaluación, rúbricas y sesiones.",
      },
      { property: "og:title", content: "Planeación Automática — DocentePRO" },
      {
        property: "og:description",
        content: "Planeación didáctica alineada a la NEM generada con IA pedagógica.",
      },
    ],
  }),
  component: PlaneacionesPage,
});

type Contenido = {
  proposito?: string;
  pda?: string[];
  saberes?: string[];
  secuencia?: { inicio?: string; desarrollo?: string; cierre?: string };
  etapas?: { nombre: string; descripcion: string }[];
  evaluacion?: string;
  rubrica?: { criterio: string; excelente: string; satisfactorio: string; en_proceso: string }[];
  lista_cotejo?: string[];
  materiales?: string[];
  adecuaciones?: string;
  transversalidad?: string;
};

type Planeacion = {
  id: string;
  titulo: string;
  estado: string;
  created_at: string;
  contenido: Contenido;
  proyecto_id: string | null;
};

function PlaneacionesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const generar = useServerFn(generarPlaneacionCompleta);
  const [proyectoId, setProyectoId] = useState<string>("");
  const [numSesiones, setNumSesiones] = useState("10");
  const [detalle, setDetalle] = useState<Planeacion | null>(null);

  const { data: proyectos = [] } = useQuery({
    queryKey: ["proyectos", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proyectos")
        .select("id, titulo, grado, tomo, disciplina")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: planeaciones = [], isLoading } = useQuery({
    queryKey: ["planeaciones", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planeaciones")
        .select("id, titulo, estado, created_at, contenido, proyecto_id")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Planeacion[];
    },
  });

  const crear = useMutation({
    mutationFn: async () => {
      if (!proyectoId) throw new Error("Elige primero un proyecto de aula");
      return generar({
        data: { proyecto_id: proyectoId, num_sesiones: Number(numSesiones) },
      });
    },
    onSuccess: (r) => {
      toast.success(`Planeación generada con ${r.sesiones} sesiones`);
      void queryClient.invalidateQueries({ queryKey: ["planeaciones"] });
      void queryClient.invalidateQueries({ queryKey: ["sesiones"] });
      void queryClient.invalidateQueries({ queryKey: ["proyectos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const eliminar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("planeaciones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Planeación eliminada");
      void queryClient.invalidateQueries({ queryKey: ["planeaciones"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DashboardShell title="Planeación Automática" subtitle="IA pedagógica alineada a la NEM">
      <section className="gradient-brand relative overflow-hidden rounded-3xl p-6 shadow-lift sm:p-8">
        <h1 className="text-2xl font-bold text-brand-foreground sm:text-3xl">
          Generar Planeación Completa
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-brand-foreground/75">
          Elige un proyecto y la cantidad de sesiones. La IA crea propósito, PDA, saberes,
          secuencia didáctica, 7 etapas, evaluación, rúbrica, lista de cotejo, materiales,
          adecuaciones y todas las sesiones.
        </p>

        <div className="mt-6 grid gap-3 rounded-2xl bg-background/95 p-4 shadow-soft md:grid-cols-[2fr_1fr_auto] md:items-end">
          <div className="space-y-1.5">
            <Label>Proyecto de aula</Label>
            <Select value={proyectoId} onValueChange={setProyectoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un proyecto" />
              </SelectTrigger>
              <SelectContent>
                {proyectos.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.grado}° · T{romano(p.tomo)} · {p.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Sesiones</Label>
            <Select value={numSesiones} onValueChange={setNumSesiones}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["5", "10", "15", "20"].map((n) => (
                  <SelectItem key={n} value={n}>
                    {n} sesiones
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button size="lg" onClick={() => crear.mutate()} disabled={crear.isPending}>
            <Wand2 className="mr-1 h-4 w-4" />
            {crear.isPending ? "Generando…" : "Generar planeación"}
          </Button>
        </div>

        {crear.isPending ? (
          <p className="mt-3 text-xs text-brand-foreground/80">
            La IA está analizando el proyecto; esto puede tardar un par de minutos.
          </p>
        ) : null}
      </section>

      {proyectos.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <Sparkles className="h-6 w-6 text-primary" />
            <p className="font-semibold">Primero crea un proyecto de aula</p>
            <Button asChild>
              <Link to="/proyectos">Ir a Proyectos de Aula</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando planeaciones…</p>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {planeaciones.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.04 * i }}
            >
              <Card className="h-full border-border/70 shadow-soft">
                <CardHeader className="pb-3">
                  <Badge variant="secondary" className="w-fit">
                    {p.estado === "generada" ? "Generada con IA" : p.estado}
                  </Badge>
                  <CardTitle className="mt-2 text-base leading-snug">{p.titulo}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="line-clamp-3 text-muted-foreground">
                    {p.contenido?.proposito ?? "Sin propósito registrado."}
                  </p>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <Button variant="outline" size="sm" onClick={() => setDetalle(p)}>
                      <FileText className="mr-1 h-4 w-4" /> Ver planeación
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Eliminar planeación"
                      onClick={() => eliminar.mutate(p.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </section>
      )}

      <Dialog open={Boolean(detalle)} onOpenChange={(o) => !o && setDetalle(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{detalle?.titulo}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            {detalle ? <DetallePlaneacion contenido={detalle.contenido} /> : null}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="font-display text-sm font-bold uppercase tracking-wide text-primary">
        {titulo}
      </h3>
      <div className="text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function Lista({ items }: { items?: string[] | undefined }) {
  if (!items?.length) return <p>Sin información.</p>;
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  );
}

function DetallePlaneacion({ contenido }: { contenido: Contenido }) {
  return (
    <div className="space-y-6 pb-4">
      <Bloque titulo="Propósito">{contenido.proposito ?? "Sin información."}</Bloque>
      <Bloque titulo="PDA">
        <Lista items={contenido.pda} />
      </Bloque>
      <Bloque titulo="Saberes disciplinares">
        <Lista items={contenido.saberes} />
      </Bloque>
      <Bloque titulo="Secuencia didáctica">
        <div className="grid gap-3 sm:grid-cols-3">
          {(["inicio", "desarrollo", "cierre"] as const).map((k) => (
            <div key={k} className="rounded-xl border bg-card p-3">
              <p className="mb-1 text-xs font-semibold uppercase text-foreground">{k}</p>
              <p>{contenido.secuencia?.[k] ?? "—"}</p>
            </div>
          ))}
        </div>
      </Bloque>
      <Bloque titulo="Metodología por proyectos · 7 etapas">
        <ol className="space-y-2">
          {(contenido.etapas ?? []).map((e, i) => (
            <li key={i} className="rounded-xl border bg-card p-3">
              <p className="text-sm font-semibold text-foreground">
                {i + 1}. {e.nombre}
              </p>
              <p>{e.descripcion}</p>
            </li>
          ))}
        </ol>
      </Bloque>
      <Bloque titulo="Evaluación formativa">{contenido.evaluacion ?? "Sin información."}</Bloque>
      <Bloque titulo="Rúbrica">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b text-foreground">
                <th className="p-2">Criterio</th>
                <th className="p-2">Excelente</th>
                <th className="p-2">Satisfactorio</th>
                <th className="p-2">En proceso</th>
              </tr>
            </thead>
            <tbody>
              {(contenido.rubrica ?? []).map((r, i) => (
                <tr key={i} className="border-b align-top">
                  <td className="p-2 font-medium text-foreground">{r.criterio}</td>
                  <td className="p-2">{r.excelente}</td>
                  <td className="p-2">{r.satisfactorio}</td>
                  <td className="p-2">{r.en_proceso}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Bloque>
      <Bloque titulo="Lista de cotejo">
        <Lista items={contenido.lista_cotejo} />
      </Bloque>
      <Bloque titulo="Materiales">
        <Lista items={contenido.materiales} />
      </Bloque>
      <Bloque titulo="Adecuaciones e inclusión">
        {contenido.adecuaciones ?? "Sin información."}
      </Bloque>
      <Bloque titulo="Transversalidad">{contenido.transversalidad ?? "Sin información."}</Bloque>
    </div>
  );
}
