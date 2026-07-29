import { Link } from 'wouter';
import { 
  useGetAdminSummary, 
  useListAdminOrders, 
  useListPresence 
} from '@workspace/api-client-react';
import type { Order } from '@workspace/api-client-react';
import { 
  BarChart3, 
  Bell, 
  CalendarDays, 
  ClipboardList, 
  MonitorSmartphone, 
  Package, 
  UsersRound 
} from 'lucide-react';
import { LoadingBlock } from '../shared';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  accent 
}: { 
  icon: typeof BarChart3; 
  label: string; 
  value?: number; 
  accent?: boolean 
}) {
  return (
    <div 
      className={cn(
        'rounded-[22px] border bg-card p-5 shadow-card',
        accent && 'border-primary/20 bg-primary/[.04]'
      )} 
      data-testid={`card-stat-${label}`}
    >
      <div className="flex items-start justify-between">
        <div className={cn(
          'grid size-10 place-items-center rounded-xl',
          accent ? 'bg-primary text-primary-foreground' : 'bg-muted text-primary'
        )}>
          <Icon size={18} />
        </div>
        <span className="rounded-full bg-secondary/10 px-2 py-1 text-[9px] font-bold text-secondary">اليوم</span>
      </div>
      <div className="mt-6 font-mono-bahrain text-3xl font-medium" dir="ltr" data-testid={`text-stat-${label}`}>
        {value ?? '—'}
      </div>
      <div className="mt-1 text-[11px] font-semibold text-muted-foreground">{label}</div>
    </div>
  );
}

function OrderRow({ order }: { order: Order }) {
  return (
    <div 
      className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 p-3" 
      data-testid={`row-admin-order-${order.id}`}
    >
      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-primary">
        <Package size={16} />
      </div>
      <div className="min-w-[110px] flex-1">
        <div className="text-xs font-bold">{order.customerName}</div>
        <div className="mt-1 text-[10px] text-muted-foreground">{order.productName} · {order.quantity} رأس</div>
      </div>
      <div className="hidden text-left sm:block">
        <div className="font-mono-bahrain text-xs" dir="ltr">#{order.id}</div>
        <div className={cn('mt-1 text-[9px] font-bold', order.status === 'new' ? 'text-primary' : 'text-muted-foreground')}>
          {order.status === 'new' ? 'جديد' : order.status}
        </div>
      </div>
    </div>
  );
}

export function OverviewAdmin() {
  const summary = useGetAdminSummary();
  const orders = useListAdminOrders();
  const presence = useListPresence();

  const presenceList = Array.isArray(presence.data) ? presence.data : [];
  const ordersList = Array.isArray(orders.data) ? orders.data : [];
  const latest = ordersList.slice(0, 5);

  return (
    <div className="page-enter">
      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ClipboardList} label="إجمالي الطلبات" value={summary.data?.totalOrders} />
        <StatCard icon={Bell} label="طلبات جديدة" value={summary.data?.newOrders} accent />
        <StatCard icon={CalendarDays} label="طلبات اليوم" value={summary.data?.todayOrders} />
        <StatCard 
          icon={UsersRound} 
          label="الزوار الآن" 
          value={summary.data?.activeVisitors ?? presenceList.filter(p => p.active).length} 
        />
      </div>

      {/* Bottom Section */}
      <div className="mt-7 grid gap-7 xl:grid-cols-[1.25fr_.75fr]">
        {/* Recent Orders */}
        <section className="rounded-[24px] border border-border bg-card p-5 md:p-7">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold">آخر الطلبات</h2>
              <p className="mt-1 text-[10px] text-muted-foreground">متابعة الطلبات الجديدة أولاً بأول</p>
            </div>
            <Link href="/admin" data-testid="link-dashboard-orders" className="text-[10px] font-bold text-primary">
              عرض الكل
            </Link>
          </div>
          {orders.isLoading ? (
            <div className="space-y-3">
              <div className="h-12 animate-pulse rounded-xl bg-muted" />
              <div className="h-12 animate-pulse rounded-xl bg-muted" />
            </div>
          ) : latest.length ? (
            <div className="space-y-2">{latest.map(order => <OrderRow key={order.id} order={order} />)}</div>
          ) : (
            <div className="py-10 text-center text-xs text-muted-foreground" data-testid="state-empty-admin-orders">
              لا توجد طلبات بعد
            </div>
          )}
        </section>

        {/* Live Presence */}
        <section className="rounded-[24px] bg-secondary p-6 text-secondary-foreground">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold">الحضور المباشر</h2>
              <p className="mt-1 text-[10px] text-secondary-foreground/60">من يتصفح المتجر الآن</p>
            </div>
            <span className="flex items-center gap-1.5 text-[10px] text-accent">
              <span className="size-1.5 rounded-full bg-accent pulse-dot" /> مباشر
            </span>
          </div>
          <div className="mt-6 space-y-3">
            {presenceList.filter(p => p.active).slice(0, 4).map(p => (
              <div 
                key={p.sessionId} 
                className="flex items-center gap-3 rounded-xl bg-secondary-foreground/[.08] p-3" 
                data-testid={`row-presence-dashboard-${p.sessionId}`}
              >
                <div className="grid size-8 place-items-center rounded-full bg-accent text-secondary">
                  <MonitorSmartphone size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[11px] font-bold">{p.customerName || 'زائر جديد'}</div>
                  <div className="mt-0.5 truncate text-[9px] text-secondary-foreground/55">{p.label}</div>
                </div>
                <div className="text-[9px] text-accent">الآن</div>
              </div>
            ))}
            {!presenceList.filter(p => p.active).length && (
              <div className="py-8 text-center text-xs text-secondary-foreground/60" data-testid="state-empty-presence">
                لا يوجد زوار الآن
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
