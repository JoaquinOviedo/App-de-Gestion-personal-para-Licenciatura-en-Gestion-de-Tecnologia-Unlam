/**
 * types/index.ts — Definiciones de tipos centrales de la aplicación.
 * Toda interfaz y tipo compartido vive aquí.
 */

// =====================================================================
// MATERIA
// =====================================================================

export interface MateriaFechas {
  p1?: string;
  p2?: string;
  recup?: string;
  final?: string;
}

export interface Materia {
  id: string;
  name: string;
  year: number;
  correlatives?: string[];
  enCursoManual?: boolean;

  // Notas de parciales
  notaP1: number | null;
  notaP2: number | null;
  notaRecup: number | null;

  // Ausentes de parciales
  ausenteP1?: boolean;
  ausenteP2?: boolean;
  ausenteRecup?: boolean;

  // Notas de finales (3 llamados)
  notaF1: number | null;
  notaF2: number | null;
  notaF3: number | null;

  // Ausentes de finales
  ausenteF1?: boolean;
  ausenteF2?: boolean;
  ausenteF3?: boolean;

  // Fechas de exámenes
  fechas?: MateriaFechas;

  // Nota final manual (override)
  notaFinalManual?: number | null;
}

// =====================================================================
// ESTADOS
// =====================================================================

export type StatusKey =
  | 'BLOQUEADA'
  | 'PENDIENTE'
  | 'EN_CURSO'
  | 'PENDIENTE_RECUP'
  | 'PENDIENTE_FINAL'
  | 'PROMOCIONADA'
  | 'APROBADA'
  | 'LIBRE';

export interface StatusConfig {
  label: string;
  color: string;
  bg: string;
  border: string;
  badge: string;
  dot: string;
}

// =====================================================================
// ESTADÍSTICAS
// =====================================================================

export interface ExamenesRestantes {
  total: number;
  parciales: number;
  recups: number;
  finales: number;
}

export interface Estadisticas {
  total: number;
  aprobadas: number;
  promocionadas: number;
  regulares: number;
  enCurso: number;
  pendientes: number;
  bloqueadas: number;
  libres: number;
  porcentajeAvance: number;
  promedio: number;
  examenesRestantes: ExamenesRestantes;
}

// =====================================================================
// CALENDARIO
// =====================================================================

export type InstanciaExamen = 'p1' | 'p2' | 'recup' | 'final';

export interface FechaOrdenada {
  materiaId: string;
  materiaNombre: string;
  instancia: InstanciaExamen;
  label: string;
  fecha: Date;
  dateStr: string;
}

export interface EventoCalendario {
  materiaId: string;
  materiaNombre: string;
  instancia: InstanciaExamen;
  label: string;
  color: 'sky' | 'violet' | 'amber' | 'emerald' | 'zinc';
}

export type EventosPorFecha = Record<string, EventoCalendario[]>;
