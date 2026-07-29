import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import {
  BarChart3,
  Bell,
  BellRing,
  ChevronDown,
  ChevronLeft,
  ExternalLink,
  FileText,
  ClipboardList,
  LogOut,
  Package,
  UsersRound,
  Users,
  Home,
  ShoppingBag,
  Info,
  Phone,
  Settings,
  Volume2,
  VolumeX,
  User,
  CreditCard,
  FileCheck,
  Shield,
  X,
  Check,
} from 'lucide-react';
import { BrandMark } from '../shared';
import { useNotifications, type NotificationType } from '@/hooks/useNotifications';

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) return 'الآن';
  if (minutes < 60) return `منذ ${minutes} ${minutes === 1 ? 'دقيقة' : 'دقائق'}`;
  if (hours < 24) return `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`;
  return date.toLocaleDateString('ar-SA');
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'customer':
      return <User className="h-4 w-4 text-blue-500" />;
    case 'order':
      return <FileCheck className="h-4 w-4 text-green-500" />;
    case 'payment':
      return <CreditCard className="h-4 w-4 text-purple-500" />;
    case 'otp':
      return <Shield className="h-4 w-4 text-orange-500" />;
  }
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

type AdminTab = 'overview' | 'products' | 'content' | 'orders' | 'presence' | 'customers' | 'settings';

interface AdminLayoutProps {
  tab: AdminTab;
  setTab: (tab: AdminTab) => void;
  children: React.ReactNode;
}

export function AdminLayout({ tab, setTab, children }: AdminLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  
  // Notifications system
  const {
    notifications,
    unreadCount,
    soundEnabled,
    markAllAsRead,
    clearAll,
    toggleSound,
  } = useNotifications();

  // Get admin info from localStorage
  const adminEmail = localStorage.getItem('admin_email') || 'مدير المتجر';
  
  // Close notifications when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Expose notifications to children via window event
  useEffect(() => {
    const eventHandler = (event: CustomEvent) => {
      window.dispatchEvent(new CustomEvent('dheebti-notification', { detail: event.detail }));
    };
    window.addEventListener('dheebti-new-data', eventHandler as EventListener);
    return () => window.removeEventListener('dheebti-new-data', eventHandler as EventListener);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_email');
    window.location.href = '/admin/login';
  };

  const adminTabs = [
    { id: 'customers' as const, label: 'العملاء', icon: Users },
    { id: 'overview' as const, label: 'نظرة عامة', icon: BarChart3 },
    { id: 'products' as const, label: 'المنتجات', icon: Package },
    { id: 'content' as const, label: 'محتوى المتجر', icon: FileText },
    { id: 'orders' as const, label: 'الطلبات', icon: ClipboardList },
    { id: 'presence' as const, label: 'الحضور المباشر', icon: UsersRound },
    { id: 'settings' as const, label: 'الإعدادات', icon: Settings },
  ];

  const storeLinks = [
    { href: '/', label: 'الصفحة الرئيسية', icon: Home },
    { href: '/products', label: 'المنتجات', icon: ShoppingBag },
    { href: '/about', label: 'من نحن', icon: Info },
    { href: '/contact', label: 'اتصل بنا', icon: Phone },
  ];

  const tabTitles: Record<AdminTab, string> = {
    customers: 'العملاء',
    overview: 'صباح الخير، يا مدير',
    products: 'المنتجات',
    content: 'محتوى المتجر',
    orders: 'الطلبات',
    presence: 'الحضور المباشر',
    settings: 'الإعدادات',
  };

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-[100dvh] bg-background" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur-xl md:px-9">
        {/* Brand on the right (RTL) */}
        <div className="flex items-center gap-4">
          <BrandMark compact />
          <div>
            <div className="font-mono-bahrain text-[9px] uppercase tracking-[.15em] text-muted-foreground" dir="ltr">
              MAWASHI / ADMIN
            </div>
            <h1 className="mt-1 text-base font-bold">{tabTitles[tab]}</h1>
          </div>
        </div>

        {/* Notifications Button */}
        <div className="relative" ref={notificationsRef}>
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              if (!notificationsOpen && unreadCount > 0) {
                markAllAsRead();
              }
            }}
            className={cn(
              "relative flex items-center gap-2 rounded-xl border bg-card px-3 py-2.5 transition-colors hover:bg-muted",
              unreadCount > 0 
                ? "border-red-200 bg-red-50 text-red-600 animate-pulse" 
                : "border-border"
            )}
          >
            {unreadCount > 0 ? (
              <BellRing size={18} />
            ) : (
              <Bell size={18} />
            )}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div className="absolute left-0 top-full mt-2 w-80 rounded-xl border border-border bg-card shadow-lg z-50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b border-border bg-muted/20">
                <div className="flex items-center gap-2">
                  <BellRing size={16} className="text-primary" />
                  <span className="text-xs font-bold">الإشعارات</span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleSound(); }}
                    className={cn(
                      "rounded-lg p-1.5 transition-colors",
                      soundEnabled ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"
                    )}
                    title={soundEnabled ? "إيقاف الصوت" : "تشغيل الصوت"}
                  >
                    {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); clearAll(); }}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    title="مسح الكل"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    <Bell size={24} className="mx-auto mb-2 opacity-30" />
                    <p>لا توجد إشعارات</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "flex items-start gap-3 p-3 border-b border-border/50 transition-colors hover:bg-muted/50",
                        !notification.read && "bg-primary/5"
                      )}
                    >
                      <div className={cn(
                        "mt-0.5 rounded-full p-1.5",
                        notification.type === 'customer' && "bg-blue-100",
                        notification.type === 'order' && "bg-green-100",
                        notification.type === 'payment' && "bg-purple-100",
                        notification.type === 'otp' && "bg-orange-100"
                      )}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{notification.title}</div>
                        {notification.subtitle && (
                          <div className="text-xs text-muted-foreground truncate">{notification.subtitle}</div>
                        )}
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {formatTimeAgo(notification.timestamp)}
                        </div>
                      </div>
                      {!notification.read && (
                        <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* القائمة Menu Button with Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            data-testid="button-admin-menu"
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold transition-colors hover:bg-muted"
          >
            <span>القائمة</span>
            <ChevronDown 
              size={14} 
              className={`transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} 
            />
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div className="absolute left-0 top-full mt-2 w-72 rounded-xl border border-border bg-card shadow-lg z-50 overflow-hidden">
              {/* User Info Section */}
              <div className="p-3 border-b border-border bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    م
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold">مدير المتجر</div>
                    <div className="truncate text-[10px] text-muted-foreground">
                      {adminEmail}
                    </div>
                  </div>
                </div>
              </div>

              {/* Control Room Section */}
              <div className="p-2 border-b border-border bg-muted/10">
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">لوحة التحكم</p>
              </div>
              <nav className="p-1 space-y-0.5">
                {adminTabs.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => { setTab(id); setMenuOpen(false); }}
                    data-testid={`button-admin-tab-${id}`}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-right text-xs font-medium transition-colors',
                      tab === id 
                        ? 'bg-primary/10 text-primary font-semibold' 
                        : 'hover:bg-muted text-foreground/80'
                    )}
                  >
                    <Icon size={16} />
                    <span className="flex-1">{label}</span>
                    {tab === id && <ChevronLeft size={12} className="opacity-50" />}
                  </button>
                ))}
              </nav>

              {/* Store Links Section */}
              <div className="p-2 border-t border-border bg-muted/10">
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">روابط المتجر</p>
              </div>
              <nav className="p-1 space-y-0.5">
                {storeLinks.map(({ href, label, icon: Icon }) => (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors hover:bg-muted text-foreground/80"
                  >
                    <Icon size={16} />
                    <span className="flex-1">{label}</span>
                    <ExternalLink size={10} className="opacity-40" />
                  </a>
                ))}
              </nav>

              {/* Sign Out Section */}
              <div className="border-t border-border p-1">
                <button
                  type="button"
                  onClick={() => { handleLogout(); setMenuOpen(false); }}
                  data-testid="button-admin-signout"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
                >
                  <LogOut size={16} />
                  <span>تسجيل الخروج</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="p-5 md:p-9">{children}</div>
    </div>
  );
}
