// Server-only helper: calls the Lovable AI Gateway Responses API (streaming SSE)
// and returns the parsed structured planning payload.

export type SesionIA = {
  numero: number;
  titulo: string;
  inicio: string;
  desarrollo: string;
  cierre: string;
  materiales: string;
  evaluacion: string;
  duracion_min: number;
};

export type PlaneacionIA = {
  titulo: string;
  proposito: string;
  pda: string[];
  saberes: string[];
  secuencia: { inicio: string; desarrollo: string; cierre: string };
  etapas: { nombre: string; descripcion: string }[];
  evaluacion: string;
  rubrica: {
    criterio: string;
    excelente: string;
    satisfactorio: string;
    en_proceso: string;
  }[];
  lista_cotejo: string[];
  materiales: string[];
  adecuaciones: string;
  transversalidad: string;
  sesiones: SesionIA[];
};

const s = (desc: string) => ({ type: "string", description: desc });

const schema = {
  type: "object",
  additionalProperties: false,
  required: [
    "titulo",
    "proposito",
    "pda",
    "saberes",
    "secuencia",
    "etapas",
    "evaluacion",
    "rubrica",
    "lista_cotejo",
    "materiales",
    "adecuaciones",
    "transversalidad",
    "sesiones",
  ],
  properties: {
    titulo: s("Título de la planeación didáctica"),
    proposito: s("Propósito general del proyecto"),
    pda: { type: "array", items: s("Proceso de desarrollo de aprendizaje") },
    saberes: { type: "array", items: s("Saber disciplinar") },
    secuencia: {
      type: "object",
      additionalProperties: false,
      required: ["inicio", "desarrollo", "cierre"],
      properties: {
        inicio: s("Momento de inicio"),
        desarrollo: s("Momento de desarrollo"),
        cierre: s("Momento de cierre"),
      },
    },
    etapas: {
      type: "array",
      description: "Las 7 etapas de la metodología por proyectos",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["nombre", "descripcion"],
        properties: { nombre: s("Nombre de la etapa"), descripcion: s("Qué se hace") },
      },
    },
    evaluacion: s("Estrategia de evaluación formativa"),
    rubrica: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["criterio", "excelente", "satisfactorio", "en_proceso"],
        properties: {
          criterio: s("Criterio"),
          excelente: s("Nivel excelente"),
          satisfactorio: s("Nivel satisfactorio"),
          en_proceso: s("Nivel en proceso"),
        },
      },
    },
    lista_cotejo: { type: "array", items: s("Indicador verificable") },
    materiales: { type: "array", items: s("Material o recurso") },
    adecuaciones: s("Adecuaciones curriculares e inclusión"),
    transversalidad: s("Vinculación con otros campos formativos y ejes articuladores"),
    sesiones: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "numero",
          "titulo",
          "inicio",
          "desarrollo",
          "cierre",
          "materiales",
          "evaluacion",
          "duracion_min",
        ],
        properties: {
          numero: { type: "integer", description: "Número consecutivo de sesión" },
          titulo: s("Título de la sesión"),
          inicio: s("Actividades de inicio"),
          desarrollo: s("Actividades de desarrollo"),
          cierre: s("Actividades de cierre"),
          materiales: s("Materiales de la sesión"),
          evaluacion: s("Instrumento o evidencia de la sesión"),
          duracion_min: { type: "integer", description: "Duración en minutos" },
        },
      },
    },
  },
} as const;

const SISTEMA = `Eres un asistente pedagógico experto en la Nueva Escuela Mexicana (NEM) y en Telesecundaria Fase 6.
Diseñas planeaciones didácticas y secuencias por proyectos alineadas a Programas Sintéticos, Libros de Proyectos,
PDA, Saberes Disciplinares, Campos Formativos, Ejes Articuladores y evaluación formativa.
Reglas: nunca inventes nombres de programas oficiales o contenidos que no correspondan al grado indicado;
respeta la estructura curricular; escribe en español de México, claro y aplicable en aula rural;
la metodología por proyectos debe desarrollarse en sus 7 etapas.`;

export async function generarPlaneacionIA(input: {
  grado: number;
  tomo: number;
  trimestre: number | null;
  campo_formativo: string;
  disciplina: string;
  titulo: string;
  ppa: string | null;
  proyecto_academico: string | null;
  producto_integrador: string | null;
  numSesiones: number;
}): Promise<PlaneacionIA> {
  const apiKey = process.env['LOVABLE_API_KEY'];
  if (!apiKey) throw new Error("Falta la configuración de IA (LOVABLE_API_KEY).");

  const prompt = `Genera la planeación didáctica completa para este proyecto de aula de Telesecundaria:
- Grado: ${input.grado}°
- Tomo: ${input.tomo}
- Trimestre: ${input.trimestre ?? "no especificado"}
- Campo formativo: ${input.campo_formativo}
- Disciplina: ${input.disciplina}
- Título del proyecto: ${input.titulo}
- Proyecto parcial de aula (PPA): ${input.ppa ?? "por definir"}
- Proyecto académico: ${input.proyecto_academico ?? "por definir"}
- Producto integrador: ${input.producto_integrador ?? "por definir"}

Incluye exactamente ${input.numSesiones} sesiones numeradas de 1 a ${input.numSesiones}, cada una con inicio,
desarrollo, cierre, materiales, instrumento de evaluación y duración en minutos (50 por sesión).
Incluye las 7 etapas de la metodología por proyectos, rúbrica con al menos 4 criterios y lista de cotejo.`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      instructions: SISTEMA,
      input: prompt,
      stream: true,
      store: false,
      reasoning: { effort: "low", summary: "auto" },
      text: {
        format: {
          type: "json_schema",
          name: "planeacion_didactica",
          strict: true,
          schema,
        },
      },
    }),
  });

  if (!res.ok || !res.body) {
    const detalle = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("La IA está saturada, intenta de nuevo en un momento.");
    if (res.status === 402)
      throw new Error("Se agotaron los créditos de IA del espacio de trabajo.");
    throw new Error(`No se pudo generar la planeación (${res.status}). ${detalle.slice(0, 200)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let texto = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const raw = line.slice(5).trim();
      if (!raw || raw === "[DONE]") continue;
      try {
        const evt = JSON.parse(raw) as {
          type?: string;
          delta?: string;
          response?: { output_text?: string };
        };
        if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
          texto += evt.delta;
        } else if (evt.type === "response.completed" && evt.response?.output_text) {
          texto = evt.response.output_text;
        }
      } catch {
        // ignorar fragmentos no JSON
      }
    }
  }

  if (!texto.trim()) throw new Error("La IA no devolvió contenido. Intenta nuevamente.");

  try {
    return JSON.parse(texto) as PlaneacionIA;
  } catch {
    throw new Error("La respuesta de la IA no pudo interpretarse. Intenta nuevamente.");
  }
}
