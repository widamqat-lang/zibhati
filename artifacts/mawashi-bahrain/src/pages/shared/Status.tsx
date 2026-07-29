import { Leaf, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LoadingBlock({ label = 'جارٍ تجهيز الصفحة' }: { label?: string }) {
  return (
    <div className="flex min-h-[65vh] flex-col items-center justify-center gap-4 text-muted-foreground" data-testid="state-loading">
      <div className="size-12 animate-pulse rounded-2xl bg-muted" />
      <div className="h-3 w-32 animate-pulse rounded bg-muted" />
      <span className="text-xs">{label}</span>
    </div>
  );
}

export function ErrorBlock({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto flex min-h-[55vh] max-w-md flex-col items-center justify-center p-8 text-center" data-testid="state-error">
      <div className="mb-5 grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <RefreshCw size={24} />
      </div>
      <h2 className="text-lg font-bold">تعذّر تحميل الصفحة</h2>
      <p className="mt-2 text-sm leading-7 text-muted-foreground">هناك مشكلة مؤقتة في الاتصال. حاول مرة أخرى.</p>
      <Button onClick={onRetry} data-testid="button-retry" className="mt-6 rounded-xl">إعادة المحاولة</Button>
    </div>
  );
}

export function EmptyProducts() {
  return (
    <div className="col-span-full rounded-[30px] border border-dashed border-border bg-card p-14 text-center" data-testid="state-empty-products">
      <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-muted text-primary">
        <Leaf size={24} />
      </div>
      <h3 className="font-bold">الموسم يتجهّز</h3>
      <p className="mt-2 text-sm text-muted-foreground">لا توجد منتجات متاحة الآن. عودوا إلينا قريباً.</p>
    </div>
  );
}
