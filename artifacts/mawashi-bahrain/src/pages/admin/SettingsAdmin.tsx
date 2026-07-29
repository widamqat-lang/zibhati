import { useState, useEffect } from 'react';
import { Shield, Lock, Mail, Eye, EyeOff, Check, X, Loader2, Bell, Smartphone, Trash2 } from 'lucide-react';
import { getNotificationPermissionStatus } from '@/lib/firebase';

interface Device {
  id: number;
  fcmToken: string;
  deviceName: string;
  deviceType: string;
  browser: string;
  os: string;
  isActive: boolean;
  lastUsedAt: string;
  createdAt: string;
}

export function SettingsAdmin() {
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [removingDevice, setRemovingDevice] = useState<number | null>(null);

  useEffect(() => {
    async function fetchAdmin() {
      try {
        const response = await fetch('/api/admin/credentials');
        if (response.ok) {
          const data = await response.json();
          setEmail(data.email);
        }
      } catch (error) {
        console.error('Error fetching admin:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAdmin();
  }, []);

  useEffect(() => {
    async function fetchDevices() {
      try {
        const response = await fetch('/api/admin/devices');
        if (response.ok) {
          const data = await response.json();
          setDevices(data);
        }
      } catch (error) {
        console.error('Error fetching devices:', error);
      } finally {
        setLoadingDevices(false);
      }
    }
    fetchDevices();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'كلمتا المرور غير متطابقتين' });
      return;
    }
    if (newPassword && newPassword.length < 6) {
      setMessage({ type: 'error', text: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
      return;
    }
    if (!currentPassword) {
      setMessage({ type: 'error', text: 'كلمة المرور الحالية مطلوبة' });
      return;
    }
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/credentials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          currentPassword: currentPassword,
          password: newPassword || undefined
        })
      });
      const data = await response.json();
      if (response.ok) {
        setMessage({ type: 'success', text: 'تم تحديث البيانات بنجاح' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: data.error || 'حدث خطأ' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'حدث خطأ في الاتصال' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveDevice = async (device: Device) => {
    if (!confirm('هل أنت متأكد من إلغاء تسجيل هذا الجهاز؟')) return;
    setRemovingDevice(device.id);
    try {
      const response = await fetch(`/api/admin/devices/${device.fcmToken}`, { method: 'DELETE' });
      if (response.ok) {
        setDevices(devices.filter(d => d.id !== device.id));
      }
    } catch (error) {
      console.error('Error removing device:', error);
    } finally {
      setRemovingDevice(null);
    }
  };

  const notificationPermission = getNotificationPermissionStatus();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">إعدادات لوحة التحكم</h2>
        <p className="text-muted-foreground mt-1">تغيير البريد وكلمة المرور</p>
      </div>

      {message && (
        <div className={`mb-6 flex items-center gap-3 rounded-lg p-4 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <Check size={20} /> : <X size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">البريد الإلكتروني</h3>
              <p className="text-xs text-muted-foreground">البريد المسجل في لوحة التحكم</p>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">البريد الإلكتروني</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Lock size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">كلمة المرور</h3>
              <p className="text-xs text-muted-foreground">لتغيير كلمة المرور أو البريد</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="currentPassword" className="text-sm font-medium">كلمة المرور الحالية <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  id="currentPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-sm font-medium">كلمة المرور الجديدة</label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  minLength={6}
                />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bell size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">الأجهزة المسجلة</h3>
              <p className="text-xs text-muted-foreground">الأجهزة التي تستلم إشعارات الطلبات</p>
            </div>
          </div>
          <div className="mb-4 flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">حالة الإشعارات:</span>
            <span className={`font-medium ${
              notificationPermission === 'granted' ? 'text-green-600' : 
              notificationPermission === 'denied' ? 'text-red-600' : 'text-yellow-600'
            }`}>
              {notificationPermission === 'granted' ? 'مفعّلة' :
               notificationPermission === 'denied' ? 'مرفوضة' : 'غير مفعّلة'}
            </span>
          </div>
          {loadingDevices ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : devices.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              <Smartphone className="mx-auto size-8 mb-2 opacity-50" />
              <p>لا توجد أجهزة مسجلة</p>
            </div>
          ) : (
            <div className="space-y-2">
              {devices.map(device => (
                <div key={device.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-muted flex items-center justify-center">
                      <Smartphone size={16} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{device.deviceName}</p>
                      <p className="text-xs text-muted-foreground">{device.browser} على {device.os}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveDevice(device)}
                    disabled={removingDevice === device.id}
                    className="p-2 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                  >
                    {removingDevice === device.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSaving ? <><Loader2 size={18} className="animate-spin" />جاري الحفظ...</> : <><Check size={18} />حفظ التغييرات</>}
        </button>
      </form>
    </div>
  );
}
