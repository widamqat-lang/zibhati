import { Link } from 'wouter';
import { AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { Shell } from '../shared';
import { Button } from '@/components/ui/button';

export function PaymentRejectedPage() {
  return (
    <Shell>
      <div className="page-enter mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-5 py-10 text-center">
        <div className="mb-6 grid size-20 place-items-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle size={40} />
        </div>
        
        <h1 className="text-2xl font-bold">تم رفض الطلب</h1>
        <p className="mt-3 text-muted-foreground">
          تم رفض عملية الدفع. يرجى إعادة المحاولة.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link href="/payment">
            <Button className="h-12 w-full rounded-2xl">
              <RefreshCw size={18} className="ml-2" />
              إعادة المحاولة
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="h-12 w-full rounded-2xl">
              العودة للرئيسية <ArrowRight size={18} className="mr-2" />
            </Button>
          </Link>
        </div>
      </div>
    </Shell>
  );
}
