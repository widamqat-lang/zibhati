import { useListPresence } from '@workspace/api-client-react';
import { MonitorSmartphone, RefreshCw } from 'lucide-react';
import { LoadingBlock } from '../shared';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function PresenceAdmin() {
  const { data, isLoading, refetch } = useListPresence();
  const rows = Array.isArray(data) ? data : [];

  return (
    <div className="page-enter">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-bold">الحضور المباشر</h2>
          <p className="mt-1 text-[11px] text-muted-foreground">راقبوا رحلة العميل داخل المتجر.</p>
        </div>
        <button 
          type="button" 
          onClick={() => void refetch()} 
          data-testid="button-refresh-presence" 
          className="grid size-10 place-items-center rounded-xl border border-border bg-card text-primary"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          <LoadingBlock />
        ) : rows.length ? (
          rows.map(p => (
            <div 
              key={p.sessionId} 
              className="rounded-[22px] border border-border bg-card p-5 shadow-card" 
              data-testid={`card-presence-${p.sessionId}`}
            >
              <div className="flex items-center justify-between">
                <div className={cn(
                  'flex items-center gap-2 text-[10px] font-bold',
                  p.active ? 'text-secondary' : 'text-muted-foreground'
                )}>
                  <span className={cn('size-2 rounded-full', p.active ? 'bg-accent pulse-dot' : 'bg-border')} />
                  {p.active ? 'نشط الآن' : 'غادر'}
                </div>
                <MonitorSmartphone size={17} className="text-primary" />
              </div>
              <h3 className="mt-6 text-sm font-bold">{p.customerName || 'زائر جديد'}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{p.label}</p>
              <div className="mt-5 flex items-center justify-between border-t border-border pt-3 text-[10px] text-muted-foreground">
                <span>{p.page}</span>
                <span dir="ltr">
                  {new Date(p.lastSeenAt).toLocaleTimeString('ar-BH', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full rounded-[22px] border border-dashed border-border p-16 text-center text-xs text-muted-foreground" data-testid="state-empty-presence-page">
            لا يوجد حضور مسجل
          </div>
        )}
      </div>
    </div>
  );
}
