function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn('flex items-center gap-3', compact && 'gap-2')} data-testid="brand-mark">
      <div className="relative grid size-11 shrink-0 place-items-center rounded-[15px] bg-accent text-secondary shadow-sm">
        <span className="absolute top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
        <span className="text-2xl font-bold leading-none">م</span>
      </div>
      <div className="leading-tight">
        <div className={cn('text-[17px] font-bold tracking-[-.04em]', compact && 'text-[15px]')}>ذبيحتي</div>
        {!compact && <div className="mt-1 font-mono-bahrain text-[8px] uppercase text-muted-foreground" dir="ltr">MAWASHI / BH</div>}
      </div>
    </div>
  );
}
