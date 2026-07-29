import { useState } from 'react';
import { useListAdminOrders } from '@workspace/api-client-react';
import type { Order } from '@workspace/api-client-react';
import { Package, Search } from 'lucide-react';
import { LoadingBlock, ErrorBlock } from '../shared';
import { Input } from '@/components/ui/input';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function getPreparationTypeLabel(type?: string) {
  if (type === 'slaughtered') return 'مذبوح مقطع';
  if (type === 'live') return 'حي بدون ذبح';
  return '-';
}

export function OrdersAdmin() {
  const { data, isLoading, isError, refetch } = useListAdminOrders();
  const [search, setSearch] = useState('');

  const ordersList = Array.isArray(data) ? data : [];
  const orders = ordersList.filter(order => 
    `${order.customerName} ${order.productName} ${order.phone}`.includes(search)
  );

  return (
    <div className="page-enter">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">سجل الطلبات</h2>
          <p className="mt-1 text-[11px] text-muted-foreground">كل طلبات العائلات في مكان واحد.</p>
        </div>
        <div className="relative">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="بحث بالاسم أو المنتج" 
            data-testid="input-orders-search" 
            className="h-10 w-52 rounded-xl pr-9 text-xs" 
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-[24px] border border-border bg-card">
        {isError ? (
          <ErrorBlock onRetry={() => void refetch()} />
        ) : isLoading ? (
          <LoadingBlock />
        ) : orders.length ? (
          <table className="w-full min-w-[700px] text-right text-xs">
            <thead className="bg-muted text-[10px] text-muted-foreground">
              <tr>
                <th className="p-4">الطلب</th>
                <th className="p-4">العميل</th>
                <th className="p-4">المنتج</th>
                <th className="p-4">الموعد</th>
                <th className="p-4">الاستلام</th>
                <th className="p-4">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map(order => (
                <tr key={order.id} data-testid={`row-order-detail-${order.id}`}>
                  <td className="p-4 font-mono-bahrain text-primary" dir="ltr">#{order.id}</td>
                  <td className="p-4">
                    <b>{order.customerName}</b>
                    <div className="mt-1 text-[10px] text-muted-foreground" dir="ltr">{order.phone}</div>
                  </td>
                  <td className="p-4">
                    {order.productName}
                    <div className="mt-1 text-[10px] text-muted-foreground">{order.quantity} رأس</div>
                  </td>
                  <td className="p-4" dir="ltr">{order.pickupDate}</td>
                  <td className="p-4">
                    <span className="text-[10px]">{getPreparationTypeLabel(order.preparationType)}</span>
                  </td>
                  <td className="p-4">
                    <span className="rounded-full bg-accent/30 px-3 py-1 text-[10px] font-bold text-secondary">
                      {order.status === 'new' ? 'جديد' : order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-16 text-center text-xs text-muted-foreground" data-testid="state-empty-orders">
            لا توجد طلبات تطابق البحث
          </div>
        )}
      </div>
    </div>
  );
}
