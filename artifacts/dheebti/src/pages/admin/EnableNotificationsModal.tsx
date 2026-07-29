import { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { 
  requestNotificationPermission,
  isNotificationSupported,
  getNotificationPermissionStatus,
  onForegroundMessage
} from '@/lib/firebase';

interface EnableNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnabled: () => void;
}

type ModalState = 'initial' | 'loading' | 'success' | 'error';

interface ErrorDetails {
  message: string;
  suggestion: string;
}

export function EnableNotificationsModal({ 
  isOpen, 
  onClose, 
  onEnabled 
}: EnableNotificationsModalProps) {
  const [state, setState] = useState<ModalState>('initial');
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);
  const [testNotificationSent, setTestNotificationSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setState('initial');
      setErrorDetails(null);
      setTestNotificationSent(false);
    }
  }, [isOpen]);

  // Listen for foreground messages
  useEffect(() => {
    if (state === 'success' && !testNotificationSent) {
      onForegroundMessage((payload) => {
        console.log('[Notifications] Foreground message received:', payload);
        // Show the message to the user
        if (Notification.permission === 'granted') {
          new Notification(payload.notification?.title || 'إشعار', {
            body: payload.notification?.body,
            icon: '/icon-192.png'
          });
        }
      });
    }
  }, [state, testNotificationSent]);

  const handleEnableNotifications = async () => {
    setState('loading');
    setErrorDetails(null);

    try {
      // Check if browser supports notifications
      const supported = await isNotificationSupported();
      if (!supported) {
        setErrorDetails({
          message: 'المتصفح لا يدعم الإشعارات',
          suggestion: 'يرجى استخدام متصفح حديث مثل Chrome أو Safari أو Firefox'
        });
        setState('error');
        return;
      }

      // Check current permission status
      const permission = getNotificationPermissionStatus();
      if (permission === 'denied') {
        setErrorDetails({
          message: 'تم رفض الإشعارات مسبقاً',
          suggestion: 'يرجى تفعيل الإشعارات من إعدادات المتصفح ثم إعادة المحاولة'
        });
        setState('error');
        return;
      }

      // Request permission and get token
      const result = await requestNotificationPermission();

      if (result.success && result.token) {
        // Save token to backend
        const response = await fetch('/api/admin/devices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fcmToken: result.token,
            deviceName: getDeviceName(),
            deviceType: getDeviceType(),
            browser: getBrowser(),
            os: getOS()
          })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Send test notification
          await fetch('/api/admin/devices/test/' + result.token, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminName: 'المدير' })
          });

          setTestNotificationSent(true);
          setState('success');
        } else {
          // Database error
          setErrorDetails({
            message: 'خطأ في قاعدة البيانات',
            suggestion: 'فشل في حفظ بيانات الجهاز. يرجى المحاولة مرة أخرى لاحقاً.'
          });
          setState('error');
        }
      } else {
        // Firebase error
        let suggestion = 'يرجى المحاولة مرة أخرى.';
        
        switch (result.errorCode) {
          case 'PERMISSION_DENIED':
            suggestion = 'يرجى تفعيل الإشعارات من إعدادات المتصفح';
            break;
          case 'VAPID_KEY_NOT_FOUND':
            suggestion = 'يرجى مراجعة إعدادات Firebase Cloud Messaging في المشروع';
            break;
          case 'TOKEN_SUBSCRIBE_FAILED':
            suggestion = 'فشل في الاتصال بـ Firebase. يرجى التحقق من اتصال الإنترنت';
            break;
          case 'UNSUPPORTED_BROWSER':
            suggestion = 'يرجى استخدام متصفح حديث مثل Chrome أو Safari';
            break;
        }

        setErrorDetails({
          message: result.error || 'خطأ في Firebase',
          suggestion
        });
        setState('error');
      }
    } catch (error: any) {
      console.error('[Notifications] Error:', error);
      setErrorDetails({
        message: 'حدث خطأ غير متوقع',
        suggestion: 'يرجى المحاولة مرة أخرى. إذا استمرت المشكلة، يرجى التواصل مع الدعم.'
      });
      setState('error');
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleEnabled = () => {
    onEnabled();
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute left-4 top-4 rounded-full p-2 hover:bg-muted transition-colors"
        >
          <X size={20} className="text-muted-foreground" />
        </button>

        {/* Initial State */}
        {state === 'initial' && (
          <>
            <div className="mb-6 mt-2 text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
                <Bell size={32} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold">تفعيل الإشعارات</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                استلم إشعارات فورية عند وجود طلبات جديدة حتى مع إغلاق المتصفح
              </p>
            </div>

            <div className="space-y-3">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  إشعارات الطلبات الجديدة
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  يعمل حتى مع إغلاق المتصفح
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  سهل الإعداد - بنقرة واحدة
                </li>
              </ul>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                ليس الآن
              </button>
              <button
                onClick={handleEnableNotifications}
                className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                تفعيل الإشعارات
              </button>
            </div>
          </>
        )}

        {/* Loading State */}
        {state === 'loading' && (
          <>
            <div className="mb-6 mt-2 text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
                <Loader2 size={32} className="animate-spin text-primary" />
              </div>
              <h2 className="text-xl font-bold">جاري التفعيل...</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                يرجى الانتظار
              </p>
            </div>
          </>
        )}

        {/* Success State */}
        {state === 'success' && (
          <>
            <div className="mb-6 mt-2 text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-green-600">تم تفعيل الإشعارات بنجاح!</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {testNotificationSent 
                  ? 'تم إرسال إشعار تجريبي. ستستلم إشعارات الطلبات الجديدة هنا.'
                  : 'ستستلم إشعارات الطلبات الجديدة هنا.'}
              </p>
            </div>

            <div className="rounded-xl bg-green-50 p-4 text-sm text-green-800">
              <p className="font-medium">💡 ملاحظة:</p>
              <p className="mt-1">للحصول على أفضل تجربة على iPhone:</p>
              <ul className="mt-2 space-y-1 pr-4">
                <li>1. اضغط على زر المشاركة في Safari</li>
                <li>2. اختر "إضافة إلى الشاشة الرئيسية"</li>
                <li>3. افتح التطبيق من الشاشة الرئيسية</li>
              </ul>
            </div>

            <button
              onClick={handleEnabled}
              className="mt-6 w-full rounded-xl bg-green-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-green-600"
            >
              تم، شكراً!
            </button>
          </>
        )}

        {/* Error State */}
        {state === 'error' && errorDetails && (
          <>
            <div className="mb-6 mt-2 text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle size={32} className="text-destructive" />
              </div>
              <h2 className="text-xl font-bold text-destructive">فشل التفعيل</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {errorDetails.message}
              </p>
            </div>

            <div className="rounded-xl bg-muted p-4 text-sm">
              <p className="font-medium">💡 الحل:</p>
              <p className="mt-1">{errorDetails.suggestion}</p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                إلغاء
              </button>
              <button
                onClick={handleEnableNotifications}
                className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                إعادة المحاولة
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Helper functions
function getDeviceName(): string {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'iPhone/iPad';
  if (/Android/.test(ua)) return 'Android Device';
  if (/Mac/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows PC';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Unknown Device';
}

function getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
  const ua = navigator.userAgent;
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  if (/mobile|android|iphone/i.test(ua)) return 'mobile';
  return 'desktop';
}

function getBrowser(): string {
  const ua = navigator.userAgent;
  if (/Chrome/.test(ua)) return 'Chrome';
  if (/Safari/.test(ua) && !/Chrome/.test(ua)) return 'Safari';
  if (/Firefox/.test(ua)) return 'Firefox';
  if (/Edge/.test(ua)) return 'Edge';
  if (/Opera|OPR/.test(ua)) return 'Opera';
  return 'Unknown';
}

function getOS(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
  if (/Android/.test(ua)) return 'Android';
  if (/Mac/.test(ua)) return 'macOS';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Unknown';
}
