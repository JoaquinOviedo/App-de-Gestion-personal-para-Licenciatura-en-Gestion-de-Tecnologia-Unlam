/**
 * views/BaseDatos.tsx — Pestaña de gestión de datos (backup/restore).
 *
 * Permite:
 * - Ver la ubicación del archivo de datos en el servidor.
 * - Exportar los datos actuales como JSON (backup).
 * - Importar un JSON previo (restore).
 * - Vista previa del JSON en pantalla.
 */

import { useState, useEffect } from 'react';
import { calcularEstadisticas } from '../utils/academic';
import type { Materia } from '../types';

interface BaseDatosProps {
  materias: Materia[];
  onRestore: (data: Materia[]) => void;
}

export function BaseDatos({ materias, onRestore }: BaseDatosProps) {
  const [dataPath, setDataPath] = useState('');
  const [backupStatus, setBackupStatus] = useState('');

  useEffect(() => {
    fetch('/api/datapath')
      .then((r) => r.json())
      .then((d: { path: string }) => setDataPath(d.path))
      .catch(() => setDataPath('No disponible'));
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
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string) as unknown;
          if (!Array.isArray(data)) throw new Error('Formato inválido');
          onRestore(data as Materia[]);
          setBackupStatus('✓ Backup restaurado correctamente');
        } catch (err) {
          setBackupStatus(`✗ Error: ${(err as Error).message}`);
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
      {/* Archivo de datos */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h3 className="text-zinc-100 font-semibold mb-4 flex items-center gap-2">
          <span>💾</span> Archivo de datos
        </h3>
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

      {/* Acciones de emergencia */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h3 className="text-zinc-100 font-semibold mb-2 flex items-center gap-2">
          <span>🛡️</span> Acciones de emergencia
        </h3>
        <p className="text-zinc-500 text-sm mb-5">Exportá o importá tus datos completos.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={hacerBackup}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl
              bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm transition-colors"
          >
            ⬇️ Hacer Backup (.json)
          </button>
          <button
            onClick={restaurarBackup}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl
              bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-200 font-semibold text-sm transition-colors"
          >
            ⬆️ Restaurar Backup
          </button>
        </div>
        {backupStatus && (
          <p
            className={`mt-3 text-sm text-center font-medium ${
              backupStatus.startsWith('✓') ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {backupStatus}
          </p>
        )}
      </div>

      {/* Vista previa JSON */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h3 className="text-zinc-100 font-semibold mb-3 flex items-center gap-2">
          <span>📋</span> Vista previa del JSON
        </h3>
        <pre className="text-xs text-zinc-400 bg-zinc-950 border border-zinc-800 rounded-xl p-4 overflow-auto max-h-64 [scrollbar-width:thin]">
          {JSON.stringify(materias, null, 2)}
        </pre>
      </div>
    </div>
  );
}
