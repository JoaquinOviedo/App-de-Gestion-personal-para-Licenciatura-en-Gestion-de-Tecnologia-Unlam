/**
 * components/ui/DateInput.tsx — Input de fecha estilizado para tema oscuro.
 */

interface DateInputProps {
  label: string;
  value?: string;
  onChange: (value: string) => void;
}

export function DateInput({ label, value, onChange }: DateInputProps) {
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
