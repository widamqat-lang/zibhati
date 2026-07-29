function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function IconButton({ 
  label, 
  children, 
  onClick, 
  className 
}: { 
  label: string; 
  children: React.ReactNode; 
  onClick?: () => void; 
  className?: string 
}) {
  return (
    <button 
      type="button" 
      aria-label={label} 
      data-testid={`button-${label}`} 
      onClick={onClick} 
      className={cn('grid size-10 place-items-center rounded-full transition hover:bg-secondary/10', className)}
    >
      {children}
    </button>
  );
}
