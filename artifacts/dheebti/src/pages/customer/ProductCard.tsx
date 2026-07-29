import { useState } from 'react';
import { useLocation } from 'wouter';
import type { Product } from '@workspace/api-client-react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const fallbackSheep = 'https://images.unsplash.com/photo-1484557985045-edf25e08da73?auto=format&fit=crop&w=900&q=82';

function money(value: number) {
  return `${value.toFixed(0)} درهم`;
}

// Get product image - prefers base64 image from DB, falls back to imageUrl
function getProductImage(product: { image?: string; imageUrl?: string }): string {
  return product.image || product.imageUrl || fallbackSheep;
}

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

export function ProductCard({ product, compact = false }: ProductCardProps) {
  const [, setLocation] = useLocation();
  const [quantity, setQuantity] = useState(1);

  const handleOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocation(`/order?product=${product.id}&quantity=${quantity}`);
  };

  const decreaseQty = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuantity(q => Math.max(1, q - 1));
  };

  const increaseQty = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuantity(q => Math.min(product.maxQuantity, q + 1));
  };

  if (compact) {
    // Compact card for smaller grids
    return (
      <article 
        className="group flex min-w-0 cursor-pointer flex-col rounded-2xl border border-border bg-card p-3 shadow-sm transition hover:border-primary/30 hover:shadow-md"
        onClick={() => setLocation(`/product/${product.id}`)}
        data-testid={`card-product-${product.id}`}
      >
        <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
          <img 
            src={getProductImage(product)} 
            alt={product.name} 
            className="size-full object-cover transition duration-500 group-hover:scale-105" 
          />
          <span className="absolute right-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[8px] font-bold text-secondary">طازج</span>
        </div>
        <div className="mt-2 flex-1">
          <h3 className="line-clamp-1 text-xs font-bold">{product.name}</h3>
          <p className="mt-1 line-clamp-2 text-[9px] leading-relaxed text-muted-foreground">{product.description}</p>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-mono-bahrain text-xs font-medium text-primary" dir="ltr">{money(product.price)}</span>
          <Button 
            size="sm" 
            className="h-7 rounded-lg text-[10px]" 
            onClick={handleOrder}
          >
            اطلب
          </Button>
        </div>
      </article>
    );
  }

  // Full card
  return (
    <article 
      className="flex min-w-0 cursor-pointer flex-col rounded-2xl border border-border bg-card shadow-sm transition hover:border-primary/30 hover:shadow-md"
      onClick={() => setLocation(`/product/${product.id}`)}
      data-testid={`card-product-${product.id}`}
    >
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden rounded-t-2xl bg-muted">
        <img 
          src={getProductImage(product)} 
          alt={product.name} 
          className="size-full object-cover transition duration-700 group-hover:scale-105" 
        />
        <span className="absolute right-2 top-2 rounded-full bg-accent px-2 py-1 text-[8px] font-bold text-secondary">طازج</span>
      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col p-3">
        {/* Product Info */}
        <div className="flex-1">
          <h3 className="line-clamp-1 text-sm font-bold" data-testid={`text-product-name-${product.id}`}>{product.name}</h3>
          <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground" data-testid={`text-product-description-${product.id}`}>
            {product.description}
          </p>
        </div>

        {/* Price & Quantity */}
        <div className="mt-3 flex items-center justify-between">
          <span className="font-mono-bahrain text-sm font-medium text-primary" dir="ltr" data-testid={`text-product-price-${product.id}`}>
            {money(product.price)}
          </span>
          <span className="text-[9px] text-muted-foreground">الاجمالي</span>
        </div>

        {/* Quantity Selector */}
        <div className="mt-2 flex items-center justify-between rounded-xl border border-input bg-background px-2 py-1">
          <button 
            type="button" 
            onClick={decreaseQty}
            className="grid size-7 place-items-center rounded-lg bg-muted text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
          >
            <Minus size={12} />
          </button>
          <span className="text-sm font-medium" dir="ltr">{quantity}</span>
          <button 
            type="button" 
            onClick={increaseQty}
            className="grid size-7 place-items-center rounded-lg bg-accent text-secondary transition hover:bg-accent/80"
          >
            <Plus size={12} />
          </button>
        </div>

        {/* Order Button */}
        <Button 
          className="mt-2 h-9 w-full rounded-xl text-xs font-bold" 
          onClick={handleOrder}
        >
          طلب الآن
        </Button>
      </div>
    </article>
  );
}
