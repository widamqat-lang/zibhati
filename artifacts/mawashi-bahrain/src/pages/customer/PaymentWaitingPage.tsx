import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Shell } from '../shared';

export function PaymentWaitingPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // After 3 seconds, redirect back to verification page with error
    const timer = setTimeout(() => {
      setLocation('/payment-verification?error=invalid');
    }, 3000);

    return () => clearTimeout(timer);
  }, [setLocation]);

  return (
    <Shell>
      <div className="page-enter mx-auto flex min-h-[calc(100vh-104px)] flex-col items-center justify-center gap-6 px-5 py-10 text-center">
        {/* Loading Spinner */}
        <div className="relative size-16">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-gray-200 border-t-primary"></div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">جارٍ التحقق...</h2>
          <p className="text-sm text-muted-foreground">يرجى الانتظار قليلاً</p>
        </div>
      </div>
    </Shell>
  );
}
