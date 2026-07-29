import { useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { useGetStorefront } from '@workspace/api-client-react';
import { Search } from 'lucide-react';
import { Shell, LoadingBlock, ErrorBlock, EmptyProducts } from '../shared';
import { ProductCard } from './ProductCard';
import { usePresence } from './usePresence';

export function HomePage() {
  const { data: storefront, isLoading, isError, refetch } = useGetStorefront();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState('');

  const storefrontProducts = Array.isArray(storefront?.products) ? storefront.products : [];
  const products = useMemo(() => {
    let filtered = storefrontProducts.filter(p => p.active);
    if (search.trim()) {
      filtered = filtered.filter(p => 
        p.name.includes(search) || p.description.includes(search)
      );
    }
    return filtered;
  }, [storefrontProducts, search]);

  usePresence('home', 'يتصفح المتجر');

  if (isLoading) return <Shell><LoadingBlock label="نحمّل لكم افضل المنتجات" /></Shell>;
  if (isError) return <Shell><ErrorBlock onRetry={() => void refetch()} /></Shell>;

  return (
    <Shell>
      {/* Products Section - 2x2 on mobile, 4x4 on desktop */}
      <section className="px-4 py-8 lg:px-8 lg:py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-[-.04em]">المنتجات المتاحة</h2>
            <p className="mt-1 text-xs text-muted-foreground">اختاروا من أفضل المواشي المتاحة</p>
          </div>
          <div className="relative">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن منتج..."
              className="h-10 w-44 rounded-xl border border-input bg-card pr-9 text-xs"
            />
          </div>
        </div>

        {products.length === 0 ? (
          <EmptyProducts />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {products.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onSelect={(p) => setLocation(`/order?product=${p.id}`)} 
              />
            ))}
          </div>
        )}
      </section>
    </Shell>
  );
}
