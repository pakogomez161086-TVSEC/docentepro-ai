export const CAMPOS_FORMATIVOS = [
  "Lenguajes",
  "Saberes y Pensamiento Científico",
  "Ética, Naturaleza y Sociedades",
  "De lo Humano y lo Comunitario",
] as const;

export type CampoFormativo = (typeof CAMPOS_FORMATIVOS)[number];

export const DISCIPLINAS: Record<CampoFormativo, string[]> = {
  Lenguajes: ["Español", "Inglés", "Artes"],
  "Saberes y Pensamiento Científico": ["Matemáticas", "Ciencias (Biología)", "Física", "Química"],
  "Ética, Naturaleza y Sociedades": ["Historia", "Geografía", "Formación Cívica y Ética"],
  "De lo Humano y lo Comunitario": ["Educación Física", "Tecnología", "Tutoría y Educación Socioemocional"],
};

export const GRADOS = [1, 2, 3] as const;
export const TOMOS = [1, 2, 3] as const;
export const TRIMESTRES = [1, 2, 3] as const;

export const ESTADOS = {
  borrador: { label: "Borrador", tone: "secondary" as const },
  en_curso: { label: "En curso", tone: "default" as const },
  completado: { label: "Completado", tone: "outline" as const },
};

export const romano = (n: number) => ["", "I", "II", "III"][n] ?? String(n);
