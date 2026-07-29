import { useState } from 'react';
import { useLocation, Link, useParams } from 'wouter';
import { useListProducts } from '@workspace/api-client-react';
import { ArrowRight, BadgeCheck, Check, Minus, Plus, ShieldCheck, Truck } from 'lucide-react';
import { Shell, LoadingBlock, ErrorBlock } from '../shared';
import { Button } from '@/components/ui/button';

const fallbackSheep = 'https://images.unsplash.com/photo-1484557985045-edf25e08da73?auto=format&fit=crop&w=900&q=82';

function money(value: number) {
  return `${value.toFixed(0)} د.ب`;
}

// Get product image - prefers imageUrl (Supabase), falls back to base64 image
function getProductImage(product: { imageUrl?: string; image?: string }): string {
  return product.imageUrl || product.image || fallbackSheep;
}

export function ProductDetailPage() {
  const [location, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const searchParams = new URLSearchParams(window.location.search);
  const productId = Number(params.id || '0');
  const initialQuantity = Number(searchParams.get('quantity') || '1');
  
  const { data: products, isLoading, isError, refetch } = useListProducts({
    query: { staleTime: 0 } // Always fetch fresh data to get latest images
  });
  const productList = Array.isArray(products) ? products : [];
  const product = productList.find(p => p.id === productId);
  
  const [quantity, setQuantity] = useState(initialQuantity);

  if (isLoading) return <Shell><LoadingBlock label="نحمّل تفاصيل المنتج" /></Shell>;
  if (isError) return <Shell><ErrorBlock onRetry={() => void refetch()} /></Shell>;
  if (!product) {
    return (
      <Shell>
        <div className="mx-auto max-w-lg p-10 text-center">
          <h1 className="text-xl font-bold">المنتج غير موجود</h1>
          <Link href="/" className="mt-4 inline-flex items-center gap-2 text-primary">
            <ArrowRight size={16} /> العودة للرئيسية
          </Link>
        </div>
      </Shell>
    );
  }

  const handleOrder = () => {
    setLocation(`/order?product=${product.id}&quantity=${quantity}`);
  };

  const decreaseQty = () => setQuantity(q => Math.max(1, q - 1));
  const increaseQty = () => setQuantity(q => Math.min(product.maxQuantity, q + 1));

  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8 lg:py-12">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="transition hover:text-foreground">الرئيسية</Link>
          <span>/</span>
          <span className="font-medium text-foreground">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Product Image */}
          <div className="relative overflow-hidden rounded-3xl bg-muted">
            <img 
              src={getProductImage(product)} 
              alt={product.name} 
              className="aspect-square size-full object-cover" 
            />
            <div className="absolute inset-x-3 top-3 flex gap-2">
              <span className="rounded-full bg-accent px-4 py-2 text-xs font-bold text-secondary backdrop-blur">
                طازج اليوم
              </span>
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col justify-center">
            <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
              {product.name}
            </h1>
            
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {product.description}
            </p>

            {/* Trust Badges */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="flex items-center gap-2 rounded-xl bg-muted p-3">
                <BadgeCheck size={18} className="text-primary" />
                <span className="text-[10px] font-medium">ذبح حلال</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-muted p-3">
                <Truck size={18} className="text-primary" />
                <span className="text-[10px] font-medium">توصيل مجاني</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-muted p-3">
                <ShieldCheck size={18} className="text-primary" />
                <span className="text-[10px] font-medium">ضمان الجودة</span>
              </div>
            </div>

            {/* Price */}
            <div className="mt-8 flex items-end justify-between">
              <div>
                <div className="text-xs text-muted-foreground">السعر  </div>
                <div className="mt-1 font-mono-bahrain text-3xl font-bold text-primary" dir="ltr">
                  {money(product.price)}
                </div>
              </div>
              <div className="text-left">
                <div className="text-xs text-muted-foreground">متوفر</div>
                <div className="mt-1 flex items-center gap-1 text-xs font-bold text-secondary">
                  <Check size={14} /> حتى {product.maxQuantity} رأس
                </div>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mt-8">
              <label className="text-sm font-medium">اختر العدد:</label>
              <div className="mt-3 flex items-center gap-4">
                <div className="flex items-center gap-3 rounded-2xl border border-input bg-background px-4 py-2">
                  <button 
                    type="button" 
                    onClick={decreaseQty}
                    className="grid size-10 place-items-center rounded-xl bg-muted text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="w-12 text-center text-xl font-bold" dir="ltr">{quantity}</span>
                  <button 
                    type="button" 
                    onClick={increaseQty}
                    className="grid size-10 place-items-center rounded-xl bg-accent text-secondary transition hover:bg-accent/80"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <span className="text-sm text-muted-foreground">
                  من {product.maxQuantity} متاح
                </span>
              </div>
            </div>

            {/* Total Price */}
            <div className="mt-6 rounded-2xl bg-secondary p-4 text-secondary-foreground">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">السعر الإجمالي:</span>
                <span className="font-mono-bahrain text-xl font-bold" dir="ltr">
                  {money(product.price * quantity)}
                </span>
              </div>
              <p className="mt-1 text-[10px] text-secondary-foreground/70">
                * السعر شامل التوصيل
              </p>
            </div>

            {/* Order Button */}
            <Button 
              onClick={handleOrder}
              className="mt-6 h-14 rounded-2xl text-base font-bold"
            >
              طلب الآن <ArrowRight size={20} />
            </Button>
          </div>
        </div>
      </div>
    </Shell>
  );
}
