/**
 * components/ui/NoteInput.tsx — Input de nota con soporte para estado "Ausente".
 *
 * REGLAS:
 * - Solo propaga el valor al padre cuando el usuario pierde el foco (onBlur).
 *   Esto evita re-renders en cascada que cerrarían el acordeón.
 * - Si `ausente` es true, el input se deshabilita y muestra "AUS".
 * - Acepta notas entre 1 y 10.
 */

import { useState, useEffect } from 'react';

interface NoteInputProps {
  label?: string;
  value: number | null | undefined;
  onCommit: (value: number | null) => void;
  disabled?: boolean;
  highlight?: 'good' | 'bad' | '';
  ausente?: boolean;
  onAusenteChange?: (checked: boolean) => void;
}

export function NoteInput({
  label,
  value,
  onCommit,
  disabled,
  highlight,
  ausente,
  onAusenteChange,
}: NoteInputProps) {
  const [localValue, setLocalValue] = useState<string>(value != null ? String(value) : '');

  useEffect(() => {
    setLocalValue(value != null ? String(value) : '');
  }, [value]);

  const handleBlur = () => {
    const num = localValue === '' ? null : parseFloat(localValue);
    const isValid = num === null || (!isNaN(num) && num >= 1 && num <= 10);
    if (!isValid) {
      setLocalValue(value != null ? String(value) : '');
      return;
    }
    if (num !== value) onCommit(num);
  };

  const isDisabled = disabled || ausente;

  const borderClass = isDisabled
    ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
    : highlight === 'good'
    ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300 focus:border-emerald-500'
    : highlight === 'bad'
    ? 'bg-red-950/40 border-red-700/50 text-red-300 focus:border-red-500'
    : 'bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-sky-500 focus:bg-zinc-800';

  return (
    <div className="flex flex-col gap-1 items-center">
      {label && (
        <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider self-start">
          {label}
        </label>
      )}
      <input
        type="number"
        min="1"
        max="10"
        step="0.5"
        disabled={isDisabled}
        value={ausente ? '' : localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        className={`w-20 px-2 py-1.5 rounded-lg text-sm font-mono text-center border transition-all outline-none ${borderClass}`}
        placeholder={ausente ? 'AUS' : '—'}
      />
      {onAusenteChange && (
        <label
          className={`flex items-center gap-1.5 mt-1 cursor-pointer select-none self-start ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <input
            type="checkbox"
            checked={!!ausente}
            disabled={disabled}
            onChange={(e) => onAusenteChange(e.target.checked)}
            className="w-3 h-3 rounded bg-zinc-900 border-zinc-700 text-sky-500 focus:ring-sky-500 focus:ring-offset-zinc-950"
          />
          <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500">
            Ausente
          </span>
        </label>
      )}
    </div>
  );
}
