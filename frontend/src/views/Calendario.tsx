/**
 * views/Calendario.tsx — Pestaña de calendario mensual interactivo.
 *
 * Muestra una grilla del mes actual con dots de colores por tipo de examen.
 * Panel lateral: eventos del día seleccionado o próximos 8 eventos futuros.
 */

import { useState, useMemo } from 'react';
import { obtenerEventosPorFecha } from '../utils/academic';
import type { Materia, EventoCalendario, EventosPorFecha } from '../types';

// ─── Constantes ───────────────────────────────────────────────────────

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const DAY_NAMES_SHORT = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

const CAL_COLOR: Record<string, { dot: string; badge: string; label: string }> = {
  sky:     { dot: 'bg-sky-400',     badge: 'bg-sky-900/60 text-sky-300 border-sky-700/40',         label: 'text-sky-300'     },
  violet:  { dot: 'bg-violet-400',  badge: 'bg-violet-900/60 text-violet-300 border-violet-700/40', label: 'text-violet-300'  },
  amber:   { dot: 'bg-amber-400',   badge: 'bg-amber-900/60 text-amber-300 border-amber-700/40',   label: 'text-amber-300'   },
  emerald: { dot: 'bg-emerald-400', badge: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/40', label: 'text-emerald-300' },
  zinc:    { dot: 'bg-zinc-400',    badge: 'bg-zinc-800 text-zinc-300 border-zinc-700',             label: 'text-zinc-300'    },
};

// ─── Helpers ──────────────────────────────────────────────────────────

interface DayCell {
  year: number;
  month: number;
  day: number;
  isCurrentMonth: boolean;
}

function getMonthGrid(year: number, month: number): DayCell[] {
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // Lunes = 0
  const current = new Date(year, month, 1 - startOffset);
  const days: DayCell[] = [];
  for (let i = 0; i < 42; i++) {
    days.push({
      year: current.getFullYear(),
      month: current.getMonth(),
      day: current.getDate(),
      isCurrentMonth: current.getMonth() === month,
    });
    current.setDate(current.getDate() + 1);
  }
  return days;
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ─── Componente ───────────────────────────────────────────────────────

interface CalendarioProps {
  materias: Materia[];
}

export function Calendario({ materias }: CalendarioProps) {
  const hoyReal = new Date();
  const [current, setCurrent] = useState({ year: hoyReal.getFullYear(), month: hoyReal.getMonth() });
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const hoy = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const eventsByDate: EventosPorFecha = useMemo(
    () => obtenerEventosPorFecha(materias),
    [materias],
  );

  const monthDays = useMemo(() => getMonthGrid(current.year, current.month), [current]);

  const prevMonth = () =>
    setCurrent(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 },
    );

  const nextMonth = () =>
    setCurrent(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 },
    );

  const goToday = () => {
    setCurrent({ year: hoyReal.getFullYear(), month: hoyReal.getMonth() });
    setSelectedDay(hoyReal.getDate());
  };

  const selectedDateStr = selectedDay ? toDateStr(current.year, current.month, selectedDay) : null;
  const selectedEvents: EventoCalendario[] = selectedDateStr
    ? (eventsByDate[selectedDateStr] ?? [])
    : [];

  // Próximos eventos (hasta 8)
  const upcomingEvents = useMemo(() => {
    const all: (EventoCalendario & { dateStr: string; d: Date })[] = [];
    Object.entries(eventsByDate).forEach(([dateStr, evs]) => {
      const d = new Date(dateStr + 'T12:00:00');
      d.setHours(0, 0, 0, 0);
      if (d >= hoy) evs.forEach((ev) => all.push({ ...ev, dateStr, d }));
    });
    all.sort((a, b) => a.d.getTime() - b.d.getTime());
    return all.slice(0, 8);
  }, [eventsByDate, hoy]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* ── Grilla del mes ── */}
      <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">

        {/* Navegación de mes */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={prevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            ‹
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-zinc-100 font-bold text-lg">
              {MONTH_NAMES[current.month]} {current.year}
            </h2>
            <button
              onClick={goToday}
              className="text-xs px-2.5 py-1 rounded-lg bg-sky-900/40 border border-sky-700/40 text-sky-400
                hover:bg-sky-800/60 transition-colors font-medium"
            >
              Hoy
            </button>
          </div>
          <button
            onClick={nextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            ›
          </button>
        </div>

        {/* Cabecera días */}
        <div className="grid grid-cols-7 mb-2">
          {DAY_NAMES_SHORT.map((d) => (
            <div
              key={d}
              className="text-center text-xs font-semibold text-zinc-600 uppercase tracking-widest py-1"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Celdas */}
        <div className="grid grid-cols-7 gap-1">
          {monthDays.map((cell, i) => {
            const dateStr = toDateStr(cell.year, cell.month, cell.day);
            const events = eventsByDate[dateStr] ?? [];
            const cellDate = new Date(cell.year, cell.month, cell.day);
            cellDate.setHours(0, 0, 0, 0);
            const isToday    = cellDate.getTime() === hoy.getTime();
            const isPast     = cellDate < hoy;
            const isSelected = selectedDay === cell.day && cell.isCurrentMonth;
            const hasEvents  = events.length > 0;

            return (
              <button
                key={`day-${i}`}
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
                `}
              >
                <span
                  className={`text-sm leading-none ${!isToday && !hasEvents ? 'text-zinc-400' : ''} ${
                    hasEvents && !isToday ? 'text-zinc-100 font-semibold' : ''
                  }`}
                >
                  {cell.day}
                </span>
                {hasEvents && (
                  <div className="flex gap-0.5 mt-1 flex-wrap justify-center px-1">
                    {events.slice(0, 4).map((ev, ei) => (
                      <div
                        key={ei}
                        className={`w-1.5 h-1.5 rounded-full ${CAL_COLOR[ev.color]?.dot ?? 'bg-zinc-400'}`}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Leyenda */}
        <div className="flex gap-4 mt-5 justify-center flex-wrap border-t border-zinc-800 pt-4">
          {[
            ['sky',     'Parcial 1'],
            ['violet',  'Parcial 2'],
            ['amber',   'Recuperatorio'],
            ['emerald', 'Final'],
          ].map(([color, label]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${CAL_COLOR[color]?.dot ?? ''}`} />
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
                  <div key={i} className={`p-3 rounded-xl border ${CAL_COLOR[ev.color]?.badge ?? ''}`}>
                    <p className="text-xs font-semibold uppercase tracking-widest opacity-70">
                      {ev.label}
                    </p>
                    <p className="text-sm font-medium mt-0.5">{ev.materiaNombre}</p>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setSelectedDay(null)}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors mt-auto"
            >
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
                  const daysLeft = Math.ceil((ev.d.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border cursor-pointer transition-all hover:opacity-80 ${
                        CAL_COLOR[ev.color]?.badge ?? ''
                      }`}
                      onClick={() => {
                        setCurrent({ year: ev.d.getFullYear(), month: ev.d.getMonth() });
                        setSelectedDay(ev.d.getDate());
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-semibold uppercase tracking-widest opacity-70">
                          {ev.label}
                        </p>
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
