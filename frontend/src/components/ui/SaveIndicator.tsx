/**
 * components/ui/SaveIndicator.tsx — Indicador visual del estado de guardado.
 */

interface SaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
}

const CONFIGS = {
  saving: { text: 'Guardando...', cls: 'text-sky-400' },
  saved:  { text: '✓ Guardado',  cls: 'text-emerald-400' },
  error:  { text: '✗ Error',     cls: 'text-red-400' },
} as const;

export function SaveIndicator({ status }: SaveIndicatorProps) {
  if (status === 'idle') return null;
  const cfg = CONFIGS[status as keyof typeof CONFIGS];
  return <span className={`text-xs font-medium ${cfg.cls}`}>{cfg.text}</span>;
}
