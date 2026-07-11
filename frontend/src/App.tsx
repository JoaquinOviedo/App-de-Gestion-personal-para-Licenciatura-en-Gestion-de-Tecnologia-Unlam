/**
 * App.tsx — Punto de entrada principal de la aplicación.
 * Solo se encarga de:
 *   1. Cargar datos con `useMaterias`.
 *   2. Renderizar el header + tabs de navegación.
 *   3. Delegar el contenido de cada tab a su vista correspondiente.
 *
 * Para agregar una nueva pestaña:
 *   - Añadir entrada a TABS.
 *   - Crear la vista en src/views/.
 *   - Agregar la condición de render en <main>.
 */

import { useState, useEffect } from 'react';
import { useMaterias } from './hooks/useMaterias';
import { SaveIndicator } from './components/ui/SaveIndicator';
import { Dashboard } from './views/Dashboard';
import { PlanEstudios } from './views/PlanEstudios';
import { Calendario } from './views/Calendario';
import { BaseDatos } from './views/BaseDatos';

// ─── Tabs ─────────────────────────────────────────────────────────────

type TabId = 'dashboard' | 'plan' | 'calendario' | 'datos';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'dashboard',  label: 'Dashboard',        icon: '📊' },
  { id: 'plan',       label: 'Plan de Estudios',  icon: '📚' },
  { id: 'calendario', label: 'Calendario',         icon: '🗓️' },
  { id: 'datos',      label: 'Base de Datos',     icon: '🗄️' },
];

// ─── App ──────────────────────────────────────────────────────────────

export default function App() {
  const { materias, loading, saveStatus, updateMateria, resetMaterias } = useMaterias();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [serverDown, setServerDown] = useState(false);

  // Heartbeat: ping al servidor cada 5s + detectar desconexión
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/heartbeat');
        if (!res.ok) throw new Error();
      } catch {
        setServerDown(true);
      }
    }, 5000);

    // Al cerrar la pestaña, avisar al servidor que se apague
    const onUnload = () => {
      navigator.sendBeacon('/api/shutdown');
    };
    window.addEventListener('beforeunload', onUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', onUnload);
    };
  }, []);

  if (serverDown) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-xl">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-zinc-100 mb-2">Servidor Desconectado</h2>
          <p className="text-zinc-400 text-sm mb-6">
            Se cerró la terminal o el backend dejó de responder. Esta pestaña ya no está sincronizada y se cerrará automáticamente.
          </p>
          <button 
            onClick={() => window.close()} 
            className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-medium text-sm rounded-xl transition-colors cursor-pointer"
          >
            Cerrar Pestaña
          </button>
        </div>
      </div>
    );
  }

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
              <p className="text-xs text-zinc-600 truncate hidden sm:block">
                Lic. en Gestión de Tecnología
              </p>
            </div>
          </div>
          <SaveIndicator status={saveStatus} />
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4">
          <nav className="flex gap-1 -mb-px overflow-x-auto [scrollbar-width:none]">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                  ${
                    activeTab === tab.id
                      ? 'border-violet-500 text-violet-400'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                  }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {activeTab === 'dashboard'  && <Dashboard   materias={materias} />}
        {activeTab === 'plan'       && <PlanEstudios materias={materias} onUpdate={updateMateria} />}
        {activeTab === 'calendario' && <Calendario   materias={materias} />}
        {activeTab === 'datos'      && <BaseDatos    materias={materias} onRestore={resetMaterias} />}
      </main>

      <footer className="border-t border-zinc-900 mt-12 py-4 text-center">
        <p className="text-zinc-700 text-xs">Mi Carrera Tech · Gestor Local · Datos en materias.json</p>
      </footer>
    </div>
  );
}
