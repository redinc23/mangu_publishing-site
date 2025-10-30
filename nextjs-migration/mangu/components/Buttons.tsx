export function Button({ children, className = 'bg-orange-500 hover:bg-orange-600' }: { children: React.ReactNode; className?: string }) {
  return <button className={`inline-flex items-center gap-2 rounded-md px-4 py-2 font-semibold transition ${className}`}>{children}</button>;
}

export function OutboundBtn({ href, label, color }: { href: string; label: string; color: string }) {
  const url = href || '#';
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={`rounded-md px-3 py-2 text-sm font-bold ${color} transition-all hover:opacity-90`} aria-label={label}>
      {label}
    </a>
  );
}

