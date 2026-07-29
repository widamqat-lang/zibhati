import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useListProducts } from '@workspace/api-client-react';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { Shell, LoadingBlock, ErrorBlock, EmptyProducts } from '../shared';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function OrderPage() {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const productId = Number(params.get('product') || '0');
  
  const { data: products, isLoading, isError, refetch } = useListProducts();
  const productList = Array.isArray(products) ? products : [];
  const product = productList.find((p) => p.id === productId) || productList.find((p) => p.active);

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [pickupDate, setPickupDate] = useState(today());
  const [deliveryTime, setDeliveryTime] = useState('');
  const [preparationType, setPreparationType] = useState<'slaughtered' | 'live'>('slaughtered');
  const [error, setError] = useState('');

  if (isLoading) return <Shell><LoadingBlock label="نجهّز لكم الاختيارات" /></Shell>;
  if (isError) return <Shell><ErrorBlock onRetry={() => void refetch()} /></Shell>;
  if (!product) return <Shell><div className="p-8"><EmptyProducts /></div></Shell>;

  const goNext = () => {
    if (!customerName.trim()) {
      setError('يرجى إدخال الاسم الكريم.');
      return;
    }
    if (phone.trim().length < 5) {
      setError('يرجى إدخال رقم هاتف صحيح.');
      return;
    }
    if (!address.trim() || address.trim().length < 3) {
      setError('يرجى إدخال عنوان التوصيل.');
      return;
    }
    if (!pickupDate) {
      setError('يرجى اختيار تاريخ التوصيل.');
      return;
    }
    if (!deliveryTime) {
      setError('يرجى اختيار وقت التوصيل.');
      return;
    }

    const payload = { 
      productId: product.id, 
      productName: product.name, 
      productPrice: product.price,
      quantity: Number(params.get('quantity') || '1'), 
      customerName, 
      phone, 
      address, 
      pickupDate, 
      deliveryTime,
      preparationType,
      paymentMethod: 'cash_on_delivery' as const 
    };
    sessionStorage.setItem('mawashi-order-draft', JSON.stringify(payload));
    sessionStorage.setItem('mawashi-customer-name', customerName);
    
    // Dispatch event for admin real-time updates
    console.log('[ORDER] Dispatching mawashi-customer-info', { customerName, phone, address });
    window.dispatchEvent(new CustomEvent('mawashi-customer-info', { 
      detail: { 
        customerName,
        phone,
        address 
      } 
    }));
    setLocation('/summary');
  };

  return (
    <Shell>
      <div className="page-enter mx-auto max-w-2xl px-5 py-10 lg:py-16">
        <Link href="/" data-testid="link-back-store" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-primary">
          <ArrowRight size={16} /> رجوع
        </Link>

        {/* Order Form */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h1 className="mb-6 text-xl font-bold">بيانات الطلب</h1>

          <div className="space-y-5">
            <div>
              <Label htmlFor="customer-name" className="text-sm font-medium">الاسم الكريم <span className="text-primary">*</span></Label>
              <Input 
                id="customer-name" 
                value={customerName} 
                onChange={e => setCustomerName(e.target.value)} 
                placeholder="مثال: محمد أحمد" 
                data-testid="input-customer-name" 
                className="mt-1.5 h-12 rounded-xl" 
                required
              />
            </div>
            
            <div>
              <Label htmlFor="customer-phone" className="text-sm font-medium">رقم الهاتف <span className="text-primary">*</span></Label>
              <Input 
                id="customer-phone" 
                type="tel"
                inputMode="tel"
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                placeholder="36 000 000" 
                dir="ltr" 
                data-testid="input-customer-phone" 
                className="mt-1.5 h-12 rounded-xl" 
                required
              />
            </div>
            
            <div>
              <Label htmlFor="customer-address" className="text-sm font-medium">عنوان التوصيل <span className="text-primary">*</span></Label>
              <Textarea 
                id="customer-address" 
                value={address} 
                onChange={e => setAddress(e.target.value)} 
                placeholder="المنطقة، الطريق، رقم المبنى..." 
                data-testid="input-customer-address" 
                className="mt-1.5 min-h-[80px] resize-none rounded-xl" 
                required
              />
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="pickup-date" className="text-sm font-medium">تاريخ التوصيل <span className="text-primary">*</span></Label>
                <div className="relative mt-1.5">
                  <CalendarDays size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    id="pickup-date" 
                    type="date" 
                    min={today()} 
                    value={pickupDate} 
                    onChange={e => setPickupDate(e.target.value)} 
                    data-testid="input-pickup-date" 
                    className="h-12 rounded-xl pr-10" 
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="delivery-time" className="text-sm font-medium">وقت التوصيل <span className="text-primary">*</span></Label>
                <select
                  id="delivery-time"
                  value={deliveryTime}
                  onChange={e => setDeliveryTime(e.target.value)}
                  data-testid="select-delivery-time"
                  className="mt-1.5 flex h-12 w-full items-center rounded-xl border border-input bg-background px-3 text-sm"
                  required
                >
                  <option value="">اختر الوقت</option>
                  <option value="morning">توصيل صباحاً</option>
                  <option value="evening">توصيل مساءً</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="preparation-type" className="text-sm font-medium">طريقة الاستلام <span className="text-primary">*</span></Label>
              <select
                id="preparation-type"
                value={preparationType}
                onChange={e => setPreparationType(e.target.value as 'slaughtered' | 'live')}
                data-testid="select-preparation-type"
                className="mt-1.5 flex h-12 w-full items-center rounded-xl border border-input bg-background px-3 text-sm"
                required
              >
                <option value="slaughtered">مذبوح مقطع</option>
                <option value="live">حي بدون ذبح</option>
              </select>
            </div>
          </div>

          {error && (
            <p className="mt-4 text-sm font-medium text-destructive" data-testid="status-order-error">
              {error}
            </p>
          )}

          <Button 
            onClick={goNext} 
            data-testid="button-continue-order" 
            className="mt-6 h-14 w-full rounded-2xl text-base font-bold"
          >
            متابعة الطلب <ArrowRight size={20} />
          </Button>
        </div>
      </div>
    </Shell>
  );
}
