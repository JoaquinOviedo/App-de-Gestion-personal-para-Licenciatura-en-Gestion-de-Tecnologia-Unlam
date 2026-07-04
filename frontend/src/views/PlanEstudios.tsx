/**
 * views/PlanEstudios.tsx — Pestaña del plan de estudios por año.
 *
 * ⚠️  CRÍTICO: YearSection está definida FUERA de PlanEstudios.
 * Si estuviera adentro, React la recrearía como nuevo tipo en cada render,
 * desmontando todos los MateriaCard hijos y perdiendo el estado `expanded`.
 */

import { MateriaCard } from '../components/MateriaCard';
import type { Materia } from '../types';

// ─── Year Section ────────────────────────────────────────────────────

interface YearSectionProps {
  year: number;
  items: Materia[];
  todasLasMaterias: Materia[];
  onUpdate: (id: string, cambios: Partial<Materia>) => void;
}

function YearSection({ year, items, todasLasMaterias, onUpdate }: YearSectionProps) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-zinc-800" />
        <h2 className="text-zinc-400 font-semibold text-sm uppercase tracking-widest px-2">
          Año {year}
        </h2>
        <div className="h-px flex-1 bg-zinc-800" />
      </div>
      <div className="space-y-3">
        {items.map((m) => (
          <MateriaCard
            key={m.id}
            materia={m}
            todasLasMaterias={todasLasMaterias}
            onUpdate={onUpdate}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Plan Estudios ───────────────────────────────────────────────────

interface PlanEstudiosProps {
  materias: Materia[];
  onUpdate: (id: string, cambios: Partial<Materia>) => void;
}

export function PlanEstudios({ materias, onUpdate }: PlanEstudiosProps) {
  const year1 = materias.filter((m) => m.year === 1);
  const year2 = materias.filter((m) => m.year === 2);

  return (
    <div className="space-y-8">
      <YearSection year={1} items={year1} todasLasMaterias={materias} onUpdate={onUpdate} />
      <YearSection year={2} items={year2} todasLasMaterias={materias} onUpdate={onUpdate} />
    </div>
  );
}
