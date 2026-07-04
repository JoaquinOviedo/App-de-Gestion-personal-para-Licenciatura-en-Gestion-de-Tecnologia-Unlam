/**
 * components/ui/Badge.tsx — Etiqueta visual de estado con clases personalizables.
 */

interface BadgeProps {
  text: string;
  className?: string;
}

export function Badge({ text, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}
    >
      {text}
    </span>
  );
}
