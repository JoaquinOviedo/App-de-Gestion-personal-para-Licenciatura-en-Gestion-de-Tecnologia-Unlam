/**
 * hooks/useMaterias.ts — Hook central de comunicación con el backend.
 * Encapsula fetch, guardado con debounce, y actualizaciones de materias.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Materia } from '../types';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface UseMateriasReturn {
  materias: Materia[];
  loading: boolean;
  saveStatus: SaveStatus;
  updateMateria: (id: string, cambios: Partial<Materia>) => void;
  resetMaterias: (data: Materia[]) => void;
}

export function useMaterias(): UseMateriasReturn {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch('/api/materias')
      .then((r) => r.json())
      .then((data: Materia[]) => {
        setMaterias(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Guarda en el servidor con debounce corto para agrupar cambios rápidos
  const guardarMaterias = useCallback((nuevasMaterias: Materia[]) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus('saving');
    saveTimerRef.current = setTimeout(() => {
      fetch('/api/materias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevasMaterias),
      })
        .then((r) => r.json())
        .then(() => {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        })
        .catch(() => {
          setSaveStatus('error');
          setTimeout(() => setSaveStatus('idle'), 3000);
        });
    }, 300);
  }, []);

  const updateMateria = useCallback(
    (id: string, cambios: Partial<Materia>) => {
      setMaterias((prev) => {
        const nueva = prev.map((m) => (m.id === id ? { ...m, ...cambios } : m));
        guardarMaterias(nueva);
        return nueva;
      });
    },
    [guardarMaterias],
  );

  const resetMaterias = useCallback(
    (data: Materia[]) => {
      setMaterias(data);
      guardarMaterias(data);
    },
    [guardarMaterias],
  );

  return { materias, loading, saveStatus, updateMateria, resetMaterias };
}
