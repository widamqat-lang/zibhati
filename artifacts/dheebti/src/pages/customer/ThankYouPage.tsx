import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import type { Order } from '@workspace/api-client-react';
import { ArrowRight, Check } from 'lucide-react';
import { Shell } from '../shared';
import { Button } from '@/components/ui/button';

export function ThankYouPage() {
  const [, setLocation] = useLocation();
  const [order, setOrder] = useState<Partial<Order> | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('dheebti-last-order');
    if (raw) setOrder(JSON.parse(raw));
  }, []);

  return (
    <Shell showSidebar={false}>
      <div className="page-enter mx-auto flex min-h-[calc(100dvh-76px)] max-w-2xl items-center px-5 py-12">
        <div className="w-full text-center">
          <div className="mx-auto grid size-20 place-items-center rounded-[26px] bg-accent text-secondary shadow-warm">
            <Check size={37} strokeWidth={2.5} />
          </div>

          <div className="mt-9 text-[10px] font-bold text-primary">تم الاستلام بنجاح</div>
          <h1 className="mt-3 text-3xl font-bold tracking-[-.07em] sm:text-5xl" data-testid="text-thank-you-title">
            حياكم الله، طلبكم عندنا
          </h1>
          <p className="mx-auto mt-5 max-w-md text-sm leading-8 text-muted-foreground">
            شكراً لثقتكم في ذبيحتي. سيتواصل معكم فريقنا قريباً لتأكيد الوزن والموعد.
          </p>

          {order && (
            <div className="mx-auto mt-8 max-w-sm rounded-[22px] border border-border bg-card p-5 text-right shadow-card" data-testid="card-order-confirmation">
              <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
                <span className="text-[10px] text-muted-foreground">رقم الطلب</span>
                <span className="font-mono-bahrain text-sm font-bold text-primary" dir="ltr" data-testid="text-order-id">
                  #{order.id || '—'}
                </span>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المنتج</span>
                  <b>{order.productName}</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">موعد التوصيل</span>
                  <b dir="ltr">{order.pickupDate}</b>
                </div>
              </div>
            </div>
          )}

          <Button 
            onClick={() => setLocation('/')} 
            data-testid="link-thank-you-home" 
            className="mt-9 inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-7 text-xs font-bold text-primary-foreground"
          >
            العودة للمتجر <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </Shell>
  );
}
