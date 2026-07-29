import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  useGetStorefront, 
  useUpdateSiteContent, 
  getGetStorefrontQueryKey 
} from '@workspace/api-client-react';
import type { SiteContentUpdate } from '@workspace/api-client-react';
import { Loader2, Save } from 'lucide-react';
import { LoadingBlock } from '../shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export function ContentAdmin() {
  const { data } = useGetStorefront();
  const update = useUpdateSiteContent();
  const client = useQueryClient();
  const [form, setForm] = useState<SiteContentUpdate | null>(null);

  useEffect(() => { 
    if (data?.content && !form) setForm({ ...data.content }); 
  }, [data?.content, form]);

  if (!form) return <LoadingBlock />;

  const change = (key: keyof SiteContentUpdate, value: string | string[]) => 
    setForm(prev => prev ? ({ ...prev, [key]: value }) : prev);

  const save = () => 
    update.mutate(
      { data: form }, 
      { 
        onSuccess: result => { 
          client.setQueryData(getGetStorefrontQueryKey(), (old: typeof data) => 
            old ? { ...old, content: result } : old
          ); 
        } 
      }
    );

  const navLinks = Array.isArray(form.navLinks) ? form.navLinks : [];

  return (
    <div className="page-enter max-w-3xl">
      <div className="mb-6">
        <h2 className="text-lg font-bold">صوت المتجر</h2>
        <p className="mt-1 text-[11px] text-muted-foreground">عدّلوا الكلمات التي تستقبل أهل البيت.</p>
      </div>

      <div className="rounded-[24px] border border-border bg-card p-5 md:p-7">
        <div className="grid gap-5">
          <div>
            <Label className="text-xs">اسم العلامة</Label>
            <Input 
              value={form.brandName} 
              onChange={e => change('brandName', e.target.value)} 
              data-testid="input-content-brand-name" 
              className="mt-2 h-11 rounded-xl" 
            />
          </div>
          <div>
            <Label className="text-xs">عنوان البطل</Label>
            <Input 
              value={form.heroTitle} 
              onChange={e => change('heroTitle', e.target.value)} 
              data-testid="input-content-hero-title" 
              className="mt-2 h-11 rounded-xl" 
            />
          </div>
          <div>
            <Label className="text-xs">نص البطل</Label>
            <Textarea 
              value={form.heroText} 
              onChange={e => change('heroText', e.target.value)} 
              data-testid="input-content-hero-text" 
              className="mt-2 min-h-[110px] rounded-xl" 
            />
          </div>
          <div>
            <Label className="text-xs">رابط صورة البطل</Label>
            <Input 
              value={form.heroImageUrl} 
              onChange={e => change('heroImageUrl', e.target.value)} 
              dir="ltr" 
              data-testid="input-content-hero-image" 
              className="mt-2 h-11 rounded-xl text-left" 
            />
          </div>
          <div>
            <Label className="text-xs">أقسام المتجر، مفصولة بفاصلة</Label>
            <Input 
              value={navLinks.join('، ')} 
              onChange={e => change('navLinks', e.target.value.split(/[،,]/).map(x => x.trim()).filter(Boolean))} 
              data-testid="input-content-nav-links" 
              className="mt-2 h-11 rounded-xl" 
            />
          </div>
        </div>

        <Button 
          onClick={save} 
          disabled={update.isPending} 
          data-testid="button-save-content" 
          className="mt-7 h-11 w-full rounded-xl"
        >
          {update.isPending ? (
            <Loader2 className="animate-spin" size={17} />
          ) : (
            <><Save size={16} /> حفظ التغييرات</>
          )}
        </Button>

        {update.isSuccess && (
          <p className="mt-3 text-center text-xs font-bold text-secondary" data-testid="status-content-saved">
            تم تحديث المتجر
          </p>
        )}
      </div>
    </div>
  );
}
