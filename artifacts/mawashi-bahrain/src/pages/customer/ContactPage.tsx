import { useState } from 'react';
import { Flame, Store, Truck } from 'lucide-react';
import { Shell } from '../shared';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export function ContactPage() {
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setForm({ name: '', phone: '', message: '' }), 3000);
  };

  return (
    <Shell>
      <div className="page-enter mx-auto max-w-4xl px-5 py-12 lg:py-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-[-.06em]">تواصل معنا</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 text-muted-foreground">
            نسعد بتواصلكم معنا. فريقنا جاهز للإجابة على استفساراتكم.
          </p>
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-2">
          {/* Contact Info */}
          <div>
            <h2 className="text-xl font-bold">معلومات التواصل</h2>
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
                <div className="grid size-10 place-items-center rounded-full bg-accent/20 text-primary">
                  <Flame size={18} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">الهاتف</div>
                  <div className="font-bold" dir="ltr">+973 1700 0000</div>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
                <div className="grid size-10 place-items-center rounded-full bg-accent/20 text-primary">
                  <Store size={18} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">البريد الإلكتروني</div>
                  <div className="font-bold">info@bahrainlivestock.com</div>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
                <div className="grid size-10 place-items-center rounded-full bg-accent/20 text-primary">
                  <Truck size={18} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">العنوان</div>
                  <div className="font-bold">مملكة البحرين</div>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-[24px] bg-secondary p-6 text-secondary-foreground">
              <h3 className="font-bold">ساعات العمل</h3>
              <p className="mt-2 text-sm">السبت - الخميس: 7:00 صباحاً - 9:00 مساءً</p>
              <p className="mt-1 text-sm">الجمعة: 2:00 مساءً - 9:00 مساءً</p>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="text-xl font-bold">أرسل رسالة</h2>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <Label className="text-xs">الاسم</Label>
                <Input 
                  value={form.name} 
                  onChange={e => setForm({ ...form, name: e.target.value })} 
                  placeholder="اسمك الكريم" 
                  className="mt-2 h-12 rounded-xl" 
                  required 
                />
              </div>
              <div>
                <Label className="text-xs">رقم الهاتف</Label>
                <Input 
                  value={form.phone} 
                  onChange={e => setForm({ ...form, phone: e.target.value })} 
                  placeholder="رقم التواصل" 
                  dir="ltr" 
                  className="mt-2 h-12 rounded-xl" 
                  required 
                />
              </div>
              <div>
                <Label className="text-xs">الرسالة</Label>
                <Textarea 
                  value={form.message} 
                  onChange={e => setForm({ ...form, message: e.target.value })} 
                  placeholder="كيف يمكننا مساعدتك؟" 
                  className="mt-2 min-h-[120px] rounded-xl" 
                  required 
                />
              </div>
              <Button type="submit" disabled={sent} className="h-12 w-full rounded-xl">
                {sent ? 'تم الإرسال ✓' : 'إرسال الرسالة'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </Shell>
  );
}
