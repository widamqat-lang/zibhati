import { useState, useRef } from 'react';
import { 
  useListProducts, 
  useCreateProduct, 
  useUpdateProduct 
} from '@workspace/api-client-react';
import type { Product, ProductInput, ProductUpdate } from '@workspace/api-client-react';
import { 
  Pencil, 
  Plus, 
  RefreshCw, 
  Save, 
  X,
  Upload,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';
import { LoadingBlock, ErrorBlock } from '../shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

const fallbackSheep = 'https://images.unsplash.com/photo-1484557985045-edf25e08da73?auto=format&fit=crop&w=900&q=82';
const API_URL = import.meta.env.VITE_API_URL || '';

// Get product image - prefers imageUrl, falls back to base64 image
function getProductImage(product: { imageUrl?: string; image?: string }): string {
  return product.imageUrl || product.image || fallbackSheep;
}

// Convert file to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
}

// Upload image to Supabase Storage
async function uploadImageToSupabase(base64Image: string): Promise<string> {
  const response = await fetch(`${API_URL}/api/admin/upload-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to upload image');
  }
  
  const data = await response.json();
  return data.imageUrl;
}

// Extended ProductInput with image field
interface ProductFormData extends Omit<ProductInput, 'image'> {
  image?: string;
  uploadingImage?: boolean;
}

function ProductEditor({ 
  product, 
  onDone 
}: { 
  product?: Product; 
  onDone: () => void 
}) {
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<ProductFormData>({
    name: product?.name || '',
    description: product?.description || '',
    imageUrl: product?.imageUrl || '',
    image: product?.image || undefined,
    maxQuantity: product?.maxQuantity || 10,
    price: product?.price || 0,
    active: product?.active ?? true,
  });
  const [busy, setBusy] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const change = (key: keyof ProductFormData, value: string | number | boolean | undefined) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('حجم الصورة يجب أن يكون أقل من 5MB');
      return;
    }
    
    try {
      setUploadingImage(true);
      const base64 = await fileToBase64(file);
      // Upload to Supabase and get URL
      const imageUrl = await uploadImageToSupabase(base64);
      change('imageUrl', imageUrl);
      // Clear base64 image
      change('image', undefined);
    } catch (error) {
      alert('فشل في رفع الصورة');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    change('imageUrl', '');
    change('image', undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      const dataToSave = {
        ...form,
        image: undefined, // Don't send base64 anymore
      };
      
      if (product) {
        await update.mutateAsync({ id: product.id, data: dataToSave });
      } else {
        await create.mutateAsync({ data: dataToSave });
      }
      onDone();
    } finally {
      setBusy(false);
    }
  };

  // Get preview URL
  const previewUrl = form.imageUrl || form.image || fallbackSheep;

  return (
    <div className="rounded-[24px] border border-border bg-card p-5 md:p-7" data-testid="panel-product-editor">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold">{product ? 'تعديل المنتج' : 'إضافة منتج'}</h2>
          <p className="mt-1 text-[10px] text-muted-foreground">كل التفاصيل التي يراها أهل الإمارات</p>
        </div>
        <button type="button" onClick={onDone}>
          <X size={18} />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label className="text-xs">اسم المنتج</Label>
          <Input 
            value={form.name} 
            onChange={e => change('name', e.target.value)} 
            data-testid="input-admin-product-name" 
            className="mt-2 h-11 rounded-xl" 
          />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs">الوصف</Label>
          <Textarea 
            value={form.description} 
            onChange={e => change('description', e.target.value)} 
            data-testid="input-admin-product-description" 
            className="mt-2 rounded-xl" 
          />
        </div>
        
        {/* Image Upload Section */}
        <div className="sm:col-span-2">
          <Label className="text-xs">صورة المنتج</Label>
          <div className="mt-2 space-y-3">
            {/* Image Preview */}
            <div className="relative aspect-[1.6] overflow-hidden rounded-xl border border-border bg-muted">
              {uploadingImage ? (
                <div className="flex size-full items-center justify-center bg-muted">
                  <RefreshCw size={24} className="animate-spin text-muted-foreground" />
                </div>
              ) : (
                <img 
                  src={previewUrl} 
                  alt="معاينة" 
                  className="size-full object-cover" 
                />
              )}
              {(form.imageUrl || form.image) && (
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute left-2 top-2 rounded-lg bg-red-500 p-1.5 text-white shadow-md hover:bg-red-600"
                  title="حذف الصورة"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            
            {/* Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
              disabled={uploadingImage}
            />
            <label
              htmlFor="image-upload"
              className={cn(
                'flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/50 text-xs font-medium text-muted-foreground transition-colors',
                !uploadingImage && 'hover:bg-muted'
              )}
            >
              {uploadingImage ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  جاري رفع الصورة...
                </>
              ) : form.imageUrl ? (
                <>
                  <Upload size={16} />
                  تغيير الصورة
                </>
              ) : (
                <>
                  <Upload size={16} />
                  رفع صورة من الجهاز
                </>
              )}
            </label>
            <p className="text-[10px] text-muted-foreground">PNG, JPG حتى 5MB</p>
            
            {/* Or use URL */}
            <div className="flex items-center gap-2">
              <div className="flex-1 border-t border-border" />
              <span className="text-[10px] text-muted-foreground">أو</span>
              <div className="flex-1 border-t border-border" />
            </div>
            
            <Input 
              value={form.imageUrl} 
              onChange={e => { 
                change('imageUrl', e.target.value);
                if (e.target.value) change('image', undefined);
              }} 
              placeholder="رابط الصورة..." 
              dir="ltr" 
              data-testid="input-admin-product-image" 
              className="h-11 rounded-xl text-left" 
            />
          </div>
        </div>
        
        <div>
          <Label className="text-xs">السعر بالدرهم</Label>
          <Input 
            type="number" 
            min="0" 
            step=".001" 
            value={form.price} 
            onChange={e => change('price', Number(e.target.value))} 
            data-testid="input-admin-product-price" 
            className="mt-2 h-11 rounded-xl" 
          />
        </div>
        <div>
          <Label className="text-xs">أقصى كمية</Label>
          <Input 
            type="number" 
            min="1" 
            value={form.maxQuantity} 
            onChange={e => change('maxQuantity', Number(e.target.value))} 
            data-testid="input-admin-product-quantity" 
            className="mt-2 h-11 rounded-xl" 
          />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between rounded-xl bg-muted p-3">
        <span className="text-xs font-semibold">ظاهر في المتجر</span>
        <button 
          type="button" 
          onClick={() => change('active', !form.active)} 
          data-testid="button-toggle-product-active" 
          className={cn('relative h-6 w-11 rounded-full transition', form.active ? 'bg-secondary' : 'bg-border')}
        >
          <span className={cn('absolute top-1 size-4 rounded-full bg-accent transition', form.active ? 'right-1' : 'right-6')} />
        </button>
      </div>

      <Button 
        onClick={save} 
        disabled={busy || !form.name} 
        data-testid="button-save-product" 
        className="mt-6 h-11 w-full rounded-xl"
      >
        {busy ? (
          <RefreshCw className="animate-spin" size={17} />
        ) : (
          <><Save size={16} /> حفظ المنتج</>
        )}
      </Button>
    </div>
  );
}

export function ProductsAdmin() {
  const { data, isLoading, isError, refetch } = useListProducts();
  const productsList = Array.isArray(data) ? data : [];
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<Product | undefined>();

  const deleteProduct = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/products/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await refetch();
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const toggle = (product: Product) => {
    // Toggle active status would go here
  };

  return (
    <div className="page-enter">
      {showEditor && (
        <div className="mb-7 max-w-2xl">
          <ProductEditor 
            product={editing} 
            onDone={() => { setShowEditor(false); setEditing(undefined); }} 
          />
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">كتالوج المنتجات</h2>
          <p className="mt-1 text-[11px] text-muted-foreground">تحكموا بالاختيارات الظاهرة للعائلات</p>
        </div>
        <Button 
          onClick={() => { setEditing(undefined); setShowEditor(true); }} 
          data-testid="button-add-product" 
          className="rounded-xl text-xs"
        >
          <Plus size={16} /> إضافة منتج
        </Button>
      </div>

      {isError ? (
        <ErrorBlock onRetry={() => void refetch()} />
      ) : isLoading ? (
        <LoadingBlock />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {productsList.map(product => (
            <div 
              key={product.id} 
              className="overflow-hidden rounded-[22px] border border-border bg-card shadow-card" 
              data-testid={`card-admin-product-${product.id}`}
            >
              <div className="relative aspect-[1.6] bg-muted">
                <img 
                  src={getProductImage(product)} 
                  alt={product.name} 
                  className="size-full object-cover" 
                />
                <span className={cn(
                  'absolute right-3 top-3 rounded-full px-2.5 py-1 text-[9px] font-bold',
                  product.active ? 'bg-accent text-secondary' : 'bg-card/90 text-muted-foreground'
                )}>
                  {product.active ? 'ظاهر' : 'مخفي'}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold">{product.name}</h3>
                    <p className="mt-1 line-clamp-2 text-[10px] leading-5 text-muted-foreground">{product.description}</p>
                  </div>
                  <span className="font-mono-bahrain text-xs text-primary" dir="ltr">
                    {product.price.toFixed(0)} د.ب
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
                  <button 
                    type="button" 
                    onClick={() => toggle(product)} 
                    data-testid={`button-toggle-product-${product.id}`} 
                    className="flex-1 rounded-lg bg-muted py-2 text-[10px] font-bold"
                  >
                    {product.active ? 'إخفاء' : 'إظهار'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setEditing(product); setShowEditor(true); }} 
                    data-testid={`button-edit-product-${product.id}`} 
                    className="grid size-8 place-items-center rounded-lg bg-muted text-primary"
                  >
                    <Pencil size={14} />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      if (confirm(`هل تريد حذف "${product.name}"؟ لا يمكن التراجع.`)) {
                        deleteProduct(product.id);
                      }
                    }} 
                    data-testid={`button-delete-product-${product.id}`} 
                    className="grid size-8 place-items-center rounded-lg bg-destructive/10 text-destructive"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
