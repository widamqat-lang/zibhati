import { useState } from 'react';
import { Link } from 'wouter';
import {
  BadgeCheck,
  ChevronLeft,
  HeartHandshake,
  Home,
  Menu,
  ShoppingBag,
  ShieldCheck,
  Truck,
  UserRound,
  X,
} from 'lucide-react';
import { BrandMark } from './BrandMark';

const navItems = [
  { href: '/', label: 'الرئيسية', icon: Home },
  { href: '/products', label: 'المنتجات', icon: ShoppingBag },
  { href: '/about', label: 'من نحن', icon: HeartHandshake },
  { href: '/contact', label: 'اتصل بنا', icon: UserRound },
];

export function Shell({ children, showSidebar = false }: { children: React.ReactNode; showSidebar?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-shell grain">
      {/* Top Banner - Trust Badges */}
      <div className="bg-secondary text-secondary-foreground">
        <div className="mx-auto flex max-w-[1480px] items-center justify-center gap-4 px-4 py-2 text-[10px] font-semibold md:gap-8 md:text-xs lg:px-10">
          <span className="flex items-center gap-1.5"><BadgeCheck size={14} className="text-accent" /> ذبح حلال معتمد</span>
          <span className="flex items-center gap-1.5"><Truck size={14} className="text-accent" /> توصيل مجاني</span>
          <span className="hidden md:flex items-center gap-1.5"><ShieldCheck size={14} className="text-accent" /> ضمان الجودة</span>
        </div>
      </div>

      <header className="border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-[1480px] items-center justify-between px-5 lg:px-10">
          <Link href="/"><BrandMark /></Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-6 text-xs font-medium text-muted-foreground md:flex">
            {navItems.map(({ href, label }) => (
              <Link key={href} href={href} className="transition hover:text-foreground">{label}</Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <Link href="/order" className="mr-2 hidden items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition hover:bg-primary/90 sm:flex">
              <ShoppingBag size={14} /> اطلب الآن
            </Link>
            <button 
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="grid size-10 place-items-center rounded-full transition hover:bg-secondary/10 md:hidden"
            >
              {mobileOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="absolute inset-x-0 z-30 border-b border-border bg-card p-4 shadow-card">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold hover:bg-muted">
              <Icon size={18} />{label}
            </Link>
          ))}
          <Link href="/order" onClick={() => setMobileOpen(false)} className="mt-1 flex items-center gap-3 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">
            <ShoppingBag size={18} /> اطلب الآن
          </Link>
        </div>
      )}

      {/* Main Content Area */}
      <div className="relative mx-auto flex max-w-[1480px]">
        {showSidebar && (
          <aside className="sticky top-4 hidden h-[calc(100dvh-32px)] w-[216px] shrink-0 flex-col border-l border-border/80 px-5 py-10 md:flex">
            <div className="mb-8 px-3 font-mono-bahrain text-[9px] uppercase tracking-[.18em] text-muted-foreground" dir="ltr">A GOOD CUT, DELIVERED</div>
            <nav className="space-y-1.5">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className="group flex items-center gap-3 rounded-2xl px-3 py-3 text-[13px] font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground">
                  <Icon size={17} strokeWidth={1.7} /><span>{label}</span>
                  <ChevronLeft className="mr-auto opacity-0 transition group-hover:opacity-50" size={14} />
                </Link>
              ))}
            </nav>
            <div className="mt-auto rounded-[24px] bg-secondary p-5 text-secondary-foreground">
              <div className="mb-3 grid size-9 place-items-center rounded-full bg-accent/90 text-secondary"><Truck size={17} /></div>
              <div className="text-sm font-bold leading-7">من المزرعة<br />إلى بابكم</div>
              <p className="mt-2 text-[10px] leading-5 text-secondary-foreground/70">اختيار طازج، وزن واضح، وموعد يصل كما وعدنا.</p>
            </div>
          </aside>
        )}

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/70 bg-card px-5 py-10 md:px-10">
        <div className="mx-auto max-w-[1480px]">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <BrandMark />
              <p className="mt-4 text-xs text-muted-foreground">مواشي البحرين - أفضل أنواع المواشي الطازجة من المزرعة إلى بابكم.</p>
            </div>
            <div>
              <h3 className="font-bold">روابط سريعة</h3>
              <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                <Link href="/" className="block hover:text-foreground">الرئيسية</Link>
                <Link href="/products" className="block hover:text-foreground">المنتجات</Link>
                <Link href="/about" className="block hover:text-foreground">من نحن</Link>
                <Link href="/contact" className="block hover:text-foreground">اتصل بنا</Link>
              </div>
            </div>
            <div>
              <h3 className="font-bold">تواصل معنا</h3>
              <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                <p>📞 +973 1700 0000</p>
                <p>✉️ info@bahrainlivestock.com</p>
                <p>📍 مملكة البحرين</p>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-6 text-center text-[10px] text-muted-foreground">
            © 2024 مواشي البحرين. جميع الحقوق محفوظة.
          </div>
        </div>
      </footer>
    </div>
  );
}
