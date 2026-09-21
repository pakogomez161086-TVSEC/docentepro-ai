import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  CAMPOS_FORMATIVOS,
  DISCIPLINAS,
  ESTADOS,
  TOMOS,
  TRIMESTRES,
  romano,
  type CampoFormativo,
} from "@/lib/curriculo";

export const Route = createFileRoute("/_authenticated/proyectos")({
  head: () => ({
    meta: [
      { title: "Proyectos de Aula — DocentePRO Telesecundaria" },
      {
        name: "description",
        content:
          "Organiza tus proyectos de aula por grado, tomo, campo formativo y disciplina, alineados a la NEM.",
      },
      { property: "og:title", content: "Proyectos de Aula — DocentePRO Telesecundaria" },
      {
        property: "og:description",
        content: "Proyectos parciales, académicos y productos integradores en un solo lugar.",
      },
    ],
  }),
  component: ProyectosPage,
});

type Proyecto = {
  id: string;
  grado: number;
  tomo: number;
  trimestre: number | null;
  campo_formativo: string;
  disciplina: string;
  titulo: string;
  ppa: string | null;
  proyecto_academico: string | null;
  producto_integrador: string | null;
  estado: keyof typeof ESTADOS;
  created_at: string;
};

const nuevoProyectoVacio = {
  grado: 1,
  tomo: 1,
  trimestre: 1,
  campo_formativo: CAMPOS_FORMATIVOS[0] as string,
  disciplina: DISCIPLINAS[CAMPOS_FORMATIVOS[0]][0] as string,
  titulo: "",
  ppa: "",
  proyecto_academico: "",
  producto_integrador: "",
};

function ProyectosPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [grado, setGrado] = useState("1");
  const [tomo, setTomo] = useState("todos");
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState(nuevoProyectoVacio);

  const { data: proyectos = [], isLoading } = useQuery({
    queryKey: ["proyectos", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proyectos")
        .select(
          "id, grado, tomo, trimestre, campo_formativo, disciplina, titulo, ppa, proyecto_academico, producto_integrador, estado, created_at",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Proyecto[];
    },
  });

  const crear = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sesión no disponible");
      if (!form.titulo.trim()) throw new Error("Escribe el título del proyecto");
      const { error } = await supabase.from("proyectos").insert({
        user_id: user.id,
        grado: form.grado,
        tomo: form.tomo,
        trimestre: form.trimestre,
        campo_formativo: form.campo_formativo,
        disciplina: form.disciplina,
        titulo: form.titulo.trim(),
        ppa: form.ppa || null,
        proyecto_academico: form.proyecto_academico || null,
        producto_integrador: form.producto_integrador || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Proyecto creado");
      setAbierto(false);
      setForm(nuevoProyectoVacio);
      void queryClient.invalidateQueries({ queryKey: ["proyectos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const eliminar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("proyectos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Proyecto eliminado");
      void queryClient.invalidateQueries({ queryKey: ["proyectos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const visibles = useMemo(
    () =>
      proyectos.filter(
        (p) => String(p.grado) === grado && (tomo === "todos" || String(p.tomo) === tomo),
      ),
    [proyectos, grado, tomo],
  );

  const disciplinas = DISCIPLINAS[form.campo_formativo as CampoFormativo] ?? [];

  return (
    <DashboardShell title="Proyectos de Aula" subtitle="Fase 6 · Nueva Escuela Mexicana">
      <section className="gradient-brand relative overflow-hidden rounded-3xl p-6 shadow-lift sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold text-brand-foreground sm:text-3xl">
              Proyectos de Aula
            </h1>
            <p className="mt-2 max-w-lg text-sm text-brand-foreground/75">
              Organiza tus proyectos por grado y tomo, con campo formativo, disciplina, proyecto
              académico y producto integrador.
            </p>
          </div>
          <Dialog open={abierto} onOpenChange={setAbierto}>
            <DialogTrigger asChild>
              <Button size="lg" variant="secondary" className="shadow-soft">
                <Plus className="mr-1 h-4 w-4" />
                Nuevo proyecto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Nuevo proyecto de aula</DialogTitle>
                <DialogDescription>
                  Solo lo esencial: el resto se genera después con la IA pedagógica.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>Grado</Label>
                    <Select
                      value={String(form.grado)}
                      onValueChange={(v) => setForm((f) => ({ ...f, grado: Number(v) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3].map((g) => (
                          <SelectItem key={g} value={String(g)}>
                            {g}°
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tomo</Label>
                    <Select
                      value={String(form.tomo)}
                      onValueChange={(v) => setForm((f) => ({ ...f, tomo: Number(v) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TOMOS.map((t) => (
                          <SelectItem key={t} value={String(t)}>
                            Tomo {romano(t)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Trimestre</Label>
                    <Select
                      value={String(form.trimestre)}
                      onValueChange={(v) => setForm((f) => ({ ...f, trimestre: Number(v) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRIMESTRES.map((t) => (
                          <SelectItem key={t} value={String(t)}>
                            {t}º
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Campo formativo</Label>
                  <Select
                    value={form.campo_formativo}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        campo_formativo: v,
                        disciplina: DISCIPLINAS[v as CampoFormativo][0] ?? "",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CAMPOS_FORMATIVOS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Disciplina</Label>
                  <Select
                    value={form.disciplina}
                    onValueChange={(v) => setForm((f) => ({ ...f, disciplina: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {disciplinas.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="titulo">Título del proyecto</Label>
                  <Input
                    id="titulo"
                    value={form.titulo}
                    placeholder="Ej. Nuestra comunidad cuenta su historia"
                    onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ppa">Proyecto parcial de aula (PPA)</Label>
                  <Textarea
                    id="ppa"
                    rows={2}
                    value={form.ppa}
                    onChange={(e) => setForm((f) => ({ ...f, ppa: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pa">Proyecto académico</Label>
                  <Textarea
                    id="pa"
                    rows={2}
                    value={form.proyecto_academico}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, proyecto_academico: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pi">Producto integrador</Label>
                  <Input
                    id="pi"
                    value={form.producto_integrador}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, producto_integrador: e.target.value }))
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => crear.mutate()}
                  disabled={crear.isPending}
                  className="w-full sm:w-auto"
                >
                  {crear.isPending ? "Guardando…" : "Crear proyecto"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={grado} onValueChange={setGrado}>
          <TabsList>
            <TabsTrigger value="1">1° grado</TabsTrigger>
            <TabsTrigger value="2">2° grado</TabsTrigger>
            <TabsTrigger value="3">3° grado</TabsTrigger>
          </TabsList>
        </Tabs>
        <Tabs value={tomo} onValueChange={setTomo}>
          <TabsList>
            <TabsTrigger value="todos">Todos los tomos</TabsTrigger>
            {TOMOS.map((t) => (
              <TabsTrigger key={t} value={String(t)}>
                Tomo {romano(t)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando proyectos…</p>
      ) : visibles.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary">
              <BookOpen className="h-5 w-5" />
            </span>
            <p className="font-semibold">Aún no hay proyectos en este filtro</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Crea tu primer proyecto de aula y después genera su planeación y sesiones en un clic.
            </p>
            <Button onClick={() => setAbierto(true)}>
              <Plus className="mr-1 h-4 w-4" /> Nuevo proyecto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibles.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.04 * i }}
            >
              <Card className="h-full border-border/70 shadow-soft">
                <CardHeader className="space-y-2 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {p.grado}° · Tomo {romano(p.tomo)}
                    </Badge>
                    {p.trimestre ? (
                      <Badge variant="outline">Trim. {p.trimestre}</Badge>
                    ) : null}
                    <Badge variant={ESTADOS[p.estado]?.tone ?? "secondary"}>
                      {ESTADOS[p.estado]?.label ?? p.estado}
                    </Badge>
                  </div>
                  <CardTitle className="text-base leading-snug">{p.titulo}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {p.campo_formativo} · {p.disciplina}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {p.ppa ? (
                    <p className="line-clamp-3 text-muted-foreground">
                      <span className="font-medium text-foreground">PPA: </span>
                      {p.ppa}
                    </p>
                  ) : null}
                  {p.producto_integrador ? (
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Producto: </span>
                      {p.producto_integrador}
                    </p>
                  ) : null}
                  <div className="flex justify-end pt-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Eliminar proyecto"
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
    </DashboardShell>
  );
}
