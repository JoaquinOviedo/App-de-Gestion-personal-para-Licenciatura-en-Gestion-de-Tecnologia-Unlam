/**
 * academic.js — Motor de Lógica Académica
 * Funciones puras para calcular estado de materias y estadísticas de carrera.
 */

// =====================================================================
// TIPOS DE ESTADO
// =====================================================================
export const STATUS = {
  BLOQUEADA: 'BLOQUEADA',
  PENDIENTE: 'PENDIENTE',
  EN_CURSO: 'EN_CURSO',
  REGULAR: 'REGULAR',
  PROMOCIONADA: 'PROMOCIONADA',
  APROBADA: 'APROBADA',
  LIBRE: 'LIBRE',
};

// =====================================================================
// A) CALCULAR ESTADO DE UNA MATERIA
// =====================================================================

/**
 * Determina si una materia está desbloqueada (correlativas cumplidas).
 * Una correlativa está cumplida si su estado es APROBADA, PROMOCIONADA o REGULAR.
 */
export function correlativasCumplidas(materia, todasLasMaterias) {
  if (!materia.correlatives || materia.correlatives.length === 0) return true;
  return materia.correlatives.every((corrId) => {
    const corr = todasLasMaterias.find((m) => m.id === corrId);
    if (!corr) return false;
    const estado = calcularEstado(corr, todasLasMaterias);
    return estado === STATUS.APROBADA || estado === STATUS.REGULAR || estado === STATUS.PROMOCIONADA;
  });
}

/**
 * Calcula el estado académico de una materia.
 * `enCursoManual`: permite marcar manualmente una materia como "En Curso"
 * antes de tener notas cargadas.
 */
export function calcularEstado(materia, todasLasMaterias) {
  const { notaP1, notaP2, notaRecup, recupTarget, finalAprobado, enCursoManual } = materia;

  // 1. APROBADA: Final aprobado
  if (finalAprobado) return STATUS.APROBADA;

  // ---- Determinar notas efectivas (considerando recuperatorio) ----
  let efectivaP1 = notaP1;
  let efectivaP2 = notaP2;
  const fueARecup = notaRecup !== null && notaRecup !== undefined;

  if (fueARecup && recupTarget === 'P1') efectivaP1 = notaRecup;
  if (fueARecup && recupTarget === 'P2') efectivaP2 = notaRecup;

  // 2. LIBRE / RECURSAR
  // 2a. Ambos parciales desaprobados
  if (notaP1 !== null && notaP2 !== null && notaP1 < 4 && notaP2 < 4) {
    return STATUS.LIBRE;
  }
  // 2b. Fue a recuperatorio y sacó menos de 4
  if (fueARecup && notaRecup < 4) {
    return STATUS.LIBRE;
  }

  // 3. BLOQUEADA: correlativas no cumplidas
  if (!correlativasCumplidas(materia, todasLasMaterias)) {
    return STATUS.BLOQUEADA;
  }

  // 4. Sin notas cargadas
  if (notaP1 === null && notaP2 === null) {
    // Toggle manual "Cursando" activa el estado EN_CURSO sin necesidad de notas
    if (enCursoManual) return STATUS.EN_CURSO;
    return STATUS.PENDIENTE;
  }

  // 5. EN CURSO: Solo P1 cargada (y P2 no cargada, sin recup)
  if (notaP1 !== null && notaP2 === null && !fueARecup) {
    return STATUS.EN_CURSO;
  }

  // 6. Con ambas notas efectivas disponibles
  if (efectivaP1 !== null && efectivaP2 !== null) {
    const ambasAprobadas = efectivaP1 >= 4 && efectivaP2 >= 4;

    if (!ambasAprobadas) {
      if (!fueARecup) return STATUS.EN_CURSO; // esperando recuperatorio
      return STATUS.LIBRE;
    }

    // Ambas aprobadas (>=4)
    // PROMOCIONADA: Si ambas notas efectivas (incluyendo recup) son >= 7
    if (efectivaP1 >= 7 && efectivaP2 >= 7) {
      return STATUS.PROMOCIONADA;
    }

    // Ambas >= 4 pero al menos una es < 7
    if (!fueARecup) {
      // Como tiene derecho a subir de nota para promocionar, sigue "En Curso" (Pendiente de recup)
      return STATUS.EN_CURSO;
    }

    // Ya fue a recuperatorio y sacó entre 4 y 6 -> queda Regular (Pendiente de final)
    return STATUS.REGULAR;
  }

  return STATUS.PENDIENTE;
}

// =====================================================================
// B) REGLA DEL RECUPERATORIO
// =====================================================================

/**
 * Determina si el input de recuperatorio debe estar habilitado.
 * Solo se habilita si EXACTAMENTE UN parcial está desaprobado (<4).
 */
export function puedeCargarRecup(materia) {
  const { notaP1, notaP2, notaRecup } = materia;
  if (notaP1 === null || notaP2 === null) return false;
  if (notaRecup !== null) return true;
  const p1Desap = notaP1 < 4;
  const p2Desap = notaP2 < 4;
  // Si ambos están desaprobados -> Libre (no hay recup posible)
  if (p1Desap && p2Desap) return false;
  // Si ambos están promocionados (>= 7), no hay nada que recuperar
  if (notaP1 >= 7 && notaP2 >= 7) return false;
  return true;
}

/**
 * Devuelve qué parcial se debería recuperar basado en cuál está desaprobado.
 */
export function detectarRecupTarget(materia) {
  const { notaP1, notaP2 } = materia;
  if (notaP1 === null || notaP2 === null) return null;
  if (notaP1 < 4 && notaP2 >= 4) return 'P1';
  if (notaP2 < 4 && notaP1 >= 4) return 'P2';
  if (notaP1 < 7 && notaP2 >= 7) return 'P1';
  if (notaP2 < 7 && notaP1 >= 7) return 'P2';
  return null;
}

// =====================================================================
// C) PEOR DE LOS CASOS
// =====================================================================

/**
 * Calcula cuántos exámenes le quedan a una materia en el peor de los casos.
 */
export function examenesRestantesPeorCaso(materia, todasLasMaterias) {
  const estado = calcularEstado(materia, todasLasMaterias);
  const { notaP1, notaP2 } = materia;

  switch (estado) {
    case STATUS.APROBADA:
    case STATUS.PROMOCIONADA:
      return { total: 0, parciales: 0, recups: 0, finales: 0 };

    case STATUS.REGULAR:
      return { total: 1, parciales: 0, recups: 0, finales: 1 };

    case STATUS.LIBRE:
      return { total: 3, parciales: 2, recups: 0, finales: 1 };

    case STATUS.PENDIENTE:
    case STATUS.BLOQUEADA:
      return { total: 3, parciales: 2, recups: 0, finales: 1 };

    case STATUS.EN_CURSO: {
      // Marcada manualmente sin notas → misma lógica que pendiente
      if (notaP1 === null && notaP2 === null) {
        return { total: 3, parciales: 2, recups: 0, finales: 1 };
      }
      // Tiene P1 cargada, P2 no
      if (notaP1 !== null && notaP2 === null) {
        return { total: 2, parciales: 1, recups: 0, finales: 1 };
      }
      // Tiene P1 y P2, uno desaprobado (esperando recup)
      if (notaP1 !== null && notaP2 !== null) {
        return { total: 2, parciales: 0, recups: 1, finales: 1 };
      }
      return { total: 2, parciales: 1, recups: 0, finales: 1 };
    }

    default:
      return { total: 3, parciales: 2, recups: 0, finales: 1 };
  }
}

// =====================================================================
// D) ESTADÍSTICAS GLOBALES
// =====================================================================

export function calcularEstadisticas(materias) {
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

  materias.forEach((m) => {
    const estado = calcularEstado(m, materias);
    const examenes = examenesRestantesPeorCaso(m, materias);

    totalExamenes += examenes.total;
    totalParciales += examenes.parciales;
    totalRecups += examenes.recups;
    totalFinales += examenes.finales;

    switch (estado) {
      case STATUS.APROBADA: aprobadas++; break;
      case STATUS.PROMOCIONADA: promocionadas++; aprobadas++; break;
      case STATUS.REGULAR: regulares++; break;
      case STATUS.EN_CURSO: enCurso++; break;
      case STATUS.PENDIENTE: pendientes++; break;
      case STATUS.BLOQUEADA: bloqueadas++; break;
      case STATUS.LIBRE: libres++; break;
    }
  });

  const porcentajeAvance = Math.round((aprobadas / total) * 100);

  return {
    total, aprobadas, promocionadas, regulares, enCurso,
    pendientes, bloqueadas, libres, porcentajeAvance,
    examenesRestantes: {
      total: totalExamenes,
      parciales: totalParciales,
      recups: totalRecups,
      finales: totalFinales,
    },
  };
}

// =====================================================================
// E) COLORES Y ETIQUETAS POR ESTADO
// =====================================================================

export const STATUS_CONFIG = {
  [STATUS.BLOQUEADA]: {
    label: 'Bloqueada',
    color: 'text-zinc-500',
    bg: 'bg-zinc-900/60',
    border: 'border-zinc-700/50',
    badge: 'bg-zinc-800 text-zinc-400',
    dot: 'bg-zinc-500',
  },
  [STATUS.PENDIENTE]: {
    label: 'Pendiente',
    color: 'text-zinc-300',
    bg: 'bg-zinc-900/80',
    border: 'border-zinc-600/50',
    badge: 'bg-zinc-700 text-zinc-300',
    dot: 'bg-zinc-400',
  },
  [STATUS.EN_CURSO]: {
    label: 'En Curso',
    color: 'text-sky-300',
    bg: 'bg-sky-950/40',
    border: 'border-sky-700/50',
    badge: 'bg-sky-900/60 text-sky-300',
    dot: 'bg-sky-400',
  },
  [STATUS.REGULAR]: {
    label: 'Regular (Debe Final)',
    color: 'text-amber-300',
    bg: 'bg-amber-950/30',
    border: 'border-amber-700/50',
    badge: 'bg-amber-900/50 text-amber-300',
    dot: 'bg-amber-400',
  },
  [STATUS.PROMOCIONADA]: {
    label: 'Promocionada',
    color: 'text-emerald-300',
    bg: 'bg-emerald-950/30',
    border: 'border-emerald-700/50',
    badge: 'bg-emerald-900/50 text-emerald-300',
    dot: 'bg-emerald-400',
  },
  [STATUS.APROBADA]: {
    label: 'Aprobada',
    color: 'text-emerald-300',
    bg: 'bg-emerald-950/30',
    border: 'border-emerald-700/50',
    badge: 'bg-emerald-900/50 text-emerald-300',
    dot: 'bg-emerald-400',
  },
  [STATUS.LIBRE]: {
    label: 'Libre / Recursar',
    color: 'text-red-300',
    bg: 'bg-red-950/30',
    border: 'border-red-700/50',
    badge: 'bg-red-900/50 text-red-300',
    dot: 'bg-red-400',
  },
};

/**
 * Devuelve todas las fechas de todas las materias ordenadas cronológicamente.
 */
export function obtenerFechasOrdenadas(materias) {
  const INSTANCIA_LABELS = {
    p1: 'Parcial 1',
    p2: 'Parcial 2',
    recup: 'Recuperatorio',
    final: 'Final',
  };

  const fechas = [];
  materias.forEach((m) => {
    if (!m.fechas) return;
    Object.entries(m.fechas).forEach(([key, dateStr]) => {
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

  fechas.sort((a, b) => a.fecha - b.fecha);
  return fechas;
}

/**
 * Devuelve un mapa { 'YYYY-MM-DD': [eventos] } para usar en el calendario.
 */
export function obtenerEventosPorFecha(materias) {
  const INSTANCIA_META = {
    p1:    { label: 'Parcial 1',       color: 'sky'    },
    p2:    { label: 'Parcial 2',       color: 'violet' },
    recup: { label: 'Recuperatorio',   color: 'amber'  },
    final: { label: 'Final',           color: 'emerald'},
  };

  const map = {};
  materias.forEach((m) => {
    if (!m.fechas) return;
    Object.entries(m.fechas).forEach(([key, dateStr]) => {
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
