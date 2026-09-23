import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { CalendarDays, CheckCircle2, Circle, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda Docente — DocentePRO Telesecundaria" },
      {
        name: "description",
        content:
          "Registro diario de tareas, bitácora de incidencias, acuerdos con padres, Consejo Técnico y evaluaciones.",
      },
      { property: "og:title", content: "Agenda Docente — DocentePRO Telesecundaria" },
      {
        property: "og:description",
        content: "Organiza tu semana escolar: tareas, incidencias, acuerdos, CTE y evaluaciones.",
      },
    ],
  }),
  component: AgendaPage,
});

type Tipo = "tarea" | "incidencia" | "acuerdo" | "cte" | "evaluacion" | "evento";
type Prioridad = "baja" | "media" | "alta";

type Entrada = {
  id: string;
  tipo: Tipo;
  titulo: string;
  descripcion: string | null;
  fecha: string;
  hora: string | null;
  prioridad: Prioridad;
  completado: boolean;
};

const TIPOS: Record<Tipo, { label: string; chip: string }> = {
  tarea: { label: "Tarea", chip: "bg-primary/10 text-primary" },
  incidencia: { label: "Incidencia", chip: "bg-destructive/10 text-destructive" },
  acuerdo: { label: "Acuerdo con padres", chip: "bg-emerald-500/10 text-emerald-600" },
  cte: { label: "Consejo Técnico", chip: "bg-amber-500/15 text-amber-600" },
  evaluacion: { label: "Evaluación", chip: "bg-sky-500/10 text-sky-600" },
  evento: { label: "Evento escolar", chip: "bg-orange-500/10 text-orange-600" },
};

const PRIORIDADES: Record<Prioridad, { label: string; tone: "secondary" | "outline" | "destructive" }> =
  {
    baja: { label: "Baja", tone: "outline" },
    media: { label: "Media", tone: "secondary" },
    alta: { label: "Alta", tone: "destructive" },
  };

const hoyISO = () => new Date().toISOString().slice(0, 10);

const formVacio = {
  tipo: "tarea" as Tipo,
  titulo: "",
  descripcion: "",
  fecha: hoyISO(),
  hora: "",
  prioridad: "media" as Prioridad,
};

function formatoFecha(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y ?? 2026, (m ?? 1) - 1, d ?? 1).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function AgendaPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filtro, setFiltro] = useState<"todas" | Tipo>("todas");
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState(formVacio);

  const { data: entradas = [], isLoading } = useQuery({
    queryKey: ["agenda", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agenda_entradas")
        .select("id, tipo, titulo, descripcion, fecha, hora, prioridad, completado")
        .order("fecha", { ascending: true })
        .order("hora", { ascending: true, nullsFirst: true });
      if (error) throw error;
      return (data ?? []) as Entrada[];
    },
  });

  const crear = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sesión no disponible");
      if (!form.titulo.trim()) throw new Error("Escribe un título");
      const { error } = await supabase.from("agenda_entradas").insert({
        user_id: user.id,
        tipo: form.tipo,
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim() || null,
        fecha: form.fecha,
        hora: form.hora || null,
        prioridad: form.prioridad,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Registro agregado a tu agenda");
      setAbierto(false);
      setForm({ ...formVacio, fecha: hoyISO() });
      void queryClient.invalidateQueries({ queryKey: ["agenda"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const alternar = useMutation({
    mutationFn: async (entrada: Entrada) => {
      const { error } = await supabase
        .from("agenda_entradas")
        .update({ completado: !entrada.completado })
        .eq("id", entrada.id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["agenda"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const eliminar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("agenda_entradas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Registro eliminado");
      void queryClient.invalidateQueries({ queryKey: ["agenda"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const visibles = useMemo(
    () => entradas.filter((e) => filtro === "todas" || e.tipo === filtro),
    [entradas, filtro],
  );

  const grupos = useMemo(() => {
    const mapa = new Map<string, Entrada[]>();
    for (const e of visibles) {
      const lista = mapa.get(e.fecha) ?? [];
      lista.push(e);
      mapa.set(e.fecha, lista);
    }
    return [...mapa.entries()];
  }, [visibles]);

  const hoy = hoyISO();
  const pendientesHoy = entradas.filter((e) => e.fecha === hoy && !e.completado).length;
  const completadas = entradas.filter((e) => e.completado).length;

  return (
    <DashboardShell title="Agenda Docente" subtitle="Tu bitácora diaria de trabajo escolar">
      <section className="gradient-brand relative overflow-hidden rounded-3xl p-6 shadow-lift sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold text-brand-foreground sm:text-3xl">Agenda Docente</h1>
            <p className="mt-2 max-w-lg text-sm text-brand-foreground/75">
              Tareas del día, bitácora de incidencias, acuerdos con padres, Consejo Técnico,
              evaluaciones y eventos escolares en un solo lugar.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-brand-foreground/85">
              <span className="rounded-full bg-white/15 px-3 py-1">
                {pendientesHoy} pendientes hoy
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1">{completadas} completadas</span>
              <span className="rounded-full bg-white/15 px-3 py-1">
                {entradas.length} registros totales
              </span>
            </div>
          </div>

          <Dialog open={abierto} onOpenChange={setAbierto}>
            <DialogTrigger asChild>
              <Button size="lg" variant="secondary" className="shadow-soft">
                <Plus className="mr-1 h-4 w-4" /> Nuevo registro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Nuevo registro de agenda</DialogTitle>
                <DialogDescription>
                  Elige el formato y escribe solo lo indispensable.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4">
                <div className="space-y-1.5">
                  <Label>Tipo de registro</Label>
                  <Select
                    value={form.tipo}
                    onValueChange={(v) => setForm((f) => ({ ...f, tipo: v as Tipo }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(TIPOS) as Tipo[]).map((t) => (
                        <SelectItem key={t} value={t}>
                          {TIPOS[t].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ag-titulo">Título</Label>
                  <Input
                    id="ag-titulo"
                    value={form.titulo}
                    placeholder="Ej. Entrega de proyecto 1° A"
                    onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="ag-fecha">Fecha</Label>
                    <Input
                      id="ag-fecha"
                      type="date"
                      value={form.fecha}
                      onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ag-hora">Hora</Label>
                    <Input
                      id="ag-hora"
                      type="time"
                      value={form.hora}
                      onChange={(e) => setForm((f) => ({ ...f, hora: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Prioridad</Label>
                    <Select
                      value={form.prioridad}
                      onValueChange={(v) => setForm((f) => ({ ...f, prioridad: v as Prioridad }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(PRIORIDADES) as Prioridad[]).map((p) => (
                          <SelectItem key={p} value={p}>
                            {PRIORIDADES[p].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ag-desc">Detalle</Label>
                  <Textarea
                    id="ag-desc"
                    rows={3}
                    value={form.descripcion}
                    placeholder="Acuerdos, observaciones o seguimiento"
                    onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => crear.mutate()}
                  disabled={crear.isPending}
                  className="w-full sm:w-auto"
                >
                  {crear.isPending ? "Guardando…" : "Agregar a la agenda"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      <Tabs value={filtro} onValueChange={(v) => setFiltro(v as "todas" | Tipo)}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="todas">Todo</TabsTrigger>
          {(Object.keys(TIPOS) as Tipo[]).map((t) => (
            <TabsTrigger key={t} value={t}>
              {TIPOS[t].label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando agenda…</p>
      ) : grupos.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary">
              <CalendarDays className="h-5 w-5" />
            </span>
            <p className="font-semibold">Tu agenda está vacía</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Registra tareas, incidencias, acuerdos con padres, sesiones de Consejo Técnico o
              evaluaciones y consérvalas siempre a la mano.
            </p>
            <Button onClick={() => setAbierto(true)}>
              <Plus className="mr-1 h-4 w-4" /> Nuevo registro
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {grupos.map(([fecha, items], gi) => (
            <motion.section
              key={fecha}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.04 * gi }}
              className="space-y-3"
            >
              <div className="flex items-center gap-3">
                <h2 className="font-display text-sm font-semibold capitalize">
                  {formatoFecha(fecha)}
                </h2>
                {fecha === hoy ? <Badge>Hoy</Badge> : null}
                <span className="h-px flex-1 bg-border" />
              </div>

              <div className="grid gap-3">
                {items.map((e) => (
                  <Card key={e.id} className="border-border/70 shadow-soft">
                    <CardContent className="flex items-start gap-3 p-4">
                      <button
                        type="button"
                        aria-label={e.completado ? "Marcar como pendiente" : "Marcar completado"}
                        onClick={() => alternar.mutate(e)}
                        className="mt-0.5 text-muted-foreground transition-colors hover:text-primary"
                      >
                        {e.completado ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TIPOS[e.tipo].chip}`}
                          >
                            {TIPOS[e.tipo].label}
                          </span>
                          {e.hora ? (
                            <Badge variant="outline">{e.hora.slice(0, 5)}</Badge>
                          ) : null}
                          <Badge variant={PRIORIDADES[e.prioridad].tone}>
                            {PRIORIDADES[e.prioridad].label}
                          </Badge>
                        </div>
                        <p
                          className={`font-medium leading-snug ${
                            e.completado ? "text-muted-foreground line-through" : ""
                          }`}
                        >
                          {e.titulo}
                        </p>
                        {e.descripcion ? (
                          <p className="text-sm text-muted-foreground">{e.descripcion}</p>
                        ) : null}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Eliminar registro"
                        onClick={() => eliminar.mutate(e.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.section>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
