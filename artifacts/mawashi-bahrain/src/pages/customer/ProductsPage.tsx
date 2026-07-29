import { useLocation } from 'wouter';
import { useListProducts } from '@workspace/api-client-react';
import { ArrowLeft } from 'lucide-react';
import { Shell, LoadingBlock, EmptyProducts } from '../shared';
import { Button } from '@/components/ui/button';
import { ProductCard } from './ProductCard';
import { usePresence } from './usePresence';

function money(value: number) {
  return `${value.toFixed(0)} د.ب`;
}

const fallbackSheep = 'https://images.unsplash.com/photo-1484557985045-edf25e08da73?auto=format&fit=crop&w=900&q=82';

// Get product image - prefers imageUrl (Supabase), falls back to base64 image
function getProductImage(product: { imageUrl?: string; image?: string }): string {
  return product.imageUrl || product.image || fallbackSheep;
}

export function ProductsPage() {
  const [, setLocation] = useLocation();
  const { data: products, isLoading, refetch } = useListProducts({
    query: { staleTime: 0 } // Always fetch fresh data to get latest images
  });
  const productList = Array.isArray(products) ? products.filter(p => p.active) : [];

  usePresence('products', 'يتصفح المنتجات');

  if (isLoading) return <Shell><LoadingBlock label="نحمّل المنتجات" /></Shell>;

  return (
    <Shell>
      <div className="page-enter px-5 py-10 lg:px-10 lg:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-[-.04em]">منتجاتنا</h1>
          <p className="mt-2 text-sm text-muted-foreground">اختاروا من أفضل أنواع المواشي الطازجة</p>
        </div>

        {productList.length === 0 ? (
          <EmptyProducts />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {productList.map(product => (
              <article key={product.id} className="group flex min-w-0 flex-col">
                <button 
                  type="button" 
                  onClick={() => setLocation(`/order?product=${product.id}`)} 
                  data-testid={`button-select-product-${product.id}`} 
                  className="relative aspect-[1.08] overflow-hidden rounded-[25px] bg-muted text-right"
                >
                  <img 
                    src={getProductImage(product)} 
                    alt={product.name} 
                    className="size-full object-cover transition duration-700 group-hover:scale-105" 
                  />
                  <div className="absolute inset-x-3 top-3 flex items-start justify-between">
                    <span className="rounded-full bg-card/90 px-3 py-1.5 text-[9px] font-bold text-secondary backdrop-blur">طازج اليوم</span>
                    <span className="grid size-8 place-items-center rounded-full bg-card/85 text-primary opacity-0 shadow-sm backdrop-blur transition group-hover:opacity-100">
                      <ArrowLeft size={14} />
                    </span>
                  </div>
                </button>
                <div className="flex items-start justify-between gap-3 px-1 pt-4">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold">{product.name}</h3>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-muted-foreground">{product.description}</p>
                  </div>
                  <div className="shrink-0 text-left">
                    <div className="font-mono-bahrain text-sm font-medium text-primary" dir="ltr">{money(product.price)}</div>
                    <div className="mt-1 text-[9px] text-muted-foreground">للكيلو</div>
                  </div>
                </div>
                <Button 
                  onClick={() => setLocation(`/order?product=${product.id}`)} 
                  className="mt-4 h-10 w-full rounded-xl text-xs"
                >
                  {product.maxQuantity} رأس متاح
                </Button>
              </article>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
