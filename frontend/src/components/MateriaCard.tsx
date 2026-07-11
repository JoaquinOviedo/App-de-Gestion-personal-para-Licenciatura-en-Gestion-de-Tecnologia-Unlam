/**
 * components/MateriaCard.tsx — Tarjeta expandible de cada materia.
 *
 * ARQUITECTURA:
 * - Recibe `materia` (solo lectura), `todasLasMaterias` (para correlativas) y `onUpdate`.
 * - El estado `expanded` es local; las notas/fechas se propagan al padre con `onUpdate`.
 * - NoteInput usa estado local y solo hace commit al perder el foco (evita re-renders
 *   que cerrarían el acordeón).
 *
 * ⚠️  YearSection debe estar definida FUERA de TabPlanEstudios para evitar que React
 *     recree el tipo del componente en cada render y desmonte todos los MateriaCard.
 */

import { useState } from 'react';
import { Badge } from './ui/Badge';
import { NoteInput } from './ui/NoteInput';
import { DateInput } from './ui/DateInput';
import {
  calcularEstado,
  STATUS,
  STATUS_CONFIG,
  puedeCargarRecup,
  detectarRecupTarget,
  calcularNotaFinal,
} from '../utils/academic';
import type { Materia } from '../types';

// ─── Helpers internos ────────────────────────────────────────────────

function getNoteHighlight(nota: number | null | undefined): 'good' | 'bad' | '' {
  if (nota == null) return '';
  if (nota >= 7) return 'good';
  if (nota >= 4) return '';
  return 'bad';
}

// ─── Props ───────────────────────────────────────────────────────────

interface MateriaCardProps {
  materia: Materia;
  todasLasMaterias: Materia[];
  onUpdate: (id: string, cambios: Partial<Materia>) => void;
}

// ─── Componente ──────────────────────────────────────────────────────

export function MateriaCard({ materia, todasLasMaterias, onUpdate }: MateriaCardProps) {
  const [expanded, setExpanded] = useState(false);

  const estado = calcularEstado(materia, todasLasMaterias);
  const cfg = STATUS_CONFIG[estado];
  const isBloqueada = estado === STATUS.BLOQUEADA;
  const isFinal = estado === STATUS.APROBADA || estado === STATUS.PROMOCIONADA;

  const correlativasFaltantes = isBloqueada
    ? (materia.correlatives ?? [])
        .filter((cid) => {
          const c = todasLasMaterias.find((m) => m.id === cid);
          if (!c) return false;
          const e = calcularEstado(c, todasLasMaterias);
          return (
            e !== STATUS.APROBADA &&
            e !== STATUS.PENDIENTE_FINAL &&
            e !== STATUS.PROMOCIONADA
          );
        })
        .map((cid) => todasLasMaterias.find((m) => m.id === cid)?.name ?? cid)
    : [];

  const recupHabilitado = puedeCargarRecup(materia);
  const recupTarget = detectarRecupTarget(materia);

  const commitNota = (campo: keyof Materia, valor: number | null) => {
    onUpdate(materia.id, { [campo]: valor });
  };

  const updateFecha = (instancia: string, valor: string) => {
    onUpdate(materia.id, { fechas: { ...materia.fechas, [instancia]: valor } });
  };

  // Toggle "Cursando": visible para materias sin notas y no bloqueada/final
  const showCursandoToggle =
    !isFinal &&
    !isBloqueada &&
    materia.notaP1 === null &&
    materia.notaP2 === null;

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 overflow-hidden
        ${isBloqueada ? 'opacity-60' : 'hover:border-zinc-600'}
        ${cfg.border} ${cfg.bg}`}
    >
      {/* ── Header ── */}
      <div className="px-5 py-4 flex items-center gap-3">
        {/* Dot de estado */}
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />

        {/* ID */}
        <span className="text-zinc-600 text-xs font-mono flex-shrink-0 hidden sm:inline">
          {materia.id}
        </span>

        {/* Nombre — clickeable para expandir */}
        <button
          onClick={() => !isBloqueada && setExpanded((e) => !e)}
          disabled={isBloqueada}
          className={`flex-1 text-left font-medium text-sm min-w-0 ${cfg.color}
            ${isBloqueada ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span className="block truncate">{materia.name}</span>
        </button>

        {/* Toggle "Cursando" */}
        {showCursandoToggle && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdate(materia.id, { enCursoManual: !materia.enCursoManual });
            }}
            title={materia.enCursoManual ? 'Quitar "En Curso"' : 'Marcar como "En Curso"'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
              border transition-all flex-shrink-0
              ${
                materia.enCursoManual
                  ? 'bg-sky-900/60 border-sky-600/60 text-sky-300 hover:bg-sky-900'
                  : 'bg-zinc-800/80 border-zinc-600/50 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500'
              }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                materia.enCursoManual ? 'bg-sky-400' : 'bg-zinc-600'
              }`}
            />
            Cursando
          </button>
        )}

        {/* Badge de estado (desktop) */}
        <Badge text={cfg.label} className={`${cfg.badge} flex-shrink-0 hidden md:inline-flex`} />

        {/* Candado o chevron */}
        {isBloqueada ? (
          <span className="text-zinc-600 text-sm flex-shrink-0">🔒</span>
        ) : (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <svg
              className={`w-4 h-4 text-zinc-500 transition-transform duration-300 ${
                expanded ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Badge en mobile (debajo del header) */}
      <div className="px-5 pb-2 md:hidden">
        <Badge text={cfg.label} className={cfg.badge} />
      </div>

      {/* Correlativas faltantes */}
      {isBloqueada && correlativasFaltantes.length > 0 && (
        <div className="px-5 pb-4">
          <p className="text-xs text-zinc-600">
            Falta regularizar:{' '}
            {correlativasFaltantes.map((n, i) => (
              <span key={n}>
                {i > 0 && ', '}
                <span className="text-zinc-500 font-medium">{n}</span>
              </span>
            ))}
          </p>
        </div>
      )}

      {/* ── Contenido expandible ── */}
      {!isBloqueada && expanded && (
        <div className="border-t border-zinc-800/50 px-5 py-5 space-y-6">

          {/* NOTAS */}
          <div>
            <h4 className="text-xs text-zinc-500 font-semibold uppercase tracking-widest mb-3">
              Notas{' '}
              <span className="normal-case font-normal text-zinc-600 ml-1">
                (confirmá con Tab o clic afuera)
              </span>
            </h4>
            <div className="flex flex-wrap gap-5 items-start">
              {/* Parcial 1 */}
              <NoteInput
                label="Parcial 1"
                value={materia.notaP1}
                ausente={materia.ausenteP1}
                onCommit={(v) => commitNota('notaP1', v)}
                onAusenteChange={(v) => onUpdate(materia.id, { ausenteP1: v, notaP1: null })}
                highlight={getNoteHighlight(materia.notaP1)}
              />

              {/* Parcial 2 */}
              <NoteInput
                label="Parcial 2"
                value={materia.notaP2}
                ausente={materia.ausenteP2}
                onCommit={(v) => commitNota('notaP2', v)}
                onAusenteChange={(v) => onUpdate(materia.id, { ausenteP2: v, notaP2: null })}
                highlight={getNoteHighlight(materia.notaP2)}
              />

              {/* Recuperatorio */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                  Recup.{recupTarget ? ` (${recupTarget})` : ''}
                </label>
                <div className="flex gap-2 items-start h-full">
                  <NoteInput
                    label=""
                    value={materia.notaRecup}
                    ausente={materia.ausenteRecup}
                    onCommit={(v) => commitNota('notaRecup', v)}
                    onAusenteChange={(v) =>
                      onUpdate(materia.id, { ausenteRecup: v, notaRecup: null })
                    }
                    disabled={!recupHabilitado}
                    highlight={getNoteHighlight(materia.notaRecup)}
                  />
                </div>
                {/* Libre directo: ambos parciales < 4 */}
                {!recupHabilitado &&
                  (materia.notaP1 !== null || materia.ausenteP1) &&
                  (materia.notaP2 !== null || materia.ausenteP2) &&
                  ((materia.notaP1 !== null && materia.notaP1 < 4) || materia.ausenteP1) &&
                  ((materia.notaP2 !== null && materia.notaP2 < 4) || materia.ausenteP2) && (
                    <p className="text-xs text-red-400 mt-1">Libre directo</p>
                  )}
              </div>

              {/* Finales — 3 llamados */}
              <div className="flex flex-col gap-1 pl-4 border-l border-zinc-800">
                <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-2">
                  Llamados a Final
                </label>
                <div className="flex gap-4">
                  <NoteInput
                    label="#1"
                    value={materia.notaF1}
                    ausente={materia.ausenteF1}
                    onCommit={(v) => commitNota('notaF1', v)}
                    onAusenteChange={(v) =>
                      onUpdate(materia.id, { ausenteF1: v, notaF1: null })
                    }
                    disabled={estado === STATUS.PROMOCIONADA}
                    highlight={getNoteHighlight(materia.notaF1)}
                  />
                  <NoteInput
                    label="#2"
                    value={materia.notaF2}
                    ausente={materia.ausenteF2}
                    onCommit={(v) => commitNota('notaF2', v)}
                    onAusenteChange={(v) =>
                      onUpdate(materia.id, { ausenteF2: v, notaF2: null })
                    }
                    disabled={estado === STATUS.PROMOCIONADA || (materia.notaF1 == null && !materia.ausenteF1) || (materia.notaF1 != null && materia.notaF1 >= 4)}
                    highlight={getNoteHighlight(materia.notaF2)}
                  />
                  <NoteInput
                    label="#3"
                    value={materia.notaF3}
                    ausente={materia.ausenteF3}
                    onCommit={(v) => commitNota('notaF3', v)}
                    onAusenteChange={(v) =>
                      onUpdate(materia.id, { ausenteF3: v, notaF3: null })
                    }
                    disabled={estado === STATUS.PROMOCIONADA || (materia.notaF2 == null && !materia.ausenteF2) || (materia.notaF2 != null && materia.notaF2 >= 4) || (materia.notaF1 != null && materia.notaF1 >= 4)}
                    highlight={getNoteHighlight(materia.notaF3)}
                  />
                </div>
              </div>

              {/* Nota Final (calculada/manual) */}
              {(estado === STATUS.APROBADA || estado === STATUS.PROMOCIONADA) && (
                <div className="flex flex-col gap-1 pl-4 border-l border-sky-900/50">
                  <label className="text-xs text-sky-400 font-bold uppercase tracking-wider mb-2">
                    Nota Final
                  </label>
                  <div className="flex items-center gap-2">
                    <NoteInput
                      value={materia.notaFinalManual ?? calcularNotaFinal(materia, todasLasMaterias)}
                      onCommit={(v) => onUpdate(materia.id, { notaFinalManual: v })}
                      highlight="good"
                    />
                    {materia.notaFinalManual != null && (
                      <button
                        onClick={() => onUpdate(materia.id, { notaFinalManual: null })}
                        className="text-[10px] uppercase font-semibold text-zinc-500 hover:text-red-400 transition-colors bg-zinc-900 px-2 py-1 rounded"
                        title="Restaurar cálculo automático"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* FECHAS */}
          <div>
            <h4 className="text-xs text-zinc-500 font-semibold uppercase tracking-widest mb-3">
              Fechas de examen
            </h4>
            <div className="flex flex-wrap gap-5">
              <DateInput
                label="Parcial 1"
                value={materia.fechas?.p1}
                onChange={(v) => updateFecha('p1', v)}
              />
              <DateInput
                label="Parcial 2"
                value={materia.fechas?.p2}
                onChange={(v) => updateFecha('p2', v)}
              />
              <DateInput
                label="Recuperatorio"
                value={materia.fechas?.recup}
                onChange={(v) => updateFecha('recup', v)}
              />
              <DateInput
                label="Final"
                value={materia.fechas?.final}
                onChange={(v) => updateFecha('final', v)}
              />
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
