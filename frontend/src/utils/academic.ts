/**
 * utils/academic.ts — Motor de Lógica Académica
 * Funciones puras para calcular estado de materias y estadísticas de carrera.
 * TIPADO FUERTE: Todas las funciones tienen tipos explícitos.
 */

import type {
  Materia,
  StatusKey,
  StatusConfig,
  Estadisticas,
  ExamenesRestantes,
  FechaOrdenada,
  EventoCalendario,
  EventosPorFecha,
  InstanciaExamen,
} from '../types';

// =====================================================================
// CONSTANTES DE ESTADO
// =====================================================================

export const STATUS: Record<StatusKey, StatusKey> = {
  BLOQUEADA:       'BLOQUEADA',
  PENDIENTE:       'PENDIENTE',
  EN_CURSO:        'EN_CURSO',
  PENDIENTE_RECUP: 'PENDIENTE_RECUP',
  PENDIENTE_FINAL: 'PENDIENTE_FINAL',
  PROMOCIONADA:    'PROMOCIONADA',
  APROBADA:        'APROBADA',
  LIBRE:           'LIBRE',
};

// =====================================================================
// HELPERS INTERNOS
// =====================================================================

/** Devuelve 0 si ausente, o la nota (null → 0 también). */
function getVal(nota: number | null | undefined, ausente: boolean | undefined): number {
  if (ausente) return 0;
  return nota ?? 0;
}

// =====================================================================
// FUNCIONES PRINCIPALES
// =====================================================================

export function correlativasCumplidas(materia: Materia, todasLasMaterias: Materia[]): boolean {
  if (!materia.correlatives || materia.correlatives.length === 0) return true;
  return materia.correlatives.every((corrId) => {
    const corr = todasLasMaterias.find((m) => m.id === corrId);
    if (!corr) return false;
    const estado = calcularEstado(corr, todasLasMaterias);
    return estado === STATUS.APROBADA || estado === STATUS.PENDIENTE_FINAL || estado === STATUS.PROMOCIONADA;
  });
}

export function calcularEstado(materia: Materia, todasLasMaterias: Materia[]): StatusKey {
  const {
    notaP1, ausenteP1,
    notaP2, ausenteP2,
    notaRecup, ausenteRecup,
    notaF1, ausenteF1,
    notaF2, ausenteF2,
    notaF3, ausenteF3,
    enCursoManual,
  } = materia;

  // 1. Aprobación por finales
  const f1 = getVal(notaF1, ausenteF1);
  const f2 = getVal(notaF2, ausenteF2);
  const f3 = getVal(notaF3, ausenteF3);

  if (f1 >= 4 || f2 >= 4 || f3 >= 4) return STATUS.APROBADA;

  // Si consumió los 3 llamados y desaprobó/faltó a todos → Libre
  const hasF1 = notaF1 !== null || ausenteF1;
  const hasF2 = notaF2 !== null || ausenteF2;
  const hasF3 = notaF3 !== null || ausenteF3;

  if (hasF1 && hasF2 && hasF3 && f1 < 4 && f2 < 4 && f3 < 4) {
    return STATUS.LIBRE;
  }

  // 2. Bloqueada por correlativas
  if (!correlativasCumplidas(materia, todasLasMaterias)) {
    return STATUS.BLOQUEADA;
  }

  const p1 = getVal(notaP1, ausenteP1);
  const p2 = getVal(notaP2, ausenteP2);
  const rec = getVal(notaRecup, ausenteRecup);

  const hasP1 = notaP1 !== null || ausenteP1;
  const hasP2 = notaP2 !== null || ausenteP2;
  const fueARecup = notaRecup !== null || ausenteRecup;

  // 3. Sin notas cargadas
  if (!hasP1 && !hasP2) {
    return enCursoManual ? STATUS.EN_CURSO : STATUS.PENDIENTE;
  }

  // 4. Solo P1 cargada
  if (hasP1 && !hasP2 && !fueARecup) {
    return STATUS.EN_CURSO;
  }

  // 5. Con ambas notas cargadas
  if (hasP1 && hasP2) {
    let efectivaP1 = p1;
    let efectivaP2 = p2;
    const recupTarget = detectarRecupTarget(materia);

    if (fueARecup && recupTarget === 'P1') efectivaP1 = rec;
    if (fueARecup && recupTarget === 'P2') efectivaP2 = rec;

    // Libre directo si ambas son < 4
    if (p1 < 4 && p2 < 4) return STATUS.LIBRE;

    // Si el recup está aplazado o ausente
    if (fueARecup && rec < 4) {
      // Si ya tenían >= 4 en ambos parciales, el recup era opcional para promocionar.
      // No pierden la regularidad, simplemente van a final.
      if (p1 >= 4 && p2 >= 4) return STATUS.PENDIENTE_FINAL;
      // Si debían regularizar, quedan libres.
      return STATUS.LIBRE;
    }

    const ambasAprobadas = efectivaP1 >= 4 && efectivaP2 >= 4;

    if (!ambasAprobadas) {
      if (!fueARecup) return STATUS.PENDIENTE_RECUP;
      return STATUS.LIBRE;
    }

    // Ambas aprobadas (≥4)
    if (efectivaP1 >= 7 && efectivaP2 >= 7) {
      return STATUS.PROMOCIONADA;
    }

    if (!fueARecup) {
      // Tiene derecho a recuperar si una es >= 7 y la otra es < 7
      if ((efectivaP1 >= 7 && efectivaP2 < 7) || (efectivaP2 >= 7 && efectivaP1 < 7)) {
        return STATUS.PENDIENTE_RECUP;
      }
      // Si ambas son < 7 (ej 5 y 6), no hay beneficio en recuperar → Final directo
      return STATUS.PENDIENTE_FINAL;
    }

    // Ya fue a recup y sacó entre 4 y 6
    return STATUS.PENDIENTE_FINAL;
  }

  return STATUS.PENDIENTE;
}

export function puedeCargarRecup(materia: Materia): boolean {
  const hasP1 = materia.notaP1 !== null || materia.ausenteP1;
  const hasP2 = materia.notaP2 !== null || materia.ausenteP2;
  const fueARecup = materia.notaRecup !== null || materia.ausenteRecup;

  if (!hasP1 || !hasP2) return false;
  if (fueARecup) return true;

  const p1 = getVal(materia.notaP1, materia.ausenteP1);
  const p2 = getVal(materia.notaP2, materia.ausenteP2);

  if (p1 < 4 && p2 < 4) return false;         // Libre
  if (p1 >= 7 && p2 >= 7) return false;        // Promocionada
  if (p1 >= 4 && p1 < 7 && p2 >= 4 && p2 < 7) return false; // Va a final directo

  return true;
}

export function detectarRecupTarget(materia: Materia): 'P1' | 'P2' | null {
  const p1 = getVal(materia.notaP1, materia.ausenteP1);
  const p2 = getVal(materia.notaP2, materia.ausenteP2);

  const hasP1 = materia.notaP1 !== null || materia.ausenteP1;
  const hasP2 = materia.notaP2 !== null || materia.ausenteP2;

  if (!hasP1 || !hasP2) return null;

  if (p1 < 4 && p2 >= 4) return 'P1';
  if (p2 < 4 && p1 >= 4) return 'P2';

  if (p1 < 7 && p2 >= 7) return 'P1';
  if (p2 < 7 && p1 >= 7) return 'P2';

  return null;
}

export function calcularNotaFinal(materia: Materia, todasLasMaterias: Materia[]): number | null {
  if (materia.notaFinalManual != null) return materia.notaFinalManual;

  const estado = calcularEstado(materia, todasLasMaterias);
  
  if (estado === STATUS.APROBADA) {
    const f1 = getVal(materia.notaF1, materia.ausenteF1);
    if (f1 >= 4) return f1;
    const f2 = getVal(materia.notaF2, materia.ausenteF2);
    if (f2 >= 4) return f2;
    const f3 = getVal(materia.notaF3, materia.ausenteF3);
    if (f3 >= 4) return f3;
  }
  
  if (estado === STATUS.PROMOCIONADA) {
    const p1 = getVal(materia.notaP1, materia.ausenteP1);
    const p2 = getVal(materia.notaP2, materia.ausenteP2);
    const rec = getVal(materia.notaRecup, materia.ausenteRecup);
    const fueARecup = materia.notaRecup !== null || materia.ausenteRecup;
    
    let efectivaP1 = p1;
    let efectivaP2 = p2;
    if (fueARecup) {
       const recupTarget = detectarRecupTarget(materia);
       if (recupTarget === 'P1') efectivaP1 = rec;
       if (recupTarget === 'P2') efectivaP2 = rec;
    }
    
    return Math.round((efectivaP1 + efectivaP2) / 2);
  }
  
  return null;
}

export function examenesRestantesPeorCaso(materia: Materia, todasLasMaterias: Materia[]): ExamenesRestantes {
  const estado = calcularEstado(materia, todasLasMaterias);
  const hasP1 = materia.notaP1 !== null || materia.ausenteP1;
  const hasP2 = materia.notaP2 !== null || materia.ausenteP2;

  switch (estado) {
    case STATUS.APROBADA:
    case STATUS.PROMOCIONADA:
      return { total: 0, parciales: 0, recups: 0, finales: 0 };

    case STATUS.PENDIENTE_FINAL:
      return { total: 1, parciales: 0, recups: 0, finales: 1 };

    case STATUS.LIBRE:
    case STATUS.PENDIENTE:
    case STATUS.BLOQUEADA:
      return { total: 3, parciales: 2, recups: 0, finales: 1 };

    case STATUS.PENDIENTE_RECUP:
      return { total: 2, parciales: 0, recups: 1, finales: 1 };

    case STATUS.EN_CURSO: {
      if (!hasP1 && !hasP2) return { total: 3, parciales: 2, recups: 0, finales: 1 };
      if (hasP1 && !hasP2)  return { total: 2, parciales: 1, recups: 0, finales: 1 };
      return { total: 3, parciales: 2, recups: 0, finales: 1 };
    }

    default:
      return { total: 3, parciales: 2, recups: 0, finales: 1 };
  }
}

export function calcularEstadisticas(materias: Materia[]): Estadisticas {
  const total = materias.length;
  let aprobadas = 0;
  let regulares = 0;
  let enCurso = 0;
  let pendientes = 0;
  let bloqueadas = 0;
  let libres = 0;
  let promocionadas = 0;

  let totalExamenes = 0;
  let totalParciales = 0;
  let totalRecups = 0;
  let totalFinales = 0;

  let sumaNotas = 0;
  let cantidadNotas = 0;

  materias.forEach((m) => {
    const estado = calcularEstado(m, materias);
    const examenes = examenesRestantesPeorCaso(m, materias);

    totalExamenes += examenes.total;
    totalParciales += examenes.parciales;
    totalRecups += examenes.recups;
    totalFinales += examenes.finales;

    switch (estado) {
      case STATUS.APROBADA:        aprobadas++; break;
      case STATUS.PROMOCIONADA:    promocionadas++; aprobadas++; break;
      case STATUS.PENDIENTE_FINAL: regulares++; break;
      case STATUS.EN_CURSO:
      case STATUS.PENDIENTE_RECUP: enCurso++; break;
      case STATUS.PENDIENTE:       pendientes++; break;
      case STATUS.BLOQUEADA:       bloqueadas++; break;
      case STATUS.LIBRE:           libres++; break;
    }

    if (estado === STATUS.APROBADA || estado === STATUS.PROMOCIONADA) {
      const nota = calcularNotaFinal(m, materias);
      if (nota !== null) {
        sumaNotas += nota;
        cantidadNotas++;
      }
    }
  });

  const porcentajeAvance = Math.round((aprobadas / total) * 100);
  const promedio = cantidadNotas > 0 ? Number((sumaNotas / cantidadNotas).toFixed(2)) : 0;

  return {
    total, aprobadas, promocionadas, regulares, enCurso,
    pendientes, bloqueadas, libres, porcentajeAvance, promedio,
    examenesRestantes: {
      total: totalExamenes,
      parciales: totalParciales,
      recups: totalRecups,
      finales: totalFinales,
    },
  };
}

// =====================================================================
// CONFIGURACIÓN VISUAL DE ESTADOS
// =====================================================================

export const STATUS_CONFIG: Record<StatusKey, StatusConfig> = {
  BLOQUEADA: {
    label: 'Bloqueada',
    color: 'text-zinc-500',
    bg: 'bg-zinc-900/60',
    border: 'border-zinc-700/50',
    badge: 'bg-zinc-800 text-zinc-400',
    dot: 'bg-zinc-500',
  },
  PENDIENTE: {
    label: 'Pendiente',
    color: 'text-zinc-300',
    bg: 'bg-zinc-900/80',
    border: 'border-zinc-600/50',
    badge: 'bg-zinc-700 text-zinc-300',
    dot: 'bg-zinc-400',
  },
  EN_CURSO: {
    label: 'En Curso',
    color: 'text-sky-300',
    bg: 'bg-sky-950/40',
    border: 'border-sky-700/50',
    badge: 'bg-sky-900/60 text-sky-300',
    dot: 'bg-sky-400',
  },
  PENDIENTE_RECUP: {
    label: 'Pend. Recuperatorio',
    color: 'text-amber-400',
    bg: 'bg-amber-950/40',
    border: 'border-amber-700/50',
    badge: 'bg-amber-900/60 text-amber-300',
    dot: 'bg-amber-400',
  },
  PENDIENTE_FINAL: {
    label: 'Pendiente Final',
    color: 'text-orange-300',
    bg: 'bg-orange-950/30',
    border: 'border-orange-700/50',
    badge: 'bg-orange-900/50 text-orange-300',
    dot: 'bg-orange-400',
  },
  PROMOCIONADA: {
    label: 'Promocionada',
    color: 'text-emerald-300',
    bg: 'bg-emerald-950/30',
    border: 'border-emerald-700/50',
    badge: 'bg-emerald-900/50 text-emerald-300',
    dot: 'bg-emerald-400',
  },
  APROBADA: {
    label: 'Aprobada',
    color: 'text-emerald-300',
    bg: 'bg-emerald-950/30',
    border: 'border-emerald-700/50',
    badge: 'bg-emerald-900/50 text-emerald-300',
    dot: 'bg-emerald-400',
  },
  LIBRE: {
    label: 'Libre / Recursar',
    color: 'text-red-300',
    bg: 'bg-red-950/30',
    border: 'border-red-700/50',
    badge: 'bg-red-900/50 text-red-300',
    dot: 'bg-red-400',
  },
};

// =====================================================================
// UTILIDADES DE CALENDARIO
// =====================================================================

const INSTANCIA_LABELS: Record<string, string> = {
  p1: 'Parcial 1',
  p2: 'Parcial 2',
  recup: 'Recuperatorio',
  final: 'Final',
};

const INSTANCIA_META: Record<string, { label: string; color: EventoCalendario['color'] }> = {
  p1:    { label: 'Parcial 1',     color: 'sky'     },
  p2:    { label: 'Parcial 2',     color: 'violet'  },
  recup: { label: 'Recuperatorio', color: 'amber'   },
  final: { label: 'Final',         color: 'emerald' },
};

export function obtenerFechasOrdenadas(materias: Materia[]): FechaOrdenada[] {
  const fechas: FechaOrdenada[] = [];
  materias.forEach((m) => {
    if (!m.fechas) return;
    (Object.entries(m.fechas) as [InstanciaExamen, string | undefined][]).forEach(([key, dateStr]) => {
      if (!dateStr) return;
      fechas.push({
        materiaId: m.id,
        materiaNombre: m.name,
        instancia: key,
        label: INSTANCIA_LABELS[key] || key,
        fecha: new Date(dateStr + 'T12:00:00'),
        dateStr,
      });
    });
  });

  fechas.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
  return fechas;
}

export function obtenerEventosPorFecha(materias: Materia[]): EventosPorFecha {
  const map: EventosPorFecha = {};
  materias.forEach((m) => {
    if (!m.fechas) return;
    (Object.entries(m.fechas) as [InstanciaExamen, string | undefined][]).forEach(([key, dateStr]) => {
      if (!dateStr) return;
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push({
        materiaId: m.id,
        materiaNombre: m.name,
        instancia: key,
        label: INSTANCIA_META[key]?.label || key,
        color: INSTANCIA_META[key]?.color || 'zinc',
      });
    });
  });
  return map;
}
