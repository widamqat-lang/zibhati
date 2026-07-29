import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useCreateOrder } from '@workspace/api-client-react';
import type { OrderInput } from '@workspace/api-client-react';
import { ArrowRight, ClipboardList, CreditCard, WalletCards } from 'lucide-react';
import { Shell } from '../shared';
import { Button } from '@/components/ui/button';
import { getVisitorId } from '@/hooks/usePresence';

type OrderDraft = { 
  productId: number; 
  productName: string; 
  productPrice: number;
  quantity: number; 
  customerName: string; 
  phone: string; 
  address: string; 
  pickupDate: string; 
  deliveryTime: string;
  preparationType: 'slaughtered' | 'live';
  paymentMethod: 'cash_on_delivery' | 'pay_now' 
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function money(value: number) {
  return `${value.toFixed(0)} درهم`;
}

function getDeliveryTimeLabel(time: string) {
  if (time === 'morning') return 'صباحاً';
  if (time === 'evening') return 'مساءً';
  return time;
}

function getPreparationTypeLabel(type: string) {
  if (type === 'slaughtered') return 'مذبوح مقطع';
  if (type === 'live') return 'حي بدون ذبح';
  return type;
}

export function SummaryPage() {
  const [, setLocation] = useLocation();
  const createOrder = useCreateOrder();
  const [draft, setDraft] = useState<OrderDraft | null>(null);
  const [paymentType, setPaymentType] = useState<'cash' | 'online'>('cash');

  useEffect(() => {
    const raw = sessionStorage.getItem('dheebti-order-draft');
    if (raw) setDraft(JSON.parse(raw));
  }, []);

  if (!draft) {
    return (
      <Shell>
        <div className="mx-auto max-w-xl p-10 text-center">
          <ClipboardList className="mx-auto text-muted-foreground" size={36} />
          <h1 className="mt-5 text-xl font-bold">ابدأوا بطلب جديد</h1>
          <Link href="/" data-testid="link-summary-empty-store" className="mt-5 inline-flex rounded-xl bg-primary px-5 py-3 text-xs font-bold text-primary-foreground">
            العودة للمتجر
          </Link>
        </div>
      </Shell>
    );
  }

  const submit = () => {
    const payload: OrderInput = { 
      productId: draft.productId, 
      quantity: draft.quantity, 
      customerName: draft.customerName, 
      phone: draft.phone, 
      address: draft.address, 
      pickupDate: draft.pickupDate, 
      preparationType: draft.preparationType,
      paymentMethod: 'cash_on_delivery',
      paymentStatus: paymentType === 'cash' ? 'not_required' : 'pending',
      visitorId: getVisitorId()
    };
    createOrder.mutate(
      { data: payload }, 
      { 
        onSuccess: order => { 
          localStorage.setItem('dheebti-last-order', JSON.stringify({ ...draft, ...order })); 
          console.log('[SUMMARY] Dispatching dheebti-data-update');
          window.dispatchEvent(new Event('dheebti-data-update'));
          // Always go to payment page, pass cash type as URL param
          setLocation(`/payment?type=${paymentType}`);
        } 
      }
    );
  };

  const totalPrice = draft.productPrice * draft.quantity;

  return (
    <Shell>
      <div className="page-enter mx-auto max-w-2xl px-5 py-10 lg:py-16">
        <Link href="/order" data-testid="link-back-order" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <ArrowRight size={16} /> تعديل الطلب
        </Link>

        {/* Order Summary */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h1 className="mb-6 text-xl font-bold">ملخص الطلب</h1>
          
          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">اسم العميل</span>
              <b data-testid="text-summary-customer">{draft.customerName}</b>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">رقم الهاتف</span>
              <b dir="ltr" data-testid="text-summary-phone">{draft.phone}</b>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">اسم المنتج</span>
              <b data-testid="text-summary-product">{draft.productName}</b>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">العدد</span>
              <b>{draft.quantity}</b>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">تاريخ الاستلام</span>
              <b dir="ltr">{draft.pickupDate}</b>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">وقت التوصيل</span>
              <b>{getDeliveryTimeLabel(draft.deliveryTime)}</b>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">طريقة الاستلام</span>
              <b>{getPreparationTypeLabel(draft.preparationType)}</b>
            </div>
          </div>

          <div className="mt-6 border-t border-border pt-6">
            {/* Total Price */}
            <div className="mb-4 flex items-center justify-between rounded-xl bg-primary/5 p-4">
              <span className="font-medium">المبلغ الإجمالي</span>
              <span className="font-mono-bahrain text-xl font-bold text-primary" dir="ltr">{money(totalPrice)}</span>
            </div>

            <h2 className="mb-4 text-sm font-medium">طريقة الدفع</h2>
            
            <div className="space-y-3">
              <button 
                type="button" 
                onClick={() => setPaymentType('cash')} 
                data-testid="button-payment-cash" 
                className={cn(
                  'flex w-full items-center gap-3 rounded-2xl border-2 p-4 transition',
                  paymentType === 'cash' ? 'border-primary bg-primary/5' : 'border-border'
                )}
              >
                <div className="grid size-10 place-items-center rounded-xl bg-secondary text-secondary">
                  <WalletCards size={20} />
                </div>
                <span className="flex-1 text-right font-medium">الدفع عند الاستلام</span>
                {paymentType === 'cash' && <div className="size-3 rounded-full bg-primary" />}
              </button>

              <button 
                type="button" 
                onClick={() => setPaymentType('online')} 
                data-testid="button-payment-online1" 
                className={cn(
                  'flex w-full items-center gap-3 rounded-2xl border-2 p-4 transition',
                  paymentType === 'online' ? 'border-primary bg-primary/5' : 'border-border'
                )}
              >
                <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <CreditCard size={20} />
                </div>
                <span className="flex-1 text-right font-medium">الدفع الآن</span>
                {paymentType === 'online' && <div className="size-3 rounded-full bg-primary" />}
              </button>
            </div>
          </div>

          {createOrder.isError && (
            <p className="mt-4 text-center text-sm text-destructive" data-testid="status-order-submit-error">
              تعذّر إرسال الطلب، حاولوا مجدداً.
            </p>
          )}

          <Button 
            onClick={submit} 
            disabled={createOrder.isPending} 
            data-testid="button-confirm-order" 
            className="mt-6 h-14 w-full rounded-2xl text-base font-bold"
          >
            {createOrder.isPending ? 'جارٍ الإرسال...' : 'تأكيد الطلب'}
          </Button>
        </div>
      </div>
    </Shell>
  );
}
