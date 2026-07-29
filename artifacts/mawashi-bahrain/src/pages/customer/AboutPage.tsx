import { BadgeCheck, HeartHandshake, Truck } from 'lucide-react';
import { Shell } from '../shared';

export function AboutPage() {
  return (
    <Shell>
      <div className="page-enter mx-auto max-w-4xl px-5 py-12 lg:py-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-[-.06em]">من نحن</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 text-muted-foreground">
            قصة ذبيحتي - من المزرعة إلى بابكم
          </p>
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-2">
          <div className="overflow-hidden rounded-[30px] bg-muted">
            <img 
              src="https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=900&q=80" 
              alt="مزرعة مواشي" 
              className="aspect-[4/3] size-full object-cover" 
            />
          </div>
          <div className="flex flex-col justify-center">
            <h2 className="text-2xl font-bold">بدايتنا</h2>
            <p className="mt-4 text-sm leading-8 text-muted-foreground">
              بدأنا رحلتنا في ذبيحتي стремясь предоставить лучшее качество мяса для семей Бахрейна. 
              نؤمن بأن كل عائلة تستحق طعاماً طازجاً وذكي الجودة.
            </p>
            <p className="mt-4 text-sm leading-8 text-muted-foreground">
              مزارعنا تقع في قلب مملكة الإمارات، حيث نربي أفضل أنواع المواشي بعناية واهتمام.
            </p>
          </div>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          <div className="rounded-[24px] border border-border bg-card p-6 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-accent/20 text-primary">
              <HeartHandshake size={24} />
            </div>
            <h3 className="mt-4 font-bold">الجودة أولاً</h3>
            <p className="mt-2 text-xs text-muted-foreground">نختار أفضل المواشي من مزارع مختارة بعناية.</p>
          </div>
          <div className="rounded-[24px] border border-border bg-card p-6 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-accent/20 text-primary">
              <BadgeCheck size={24} />
            </div>
            <h3 className="mt-4 font-bold">ذبح حلال</h3>
            <p className="mt-2 text-xs text-muted-foreground">جميع منتجاتنا مجهزة حسب المعايير الشرعية.</p>
          </div>
          <div className="rounded-[24px] border border-border bg-card p-6 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-accent/20 text-primary">
              <Truck size={24} />
            </div>
            <h3 className="mt-4 font-bold">توصيل سريع</h3>
            <p className="mt-2 text-xs text-muted-foreground">نوصل طلبكم مجانياً إلى بابكم بنفس اليوم.</p>
          </div>
        </div>
      </div>
    </Shell>
  );
}
