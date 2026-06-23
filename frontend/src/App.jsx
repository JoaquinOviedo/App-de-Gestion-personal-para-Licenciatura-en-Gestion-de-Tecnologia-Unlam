import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  calcularEstado,
  calcularEstadisticas,
  obtenerFechasOrdenadas,
  obtenerEventosPorFecha,
  puedeCargarRecup,
  detectarRecupTarget,
  STATUS,
  STATUS_CONFIG,
} from './utils/academic';

// =====================================================================
// HOOKS
// =====================================================================

function useMaterias() {
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('idle');
  const saveTimerRef = useRef(null);

  useEffect(() => {
    fetch('/api/materias')
      .then((r) => r.json())
      .then((data) => { setMaterias(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Guarda en el servidor (con debounce corto para agrupar cambios rápidos)
  const guardarMaterias = useCallback((nuevasMaterias) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus('saving');
    saveTimerRef.current = setTimeout(() => {
      fetch('/api/materias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevasMaterias),
      })
        .then((r) => r.json())
        .then(() => { setSaveStatus('saved'); setTimeout(() => setSaveStatus('idle'), 2000); })
        .catch(() => { setSaveStatus('error'); setTimeout(() => setSaveStatus('idle'), 3000); });
    }, 300);
  }, []);

  const updateMateria = useCallback((id, cambios) => {
    setMaterias((prev) => {
      const nueva = prev.map((m) => (m.id === id ? { ...m, ...cambios } : m));
      guardarMaterias(nueva);
      return nueva;
    });
  }, [guardarMaterias]);

  const resetMaterias = useCallback((data) => {
    setMaterias(data);
    guardarMaterias(data);
  }, [guardarMaterias]);

  return { materias, loading, saveStatus, updateMateria, resetMaterias };
}

// =====================================================================
// COMPONENTES UI BASE
// =====================================================================

function SaveIndicator({ status }) {
  if (status === 'idle') return null;
  const configs = {
    saving: { text: 'Guardando...', cls: 'text-sky-400' },
    saved:  { text: '✓ Guardado',  cls: 'text-emerald-400' },
    error:  { text: '✗ Error',     cls: 'text-red-400' },
  };
  const cfg = configs[status];
  return <span className={`text-xs font-medium ${cfg.cls}`}>{cfg.text}</span>;
}

/**
 * Input de nota con ESTADO LOCAL.
 * Solo propaga el valor al padre cuando el usuario pierde el foco (onBlur).
 * Esto evita re-renders en cascada mientras se escribe, que cerraban el acordeón.
 */
function NoteInput({ label, value, onCommit, disabled, highlight }) {
  const [localValue, setLocalValue] = useState(value ?? '');

  // Sincroniza si el valor externo cambia (p.ej. carga inicial)
  useEffect(() => {
    setLocalValue(value ?? '');
  }, [value]);

  const handleBlur = () => {
    const num = localValue === '' ? null : parseFloat(localValue);
    const isValid = num === null || (!isNaN(num) && num >= 1 && num <= 10);
    if (!isValid) {
      setLocalValue(value ?? '');
      return;
    }
    if (num !== value) onCommit(num);
  };

  const borderClass =
    disabled ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
    : highlight === 'good' ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300 focus:border-emerald-500'
    : highlight === 'bad'  ? 'bg-red-950/40 border-red-700/50 text-red-300 focus:border-red-500'
    : 'bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-sky-500 focus:bg-zinc-800';

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{label}</label>
      <input
        type="number"
        min="1" max="10" step="0.5"
        disabled={disabled}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        className={`w-20 px-2 py-1.5 rounded-lg text-sm font-mono text-center border transition-all outline-none ${borderClass}`}
        placeholder="—"
      />
    </div>
  );
}

function DateInput({ label, value, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{label}</label>
      <input
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="px-2 py-1.5 rounded-lg text-sm border bg-zinc-900 border-zinc-700 text-zinc-300
          focus:border-sky-500 focus:bg-zinc-800 outline-none transition-all cursor-pointer [color-scheme:dark]"
      />
    </div>
  );
}

function Badge({ text, className }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}>
      {text}
    </span>
  );
}

// =====================================================================
// TAB 1: DASHBOARD
// =====================================================================

function ProgressRing({ percent }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (percent / 100) * circ;
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#27272a" strokeWidth="10" />
        <circle cx="64" cy="64" r={r} fill="none" stroke="url(#progressGrad)"
          strokeWidth="10" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
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

function CalendarSection({ materias }) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fechas = obtenerFechasOrdenadas(materias);

  const INSTANCIA_COLORS = {
    p1:    'text-sky-400 border-sky-700/40 bg-sky-950/30',
    p2:    'text-violet-400 border-violet-700/40 bg-violet-950/30',
    recup: 'text-amber-400 border-amber-700/40 bg-amber-950/30',
    final: 'text-emerald-400 border-emerald-700/40 bg-emerald-950/30',
  };

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

            return (
              <React.Fragment key={`${f.materiaId}-${f.instancia}`}>
                {showTodayMarker && (
                  <div className="flex items-center gap-3 my-3">
                    <div className="flex-1 h-px bg-sky-500/40" />
                    <span className="text-xs font-bold text-sky-400 bg-sky-950 border border-sky-700/50 px-3 py-1 rounded-full animate-pulse">
                      ◀ HOY {hoy.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} ▶
                    </span>
                    <div className="flex-1 h-px bg-sky-500/40" />
                  </div>
                )}
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all
                  ${esHoy ? 'border-sky-500/50 bg-sky-950/30' : ''}
                  ${esPasada ? 'opacity-40 border-zinc-800 bg-zinc-900/50' : ''}
                  ${esFutura && !esHoy ? `border ${INSTANCIA_COLORS[f.instancia]}` : ''}
                `}>
                  <div className="text-center min-w-[48px]">
                    <div className="text-xs text-zinc-500 uppercase">
                      {f.fecha.toLocaleDateString('es-AR', { month: 'short' })}
                    </div>
                    <div className={`text-xl font-bold ${esHoy ? 'text-sky-300' : esPasada ? 'text-zinc-600' : 'text-zinc-100'}`}>
                      {f.fecha.toLocaleDateString('es-AR', { day: 'numeric' })}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${esPasada ? 'text-zinc-500' : 'text-zinc-200'}`}>
                      {f.materiaNombre}
                    </div>
                    <div className={`text-xs ${INSTANCIA_COLORS[f.instancia].split(' ')[0]}`}>{f.label}</div>
                  </div>
                  {esPasada && <span className="text-xs text-zinc-600">Pasada</span>}
                  {esHoy && <span className="text-xs font-bold text-sky-400 animate-pulse">HOY</span>}
                </div>
              </React.Fragment>
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

function TabDashboard({ materias }) {
  const stats = calcularEstadisticas(materias);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Avance */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 hover:border-zinc-700 transition-colors">
          <div className="text-xs text-zinc-500 font-semibold uppercase tracking-widest">Avance</div>
          <ProgressRing percent={stats.porcentajeAvance} />
        </div>
        {/* Aprobadas */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-2 hover:border-zinc-700 transition-colors">
          <div className="text-xs text-zinc-500 font-semibold uppercase tracking-widest flex items-center gap-2"><span>🎓</span>Aprobadas</div>
          <div className="text-4xl font-bold text-emerald-400">{stats.aprobadas}/{stats.total}</div>
          <p className="text-zinc-500 text-sm">{stats.promocionadas} promocionadas</p>
        </div>
        {/* Exámenes restantes */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-2 col-span-2 hover:border-zinc-700 transition-colors">
          <div className="text-xs text-zinc-500 font-semibold uppercase tracking-widest flex items-center gap-2"><span>⚡</span>Exámenes restantes (peor caso)</div>
          <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-sky-400 leading-none">
            {stats.examenesRestantes.total}
          </div>
          <div className="flex gap-4 text-sm flex-wrap">
            <span className="text-sky-400"><span className="font-bold">{stats.examenesRestantes.parciales}</span> Parciales</span>
            <span className="text-amber-400"><span className="font-bold">{stats.examenesRestantes.recups}</span> Recups</span>
            <span className="text-violet-400"><span className="font-bold">{stats.examenesRestantes.finales}</span> Finales</span>
          </div>
        </div>
        {/* Estados secundarios */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 col-span-2 md:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'En Curso',       value: stats.enCurso,    color: 'text-sky-400'     },
            { label: 'Regulares',      value: stats.regulares,  color: 'text-amber-400'   },
            { label: 'Pendientes',     value: stats.pendientes + stats.bloqueadas, color: 'text-zinc-400'    },
            { label: 'Libre/Recursar', value: stats.libres,     color: 'text-red-400'     },
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

// =====================================================================
// TAB 2: PLAN DE ESTUDIOS
// =====================================================================

// ⚠️ CRÍTICO: YearSection definida FUERA de TabPlanEstudios.
// Si estuviera adentro, React la recrearía como nuevo tipo en cada render,
// desmontando todos los MateriaCard hijos y perdiendo el estado `expanded`.
function YearSection({ year, items, todasLasMaterias, onUpdate }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-zinc-800" />
        <h2 className="text-zinc-400 font-semibold text-sm uppercase tracking-widest px-2">Año {year}</h2>
        <div className="h-px flex-1 bg-zinc-800" />
      </div>
      <div className="space-y-3">
        {items.map((m) => (
          <MateriaCard key={m.id} materia={m} todasLasMaterias={todasLasMaterias} onUpdate={onUpdate} />
        ))}
      </div>
    </div>
  );
}

function MateriaCard({ materia, todasLasMaterias, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const estado = calcularEstado(materia, todasLasMaterias);
  const cfg = STATUS_CONFIG[estado];
  const isBloqueada = estado === STATUS.BLOQUEADA;
  const isFinal = estado === STATUS.APROBADA || estado === STATUS.PROMOCIONADA;

  const correlativasFaltantes = isBloqueada
    ? (materia.correlatives || [])
        .filter((cid) => {
          const c = todasLasMaterias.find((m) => m.id === cid);
          if (!c) return false;
          const e = calcularEstado(c, todasLasMaterias);
          return e !== STATUS.APROBADA && e !== STATUS.REGULAR && e !== STATUS.PROMOCIONADA;
        })
        .map((cid) => todasLasMaterias.find((m) => m.id === cid)?.name || cid)
    : [];

  const recupHabilitado = puedeCargarRecup(materia);

  // Commit de nota al perder foco (no en cada tecla)
  const commitNota = (campo, valor) => {
    const cambios = { [campo]: valor };
    if (campo === 'notaP1' || campo === 'notaP2') {
      const p1 = campo === 'notaP1' ? valor : materia.notaP1;
      const p2 = campo === 'notaP2' ? valor : materia.notaP2;
      const target = detectarRecupTarget({ ...materia, notaP1: p1, notaP2: p2 });
      if (target) cambios.recupTarget = target;
    }
    onUpdate(materia.id, cambios);
  };

  const updateFecha = (instancia, valor) => {
    onUpdate(materia.id, { fechas: { ...materia.fechas, [instancia]: valor } });
  };

  const getNoteHighlight = (nota) => {
    if (nota === null || nota === undefined) return '';
    if (nota >= 7) return 'good';
    if (nota >= 4) return '';
    return 'bad';
  };

  // Toggle "Cursando" manual: visible para materias que aún no tienen notas
  // y no están en estado final o bloqueada
  const showCursandoToggle = !isFinal && !isBloqueada &&
    (materia.notaP1 === null && materia.notaP2 === null);

  return (
    <div className={`rounded-2xl border transition-all duration-300 overflow-hidden
      ${isBloqueada ? 'opacity-60' : 'hover:border-zinc-600'}
      ${cfg.border} ${cfg.bg}`}>

      {/* ── Header ── */}
      <div className="px-5 py-4 flex items-center gap-3">
        {/* Dot de estado */}
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />

        {/* ID */}
        <span className="text-zinc-600 text-xs font-mono flex-shrink-0 hidden sm:inline">{materia.id}</span>

        {/* Nombre — clickeable para expandir */}
        <button
          onClick={() => !isBloqueada && setExpanded((e) => !e)}
          disabled={isBloqueada}
          className={`flex-1 text-left font-medium text-sm min-w-0 ${cfg.color}
            ${isBloqueada ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span className="block truncate">{materia.name}</span>
        </button>

        {/* Toggle "Cursando" — solo si no tiene notas y no es bloqueada/final */}
        {showCursandoToggle && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdate(materia.id, { enCursoManual: !materia.enCursoManual });
            }}
            title={materia.enCursoManual ? 'Quitar "En Curso"' : 'Marcar como "En Curso"'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
              border transition-all flex-shrink-0
              ${materia.enCursoManual
                ? 'bg-sky-900/60 border-sky-600/60 text-sky-300 hover:bg-sky-900'
                : 'bg-zinc-800/80 border-zinc-600/50 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500'
              }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${materia.enCursoManual ? 'bg-sky-400' : 'bg-zinc-600'}`} />
            Cursando
          </button>
        )}

        {/* Badge de estado */}
        <Badge text={cfg.label} className={`${cfg.badge} flex-shrink-0 hidden md:inline-flex`} />

        {/* Candado o chevron */}
        {isBloqueada ? (
          <span className="text-zinc-600 text-sm flex-shrink-0">🔒</span>
        ) : (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <svg className={`w-4 h-4 text-zinc-500 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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
              <React.Fragment key={n}>
                {i > 0 && ', '}
                <span className="text-zinc-500 font-medium">{n}</span>
              </React.Fragment>
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
              Notas <span className="normal-case font-normal text-zinc-600 ml-1">(confirmá con Tab o clic afuera)</span>
            </h4>
            <div className="flex flex-wrap gap-5 items-start">
              <NoteInput
                label="Parcial 1"
                value={materia.notaP1}
                onCommit={(v) => commitNota('notaP1', v)}
                highlight={getNoteHighlight(materia.notaP1)}
              />
              <NoteInput
                label="Parcial 2"
                value={materia.notaP2}
                onCommit={(v) => commitNota('notaP2', v)}
                highlight={getNoteHighlight(materia.notaP2)}
              />

              {/* Recuperatorio */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                  Recuperatorio{materia.recupTarget && (
                    <span className="ml-1 text-amber-400 normal-case">({materia.recupTarget})</span>
                  )}
                </label>
                <div className="flex gap-2 items-center">
                  <NoteInput
                    label=""
                    value={materia.notaRecup}
                    onCommit={(v) => commitNota('notaRecup', v)}
                    disabled={!recupHabilitado}
                    highlight={getNoteHighlight(materia.notaRecup)}
                  />
                  {recupHabilitado && (
                    <select
                      value={materia.recupTarget || ''}
                      onChange={(e) => onUpdate(materia.id, { recupTarget: e.target.value || null })}
                      className="px-2 py-1.5 rounded-lg text-sm border bg-zinc-900 border-zinc-700 text-zinc-300
                        focus:border-amber-500 outline-none transition-all [color-scheme:dark]"
                    >
                      <option value="">¿Cuál?</option>
                      {(materia.notaP1 === null || materia.notaP1 < 7) && <option value="P1">Recup. P1</option>}
                      {(materia.notaP2 === null || materia.notaP2 < 7) && <option value="P2">Recup. P2</option>}
                    </select>
                  )}
                </div>
                {!recupHabilitado && materia.notaP1 !== null && materia.notaP2 !== null
                  && materia.notaP1 < 4 && materia.notaP2 < 4 && (
                  <p className="text-xs text-red-400 mt-1">Ambos desaprobados → Libre directo</p>
                )}
              </div>

              {/* Final */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Final</label>
                <label className="flex items-center gap-2 cursor-pointer mt-1">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={materia.finalAprobado || false}
                      onChange={(e) => onUpdate(materia.id, { finalAprobado: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-zinc-800 border border-zinc-700 rounded-full
                      peer-checked:bg-emerald-600 peer-checked:border-emerald-500 transition-all" />
                    <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-zinc-400 rounded-full transition-all
                      peer-checked:translate-x-4 peer-checked:bg-white" />
                  </div>
                  <span className={`text-sm font-medium transition-colors ${materia.finalAprobado ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {materia.finalAprobado ? 'Aprobado ✓' : 'Pendiente'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* FECHAS */}
          <div>
            <h4 className="text-xs text-zinc-500 font-semibold uppercase tracking-widest mb-3">Fechas de examen</h4>
            <div className="flex flex-wrap gap-5">
              <DateInput label="Parcial 1"     value={materia.fechas?.p1}    onChange={(v) => updateFecha('p1', v)}    />
              <DateInput label="Parcial 2"     value={materia.fechas?.p2}    onChange={(v) => updateFecha('p2', v)}    />
              <DateInput label="Recuperatorio" value={materia.fechas?.recup} onChange={(v) => updateFecha('recup', v)} />
              <DateInput label="Final"         value={materia.fechas?.final} onChange={(v) => updateFecha('final', v)} />
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

function TabPlanEstudios({ materias, onUpdate }) {
  const year1 = materias.filter((m) => m.year === 1);
  const year2 = materias.filter((m) => m.year === 2);
  return (
    <div className="space-y-8">
      <YearSection year={1} items={year1} todasLasMaterias={materias} onUpdate={onUpdate} />
      <YearSection year={2} items={year2} todasLasMaterias={materias} onUpdate={onUpdate} />
    </div>
  );
}

// =====================================================================
// TAB 3: CALENDARIO MENSUAL
// =====================================================================

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const DAY_NAMES_SHORT = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

const CAL_COLOR = {
  sky:     { dot: 'bg-sky-400',     badge: 'bg-sky-900/60 text-sky-300 border-sky-700/40',     label: 'text-sky-300'     },
  violet:  { dot: 'bg-violet-400',  badge: 'bg-violet-900/60 text-violet-300 border-violet-700/40', label: 'text-violet-300' },
  amber:   { dot: 'bg-amber-400',   badge: 'bg-amber-900/60 text-amber-300 border-amber-700/40',   label: 'text-amber-300'   },
  emerald: { dot: 'bg-emerald-400', badge: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/40', label: 'text-emerald-300' },
  zinc:    { dot: 'bg-zinc-400',    badge: 'bg-zinc-800 text-zinc-300 border-zinc-700',             label: 'text-zinc-300'    },
};

function getMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // Lunes = 0
  const current = new Date(year, month, 1 - startOffset);
  const days = [];
  for (let i = 0; i < 42; i++) {
    days.push({
      year: current.getFullYear(),
      month: current.getMonth(),
      day: current.getDate(),
      isCurrentMonth: current.getMonth() === month
    });
    current.setDate(current.getDate() + 1);
  }
  return days;
}

function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function TabCalendario({ materias }) {
  const hoyReal = new Date();
  const [current, setCurrent] = useState({ year: hoyReal.getFullYear(), month: hoyReal.getMonth() });
  const [selectedDay, setSelectedDay] = useState(null);

  const hoy = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const eventsByDate = useMemo(() => obtenerEventosPorFecha(materias), [materias]);

  const monthDays = useMemo(() => getMonthGrid(current.year, current.month), [current]);

  const prevMonth = () => setCurrent(({ year, month }) =>
    month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
  );
  const nextMonth = () => setCurrent(({ year, month }) =>
    month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
  );
  const goToday = () => {
    setCurrent({ year: hoyReal.getFullYear(), month: hoyReal.getMonth() });
    setSelectedDay(hoyReal.getDate());
  };

  const selectedDateStr = selectedDay ? toDateStr(current.year, current.month, selectedDay) : null;
  const selectedEvents  = selectedDateStr ? (eventsByDate[selectedDateStr] || []) : [];

  // Próximos eventos (hasta 8)
  const upcomingEvents = useMemo(() => {
    const all = [];
    Object.entries(eventsByDate).forEach(([dateStr, evs]) => {
      const d = new Date(dateStr + 'T12:00:00');
      d.setHours(0, 0, 0, 0);
      if (d >= hoy) evs.forEach((ev) => all.push({ ...ev, dateStr, d }));
    });
    all.sort((a, b) => a.d - b.d);
    return all.slice(0, 8);
  }, [eventsByDate, hoy]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* ── Grilla del mes ── */}
      <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">

        {/* Navegación de mes */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors">
            ‹
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-zinc-100 font-bold text-lg">
              {MONTH_NAMES[current.month]} {current.year}
            </h2>
            <button onClick={goToday}
              className="text-xs px-2.5 py-1 rounded-lg bg-sky-900/40 border border-sky-700/40 text-sky-400
                hover:bg-sky-800/60 transition-colors font-medium">
              Hoy
            </button>
          </div>
          <button onClick={nextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors">
            ›
          </button>
        </div>

        {/* Cabecera días */}
        <div className="grid grid-cols-7 mb-2">
          {DAY_NAMES_SHORT.map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-zinc-600 uppercase tracking-widest py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Celdas */}
        <div className="grid grid-cols-7 gap-1">
          {monthDays.map((cell, i) => {
            const dateStr = toDateStr(cell.year, cell.month, cell.day);
            const events  = eventsByDate[dateStr] || [];
            const cellDate = new Date(cell.year, cell.month, cell.day);
            cellDate.setHours(0, 0, 0, 0);
            const isToday    = cellDate.getTime() === hoy.getTime();
            const isPast     = cellDate < hoy;
            const isSelected = selectedDay === cell.day && cell.isCurrentMonth;
            const hasEvents  = events.length > 0;

            return (
              <button key={`day-${i}`}
                onClick={() => {
                  if (!cell.isCurrentMonth) {
                    setCurrent({ year: cell.year, month: cell.month });
                    setSelectedDay(cell.day);
                  } else {
                    setSelectedDay(isSelected ? null : cell.day);
                  }
                }}
                className={`
                  relative h-11 rounded-xl flex flex-col items-center pt-1.5 transition-all
                  ${!cell.isCurrentMonth ? 'opacity-30 hover:opacity-50' : ''}
                  ${isToday ? 'bg-sky-600 shadow-lg shadow-sky-900/50 text-white font-bold ring-2 ring-sky-500/50 opacity-100' : ''}
                  ${isSelected && !isToday ? 'bg-zinc-700 ring-1 ring-zinc-500' : ''}
                  ${!isToday && !isSelected && cell.isCurrentMonth ? 'hover:bg-zinc-800' : ''}
                  ${isPast && !isToday && cell.isCurrentMonth ? 'opacity-50' : ''}
                `}>
                <span className={`text-sm leading-none ${!isToday && !hasEvents ? 'text-zinc-400' : ''} ${hasEvents && !isToday ? 'text-zinc-100 font-semibold' : ''}`}>
                  {cell.day}
                </span>
                {hasEvents && (
                  <div className="flex gap-0.5 mt-1 flex-wrap justify-center px-1">
                    {events.slice(0, 4).map((ev, ei) => (
                      <div key={ei} className={`w-1.5 h-1.5 rounded-full ${CAL_COLOR[ev.color]?.dot || 'bg-zinc-400'}`} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Leyenda */}
        <div className="flex gap-4 mt-5 justify-center flex-wrap border-t border-zinc-800 pt-4">
          {[['sky', 'Parcial 1'], ['violet', 'Parcial 2'], ['amber', 'Recuperatorio'], ['emerald', 'Final']].map(([color, label]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${CAL_COLOR[color].dot}`} />
              <span className="text-xs text-zinc-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Panel lateral ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
        {selectedDay ? (
          <>
            <h3 className="text-zinc-100 font-semibold flex items-center gap-2">
              <span>📋</span>
              {selectedDay} de {MONTH_NAMES[current.month]}
            </h3>
            {selectedEvents.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <span className="text-3xl mb-2">✅</span>
                <p className="text-zinc-600 text-sm">Sin exámenes este día</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedEvents.map((ev, i) => (
                  <div key={i} className={`p-3 rounded-xl border ${CAL_COLOR[ev.color]?.badge || ''}`}>
                    <p className="text-xs font-semibold uppercase tracking-widest opacity-70">{ev.label}</p>
                    <p className="text-sm font-medium mt-0.5">{ev.materiaNombre}</p>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setSelectedDay(null)}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors mt-auto">
              ← Ver próximos
            </button>
          </>
        ) : (
          <>
            <h3 className="text-zinc-100 font-semibold flex items-center gap-2">
              <span>🔜</span> Próximos exámenes
            </h3>
            {upcomingEvents.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <span className="text-3xl mb-2">🎉</span>
                <p className="text-zinc-600 text-sm">No hay exámenes próximos</p>
                <p className="text-zinc-700 text-xs mt-1">Cargá fechas en el Plan de Estudios</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.map((ev, i) => {
                  const daysLeft = Math.ceil((ev.d - hoy) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={i}
                      className={`p-3 rounded-xl border cursor-pointer transition-all hover:opacity-80 ${CAL_COLOR[ev.color]?.badge || ''}`}
                      onClick={() => {
                        const d = ev.d;
                        setCurrent({ year: d.getFullYear(), month: d.getMonth() });
                        setSelectedDay(d.getDate());
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-semibold uppercase tracking-widest opacity-70">{ev.label}</p>
                        <span className="text-xs opacity-60">
                          {daysLeft === 0 ? '¡Hoy!' : daysLeft === 1 ? 'Mañana' : `en ${daysLeft}d`}
                        </span>
                      </div>
                      <p className="text-sm font-medium mt-0.5 truncate">{ev.materiaNombre}</p>
                      <p className="text-xs opacity-50 mt-0.5">
                        {ev.d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// =====================================================================
// TAB 4: BASE DE DATOS
// =====================================================================

function TabBaseDatos({ materias, onRestore }) {
  const [dataPath, setDataPath]     = useState('');
  const [backupStatus, setBackupStatus] = useState('');

  useEffect(() => {
    fetch('/api/datapath').then((r) => r.json()).then((d) => setDataPath(d.path)).catch(() => setDataPath('No disponible'));
  }, []);

  const hacerBackup = () => {
    const blob = new Blob([JSON.stringify(materias, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `materias_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupStatus('✓ Backup descargado');
    setTimeout(() => setBackupStatus(''), 3000);
  };

  const restaurarBackup = () => {
    const input    = document.createElement('input');
    input.type     = 'file';
    input.accept   = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (!Array.isArray(data)) throw new Error('Formato inválido');
          onRestore(data);
          setBackupStatus('✓ Backup restaurado correctamente');
        } catch (err) {
          setBackupStatus(`✗ Error: ${err.message}`);
        }
        setTimeout(() => setBackupStatus(''), 4000);
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const stats = calcularEstadisticas(materias);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h3 className="text-zinc-100 font-semibold mb-4 flex items-center gap-2"><span>💾</span> Archivo de datos</h3>
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Ubicación</p>
        <code className="text-xs text-sky-400 bg-sky-950/30 border border-sky-900/50 px-3 py-2 rounded-lg block break-all">
          {dataPath || 'Cargando...'}
        </code>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-zinc-800/50 rounded-xl p-3">
            <p className="text-xs text-zinc-500 mb-1">Total materias</p>
            <p className="text-2xl font-bold text-zinc-100">{stats.total}</p>
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-3">
            <p className="text-xs text-zinc-500 mb-1">Aprobadas</p>
            <p className="text-2xl font-bold text-emerald-400">{stats.aprobadas}</p>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h3 className="text-zinc-100 font-semibold mb-2 flex items-center gap-2"><span>🛡️</span> Acciones de emergencia</h3>
        <p className="text-zinc-500 text-sm mb-5">Exportá o importá tus datos completos.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={hacerBackup}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl
              bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm transition-colors">
            ⬇️ Hacer Backup (.json)
          </button>
          <button onClick={restaurarBackup}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl
              bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-200 font-semibold text-sm transition-colors">
            ⬆️ Restaurar Backup
          </button>
        </div>
        {backupStatus && (
          <p className={`mt-3 text-sm text-center font-medium ${backupStatus.startsWith('✓') ? 'text-emerald-400' : 'text-red-400'}`}>
            {backupStatus}
          </p>
        )}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h3 className="text-zinc-100 font-semibold mb-3 flex items-center gap-2"><span>📋</span> Vista previa del JSON</h3>
        <pre className="text-xs text-zinc-400 bg-zinc-950 border border-zinc-800 rounded-xl p-4 overflow-auto max-h-64 [scrollbar-width:thin]">
          {JSON.stringify(materias, null, 2)}
        </pre>
      </div>
    </div>
  );
}

// =====================================================================
// APP PRINCIPAL
// =====================================================================

const TABS = [
  { id: 'dashboard',  label: 'Dashboard',       icon: '📊' },
  { id: 'plan',       label: 'Plan de Estudios', icon: '📚' },
  { id: 'calendario', label: 'Calendario',        icon: '🗓️' },
  { id: 'datos',      label: 'Base de Datos',    icon: '🗄️' },
];

export default function App() {
  const { materias, loading, saveStatus, updateMateria, resetMaterias } = useMaterias();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400 text-sm">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">

      {/* Header */}
      <header className="border-b border-zinc-800 sticky top-0 z-50 bg-zinc-950/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-sky-600 flex items-center justify-center flex-shrink-0">
              <span className="text-sm">🎓</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-zinc-100 truncate">Mi Carrera Tech</h1>
              <p className="text-xs text-zinc-600 truncate hidden sm:block">Lic. en Gestión de Tecnología</p>
            </div>
          </div>
          <SaveIndicator status={saveStatus} />
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4">
          <nav className="flex gap-1 -mb-px overflow-x-auto [scrollbar-width:none]">
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-violet-500 text-violet-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                  }`}>
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {activeTab === 'dashboard'  && <TabDashboard  materias={materias} />}
        {activeTab === 'plan'       && <TabPlanEstudios materias={materias} onUpdate={updateMateria} />}
        {activeTab === 'calendario' && <TabCalendario   materias={materias} />}
        {activeTab === 'datos'      && <TabBaseDatos   materias={materias} onRestore={resetMaterias} />}
      </main>

      <footer className="border-t border-zinc-900 mt-12 py-4 text-center">
        <p className="text-zinc-700 text-xs">Mi Carrera Tech · Gestor Local · Datos en materias.json</p>
      </footer>
    </div>
  );
}
