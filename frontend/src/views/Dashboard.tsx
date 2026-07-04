/**
 * views/Dashboard.tsx — Pestaña de métricas y resumen de carrera.
 *
 * Muestra:
 * - Anillo de progreso (% de materias aprobadas).
 * - Contador de aprobadas / promocionadas.
 * - Exámenes restantes en peor caso (parciales + recups + finales).
 * - Estados secundarios (en curso, regulares, pendientes, libres).
 * - Próximos exámenes ordenados cronológicamente con marcador "HOY".
 */

import { calcularEstadisticas, obtenerFechasOrdenadas } from '../utils/academic';
import type { Materia, FechaOrdenada } from '../types';

// ─── Progress Ring ────────────────────────────────────────────────────

function ProgressRing({ percent }: { percent: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (percent / 100) * circ;
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#27272a" strokeWidth="10" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="url(#progressGrad)"
          strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)' }}
        />
        <defs>
          <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{percent}%</span>
        <span className="text-xs text-zinc-500">avance</span>
      </div>
    </div>
  );
}

// ─── Calendar Section ─────────────────────────────────────────────────

const INSTANCIA_COLORS: Record<string, string> = {
  p1:    'text-sky-400 border-sky-700/40 bg-sky-950/30',
  p2:    'text-violet-400 border-violet-700/40 bg-violet-950/30',
  recup: 'text-amber-400 border-amber-700/40 bg-amber-950/30',
  final: 'text-emerald-400 border-emerald-700/40 bg-emerald-950/30',
};

function CalendarSection({ materias }: { materias: Materia[] }) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fechas: FechaOrdenada[] = obtenerFechasOrdenadas(materias);

  let todayInserted = false;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h3 className="text-zinc-100 font-semibold text-base mb-4 flex items-center gap-2">
        <span>📅</span> Próximos exámenes
      </h3>
      {fechas.length === 0 ? (
        <p className="text-zinc-600 text-sm text-center py-8">No hay fechas cargadas todavía.</p>
      ) : (
        <div className="space-y-2">
          {fechas.map((f) => {
            const fDate = new Date(f.fecha);
            fDate.setHours(0, 0, 0, 0);
            const esPasada = fDate < hoy;
            const esHoy = fDate.getTime() === hoy.getTime();
            const esFutura = fDate > hoy;

            let showTodayMarker = false;
            if (!todayInserted && esFutura) {
              showTodayMarker = true;
              todayInserted = true;
            }

            const colorClass = INSTANCIA_COLORS[f.instancia] ?? '';

            return (
              <span key={`${f.materiaId}-${f.instancia}`}>
                {showTodayMarker && (
                  <div className="flex items-center gap-3 my-3">
                    <div className="flex-1 h-px bg-sky-500/40" />
                    <span className="text-xs font-bold text-sky-400 bg-sky-950 border border-sky-700/50 px-3 py-1 rounded-full animate-pulse">
                      ◀ HOY {hoy.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} ▶
                    </span>
                    <div className="flex-1 h-px bg-sky-500/40" />
                  </div>
                )}
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all
                    ${esHoy ? 'border-sky-500/50 bg-sky-950/30' : ''}
                    ${esPasada ? 'opacity-40 border-zinc-800 bg-zinc-900/50' : ''}
                    ${esFutura && !esHoy ? `border ${colorClass}` : ''}
                  `}
                >
                  <div className="text-center min-w-[48px]">
                    <div className="text-xs text-zinc-500 uppercase">
                      {f.fecha.toLocaleDateString('es-AR', { month: 'short' })}
                    </div>
                    <div
                      className={`text-xl font-bold ${
                        esHoy ? 'text-sky-300' : esPasada ? 'text-zinc-600' : 'text-zinc-100'
                      }`}
                    >
                      {f.fecha.toLocaleDateString('es-AR', { day: 'numeric' })}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-sm font-medium truncate ${
                        esPasada ? 'text-zinc-500' : 'text-zinc-200'
                      }`}
                    >
                      {f.materiaNombre}
                    </div>
                    <div className={`text-xs ${colorClass.split(' ')[0]}`}>{f.label}</div>
                  </div>
                  {esPasada && <span className="text-xs text-zinc-600">Pasada</span>}
                  {esHoy && (
                    <span className="text-xs font-bold text-sky-400 animate-pulse">HOY</span>
                  )}
                </div>
              </span>
            );
          })}
          {!todayInserted && fechas.length > 0 && (
            <div className="flex items-center gap-3 mt-3">
              <div className="flex-1 h-px bg-sky-500/40" />
              <span className="text-xs font-bold text-sky-400 bg-sky-950 border border-sky-700/50 px-3 py-1 rounded-full">
                HOY {hoy.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
              </span>
              <div className="flex-1 h-px bg-sky-500/40" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Dashboard principal ──────────────────────────────────────────────

interface DashboardProps {
  materias: Materia[];
}

export function Dashboard({ materias }: DashboardProps) {
  const stats = calcularEstadisticas(materias);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Avance */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 hover:border-zinc-700 transition-colors">
          <div className="text-xs text-zinc-500 font-semibold uppercase tracking-widest">Avance</div>
          <ProgressRing percent={stats.porcentajeAvance} />
        </div>

        {/* Aprobadas */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-2 hover:border-zinc-700 transition-colors">
          <div className="text-xs text-zinc-500 font-semibold uppercase tracking-widest flex items-center gap-2">
            <span>🎓</span>Aprobadas
          </div>
          <div className="text-4xl font-bold text-emerald-400">
            {stats.aprobadas}/{stats.total}
          </div>
          <p className="text-zinc-500 text-sm">{stats.promocionadas} promocionadas</p>
        </div>

        {/* Promedio */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-2 hover:border-zinc-700 transition-colors">
          <div className="text-xs text-zinc-500 font-semibold uppercase tracking-widest flex items-center gap-2">
            <span>⭐</span>Promedio
          </div>
          <div className="text-4xl font-bold text-sky-400">
            {stats.promedio.toLocaleString('es-AR')}
          </div>
          <p className="text-zinc-500 text-sm">nota final</p>
        </div>

        {/* Exámenes restantes */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-2 col-span-2 hover:border-zinc-700 transition-colors">
          <div className="text-xs text-zinc-500 font-semibold uppercase tracking-widest flex items-center gap-2">
            <span>⚡</span>Exámenes restantes (peor caso)
          </div>
          <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-sky-400 leading-none">
            {stats.examenesRestantes.total}
          </div>
          <div className="flex gap-4 text-sm flex-wrap">
            <span className="text-sky-400">
              <span className="font-bold">{stats.examenesRestantes.parciales}</span> Parciales
            </span>
            <span className="text-amber-400">
              <span className="font-bold">{stats.examenesRestantes.recups}</span> Recups
            </span>
            <span className="text-violet-400">
              <span className="font-bold">{stats.examenesRestantes.finales}</span> Finales
            </span>
          </div>
        </div>

        {/* Estados secundarios */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 col-span-2 md:col-span-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'En Curso',       value: stats.enCurso,                        color: 'text-sky-400'   },
            { label: 'Regulares',      value: stats.regulares,                      color: 'text-amber-400' },
            { label: 'Pendientes',     value: stats.pendientes + stats.bloqueadas,  color: 'text-zinc-400'  },
            { label: 'Libre/Recursar', value: stats.libres,                         color: 'text-red-400'   },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1 p-2">
              <span className={`text-3xl font-bold ${s.color}`}>{s.value}</span>
              <span className="text-xs text-zinc-500 text-center">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <CalendarSection materias={materias} />
    </div>
  );
}
